"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Bot, User, Send, X, Terminal, Cpu, Sparkles, AlertTriangle, Package, RefreshCw, ArrowRight } from 'lucide-react';
import { chatWithOllama, pingOllama } from '@/lib/ollama';
import { searchInventoryForAI, formatInventoryForAI, fetchAIBaseline, addToWaitlist } from '@/lib/inventory';
import { supabase } from '@/lib/supabase';

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

  const [quickReplies] = useState([
    'Quiero una laptop para diseño',
    'Busco algo para gaming fuerte',
    'Necesito una opción económica',
    '¿Qué laptops recomiendas?'
  ]);

  useEffect(() => {
    pingOllama().then(setOllamaReady);
    fetchAIBaseline().then(setBaselineKnowledge);
  }, []);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleQuickReply = (text) => {
    setInput(text);
    // Auto-send if needed, or just fill input
  };

  const handleSend = async (e) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    const messageContent = typeof e === 'string' ? e : input;
    if (!messageContent.trim() || loading) return;

    const userMessage = { role: 'user', content: messageContent };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      let aiResponseText = await chatWithOllama([...messages, userMessage], inventoryContext || baselineKnowledge);
      const searchMatch = aiResponseText.match(/\[SEARCH:\s*(.*?)\]/);

      if (searchMatch) {
        setLoading(true);
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

        const finalResponse = await chatWithOllama(
          [...messages, userMessage, { role: 'assistant', content: 'Buscando en el catálogo de Banana Computer...' }],
          context || baselineKnowledge
        );

        processAndAddResponse(finalResponse, results);
      } else {
        processAndAddResponse(aiResponseText);
      }
    } catch (err) {
      console.error('Banana AI Error:', err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Lo siento, tuve un pequeño mareo tecnológico. ¿Podrías repetirme eso? 🍌' }]);
    } finally {
      setLoading(false);
    }
  };

  const processAndAddResponse = (responseText, results = null) => {
    // --- 1. EXTRACT TAGS ---
    const regexTags = /\[(RECOMENDACION|COMPARE|WAITLIST_PROMPT):?\s*(.*?)\]/gi;
    const rawTags = responseText.match(regexTags) || [];
    
    // --- 2. SECURITY FILTER ---
    const lowerResRaw = responseText.toLowerCase();
    if (lowerResRaw.includes('cvv') || lowerResRaw.includes('numero de tarjeta')) {
      const safetyWarning = "⚠️ **Aviso de Seguridad**: No compartas datos de pago. Por favor, usa el carrito de compras oficial. 🍌🛡️";
      setMessages(prev => [...prev, { role: 'assistant', content: safetyWarning }]);
      return; 
    }

    // --- 3. AGGRESSIVE TEXT CLEANUP (Removing Leaks) ---
    let cleanResponse = responseText
      .replace(/\*\*\[.*?\]\*\*/gi, '') // Remove bolded tags from text
      .replace(/\[(RECOMENDACION|COMPARE|WAITLIST_PROMPT):.*?\]/gi, '') // Remove raw tags from text
      .replace(/(RECOMENDACIÓN|COMPARE|WAITLIST_PROMPT|SEARCH):/gi, '') // Remove labels
      .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '') // Remove UUIDs
      .replace(/ID:\s*/gi, '')
      .replace(/\| \$.*?\|.*?\|.*?\|.*?\|/g, '') // Remove inventory rows
      .replace(/\s+/g, ' ')
      .trim();

    // Re-attach tags for processing (without bold)
    cleanResponse += "\n\n" + rawTags.join('\n');

    // --- SAFETY MATCHER (Scoring Logic) ---
    try {
      const lines = baselineKnowledge.split('\n');
      const products = [];
      lines.forEach(line => {
        // Match name, optional model, price, and specs
        const match = line.match(/- (.*?) (?:\[Modelo: (.*?)\] )?\| \$(.*?) \| CPU: (.*?) \| RAM: (.*?) \| SSD: (.*?) \| Pantalla: (.*?) \|/);
        const idMatch = line.match(/\[ID: (.*?)\]/);
        
        if (match && idMatch) {
          products.push({ 
            name: match[1].trim(), 
            model: match[2]?.trim() || '',
            price: match[3].trim(), 
            cpu: match[4].trim(), 
            ram: match[5].trim(), 
            ssd: match[6].trim(),
            screen: match[7].trim(),
            id: idMatch[1].trim()
          });
        }
      });

      const matchedIds = new Set();
      
      // Phase 1: Match by Model (High Precision)
      products.forEach(p => {
        if (p.model) {
          const modelBase = p.model.split(/[- ]/)[0].toLowerCase(); // e.g. "E1504FA" -> "e1504fa" or partial
          const textLower = cleanResponse.toLowerCase();
          
          if (textLower.includes(p.model.toLowerCase()) || 
              (modelBase.length > 3 && textLower.includes(modelBase)) ||
              (textLower.includes(p.model.split('-')[0].toLowerCase()))) {
            matchedIds.add(p.id);
            // Add tag if not already present
            if (!cleanResponse.includes(`[RECOMENDACION: ${p.id}]`)) {
              cleanResponse += ` [RECOMENDACION: ${p.id}]`;
            }
          }
        }
      });

      // Phase 2: Match by Name (Fallback / Scoring) + Partial Match
      const uniqueNames = [...new Set(products.map(p => p.name))];
      for (const fullName of uniqueNames) {
        // Create variations: full name and name without brand (e.g., "ASUS Vivobook" -> ["ASUS Vivobook", "Vivobook"])
        const parts = fullName.split(' ');
        const variations = [fullName];
        if (parts.length > 1 && parts[0].length <= 5) variations.push(parts.slice(1).join(' ')); // e.g. "ASUS Vivobook" -> "Vivobook"

        for (const name of variations) {
          const regex = new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
          let m;
          while ((m = regex.exec(cleanResponse)) !== null) {
            const startPos = m.index;
            const endPos = startPos + m[0].length;
            
            // Skip if a tag is directly after
            if (cleanResponse.slice(endPos, endPos + 100).includes('[RECOMENDACION:')) continue;

          const context = cleanResponse.slice(Math.max(0, startPos - 100), Math.min(cleanResponse.length, endPos + 100)).toLowerCase();
          const candidates = products.filter(p => p.name.toLowerCase() === name.toLowerCase());
          let bestCand = null; let bestScore = -1;

          for (const cand of candidates) {
            let score = 0;
            const priceNum = cand.price.replace(/[$,]/g, '').split('.')[0];
            const ssdNum = cand.ssd.match(/\d+/)?.[0];
            
            if (context.includes(cand.price.toLowerCase())) score += 80;
            if (priceNum && context.includes(priceNum)) score += 60;
            if (ssdNum && context.includes(ssdNum)) score += 70;
            if (cand.ram !== 'n/a' && context.includes(cand.ram.toLowerCase())) score += 30;
            if (cand.cpu !== 'n/a' && context.includes(cand.cpu.toLowerCase().split(' ')[0])) score += 30;
            
            if (score > bestScore) { bestScore = score; bestCand = cand; }
          }
            if (bestCand && bestCand.id) {
              matchedIds.add(bestCand.id);
              const tag = ` [RECOMENDACION: ${bestCand.id}]`;
              cleanResponse = cleanResponse.slice(0, endPos) + tag + cleanResponse.slice(endPos);
              regex.lastIndex += tag.length;
            }
          }
        }
      }

      // AUTO-COMPARE FEATURE: Trigger if 2 or 3 unique products were matched
      if (matchedIds.size >= 2 && matchedIds.size <= 3 && !cleanResponse.toLowerCase().includes('[compare:')) {
        const ids = Array.from(matchedIds);
        cleanResponse += `\n\n[COMPARE: ${ids.join(', ')}]`;
      }
    } catch (e) { console.error('Safety Matcher Error:', e); }

    setMessages(prev => [...prev, { 
      role: 'assistant', 
      content: cleanResponse, 
      results,
      showGadgets: false // Initially false for delayed rendering
    }]);

    // Delay gadgets for better reading flow
    setTimeout(() => {
      setMessages(prev => prev.map((m, i) => 
        i === prev.length - 1 ? { ...m, showGadgets: true } : m
      ));
    }, 1000); // 1s delay after text appears
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4 bg-black/20 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full md:max-w-2xl h-full md:h-[85vh] bg-white/20 backdrop-blur-xl rounded-none md:rounded-[2.5rem] shadow-3xl flex flex-col overflow-hidden relative border-none md:border md:border-white/20">
        {/* Header */}
        <header className="p-6 bg-purple-brand/80 backdrop-blur-md text-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-2 bg-white/10 rounded-xl ${ollamaReady ? 'animate-pulse' : ''}`}>
              <Bot size={24} />
            </div>
            <div>
              <h3 className="font-black tracking-tight">Banana AI</h3>
              <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest opacity-60">
                <span className={`w-1.5 h-1.5 rounded-full ${ollamaReady ? 'bg-mint-success' : 'bg-raspberry'}`}></span>
                {ollamaReady ? 'Sistemas Online' : 'Sistemas Offline'}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={24} />
          </button>
        </header>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-white/10 dark:bg-black/10">
          {!ollamaReady && (
            <div className="p-6 bg-raspberry/10 border border-raspberry/20 rounded-3xl flex flex-col items-center text-center gap-3">
              <AlertTriangle className="text-raspberry" size={32} />
              <p className="text-sm font-bold text-raspberry">El Motor IA está fuera de línea.</p>
              <p className="text-[10px] opacity-60 font-medium">Asegúrate de que el servidor Ollama esté activo y accesible.</p>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex gap-4 ${m.role === 'assistant' ? 'flex-row' : 'flex-row-reverse'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.role === 'assistant' ? 'bg-purple-brand text-white' : 'bg-banana-yellow text-black'}`}>
                {m.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
              </div>
              <div className={`max-w-[85%] rounded-[1.5rem] p-4 text-sm font-medium leading-relaxed shadow-sm ${m.role === 'assistant' ? 'bg-white/40 backdrop-blur-md text-black border border-white/20' : 'bg-purple-brand/80 text-white'}`}>
                <MessageContent content={m.content} showGadgets={m.role === 'assistant' ? m.showGadgets : true} />
                {m.role === 'assistant' && m.results && m.results.length > 0 && m.showGadgets && (
                  <div className="flex flex-col gap-3 mt-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {m.results.filter(p => !m.content.includes(p.id)).map(prod => (
                      <RecommendedProduct key={prod.id} id={prod.id} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-purple-brand text-white flex items-center justify-center animate-bounce">
                <Bot size={16} />
              </div>
              <div className="bg-white/30 backdrop-blur-md p-4 rounded-3xl flex gap-1 items-center">
                <span className="w-1 h-1 bg-purple-brand rounded-full animate-bounce"></span>
                <span className="w-1 h-1 bg-purple-brand rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1 h-1 bg-purple-brand rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          )}
          <div ref={endOfMessagesRef} />
        </div>

        {/* Input area with Quick Replies */}
        <div className="bg-white/20 dark:bg-dark-nav border-t border-white/10 backdrop-blur-xl p-6 flex flex-col gap-4">
          {messages.length < 3 && (
            <div className="flex flex-wrap gap-2 mb-2 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-300">
              {quickReplies.map((text, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(text)}
                  className="px-4 py-2 bg-white/40 hover:bg-white/60 dark:bg-black/20 dark:hover:bg-black/40 border border-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
                >
                  {text}
                </button>
              ))}
            </div>
          )}
          
          <form onSubmit={handleSend} className="flex gap-4">
            <input
              type="text"
              placeholder="Escribe tu mensaje aquí..."
              className="flex-1 bg-white/30 dark:bg-black/20 border border-white/20 rounded-2xl px-6 py-4 text-sm outline-none focus:bg-white/50 transition-all font-medium placeholder-gray-500"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading || !ollamaReady}
            />
            <button
              type="submit"
              className="p-4 bg-purple-brand text-white rounded-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-purple-brand/20"
              disabled={loading || !ollamaReady}
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const RecommendedProduct = ({ id }) => {
  const [prod, setProd] = useState(null);
  useEffect(() => {
    if (!id || id === 'undefined') return;
    supabase.from('products').select('*, product_attributes(value, attribute_definitions(name, unit))').eq('id', id).single().then(({ data }) => setProd(data));
  }, [id]);

  if (!prod) return null;

  const specs = prod.product_attributes?.slice(0, 3).map(a => ({
    name: a.attribute_definitions.name,
    value: `${a.value} ${a.attribute_definitions.unit || ''}`.trim()
  })) || [];

  return (
    <Link href={`/producto/${prod.id}`} className="flex flex-col gap-3 p-4 bg-white hover:bg-gray-50 rounded-[1.5rem] border border-black/5 transition-all group shadow-sm text-black">
      <div className="flex gap-4">
        <div className="w-20 h-20 bg-gray-50 rounded-xl flex items-center justify-center p-2 border border-black/5 shrink-0">
          <img src={prod.image_url} alt={prod.name} className="object-contain w-full h-full group-hover:scale-110 transition-transform" />
        </div>
        <div className="flex flex-col justify-center gap-1">
          <h6 className="text-[11px] font-black line-clamp-2 leading-tight">{prod.name}</h6>
          <span className="text-sm font-black text-purple-brand">${parseFloat(prod.price).toLocaleString()}</span>
        </div>
      </div>
      {specs.length > 0 && (
        <div className="grid grid-cols-1 gap-1 pt-2 border-t border-black/5">
          {specs.map((s, i) => (
            <div key={i} className="flex justify-between items-center text-[9px]">
              <span className="text-gray-400 font-bold uppercase tracking-widest">{s.name}</span>
              <span className="font-bold text-gray-700">{s.value}</span>
            </div>
          ))}
        </div>
      )}
      <div className="text-[9px] font-black uppercase tracking-[0.2em] text-purple-brand mt-1 flex items-center justify-end gap-1 group-hover:gap-2 transition-all">
        Ver Detalles <ArrowRight size={10} />
      </div>
    </Link>
  );
};

const WaitlistForm = ({ interest }) => {
  const [email, setEmail] = useState('');
  const [joined, setJoined] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || submitting) return;
    setSubmitting(true);
    try {
      await addToWaitlist(email, interest);
      setJoined(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (joined) return (
    <div className="bg-mint-success/10 border border-mint-success/20 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-mint-success flex items-center gap-2">
      <Sparkles size={14} /> ¡Anotado! Te avisaremos a {email}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-black/5 p-5 rounded-2xl flex flex-col gap-3 text-black">
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">¿Quieres que te avisemos cuando llegue stock?</p>
      <div className="flex gap-2">
        <input
          type="email"
          placeholder="tu@email.com"
          className="flex-1 bg-gray-50 border border-black/5 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-purple-brand/30"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 bg-purple-brand text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-purple-brand/80 transition-all font-black"
        >
          {submitting ? '...' : 'Anotarme'}
        </button>
      </div>
    </form>
  );
};

const ComparisonTable = ({ ids }) => {
  const [products, setProducts] = useState([]);
  const idArray = ids ? ids.split(',').map(s => s.trim()) : [];

  useEffect(() => {
    if (idArray.length === 0) return;
    Promise.all(
      idArray.map(id => 
        supabase.from('products')
          .select('*, product_attributes(value, attribute_definitions(name, unit))')
          .eq('id', id)
          .single()
      )
    ).then(results => {
      setProducts(results.map(r => r.data).filter(Boolean));
    });
  }, [ids]);

  if (products.length < 2) return null;

  const getAttr = (prod, name) => {
    const search = name.toLowerCase();
    const synonyms = {
      'almacenamiento': ['almacenamiento', 'ssd', 'disco', 'hdd'],
      'procesador': ['procesador', 'cpu'],
      'gráficos': ['gráficos', 'gpu', 'video', 'graphic']
    };
    const searchTerms = synonyms[search] || [search];
    const a = prod.product_attributes?.find(attr => {
      const aName = attr.attribute_definitions.name.toLowerCase();
      return searchTerms.some(term => aName.includes(term));
    });
    return a ? `${a.value} ${a.attribute_definitions.unit || ''}` : 'N/A';
  };

  return (
    <div className="bg-white border border-black/5 rounded-2xl overflow-hidden shadow-md text-black my-2">
      <div className="bg-gray-50 p-2 border-b border-black/5 flex justify-between items-center">
        <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">Comparativa Técnica</span>
        <Terminal size={10} className="text-purple-brand opacity-30" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[10px] border-collapse min-w-[300px]">
          <thead>
            <tr>
              <th className="p-2 border-b border-r border-black/5 w-1/4 text-left pl-3 text-gray-400 font-bold uppercase text-[7px] tracking-widest">Atributo</th>
              {products.map(p => (
                <th key={p.id} className="p-2 border-b border-black/5 text-purple-brand font-black leading-tight uppercase tracking-tighter text-center">
                  {p.name.split(' ').slice(0, 2).join(' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="font-bold">
            <tr>
              <td className="p-2 border-b border-r border-black/5 text-gray-400 font-bold uppercase text-[7px] tracking-widest pl-3">Precio</td>
              {products.map(p => <td key={p.id} className="p-2 border-b border-black/5 text-center text-purple-brand">${parseFloat(p.price).toLocaleString()}</td>)}
            </tr>
            {['Procesador', 'RAM', 'Almacenamiento', 'Pantalla'].map(attr => (
              <tr key={attr}>
                <td className="p-2 border-b border-r border-black/5 text-gray-400 font-bold uppercase text-[7px] tracking-widest pl-3">{attr}</td>
                {products.map(p => <td key={p.id} className="p-2 border-b border-black/5 text-center text-gray-600 truncate max-w-[80px]">{getAttr(p, attr)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const MessageContent = ({ content, showGadgets = true }) => {
  // Now we ONLY render text here, and strip tags from visible output
  const cleanText = content
    .replace(/\[(RECOMENDACION|WAITLIST_PROMPT|COMPARE):?\s*.*?\]/gi, '')
    .replace(/\[TAGS\]/gi, '')
    .trim();

  const regexGadgets = /\[(RECOMENDACION|WAITLIST_PROMPT|COMPARE):?\s*.*?\]/gi;
  const gadgetsRaw = content.match(regexGadgets) || [];
  
  // Deduplicate and filter gadgets
  const seenIds = new Set();
  const gadgets = gadgetsRaw.filter(gadget => {
    const recMatch = gadget.match(/\[RECOMENDACION:?\s*(.*?)\]/i);
    if (recMatch) {
      const id = recMatch[1].trim();
      if (seenIds.has(id)) return false;
      seenIds.add(id);
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="text-sm font-medium leading-relaxed">{cleanText}</div>
      
      {showGadgets && gadgets.length > 0 && (
        <div className="mt-4 pt-4 border-t border-black/5 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
          {gadgets.map((gadget, i) => {
            const inner = gadget.replace(/[\[\]]/g, '');
            const [type, value] = inner.split(/[:\s]+/).map(s => s.trim());
            const ids = value ? value.split(/,\s*/).map(s => s.trim()) : [];

            if (type.toUpperCase() === 'RECOMENDACION') {
              return ids.map(id => <RecommendedProduct key={id} id={id} />);
            }
            if (type.toUpperCase() === 'WAITLIST_PROMPT') {
              return <WaitlistForm key={i} interest={value} />;
            }
            if (type.toUpperCase() === 'COMPARE') {
              return <ComparisonTable key={i} ids={value} />;
            }
            return null;
          })}
        </div>
      )}
    </div>
  );
};

export default AIAssistant;
