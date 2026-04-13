"use client";
import { useState, useCallback, useRef } from 'react';
import { pingOllama, analyzeWithOllama, generateBananaReview } from '@/lib/ollama';

/**
 * useOllama — Hook for AI automation in Product Catalog.
 */
export function useOllama() {
  const [status, setStatus] = useState('checking');
  const [analyzing, setAnalyzing] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [error, setError] = useState('');
  const activeController = useRef(null);

  const checkStatus = useCallback(async () => {
    const ok = await pingOllama();
    setStatus(ok ? 'online' : 'offline');
    return ok;
  }, []);

  const analyze = useCallback(async (datasheetRaw, attrDefs, onComplete, price = null) => {
    if (!datasheetRaw.trim()) {
      setError('Primero sube o pega el datasheet del producto.');
      return;
    }

    setAnalyzing(true);
    setError('');
    setStreamingText('');

    const ctrl = new AbortController();
    activeController.current = ctrl;

    try {
      const result = await analyzeWithOllama(datasheetRaw, attrDefs, (text) => {
        setStreamingText(text);
      }, ctrl.signal, price);
      
      if (activeController.current === ctrl) {
        if (onComplete) onComplete(result);
        setStreamingText('');
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError(`Error de AI: ${err.message}.`);
    } finally {
      if (activeController.current === ctrl) {
        setAnalyzing(false);
        activeController.current = null;
      }
    }
  }, []);

  const cancel = useCallback(() => {
    if (activeController.current) {
      activeController.current.abort();
      activeController.current = null;
      setAnalyzing(false);
    }
  }, []);

  const generateReview = useCallback(async (product, attrs, onComplete) => {
    setAnalyzing(true);
    setError('');
    
    const ctrl = new AbortController();
    activeController.current = ctrl;

    try {
      const specsText = attrs.map(a => `${a.name}: ${a.value}`).join(', ');
      const result = await generateBananaReview(product, specsText, ctrl.signal);
      
      if (activeController.current === ctrl) {
        if (onComplete) onComplete(result);
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError(`Error generando review: ${err.message}`);
    } finally {
      if (activeController.current === ctrl) {
        setAnalyzing(false);
        activeController.current = null;
      }
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
    cancel,
    setError,
    setStreamingText
  };
}
