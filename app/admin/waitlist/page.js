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
    <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col gap-4">
        <Link href="/admin" className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors w-fit">
          <ArrowLeft size={14} /> Volver al Dashboard
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-black tracking-tight">Lista de Espera</h1>
            <p className="text-gray-500 font-medium">Prospectos interesados capturados por la IA.</p>
          </div>
          <div className="px-4 py-2 bg-banana-yellow text-black rounded-full font-black text-sm flex items-center gap-2">
            <Users size={16} />
            {waitlist.length} {waitlist.length === 1 ? 'Prospecto' : 'Prospectos'}
          </div>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white/5 rounded-3xl border border-white/5">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-white/10 border-t-banana-yellow rounded-full animate-spin"></div>
            <span className="text-xs font-black uppercase tracking-[0.3em] opacity-40">Cargando leads...</span>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-white/5 bg-white/5 backdrop-blur-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Email</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Interés / Contexto</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 text-center">Fecha</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {waitlist.map((entry) => (
                <tr key={entry.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-brand/20 flex items-center justify-center text-purple-brand">
                        <Mail size={14} />
                      </div>
                      <span className="font-bold text-sm">{entry.email}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm opacity-60 font-medium italic">"{entry.interest || 'Sin interés especificado'}"</p>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="text-[10px] font-black opacity-30">
                      {new Date(entry.created_at).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={() => deleteEntry(entry.id)}
                      className="p-2 rounded-xl bg-raspberry/10 text-raspberry opacity-0 group-hover:opacity-100 transition-all hover:bg-raspberry hover:text-white"
                      title="Eliminar Prospecto"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {waitlist.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-8 py-20 text-center text-gray-500 font-medium italic italic">
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
