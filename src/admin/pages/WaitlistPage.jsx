import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Mail, Calendar, Info, Trash2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const WaitlistPage = () => {
  const [waitlist, setWaitlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
    <div className="admin-container">
      <header className="admin-header">
        <button onClick={() => navigate('/admin')} className="back-btn">
          <ArrowLeft size={18} /> Volver
        </button>
        <h1>Lista de Espera (Leads IA)</h1>
        <div className="lead-count">{waitlist.length} prospectos</div>
      </header>

      {loading ? (
        <div className="loading-state">Cargando lista...</div>
      ) : (
        <div className="admin-table-container glass-panel">
          <table className="admin-table">
            <thead>
              <tr>
                <th><Mail size={16} /> Email</th>
                <th><Info size={16} /> Interés</th>
                <th><Calendar size={16} /> Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {waitlist.map((entry) => (
                <tr key={entry.id}>
                  <td><strong>{entry.email}</strong></td>
                  <td>{entry.interest}</td>
                  <td className="date-cell">
                    {new Date(entry.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <button 
                      className="delete-btn" 
                      onClick={() => deleteEntry(entry.id)}
                      title="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {waitlist.length === 0 && (
                <tr>
                  <td colSpan="4" className="empty-state">No hay registros en la lista de espera aún.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <style jsx>{`
        .date-cell { font-size: 0.85rem; color: #888; }
        .back-btn { display: flex; align-items: center; gap: 8px; background: none; border: none; color: white; cursor: pointer; margin-bottom: 1rem; }
        .lead-count { background: var(--banana-yellow); color: black; padding: 4px 12px; border-radius: 20px; font-weight: bold; font-size: 0.9rem; }
        .empty-state { text-align: center; padding: 3rem; color: #666; font-style: italic; }
      `}</style>
    </div>
  );
};

export default WaitlistPage;
