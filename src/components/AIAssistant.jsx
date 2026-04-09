import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, User, Send, X, Terminal, Cpu, Sparkles, AlertTriangle, Package } from 'lucide-react';
import { chatWithOllama, pingOllama } from '../lib/ollama';
import { searchInventoryForAI, formatInventoryForAI, fetchAIBaseline, addToWaitlist } from '../lib/inventory';
import { supabase } from '../lib/supabase';
import './AIAssistant.css';

const AIAssistant = ({ onClose }) => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '¡Hola! Soy Banana AI. Estoy aquí para ayudarte a encontrar la computadora perfecta. ¿Para qué planeas usar tu nuevo equipo principalmente? (Ej. Gaming, Oficina, Edición de video)' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [inventoryContext, setInventoryContext] = useState('');
  const [baselineKnowledge, setBaselineKnowledge] = useState('');
  const [ollamaReady, setOllamaReady] = useState(true);
  const endOfMessagesRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    pingOllama().then(setOllamaReady);
    fetchAIBaseline().then(setBaselineKnowledge);
  }, []);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // 1. Get first AI response
      let aiResponseText = await chatWithOllama([...messages, userMessage], inventoryContext || baselineKnowledge);
      
      // 2. Check for [SEARCH: ...] command
      const searchMatch = aiResponseText.match(/\[SEARCH:\s*(.*?)\]/);
      
      if (searchMatch) {
        setLoading(true); // Keep loading while searching
        const params = searchMatch[1];
        const categoryMatch = params.match(/category=(.*?)(?:\s|$)/);
        const priceMatch = params.match(/max_price=(.*?)(?:\s|$)/);
        
        const filters = {
          category: categoryMatch ? categoryMatch[1].replace(/,$/, '') : null,
          maxPrice: priceMatch ? parseInt(priceMatch[1]) : null
        };

        const results = await searchInventoryForAI(filters);
        const context = formatInventoryForAI(results);
        setInventoryContext(context);

        // Re-call AI with the inventory results, but without showing the [SEARCH] part to the user
        // We pass the refined context to the next prompt
        const finalResponse = await chatWithOllama(
          [...messages, userMessage, { role: 'assistant', content: 'Buscando en el catálogo...' }], 
          context || baselineKnowledge
        );
        
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: finalResponse, 
          results: results.length > 0 ? results : null 
        }]);
      } else {
        // No search needed, just show the response
        let cleanResponse = aiResponseText.replace(/\[SEARCH:.*?\]/g, '').trim();
        
        // --- SECURITY FILTER: Block any attempt to ask for payment data ---
        const lowerRes = cleanResponse.toLowerCase();
        const sensitiveKeywords = ['cvv', 'vencimiento', 'numero de tarjeta', 'credit card', 'clave de cajero', 'pin de tarjeta'];
        const suspiciousPhrases = ['ingresa tu tarjeta', 'dame tu numero', 'puedes pagar aqui', 'necesito tu tarjeta'];
        
        // Check if it's a payment request (e.g., asking for card data)
        const isSafeCardMention = lowerRes.includes('tarjeta gráfica') || 
                                  lowerRes.includes('tarjeta de video') || 
                                  lowerRes.includes('tarjeta del producto') ||
                                  lowerRes.includes('esta tarjeta') ||
                                  lowerRes.includes('la tarjeta que aparece');
        
        const hasSensitiveKw = sensitiveKeywords.some(kw => lowerRes.includes(kw));
        const hasSuspiciousPhrase = suspiciousPhrases.some(p => lowerRes.includes(p));
        
        if (!isSafeCardMention && (hasSensitiveKw || hasSuspiciousPhrase)) {
          cleanResponse = "⚠️ **Aviso de Seguridad**: Por tu protección, Banana AI no puede solicitar ni procesar datos de pago directamente en el chat. Por favor, utiliza los botones de compra oficial o el carrito de la tienda para finalizar tu pedido de forma segura. 🍌🛡️";
        }
        
        // --- SAFETY MATCHER: If AI mentions a product but forgets the RECOMENDACION tag ---
        try {
          const lines = baselineKnowledge.split('\n');
          const products = [];
          
          for (const line of lines) {
            const match = line.match(/- (.*?) \| \$(.*?) \| RAM: (.*?) \| CPU: (.*?) \[ID: (.*?)\]/);
            if (match) {
              products.push({
                name: match[1].trim(),
                price: match[2].trim(),
                ram: match[3].trim(),
                cpu: match[4].trim(),
                id: match[5].trim()
              });
            }
          }

          // Get unique product names to look for
          const uniqueNames = [...new Set(products.map(p => p.name))];
          
          for (const name of uniqueNames) {
            const regex = new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
            let match;
            
            // We need to work on a copy that we update to avoid index shifts during loop
            // or just process matches one by one.
            while ((match = regex.exec(cleanResponse)) !== null) {
              const startPos = match.index;
              const endPos = startPos + match[0].length;
              
              // Skip if already followed by [RECOMENDACION]
              const followingText = cleanResponse.slice(endPos, endPos + 100);
              if (followingText.includes('[RECOMENDACION:')) continue;
              
              // Define context window (-80 to +80 chars)
              const context = cleanResponse.slice(Math.max(0, startPos - 80), Math.min(cleanResponse.length, endPos + 80)).toLowerCase();
              
              // Score candidates for this mention
              const candidates = products.filter(p => p.name.toLowerCase() === name.toLowerCase());
              let bestCand = null;
              let bestScore = -1;
              
              for (const cand of candidates) {
                let score = 0;
                if (context.includes(cand.price.toLowerCase())) score += 50;
                if (cand.ram !== 'n/a' && context.includes(cand.ram.toLowerCase())) score += 30;
                if (cand.cpu !== 'n/a' && context.includes(cand.cpu.toLowerCase().split(' ')[0])) score += 30;
                
                if (score > bestScore) {
                  bestScore = score;
                  bestCand = cand;
                }
              }
              
              // If we have a clear winner or just one candidate
              if (bestCand) {
                const tag = ` [RECOMENDACION: ${bestCand.id}]`;
                cleanResponse = cleanResponse.slice(0, endPos) + tag + cleanResponse.slice(endPos);
                // Adjust regex lastIndex to skip what we just inserted
                regex.lastIndex += tag.length;
              }
            }
          }
        } catch (e) { console.error('Safety Matcher Error:', e); }

        setMessages(prev => [...prev, { role: 'assistant', content: cleanResponse }]);
      }
    } catch (err) {
      console.error('Banana AI Error:', err);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Lo siento, tuve un pequeño mareo tecnológico. ¿Podrías repetirme eso? 🍌' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const RecommendedProduct = ({ id }) => {
    const [prod, setProd] = useState(null);
    useEffect(() => {
      if (!id || id === 'undefined') return;
      supabase
        .from('products')
        .select('*, product_attributes(value, attribute_definitions(name, unit))')
        .eq('id', id)
        .single()
        .then(({ data }) => setProd(data));
    }, [id]);

    if (!prod || !id || id === 'undefined') return null;

    const specs = prod.product_attributes?.slice(0, 4).map(a => ({
      name: a.attribute_definitions.name,
      value: `${a.value} ${a.attribute_definitions.unit || ''}`.trim()
    })) || [];

    return (
      <div className="ai-product-card-vertical" onClick={() => navigate(`/producto/${prod.id}`)}>
        <div className="ai-card-main">
          <div className="ai-card-img">
            {prod.image_url ? (
              <img src={prod.image_url} alt={prod.name} onError={(e) => e.target.style.display = 'none'} />
            ) : null}
            {!prod.image_url && <div className="img-placeholder"><Package size={20} /></div>}
          </div>
          <div className="ai-card-info">
            <div className="ai-card-header">
              <h6>{prod.name}</h6>
              <span className="price-tag">${parseFloat(prod.price).toLocaleString()}</span>
            </div>
            
            {specs.length > 0 && (
              <div className="ai-card-specs">
                {specs.map((s, i) => (
                  <div key={i} className="spec-item">
                    <span className="spec-name">{s.name}:</span>
                    <span className="spec-val">{s.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="ai-card-footer">
          Ver detalles del equipo →
        </div>
      </div>
    );
  };

  const WaitlistForm = ({ interest }) => {
    const [email, setEmail] = useState('');
    const [joined, setJoined] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!email || loading) return;
      setLoading(true);
      try {
        await addToWaitlist(email, interest);
        setJoined(true);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (joined) return <div className="waitlist-success">✓ ¡Anotado! Te avisaremos a {email}.</div>;

    return (
      <form className="waitlist-form" onSubmit={handleSubmit}>
        <p>Déjanos tu correo para avisarte sobre: <strong>{interest}</strong></p>
        <div className="waitlist-input-group">
          <input 
            type="email" 
            placeholder="tu@email.com" 
            value={email} 
            onChange={e => setEmail(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>Unirme</button>
        </div>
      </form>
    );
  };

  const MessageContent = ({ content }) => {
    // Detect [RECOMENDACION: id] and [WAITLIST_PROMPT: interest]
    const regex = /(\[RECOMENDACION:\s*.*?\]|\[WAITLIST_PROMPT:\s*.*?\])/g;
    const parts = content.split(regex);
    
    return (
      <div className="msg-text">
        {parts.map((part, i) => {
          const recMatch = part.match(/\[RECOMENDACION:\s*(.*?)\]/);
          const waitMatch = part.match(/\[WAITLIST_PROMPT:\s*(.*?)\]/);
          
          if (recMatch) {
            const id = recMatch[1].trim();
            if (!id || id === 'undefined') return null;
            return <RecommendedProduct key={i} id={id} />;
          }
          if (waitMatch) {
            const interest = waitMatch[1].trim();
            if (!interest) return null;
            return <WaitlistForm key={i} interest={interest} />;
          }
          return <span key={i}>{part}</span>;
        })}
      </div>
    );
  };

  return (
    <div className="ai-assistant-overlay">
      <div className="ai-assistant-window glass-panel">
        <header className="ai-header">
          <div className="ai-title">
            <div className="ai-avatar pulse">
              <Bot size={20} />
            </div>
            <div>
              <h3>Banana AI</h3>
              <span className="status-badge">
                {ollamaReady ? <><Sparkles size={10} /> Online</> : <><AlertTriangle size={10} /> Offline</>}
              </span>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </header>

        <div className="ai-messages">
          {!ollamaReady && (
            <div className="offline-notice">
              <AlertTriangle size={32} />
              <p>Ollama no está respondiendo.</p>
              
              {window.location.protocol === 'https:' ? (
                <p className="hint">
                  <strong>Aviso de Seguridad:</strong> Estás en una conexión HTTPS. 
                  Para conectar con tu Ollama local, necesitas usar un túnel (como <strong>Ngrok</strong>) 
                  o configurar <code>OLLAMA_ORIGINS</code>.
                </p>
              ) : (
                <p className="hint">Asegúrate de que el servidor local esté activo con <code>ollama serve</code>.</p>
              )}
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`message ${m.role}`}>
              <div className="message-icon">
                {m.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
              </div>
              <div className="message-bubble">
                <MessageContent content={m.content} />
                
                {/* Automatic Product Grid for Search Results (Vertical Stack) */}
                {m.role === 'assistant' && m.results && m.results.length > 0 && (
                  <div className="ai-results-vertical-list">
                    {/* Only show products if they aren't already mentioned in the text via [RECOMENDACION] */}
                    {m.results.filter(p => !m.content.includes(p.id)).map(prod => (
                      <RecommendedProduct key={prod.id} id={prod.id} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
          <div className="message assistant">
            <div className="message-icon banana-thinking">
              <Bot size={20} />
            </div>
            <div className="message-content thinking">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        <div ref={endOfMessagesRef} />
        </div>

        <form className="ai-input-area" onSubmit={handleSend}>
          <input 
            type="text" 
            placeholder="Escribe tu mensaje..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading || !ollamaReady}
          />
          <button type="submit" disabled={loading || !ollamaReady}>
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIAssistant;
