import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Header from '../components/Header';

const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: '', phone: '', address_line1: '', address_line2: '',
    city: '', country: '', zip_code: '',
  });

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    supabase.from('customers').select('*').eq('id', user.id).single()
      .then(({ data }) => {
        if (data) {
          setProfile(data);
          setForm({
            full_name: data.full_name || '',
            phone: data.phone || '',
            address_line1: data.address_line1 || '',
            address_line2: data.address_line2 || '',
            city: data.city || '',
            country: data.country || '',
            zip_code: data.zip_code || '',
          });
        }
      });
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    await supabase.from('customers').update({ ...form, updated_at: new Date().toISOString() }).eq('id', user.id);
    setSaving(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="app-container">
      <Header />
      <main style={{ maxWidth: '640px', margin: '4rem auto', padding: '0 2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem' }}>Mi perfil</h1>
        <p style={{ color: '#888', marginBottom: '2rem' }}>{user?.email}</p>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[
            ['Nombre completo', 'full_name', 'text'],
            ['Teléfono', 'phone', 'tel'],
            ['Dirección línea 1', 'address_line1', 'text'],
            ['Dirección línea 2', 'address_line2', 'text'],
            ['Ciudad', 'city', 'text'],
            ['País', 'country', 'text'],
            ['Código postal', 'zip_code', 'text'],
          ].map(([label, field, type]) => (
            <div key={field} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#888' }}>
                {label}
              </label>
              <input
                type={type}
                value={form[field]}
                onChange={(e) => setForm(f => ({ ...f, [field]: e.target.value }))}
                style={{ padding: '0.9rem 1rem', border: '1.5px solid #e0e0e0', borderRadius: '12px', fontFamily: 'inherit', fontSize: '0.95rem' }}
              />
            </div>
          ))}
          <button type="submit" className="btn-brand" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>

        <button onClick={handleSignOut} className="outline-button" style={{ marginTop: '1.5rem', width: '100%' }}>
          Cerrar sesión
        </button>

        <Link to="/" style={{ display: 'block', textAlign: 'center', marginTop: '1rem', color: '#aaa', textDecoration: 'none', fontSize: '0.8rem' }}>
          ← Volver a la tienda
        </Link>
      </main>
    </div>
  );
};

export default ProfilePage;
