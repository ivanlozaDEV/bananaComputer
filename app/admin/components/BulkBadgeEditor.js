"use client";
import React, { useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { X, CheckCircle2, AlertTriangle, Zap, ShieldCheck } from 'lucide-react';

const BADGE_OPTIONS = [
  { value: 'new',         label: '🆕 Nuevo',         cls: 'bg-banana-yellow text-black' },
  { value: 'featured',    label: '🏆 Destacado',      cls: 'bg-purple-brand text-white' },
  { value: 'sale',        label: '🔥 Oferta',         cls: 'bg-orange-500 text-white' },
  { value: 'unavailable', label: '🚫 No Disponible',  cls: 'bg-raspberry text-white' },
];

/**
 * BulkBadgeEditor
 * Props:
 *   allProducts  — full product list already loaded
 *   onClose      — callback to close the modal
 *   onDone       — callback after successful save (triggers re-fetch)
 */
export default function BulkBadgeEditor({ allProducts, onClose, onDone }) {
  const [rawInput, setRawInput]     = useState('');
  const [targetBadge, setTargetBadge] = useState('');
  const [inverseMode, setInverseMode] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [result, setResult]         = useState(null);

  // ── Parse input tokens ──
  const tokens = useMemo(() =>
    rawInput.split(/[\n,;]+/).map(t => t.trim()).filter(Boolean),
    [rawInput]
  );

  // ── Match tokens → products ──
  const { matched, notFound } = useMemo(() => {
    if (tokens.length === 0) return { matched: [], notFound: [] };
    const matched = [];
    const notFound = [];
    tokens.forEach(token => {
      const lc = token.toLowerCase();
      const hit = allProducts.find(p =>
        p.model_number?.toLowerCase() === lc ||
        p.sku?.toLowerCase() === lc ||
        p.name?.toLowerCase() === lc
      );
      if (hit) {
        if (!matched.find(m => m.id === hit.id)) matched.push(hit);
      } else {
        notFound.push(token);
      }
    });
    return { matched, notFound };
  }, [tokens, allProducts]);

  // ── In inverse mode, "affected" = all active products NOT in the matched list ──
  const affectedProducts = useMemo(() => {
    if (!inverseMode) return matched;
    const matchedIds = new Set(matched.map(p => p.id));
    return allProducts.filter(p => p.is_active && !matchedIds.has(p.id));
  }, [inverseMode, matched, allProducts]);

  const canApply = affectedProducts.length > 0 && targetBadge;

  // ── Apply ──
  const handleApply = async () => {
    if (!canApply) return;
    setSaving(true);
    try {
      let error;
      if (!inverseMode) {
        // Normal: update matched products
        const ids = affectedProducts.map(p => p.id);
        ({ error } = await supabase
          .from('products')
          .update({ badge_type: targetBadge })
          .in('id', ids));
      } else {
        // Inverse: update all EXCEPT matched (safe list)
        const safeIds = matched.map(p => p.id);
        if (safeIds.length > 0) {
          ({ error } = await supabase
            .from('products')
            .update({ badge_type: targetBadge })
            .eq('is_active', true)
            .not('id', 'in', `(${safeIds.join(',')})`));
        } else {
          // No safe list — update all active products
          ({ error } = await supabase
            .from('products')
            .update({ badge_type: targetBadge })
            .eq('is_active', true));
        }
      }

      if (error) throw error;

      setResult({
        updated: affectedProducts.length,
        saved: inverseMode ? matched.length : 0,
        notFound: notFound.length,
        badgeLabel: BADGE_OPTIONS.find(b => b.value === targetBadge)?.label,
        wasInverse: inverseMode,
      });
      onDone?.();
    } catch (e) {
      console.error(e);
      alert('Error al aplicar cambios: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const selectedBadge = BADGE_OPTIONS.find(b => b.value === targetBadge);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[300] animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[301] flex items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300 max-h-[90vh]">

          {/* Header */}
          <div className="flex items-center justify-between px-8 py-6 border-b border-black/5">
            <div>
              <h2 className="text-xl font-black tracking-tight">Edición Masiva de Etiquetas</h2>
              <p className="text-xs font-bold text-gray-400 mt-0.5">
                Pega modelos, SKUs o nombres — separados por coma o por línea
              </p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-400 hover:text-black">
              <X size={20} />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 px-8 py-6 flex flex-col gap-6">

            {result ? (
              /* ── SUCCESS STATE ── */
              <div className="flex flex-col items-center gap-6 py-8 text-center">
                <div className="w-16 h-16 bg-mint-success/10 rounded-full flex items-center justify-center">
                  <CheckCircle2 size={32} className="text-mint-success" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-2xl font-black">{result.updated} productos actualizados</p>
                  <p className="text-sm text-gray-400 font-bold">
                    Etiqueta: {result.badgeLabel}
                  </p>
                  {result.wasInverse && result.saved > 0 && (
                    <p className="text-sm text-mint-success font-bold">
                      {result.saved} producto{result.saved > 1 ? 's' : ''} protegido{result.saved > 1 ? 's' : ''} (sin cambios)
                    </p>
                  )}
                  {result.notFound > 0 && (
                    <p className="text-sm text-raspberry font-bold">
                      {result.notFound} token{result.notFound > 1 ? 's' : ''} no encontrado{result.notFound > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="px-8 py-3 bg-purple-brand text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <>
                {/* ── MODE TOGGLE ── */}
                <div className="flex rounded-2xl border border-black/10 overflow-hidden">
                  <button
                    onClick={() => setInverseMode(false)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-[9px] font-black uppercase tracking-widest transition-all ${
                      !inverseMode ? 'bg-purple-brand text-white' : 'bg-gray-50 text-gray-400 hover:text-black'
                    }`}
                  >
                    <Zap size={11} />
                    Aplicar a la lista
                  </button>
                  <button
                    onClick={() => setInverseMode(true)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-[9px] font-black uppercase tracking-widest transition-all border-l border-black/10 ${
                      inverseMode ? 'bg-raspberry text-white' : 'bg-gray-50 text-gray-400 hover:text-black'
                    }`}
                  >
                    <ShieldCheck size={11} />
                    Salvar la lista (aplicar al resto)
                  </button>
                </div>

                {/* Mode description */}
                <div className={`rounded-2xl px-4 py-3 text-[10px] font-bold leading-relaxed ${
                  inverseMode
                    ? 'bg-raspberry/5 border border-raspberry/20 text-raspberry'
                    : 'bg-purple-brand/5 border border-purple-brand/10 text-purple-brand'
                }`}>
                  {inverseMode
                    ? `🛡️ Los productos que listes quedarán PROTEGIDOS (sin cambios). La etiqueta seleccionada se aplicará a TODOS los demás productos activos del catálogo.`
                    : `⚡ La etiqueta seleccionada se aplicará ÚNICAMENTE a los productos de la lista.`
                  }
                </div>

                {/* ── STEP 1: Input ── */}
                <div className="flex flex-col gap-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-gray-500">
                    {inverseMode ? 'Lista de productos que se salvan (no cambiarán)' : 'Lista de modelos, SKUs o nombres'}
                  </label>
                  <textarea
                    className="w-full bg-gray-50 border border-black/10 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-purple-brand/40 transition-all resize-none placeholder:text-gray-300 font-mono leading-relaxed"
                    rows={4}
                    placeholder={"VX2428A, IdeaPad Gaming 3, ROG Strix G16\nLP-RYZEN5-16GB\nVivoBook 15X OLED"}
                    value={rawInput}
                    onChange={e => setRawInput(e.target.value)}
                  />
                  {tokens.length > 0 && (
                    <p className="text-[9px] font-black text-gray-400 ml-1">
                      {tokens.length} token{tokens.length > 1 ? 's' : ''} detectado{tokens.length > 1 ? 's' : ''}
                      {' · '}{matched.length} encontrado{matched.length > 1 ? 's' : ''}
                      {notFound.length > 0 && <span className="text-raspberry"> · {notFound.length} no encontrado{notFound.length > 1 ? 's' : ''}</span>}
                    </p>
                  )}
                </div>

                {/* ── STEP 2: Badge selector ── */}
                <div className="flex flex-col gap-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-gray-500">
                    Nueva etiqueta {inverseMode ? 'para el resto del catálogo' : 'para los productos listados'}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {BADGE_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setTargetBadge(opt.value)}
                        className={`px-3 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest border-2 transition-all ${
                          targetBadge === opt.value
                            ? `${opt.cls} border-transparent shadow-lg scale-105`
                            : 'bg-gray-50 text-gray-500 border-transparent hover:border-black/10'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── STEP 3: Preview ── */}
                {tokens.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-500">
                      Previsualización
                    </label>

                    {/* Protected / Matched list */}
                    {matched.length > 0 && (
                      <div className={`border rounded-2xl overflow-hidden ${inverseMode ? 'bg-mint-success/5 border-mint-success/20' : 'bg-mint-success/5 border-mint-success/20'}`}>
                        <div className="px-4 py-2.5 bg-mint-success/10 flex items-center gap-2">
                          {inverseMode ? <ShieldCheck size={12} className="text-mint-success" /> : <CheckCircle2 size={12} className="text-mint-success" />}
                          <span className="text-[9px] font-black text-mint-success uppercase tracking-widest">
                            {inverseMode
                              ? `${matched.length} protegido${matched.length > 1 ? 's' : ''} — no cambiarán`
                              : `${matched.length} producto${matched.length > 1 ? 's' : ''} seleccionado${matched.length > 1 ? 's' : ''}`
                            }
                          </span>
                        </div>
                        <div className="divide-y divide-black/5 max-h-40 overflow-y-auto">
                          {matched.map(p => (
                            <div key={p.id} className="flex items-center gap-3 px-4 py-2">
                              {p.image_url && <img src={p.image_url} alt="" className="w-7 h-7 object-contain rounded-lg bg-gray-50 shrink-0" />}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-black truncate">{p.name}</p>
                                <p className="text-[9px] text-gray-400 font-bold">
                                  {p.model_number && <span className="mr-2">{p.model_number}</span>}
                                  {p.sku && <span className="opacity-60">{p.sku}</span>}
                                </p>
                              </div>
                              {!inverseMode && selectedBadge && (
                                <span className={`px-2 py-0.5 rounded-full text-[7px] font-black tracking-widest uppercase shrink-0 ${selectedBadge.cls}`}>
                                  {selectedBadge.label}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Inverse: summary of affected */}
                    {inverseMode && (
                      <div className={`rounded-2xl px-4 py-3 flex items-center justify-between ${
                        selectedBadge ? 'bg-raspberry/5 border border-raspberry/20' : 'bg-gray-50 border border-black/5'
                      }`}>
                        <div className="flex items-center gap-3">
                          <AlertTriangle size={14} className={selectedBadge ? 'text-raspberry' : 'text-gray-300'} />
                          <div>
                            <p className={`text-[9px] font-black uppercase tracking-widest ${selectedBadge ? 'text-raspberry' : 'text-gray-400'}`}>
                              {affectedProducts.length} producto{affectedProducts.length > 1 ? 's' : ''} recibirán{' '}
                              {selectedBadge ? selectedBadge.label : 'la etiqueta seleccionada'}
                            </p>
                            <p className="text-[8px] text-gray-400 font-bold mt-0.5">
                              Todos los productos activos excepto los {matched.length} protegidos
                            </p>
                          </div>
                        </div>
                        {selectedBadge && (
                          <span className={`px-2 py-0.5 rounded-full text-[7px] font-black tracking-widest uppercase shrink-0 ${selectedBadge.cls}`}>
                            {selectedBadge.label}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Not found warning */}
                    {notFound.length > 0 && (
                      <div className="bg-orange-50 border border-orange-200 rounded-2xl px-4 py-3 flex items-start gap-3">
                        <AlertTriangle size={13} className="text-orange-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest mb-1">
                            {notFound.length} token{notFound.length > 1 ? 's' : ''} no encontrado{notFound.length > 1 ? 's' : ''}
                          </p>
                          <p className="text-[9px] font-bold text-gray-500 leading-relaxed">{notFound.join(' · ')}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          {!result && (
            <div className="px-8 py-5 border-t border-black/5 flex items-center justify-between gap-4">
              <p className="text-[9px] font-bold text-gray-400">
                {canApply
                  ? `${affectedProducts.length} producto${affectedProducts.length > 1 ? 's' : ''} ${inverseMode ? 'cambiarán' : 'listos para actualizar'}`
                  : 'Ingresa modelos arriba y selecciona una etiqueta'}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest text-gray-400 hover:text-black hover:bg-gray-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleApply}
                  disabled={!canApply || saving}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${
                    canApply && !saving
                      ? inverseMode
                        ? 'bg-raspberry text-white hover:scale-105 shadow-lg shadow-raspberry/20'
                        : 'bg-purple-brand text-white hover:scale-105 shadow-lg shadow-purple-brand/20'
                      : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                  }`}
                >
                  {saving
                    ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : inverseMode ? <AlertTriangle size={11} /> : <Zap size={11} />
                  }
                  {inverseMode
                    ? `Aplicar al resto (${affectedProducts.length})`
                    : `Aplicar a ${affectedProducts.length} producto${affectedProducts.length !== 1 ? 's' : ''}`
                  }
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
