import React, { useRef, useEffect, useState } from 'react';
import { Sparkles, FileText } from 'lucide-react';
import { OLLAMA_MODEL } from '../../lib/ollama';

const OllamaImportSection = ({ 
  ollama, 
  datasheetRaw, 
  setDatasheetRaw, 
  handleDatasheetFile, 
  onAnalyzeComplete 
}) => {
  const [copied, setCopied] = useState(false);
  const streamBoxRef = useRef(null);

  // Auto-scroll streaming box when new tokens arrive
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
    <div style={{ background: '#0f0f0f', border: '1px solid #2a2a2a', borderRadius: '14px', padding: '1.25rem', marginBottom: '1.5rem' }}>
      {/* Header row: title + live status indicator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={16} style={{ color: '#a78bfa' }} />
          <span style={{ color: '#a78bfa', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Importar con IA (Ollama)
          </span>
        </div>

        {/* Status pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            fontSize: '0.72rem', fontWeight: 700, padding: '0.25rem 0.65rem',
            borderRadius: '99px', border: '1px solid',
            background: ollama.status === 'online' ? '#052e16' : ollama.status === 'offline' ? '#1a0f0f' : '#111',
            color:      ollama.status === 'online' ? '#4ade80' : ollama.status === 'offline' ? '#f87171' : '#555',
            borderColor:ollama.status === 'online' ? '#166534' : ollama.status === 'offline' ? '#7f1d1d' : '#2a2a2a',
          }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
            {ollama.status === 'online' ? 'Ollama activo' : ollama.status === 'offline' ? 'Ollama inactivo' : 'Verificando...'}
          </span>

          <button type="button" onClick={ollama.checkStatus}
            style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: '0.75rem', padding: '0.2rem 0.4rem' }}>
            ↻
          </button>
        </div>
      </div>

      {/* Offline helper */}
      {ollama.status === 'offline' && (
        <div style={{ background: '#1a0f0f', border: '1px solid #3a1a1a', borderRadius: '10px', padding: '0.85rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <p style={{ color: '#f87171', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>Ollama no está corriendo</p>
            <p style={{ color: '#888', fontSize: '0.75rem' }}>Abre una terminal y ejecuta:</p>
            <code style={{ color: '#fde68a', fontSize: '0.8rem', fontFamily: 'monospace', background: '#111', padding: '0.2rem 0.5rem', borderRadius: '6px', display: 'inline-block', marginTop: '0.25rem' }}>ollama serve</code>
          </div>
          <button type="button" onClick={copyStartCommand}
            style={{ background: copied ? '#052e16' : '#1f1f1f', border: '1px solid', borderColor: copied ? '#166534' : '#3a3a3a', color: copied ? '#4ade80' : '#ccc', borderRadius: '10px', padding: '0.5rem 1rem', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
            {copied ? '✓ Copiado!' : '📋 Copiar comando'}
          </button>
        </div>
      )}

      <p style={{ color: '#666', fontSize: '0.8rem', marginBottom: '1rem' }}>
        Sube el datasheet del fabricante (TXT, CSV) o pega el texto. La IA llenará todos los campos automáticamente — puedes editar después.
      </p>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', cursor: 'pointer', color: '#ccc', fontSize: '0.8rem', fontWeight: 600 }}>
          <FileText size={14} />
          Subir archivo
          <input type="file" accept=".txt,.csv,.tsv,.md" onChange={handleDatasheetFile} style={{ display: 'none' }} />
        </label>

        <span style={{ color: '#444', fontSize: '0.75rem' }}>o pega el texto abajo</span>

        <button
          type="button"
          className="admin-btn"
          disabled={ollama.analyzing || !datasheetRaw.trim() || ollama.status !== 'online'}
          onClick={() => onAnalyzeComplete()}
          style={{
            background: ollama.analyzing ? '#2d1f4e' : '#4c1d95',
            color: '#c4b5fd',
            border: '1px solid #5b21b6',
            marginLeft: 'auto',
            opacity: (!datasheetRaw.trim() || ollama.status !== 'online') ? 0.4 : 1,
          }}
        >
          <Sparkles size={14} />
          {ollama.analyzing ? 'Analizando...' : ollama.status !== 'online' ? 'Ollama inactivo' : 'Analizar con IA'}
        </button>
      </div>

      {/* Datasheet textarea */}
      <textarea
        style={{ marginTop: '0.75rem', width: '100%', minHeight: '110px', background: '#111', border: '1px solid #2a2a2a', borderRadius: '10px', color: '#9ca3af', fontFamily: 'monospace', fontSize: '0.78rem', padding: '0.75rem', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
        placeholder={`Pega aquí el datasheet del fabricante...\n\nEjemplo:\nRAM    8GB DDR4\nStorage    512GB NVMe SSD\nProcessor    Intel Core i5-1235U\n...`}
        value={datasheetRaw}
        onChange={e => { setDatasheetRaw(e.target.value); ollama.setError(''); }}
      />

      {/* Live streaming preview */}
      {ollama.analyzing && ollama.streamingText && (
        <div ref={streamBoxRef} style={{ marginTop: '0.75rem', background: '#080808', border: '1px solid #1a1a1a', borderRadius: '10px', padding: '0.75rem', maxHeight: '160px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.72rem', color: '#4ade80', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          <span style={{ color: '#555', display: 'block', marginBottom: '0.25rem' }}>▶ ollama ({OLLAMA_MODEL})</span>
          {ollama.streamingText}<span style={{ opacity: 0.6 }}>▌</span>
        </div>
      )}
      {ollama.analyzing && !ollama.streamingText && (
        <p style={{ color: '#a78bfa', fontSize: '0.8rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Sparkles size={12} /> Conectando con Ollama...
        </p>
      )}
      {ollama.error && <p style={{ color: '#f87171', fontSize: '0.8rem', marginTop: '0.5rem' }}>⚠️ {ollama.error}</p>}
    </div>
  );
};

export default OllamaImportSection;
