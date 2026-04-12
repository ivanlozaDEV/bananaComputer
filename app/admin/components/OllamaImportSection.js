"use client";
import React, { useRef, useEffect, useState } from 'react';
import { Sparkles, FileText, CheckCircle2, Copy } from 'lucide-react';
import { OLLAMA_MODEL } from '@/lib/ollama';

const OllamaImportSection = ({ 
  ollama, 
  datasheetRaw, 
  setDatasheetRaw, 
  handleDatasheetFile, 
  onAnalyzeComplete 
}) => {
  const [copied, setCopied] = useState(false);
  const streamBoxRef = useRef(null);

  useEffect(() => {
    if (streamBoxRef.current) {
      streamBoxRef.current.scrollTop = streamBoxRef.current.scrollHeight;
    }
  }, [ollama.streamingText]);

  const copyStartCommand = () => {
    navigator.clipboard.writeText('ollama serve');
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="bg-gray-50/50 border border-black/5 rounded-2xl p-4 mb-6 group/import">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-purple-brand/40" />
          <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Importar con IA Local (Ollama)</span>
        </div>

        <div className="flex items-center gap-3">
          <div className={`
            flex items-center gap-2 px-3 py-1 rounded-full border text-[8px] font-black uppercase tracking-widest
            ${ollama.status === 'online' ? 'bg-mint-success/5 border-mint-success/10 text-mint-success' : 'bg-raspberry/5 border-raspberry/10 text-raspberry'}
          `}>
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${ollama.status === 'online' ? 'bg-mint-success' : 'bg-raspberry'}`}></div>
            {ollama.status === 'online' ? 'Online' : 'Offline'}
          </div>
          <button onClick={ollama.checkStatus} className="text-gray-300 hover:text-black transition-all">
            <span className="text-sm rotate-0 hover:rotate-180 transition-transform inline-block">↻</span>
          </button>
        </div>
      </div>

      {ollama.status === 'offline' && (
        <div className="bg-white border border-raspberry/10 rounded-xl p-4 mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
          <div>
            <h4 className="text-raspberry font-black text-[10px] mb-1 uppercase tracking-tight">Ollama no detectado</h4>
            <p className="text-gray-400 text-[8px] font-medium uppercase tracking-widest">Ejecuta el comando en tu terminal para activar el cerebro local:</p>
          </div>
          <button 
            onClick={copyStartCommand}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-black text-[9px] tracking-widest transition-all border
              ${copied ? 'bg-mint-success/5 border-mint-success/10 text-mint-success' : 'bg-gray-50 border-black/5 text-gray-700 hover:bg-gray-100'}
            `}
          >
            {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
            {copied ? 'COPIADO' : 'ollama serve'}
          </button>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 px-4 py-2 bg-white border border-black/5 rounded-lg cursor-pointer hover:bg-gray-50 transition-all font-black text-[9px] uppercase tracking-[0.2em] text-gray-500 shadow-sm">
              <FileText size={14} /> Subir Datasheet
              <input type="file" accept=".txt,.csv,.tsv,.md" onChange={handleDatasheetFile} className="hidden" />
            </label>
            <span className="text-[9px] font-black uppercase tracking-widest text-gray-200">o pega el texto abajo</span>
          </div>

          <button
            disabled={ollama.analyzing || !datasheetRaw.trim() || ollama.status !== 'online'}
            onClick={() => onAnalyzeComplete()}
            className={`
              px-6 py-2 rounded-lg font-black text-[9px] uppercase tracking-widest flex items-center gap-2 transition-all
              ${ollama.analyzing ? 'bg-purple-brand/10 text-purple-brand' : datasheetRaw.trim() && ollama.status === 'online' ? 'bg-purple-brand text-white hover:scale-105 active:scale-95 shadow-lg shadow-purple-brand/20' : 'bg-gray-50 text-gray-200 cursor-not-allowed'}
            `}
          >
            <Sparkles size={14} />
            {ollama.analyzing ? 'Procesando...' : 'Analizar con IA'}
          </button>
        </div>

        <textarea
          className="w-full h-24 bg-white border border-black/5 rounded-xl p-4 text-xs font-bold focus:outline-none focus:border-purple-brand/10 text-gray-700 placeholder:text-gray-200 shadow-inner"
          placeholder={`Pega aquí el datasheet o texto técnico del producto...\nLa IA mapeará automáticamente el nombre, modelo, SKU y especificaciones.`}
          value={datasheetRaw}
          onChange={e => { setDatasheetRaw(e.target.value); ollama.setError(''); }}
        />

        {ollama.analyzing && (
           <div className="animate-in fade-in slide-in-from-top-2">
            <div ref={streamBoxRef} className="bg-gray-900 border border-black/10 rounded-xl p-4 h-32 overflow-y-auto font-mono text-[9px] text-mint-success/80 leading-relaxed shadow-2xl">
              <div className="flex items-center gap-2 mb-2 opacity-40">
                <span className="w-1 h-1 rounded-full bg-mint-success animate-pulse"></span>
                <span className="uppercase tracking-[0.2em] font-black text-[7px]">IA Thinking...</span>
              </div>
              {ollama.streamingText}
              <span className="inline-block w-1 h-2 bg-mint-success animate-pulse ml-0.5"></span>
            </div>
           </div>
        )}

        {ollama.error && (
          <div className="p-3 bg-raspberry/5 border border-raspberry/10 rounded-lg text-raspberry text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
            ⚠️ {ollama.error}
          </div>
        )}
      </div>
    </div>
  );
};

export default OllamaImportSection;
