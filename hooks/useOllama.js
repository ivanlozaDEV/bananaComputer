"use client";
import { useState, useCallback } from 'react';
import { pingOllama, analyzeWithOllama, generateBananaReview } from '@/lib/ollama';

/**
 * useOllama — Hook for AI automation in Product Catalog.
 */
export function useOllama() {
  const [status, setStatus] = useState('checking');
  const [analyzing, setAnalyzing] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [error, setError] = useState('');
  const [abortController, setAbortController] = useState(null);

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

    const ctrl = new AbortController();
    setAbortController(ctrl);

    try {
      const result = await analyzeWithOllama(datasheetRaw, attrDefs, (text) => {
        setStreamingText(text);
      }, ctrl.signal);
      
      if (onComplete) {
        onComplete(result);
      }
      setStreamingText('');
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError(`Error de Ollama: ${err.message}. ¿Está Ollama corriendo? (ollama serve)`);
    } finally {
      if (ctrl === abortController) {
        setAnalyzing(false);
        setAbortController(null);
      }
    }
  }, [abortController]);

  const cancel = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setAnalyzing(false);
    }
  }, [abortController]);

  const generateReview = useCallback(async (product, attrs, onComplete) => {
    setAnalyzing(true);
    setError('');
    const ctrl = new AbortController();
    setAbortController(ctrl);
    try {
      const specsText = attrs.map(a => `${a.name}: ${a.value}`).join(', ');
      const result = await generateBananaReview(product, specsText, ctrl.signal);
      if (onComplete) onComplete(result);
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError(`Error generando review: ${err.message}`);
    } finally {
      if (ctrl === abortController) {
        setAnalyzing(false);
        setAbortController(null);
      }
    }
  }, [abortController]);

  return {
    status,
    analyzing,
    error,
    streamingText,
    checkStatus,
    analyze,
    generateReview,
    cancel,
    setError,
    setStreamingText
  };
}
