import { useState, useCallback } from 'react';
import { pingOllama, analyzeWithOllama } from '../lib/ollama';

export function useOllama() {
  const [status, setStatus] = useState('checking');
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [streamingText, setStreamingText] = useState('');

  const checkStatus = useCallback(async () => {
    const ok = await pingOllama();
    setStatus(ok ? 'online' : 'offline');
    return ok;
  }, []);

  const analyze = useCallback(async (datasheetRaw, attrDefs, onComplete) => {
    if (!datasheetRaw.trim()) {
      setError('Primero sube o pega el datasheet del producto.');
      return;
    }

    setAnalyzing(true);
    setError('');
    setStreamingText('');

    try {
      const result = await analyzeWithOllama(datasheetRaw, attrDefs, (text) => {
        setStreamingText(text);
      });
      
      if (onComplete) {
        onComplete(result);
      }
      setStreamingText('');
    } catch (err) {
      setError(`Error de Ollama: ${err.message}. ¿Está Ollama corriendo? (ollama serve)`);
    } finally {
      setAnalyzing(false);
    }
  }, []);

  const generateReview = useCallback(async (product, attrs, onComplete) => {
    setAnalyzing(true);
    setError('');
    try {
      const specsText = attrs.map(a => `${a.name}: ${a.value}`).join(', ');
      const result = await import('../lib/ollama').then(m => m.generateBananaReview(product, specsText));
      if (onComplete) onComplete(result);
    } catch (err) {
      setError(`Error generando review: ${err.message}`);
    } finally {
      setAnalyzing(false);
    }
  }, []);

  return {
    status,
    analyzing,
    error,
    streamingText,
    checkStatus,
    analyze,
    generateReview,
    setError,
    setStreamingText
  };
}
