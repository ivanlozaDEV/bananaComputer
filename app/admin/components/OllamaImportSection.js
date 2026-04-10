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
    <div className="bg-white/5 border border-white/5 rounded-3xl p-6 mb-8 group/import">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-banana-yellow" />
          <span className="text-xs font-black uppercase tracking-widest text-banana-yellow">Importar con IA Local (Ollama)</span>
        </div>

        <div className="flex items-center gap-4">
          <div className={`
            flex items-center gap-2 px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest
            ${ollama.status === 'online' ? 'bg-mint-success/10 border-mint-success/20 text-mint-success' : 'bg-raspberry/10 border-raspberry/20 text-raspberry'}
          `}>
            <div className={`w-2 h-2 rounded-full animate-pulse ${ollama.status === 'online' ? 'bg-mint-success' : 'bg-raspberry'}`}></div>
            {ollama.status === 'online' ? 'Conectado' : 'Desconectado'}
          </div>
          <button onClick={ollama.checkStatus} className="text-gray-500 hover:text-white transition-colors">
            <span className="text-lg rotate-0 hover:rotate-180 transition-transform inline-block">↻</span>
          </button>
        </div>
      </div>

      {ollama.status === 'offline' && (
        <div className="bg-raspberry/5 border border-raspberry/10 rounded-2xl p-6 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h4 className="text-raspberry font-black text-sm mb-1 uppercase tracking-tight">Ollama no está en ejecución</h4>
            <p className="text-gray-500 text-xs font-medium">Ejecuta el siguiente comando en tu terminal para activar el cerebro local:</p>
          </div>
          <button 
            onClick={copyStartCommand}
            className={`
              flex items-center gap-3 px-6 py-3 rounded-xl font-black text-xs transition-all border
              ${copied ? 'bg-mint-success/10 border-mint-success/20 text-mint-success' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}
            `}
          >
            {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
            {copied ? 'COPIADO' : 'ollama serve'}
          </button>
        </div>
      )}

      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10 transition-all font-black text-[10px] uppercase tracking-widest">
              <FileText size={16} /> Subir Datasheet
              <input type="file" accept=".txt,.csv,.tsv,.md" onChange={handleDatasheetFile} className="hidden" />
            </label>
            <span className="text-[10px] font-black uppercase tracking-widest opacity-20">o pega el texto abajo</span>
          </div>

          <button
            disabled={ollama.analyzing || !datasheetRaw.trim() || ollama.status !== 'online'}
            onClick={() => onAnalyzeComplete()}
            className={`
              px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all
              ${ollama.analyzing ? 'bg-purple-brand/20 text-purple-brand' : datasheetRaw.trim() && ollama.status === 'online' ? 'bg-purple-brand text-white hover:scale-105 active:scale-95' : 'bg-white/5 text-gray-700 opacity-50 cursor-not-allowed'}
            `}
          >
            <Sparkles size={16} />
            {ollama.analyzing ? 'Procesando...' : 'Analizar con IA'}
          </button>
        </div>

        <textarea
          className="w-full h-32 bg-black/20 border border-white/5 rounded-2xl p-6 text-sm font-medium focus:outline-none focus:border-white/10 text-gray-400 placeholder:opacity-20"
          placeholder={`Pega aquí el datasheet o texto técnico del producto...\nLa IA mapeará automáticamente el nombre, modelo, SKU y especificaciones.`}
          value={datasheetRaw}
          onChange={e => { setDatasheetRaw(e.target.value); ollama.setError(''); }}
        />

        {ollama.analyzing && (
           <div className="animate-in fade-in slide-in-from-top-2">
            <div ref={streamBoxRef} className="bg-black/40 border border-white/5 rounded-2xl p-6 h-40 overflow-y-auto font-mono text-[11px] text-mint-success leading-relaxed">
              <div className="flex items-center gap-2 mb-3 opacity-40">
                <span className="w-2 h-2 rounded-full bg-mint-success animate-pulse"></span>
                <span className="uppercase tracking-[0.2em] font-bold text-[9px]">Ollama @ {OLLAMA_MODEL} is thinking...</span>
              </div>
              {ollama.streamingText}
              <span className="inline-block w-1.5 h-3 bg-mint-success animate-pulse ml-0.5"></span>
            </div>
           </div>
        )}

        {ollama.error && (
          <div className="p-4 bg-raspberry/10 border border-raspberry/20 rounded-xl text-raspberry text-[10px] font-black uppercase tracking-widest">
            ⚠️ {ollama.error}
          </div>
        )}
      </div>
    </div>
  );
};

export default OllamaImportSection;
