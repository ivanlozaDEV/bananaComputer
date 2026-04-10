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
          [...messages, userMessage, { role: 'assistant', content: 'Buscando en el catálogo...' }],
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
    let cleanResponse = responseText.replace(/\[SEARCH:.*?\]/g, '').trim();

    // --- SECURITY FILTER ---
    const lowerRes = cleanResponse.toLowerCase();
    const sensitiveKeywords = ['cvv', 'vencimiento', 'numero de tarjeta', 'credit card', 'clave de cajero', 'pin de tarjeta'];
    const suspiciousPhrases = ['ingresa tu tarjeta', 'dame tu numero', 'puedes pagar aqui', 'necesito tu tarjeta'];
    const isSafeCardMention = lowerRes.includes('tarjeta gráfica') || lowerRes.includes('tarjeta de video') || lowerRes.includes('tarjeta del producto') || lowerRes.includes('esta tarjeta') || lowerRes.includes('la tarjeta que aparece');

    if (!isSafeCardMention && (sensitiveKeywords.some(kw => lowerRes.includes(kw)) || suspiciousPhrases.some(p => lowerRes.includes(p)))) {
      cleanResponse = "⚠️ **Aviso de Seguridad**: Por tu protección, Banana AI no puede solicitar ni procesar datos de pago directamente en el chat. Por favor, utiliza los botones de compra oficial o el carrito de la tienda para finalizar tu pedido de forma segura. 🍌🛡️";
    }

    // --- SAFETY MATCHER (Scoring Logic) ---
    try {
      const lines = baselineKnowledge.split('\n');
      const products = [];
      lines.forEach(line => {
        const match = line.match(/- (.*?) \| \$(.*?) \| RAM: (.*?) \| CPU: (.*?) \[ID: (.*?)\]/);
        if (match) products.push({ name: match[1].trim(), price: match[2].trim(), ram: match[3].trim(), cpu: match[4].trim(), id: match[5].trim() });
      });

      const uniqueNames = [...new Set(products.map(p => p.name))];
      for (const name of uniqueNames) {
        const regex = new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        let m;
        while ((m = regex.exec(cleanResponse)) !== null) {
          const startPos = m.index;
          const endPos = startPos + m[0].length;
          if (cleanResponse.slice(endPos, endPos + 100).includes('[RECOMENDACION:')) continue;

          const context = cleanResponse.slice(Math.max(0, startPos - 80), Math.min(cleanResponse.length, endPos + 80)).toLowerCase();
          const candidates = products.filter(p => p.name.toLowerCase() === name.toLowerCase());
          let bestCand = null; let bestScore = -1;

          for (const cand of candidates) {
            let score = 0;
            if (context.includes(cand.price.toLowerCase())) score += 50;
            if (cand.ram !== 'n/a' && context.includes(cand.ram.toLowerCase())) score += 30;
            if (cand.cpu !== 'n/a' && context.includes(cand.cpu.toLowerCase().split(' ')[0])) score += 30;
            if (score > bestScore) { bestScore = score; bestCand = cand; }
          }
          if (bestCand) {
            const tag = ` [RECOMENDACION: ${bestCand.id}]`;
            cleanResponse = cleanResponse.slice(0, endPos) + tag + cleanResponse.slice(endPos);
            regex.lastIndex += tag.length;
          }
        }
      }
    } catch (e) { console.error('Safety Matcher Error:', e); }

    setMessages(prev => [...prev, { role: 'assistant', content: cleanResponse, results }]);
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
                <MessageContent content={m.content} />
                {m.role === 'assistant' && m.results && m.results.length > 0 && (
                  <div className="flex flex-col gap-3 mt-4">
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

        {/* Input */}
        <form onSubmit={handleSend} className="p-6 bg-white/20 dark:bg-dark-nav border-t border-white/10 backdrop-blur-xl flex gap-4">
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

const MessageContent = ({ content }) => {
  const regex = /(\[RECOMENDACION:\s*.*?\]|\[WAITLIST_PROMPT:\s*.*?\])/g;
  const parts = content.split(regex);
  return (
    <div className="flex flex-col gap-4">
      {parts.map((part, i) => {
        const recMatch = part.match(/\[RECOMENDACION:\s*(.*?)\]/);
        const waitMatch = part.match(/\[WAITLIST_PROMPT:\s*(.*?)\]/);

        if (recMatch) return <RecommendedProduct key={i} id={recMatch[1].trim()} />;
        if (waitMatch) return <WaitlistForm key={i} interest={waitMatch[1].trim()} />;
        return <span key={i}>{part}</span>;
      })}
    </div>
  );
};

export default AIAssistant;
