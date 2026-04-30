"use client";
import React, { useState, useEffect, useRef, memo, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Bot, User, Send, X, Terminal, Cpu, Sparkles, AlertTriangle, Package, RefreshCw, ArrowRight } from 'lucide-react';
import { chatWithOllama, pingOllama } from '@/lib/ollama';
import { searchInventoryForAI, formatInventoryForAI, generateAIBaseline, filterInventoryByIds, fetchProductDetailsBySlug } from '@/lib/inventory';
import WaitlistForm from '@/components/WaitlistForm';
import { supabase } from '@/lib/supabase';
import { productUrl } from '@/lib/productUrl';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TAG_REGEX_SRC = '\\[(RECOMENDACI[OÓ]N|COMPARE|WAITLIST_PROMPT|SEARCH):?\\s*(.*?)\\]';
const getTagRegex = () => new RegExp(TAG_REGEX_SRC, 'gi');

const AIAssistant = ({ onClose }) => {
  // ── Onboarding: step 0=category, 1=budget, 2=done ──
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [categories, setCategories] = useState([]);
  const [userPrefs, setUserPrefs] = useState({ category: '', budget: '' });
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '¡Hola! Soy Banana AI 🍌 ¿Qué tipo de producto estás buscando hoy?' }
  ]);
  const [loading, setLoading] = useState(false);
  const [inventoryContext, setInventoryContext] = useState('');
  const [baselineKnowledge, setBaselineKnowledge] = useState('');
  const [ollamaReady, setOllamaReady] = useState(true);
  const endOfMessagesRef = useRef(null);

  const BUDGET_OPTIONS = ['Menos de $600', '$600 - $1000', '$1000 - $1500', 'Más de $1500'];

  const retryPing = useCallback(() => {
    setOllamaReady(true);
    pingOllama().then(setOllamaReady);
  }, []);

  useEffect(() => {
    pingOllama().then(setOllamaReady);
    // Always generate fresh baseline — never use cached version which may include unavailable products
    generateAIBaseline().then(setBaselineKnowledge);
    supabase.from('categories').select('name').order('name')
      .then(({ data }) => setCategories((data || []).map(c => c.name)));
  }, []);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Only attach gadgetTags to fresh recommendations (not follow-ups)
  const isFollowUpQuestion = (text) => {
    const followUpKeywords = [
      'tiene', 'cuánto', 'cuanto', 'pesa', 'mide', 'cuál', 'cual', 'es', 'son',
      'sirve', 'puedo', 'funciona', 'incluye', 'viene', 'viene con', 'garantía',
      'garantia', 'envío', 'envio', 'precio', 'y la', 'y el', 'y ese', 'y esa',
    ];
    const lc = text.toLowerCase();
    return followUpKeywords.some(kw => lc.startsWith(kw)) || lc.includes('?');
  };

  const processAndAddResponse = useCallback((responseText) => {
    // Always create a fresh regex instance — the /g flag is stateful
    const rawTags = [...responseText.matchAll(new RegExp(TAG_REGEX_SRC, 'gi'))].map(m => m[0]);
    console.log('[BananaAI] rawTags found:', rawTags);

    const stripTags = (text) => text
      .replace(/\*\*\[.*?\]\*\*/gi, '')
      .replace(getTagRegex(), '')
      .replace(/(RECOMENDACI[OÓ]N|COMPARE|WAITLIST_PROMPT|SEARCH):/gi, '')
      .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '')
      .replace(/ID:\s*/gi, '')
      .replace(/\[\s*\]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (responseText.toLowerCase().includes('cvv') || responseText.toLowerCase().includes('numero de tarjeta')) {
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ No compartas datos de pago. Usa el carrito oficial. 🍌🛡️' }]);
      return;
    }

    const cleanResponse = stripTags(responseText);
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: cleanResponse,
      gadgetTags: rawTags,
      showGadgets: rawTags.length === 0,
    }]);

    if (rawTags.length > 0) {
      setTimeout(() => {
        setMessages(prev => prev.map((m, i) =>
          i === prev.length - 1 ? { ...m, showGadgets: true } : m
        ));
      }, 800);
    }
  }, []);

  const handleSend = async (text) => {
    if (!text.trim() || loading) return;

    const userMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);

    // ── STEP 0: Pick category ──
    if (onboardingStep === 0) {
      setUserPrefs(prev => ({ ...prev, category: text }));
      setOnboardingStep(1);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Perfecto, te ayudo con ${text}. ¿Cuál es tu presupuesto aproximado?`
      }]);
      return;
    }

    // ── STEP 1: Pick budget → trigger recommendation ──
    if (onboardingStep === 1) {
      const budget = text;
      const category = userPrefs.category;
      setUserPrefs(prev => ({ ...prev, budget }));
      setOnboardingStep(2);
      setLoading(true);

      try {
        // Phase 1: Selection — compact index, cheap tokens
        const selectionPrompt = [
          `SISTEMA: Eres un asesor de ventas. Elige los SLUGS de los 3 mejores productos de la categoría "${category}" para un cliente con presupuesto ${budget}.`,
          `REGLAS: 1) Prioriza productos dentro del rango de precio. 2) Elige los de mejores especificaciones. 3) Devuelve SOLO los 3 slugs separados por comas, sin texto adicional.`,
        ].join('\n');

        const selectionResponse = await chatWithOllama(
          [{ role: 'user', content: selectionPrompt }],
          inventoryContext || baselineKnowledge
        );

        const selectedSlugs = (selectionResponse.match(/[a-z0-9][a-z0-9-]{4,99}/g) || [])
          .filter(s => !s.includes(' '))
          .slice(0, 3);

        // Phase 2: Enrich — full specs only for the 3 selected
        let detailContext = selectedSlugs.length > 0
          ? await fetchProductDetailsBySlug(selectedSlugs)
          : '';
        if (!detailContext) {
          detailContext = filterInventoryByIds(inventoryContext || baselineKnowledge, selectedSlugs);
        }
        setInventoryContext(detailContext);

        // Phase 3: Answer — concise, datasheet-backed explanation
        const answerPrompt = [
          `[SISTEMA]: El cliente busca ${category} con presupuesto ${budget}.`,
          `Explica en máximo 1 oración por producto por qué cada uno es la mejor opción para ese uso y presupuesto, usando solo los datos de la ficha técnica.`,
          `Incluye al final exactamente un [RECOMENDACION: slug] por producto.`,
        ].join('\n');

        const aiResponseText = await chatWithOllama(
          [...messages, userMessage, { role: 'user', content: answerPrompt }],
          detailContext
        );
        processAndAddResponse(aiResponseText);
      } catch (err) {
        console.error('Selection/Chat Error:', err);
        processAndAddResponse('Lo siento, tuve un problema. ¿Podrías intentar de nuevo? 🍌');
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);

    // Fix #4: AbortController with 20s timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
      let aiResponseText = await chatWithOllama(
        [...messages, userMessage],
        inventoryContext || baselineKnowledge,
        controller.signal
      );
      // ── Auto-retry si el AI olvidó los tags ──────────────────────
      // Si la respuesta hace referencia a nombres de productos del inventario
      // pero no incluye ningún [RECOMENDACION: UUID], reenviamos con recordatorio.
      const followUp = isFollowUpQuestion(text);

      // Only retry tag injection for fresh recommendations, not follow-ups
      if (!followUp) {
        const hasTags = /\[RECOMENDACI[OÓ]N\s*:/i.test(aiResponseText);
        const mentionsProduct = /\b(ASUS|Lenovo|HP|Dell|MSI|ROG|TUF|Vivobook|Acer|Samsung|ViewSonic|Epson|BenQ)\b/i.test(aiResponseText);

        if (mentionsProduct && !hasTags) {
          await new Promise(res => setTimeout(res, 1500));
          const retry = await chatWithOllama(
            [...messages, userMessage,
              { role: 'assistant', content: aiResponseText },
              { role: 'user', content: '⚠️ SISTEMA: Olvidaste los tags [RECOMENDACION: slug]. Añádelos al final con los slugs exactos del inventario.' }
            ],
            inventoryContext || baselineKnowledge,
            controller.signal
          );
          aiResponseText = retry;
        }
      }

      const searchMatch = aiResponseText.match(/\[SEARCH:\s*(.*?)\]/i);

      if (searchMatch) {
        const params = searchMatch[1];
        const categoryMatch = params.match(/category=([^ \s,\]]+)/i);
        const priceMatch = params.match(/max_price=(\d+)/i);
        const filters = {
          category: categoryMatch ? categoryMatch[1].trim() : null,
          maxPrice: priceMatch ? parseInt(priceMatch[1]) : null
        };
        const results = await searchInventoryForAI(filters);
        const context = formatInventoryForAI(results);
        setInventoryContext(context);
        const finalResponse = await chatWithOllama(
          [...messages, userMessage, { role: 'assistant', content: 'Buscando en el catálogo...' }],
          context || baselineKnowledge,
          controller.signal
        );
        processAndAddResponse(finalResponse);
      } else {
        processAndAddResponse(aiResponseText);
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        setMessages(prev => [...prev, { role: 'assistant', content: 'La respuesta tardó demasiado. Por favor intenta de nuevo. 🍌⏱️' }]);
      } else {
        console.error('Banana AI Error:', err);
        setMessages(prev => [...prev, { role: 'assistant', content: 'Lo siento, tuve un pequeño mareo tecnológico. ¿Podrías repetirme eso? 🍌' }]);
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4 bg-black/20 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full md:max-w-2xl h-full md:h-[85vh] bg-white/20 backdrop-blur-xl rounded-none md:rounded-[2.5rem] shadow-3xl flex flex-col overflow-hidden relative border-none md:border md:border-white/20">
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

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-white/10">
          {/* Fix #2 + #9: retry button, no blocking, generic message */}
          {!ollamaReady && (
            <div className="p-6 bg-raspberry/10 border border-raspberry/20 rounded-3xl flex flex-col items-center text-center gap-3">
              <AlertTriangle className="text-raspberry" size={32} />
              <p className="text-sm font-bold text-raspberry">El asistente está temporalmente fuera de línea.</p>
              <p className="text-[10px] opacity-60 font-medium">Intenta de nuevo en unos momentos.</p>
              <button
                onClick={retryPing}
                className="flex items-center gap-2 px-4 py-2 bg-raspberry/20 hover:bg-raspberry/30 text-raspberry text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
              >
                <RefreshCw size={12} /> Reintentar conexión
              </button>
            </div>
          )}

          <MessageList messages={messages} loading={loading} />
          <div ref={endOfMessagesRef} />
        </div>

        {/* Fix #2: don't hard-disable input when offline — user can still try */}
        <ChatInput
          onSend={handleSend}
          disabled={loading}
          quickReplies={
            onboardingStep === 0 ? categories :
            onboardingStep === 1 ? BUDGET_OPTIONS :
            []
          }
        />
      </div>
    </div>
  );
};

const MessageList = memo(({ messages, loading }) => {
  return (
    <>
      {messages.map((m, i) => (
        <div key={i} className={`flex gap-4 ${m.role === 'assistant' ? 'flex-row' : 'flex-row-reverse'} animate-in fade-in duration-500`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.role === 'assistant' ? 'bg-purple-brand text-white' : 'bg-banana-yellow text-black'}`}>
            {m.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
          </div>
          <div className={`max-w-[85%] rounded-[1.5rem] p-4 text-sm font-medium leading-relaxed shadow-sm ${m.role === 'assistant' ? 'bg-white/40 backdrop-blur-md text-black border border-white/20' : 'bg-purple-brand/80 text-white'}`}>
            <MessageContent 
              content={m.content}
              gadgetTags={m.gadgetTags || []}
              showGadgets={m.role === 'assistant' ? m.showGadgets : true} 
            />
            {/* Removed m.results block: gadgetTags in MessageContent is the single
                source of truth for product cards. m.results was showing ALL search
                results regardless of AI recommendation, causing irrelevant cards. */}
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
    </>
  );
});

const ChatInput = ({ onSend, disabled, quickReplies }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || disabled) return;
    onSend(input.trim());
    setInput('');
  };

  return (
    <div className="bg-white/20 border-t border-white/10 backdrop-blur-xl p-6 flex flex-col gap-4">
      {quickReplies.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-300">
          {quickReplies.map((text, i) => (
            <button
              key={i}
              onClick={() => onSend(text)}
              className="px-4 py-2 bg-white/40 hover:bg-white/60 border border-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
            >
              {text}
            </button>
          ))}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex gap-4">
        <input
          type="text"
          placeholder="Escribe tu mensaje aquí..."
          className="flex-1 bg-white/30 border border-white/20 rounded-2xl px-6 py-4 text-sm outline-none focus:bg-white/50 transition-all font-medium placeholder-gray-500"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={disabled}
        />
        <button
          type="submit"
          className="p-4 bg-purple-brand text-white rounded-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-purple-brand/20"
          disabled={disabled || !input.trim()}
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

const PROD_SELECT = '*, categories(slug, name), subcategories:subcategory_id(slug, name), product_attributes(value, attribute_definitions(name, unit))';

const RecommendedProduct = memo(({ id }) => {
  const [prod, setProd] = useState(null);
  useEffect(() => {
    if (!id || id === 'undefined') return;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    const fetchProduct = async () => {
      // 1. Exact match by UUID or slug
      const { data: exact } = await (isUuid
        ? supabase.from('products').select(PROD_SELECT).eq('id', id).neq('badge_type', 'unavailable').maybeSingle()
        : supabase.from('products').select(PROD_SELECT).eq('slug', id).neq('badge_type', 'unavailable').maybeSingle()
      );
      if (exact) { setProd(exact); return; }

      // 2. Fuzzy fallback — slug contains the AI token (handles truncated slugs)
      if (!isUuid) {
        const { data: fuzzy } = await supabase
          .from('products')
          .select(PROD_SELECT)
          .ilike('slug', `%${id}%`)
          .neq('badge_type', 'unavailable')
          .limit(1)
          .maybeSingle();
        if (fuzzy) { setProd(fuzzy); return; }
      }
    };

    fetchProduct();
  }, [id]);

  if (!prod) return null;

  const specs = prod.product_attributes?.slice(0, 3).map(a => ({
    name: a.attribute_definitions.name,
    value: `${a.value} ${a.attribute_definitions.unit || ''}`.trim()
  })) || [];

  const catSlug = prod.categories?.slug;
  const subSlug = prod.subcategories?.slug;
  const url = productUrl(prod);

  return (
    <Link href={url} className="flex flex-col gap-3 p-4 bg-white hover:bg-gray-50 rounded-[1.5rem] border border-black/5 transition-all group shadow-sm text-black">
      <div className="flex gap-4">
        <div className="w-20 h-20 bg-gray-50 rounded-xl flex items-center justify-center p-2 border border-black/5 shrink-0">
          {/* Fix #8: fallback image on broken URL */}
          <img
            src={prod.image_url || '/placeholder.png'}
            alt={prod.name}
            className="object-contain w-full h-full group-hover:scale-110 transition-transform"
            onError={e => { e.currentTarget.src = '/placeholder.png'; }}
          />
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
});



const ComparisonTable = memo(({ ids }) => {
  const [products, setProducts] = useState([]);
  const idArray = ids ? ids.split(',').map(s => s.trim()) : [];

  useEffect(() => {
    if (idArray.length === 0) return;
    
    Promise.all(
      idArray.map(id => {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        const query = isUuid 
          ? supabase.from('products').select('*, product_attributes(value, attribute_definitions(name, unit))').eq('id', id)
          : supabase.from('products').select('*, product_attributes(value, attribute_definitions(name, unit))').eq('slug', id);
        return query.single();
      })
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
});

const MessageContent = memo(({ content, gadgetTags = [], showGadgets = true }) => {
  // Fix #7: content is already clean; use gadgetTags for widgets
  const cleanText = useMemo(() => {
    return content.replace(new RegExp(TAG_REGEX_SRC, 'gi'), '').replace(/\[TAGS\]/gi, '').trim();
  }, [content]);

  // Fix #7: use gadgetTags prop (separated from content) instead of re-parsing content
  const gadgets = useMemo(() => {
    const seenIds = new Set();
    return gadgetTags.filter(gadget => {
      const recMatch = gadget.match(/RECOMENDACI[OÓ]N:?\s*(.*?)\]/i);
      const waitMatch = gadget.match(/WAITLIST_PROMPT:?\s*(.*?)\]/i);
      
      if (recMatch) {
        const id = recMatch[1].trim();
        if (!id || seenIds.has(id)) return false;
        seenIds.add(id);
      }
      
      if (waitMatch && seenIds.size > 0) return false;
      
      return true;
    });
  }, [gadgetTags]);

  return (
    <div className="flex flex-col gap-4">
      <div className="text-sm font-medium leading-relaxed">{cleanText}</div>
      
      {showGadgets && gadgets.length > 0 && (
        <div className="mt-4 pt-4 border-t border-black/5 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
          {gadgets.map((gadget, i) => {
            const inner = gadget.replace(/[\[\]]/g, '');
            const typeMatch = inner.match(/^(RECOMENDACI[OÓ]N|WAITLIST_PROMPT|COMPARE|SEARCH)[:\s]*(.*)$/i);
            if (!typeMatch) return null;
            
            const type = typeMatch[1];
            const value = typeMatch[2];
            const ids = value ? value.split(/[\s,]+/).map(s => s.trim()).filter(Boolean) : [];

            // Fix #3: normalize accented Ó before comparing
            const normalizedType = type.toUpperCase()
              .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

            if (normalizedType === 'RECOMENDACION') {
              return ids.map(id => <RecommendedProduct key={id} id={id} />);
            }
            if (normalizedType === 'WAITLIST_PROMPT') {
              return <WaitlistForm key={i} interest={value} />;
            }
            if (normalizedType === 'COMPARE') {
              return <ComparisonTable key={i} ids={value} />;
            }
            return null;
          })}
        </div>
      )}
    </div>
  );
});

export default AIAssistant;
