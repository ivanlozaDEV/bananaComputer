import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const DashboardPage = () => {
  const [stats, setStats] = useState({ products: 0, categories: 0, customers: 0, featured: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [p, c, cu, f] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('categories').select('*', { count: 'exact', head: true }),
        supabase.from('customers').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_featured', true),
      ]);
      setStats({
        products: p.count || 0,
        categories: c.count || 0,
        customers: cu.count || 0,
        featured: f.count || 0,
      });
      setLoading(false);
    };
    fetchStats();
  }, []);

  const STATS = [
    { label: 'Productos', value: stats.products, emoji: '📦' },
    { label: 'Destacados', value: stats.featured, emoji: '⭐' },
    { label: 'Categorías', value: stats.categories, emoji: '🏷️' },
    { label: 'Clientes', value: stats.customers, emoji: '👥' },
  ];

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Dashboard</h1>
      </div>

      <div className="admin-stat-grid">
        {STATS.map(({ label, value, emoji }) => (
          <div key={label} className="admin-stat-card">
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{emoji}</div>
            <div className="admin-stat-value">{loading ? '—' : value}</div>
            <div className="admin-stat-label">{label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#1a1a1a', borderRadius: '16px', padding: '1.5rem', border: '1px solid #272727' }}>
        <h2 style={{ color: '#fff', fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Accesos rápidos</h2>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {['hero', 'categories', 'products'].map(page => (
            <a key={page} href={`/admin/${page}`} className="admin-btn admin-btn-ghost" style={{ textDecoration: 'none' }}>
              {page === 'hero' ? '🖼️ Editar Hero' : page === 'categories' ? '🏷️ Categorías' : '📦 Productos'}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
