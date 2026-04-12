"use client";
export const dynamic = 'force-dynamic';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Mail, Calendar, Info, Trash2, ArrowLeft, Users } from 'lucide-react';
import Link from 'next/link';

export default function WaitlistAdminPage() {
  const [waitlist, setWaitlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWaitlist();
  }, []);

  const fetchWaitlist = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('waitlist')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) console.error(error);
    else setWaitlist(data || []);
    setLoading(false);
  };

  const deleteEntry = async (id) => {
    if (!confirm('¿Eliminar este registro?')) return;
    const { error } = await supabase.from('waitlist').delete().eq('id', id);
    if (!error) setWaitlist(prev => prev.filter(entry => entry.id !== id));
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <header className="flex flex-col gap-4">
        <Link href="/admin" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-black transition-colors w-fit">
          <ArrowLeft size={12} /> Volver al Dashboard
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-black tracking-tight">Lista de Espera</h1>
            <p className="text-gray-400 text-sm font-medium">Prospectos interesados capturados por la IA.</p>
          </div>
          <div className="px-4 py-2 bg-banana-yellow/10 text-banana-yellow border border-banana-yellow/20 rounded-full font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
            <Users size={14} />
            {waitlist.length} {waitlist.length === 1 ? 'Prospecto' : 'Prospectos'}
          </div>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white border border-black/5 rounded-3xl">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-black/5 border-t-banana-yellow rounded-full animate-spin"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">Cargando leads...</span>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-black/5 bg-gray-50/50">
                <th className="px-8 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Email</th>
                <th className="px-8 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Interés / Contexto</th>
                <th className="px-8 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 text-center">Fecha</th>
                <th className="px-8 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 text-right pr-12">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {waitlist.map((entry) => (
                <tr key={entry.id} className="border-b border-black/5 last:border-0 hover:bg-gray-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-brand/5 border border-purple-brand/10 flex items-center justify-center text-purple-brand">
                        <Mail size={14} />
                      </div>
                      <span className="font-bold text-sm text-gray-700">{entry.email}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <p className="text-sm text-gray-400 font-medium italic leading-relaxed">"{entry.interest || 'Sin interés especificado'}"</p>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                      {new Date(entry.created_at).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right pr-12">
                    <button 
                      onClick={() => deleteEntry(entry.id)}
                      className="p-2 rounded-xl text-gray-300 hover:text-raspberry transition-all opacity-0 group-hover:opacity-100"
                      title="Eliminar Prospecto"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {waitlist.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-8 py-20 text-center text-gray-300 font-medium italic">
                    No se han capturado leads todavía. El asistente IA registrará prospectos aquí.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
