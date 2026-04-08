import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Header from '../components/Header';
import './ProfilePage.css';

const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: '', phone: '', address_line1: '', address_line2: '',
    city: '', zip_code: '',
  });

  const [activeTab, setActiveTab] = useState('datos');
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    // Fetch profile
    supabase.from('customers').select('*').eq('id', user.id).single()
      .then(({ data }) => {
        if (data) {
          setProfile(data);
          setForm({
            full_name: data.full_name || '',
            phone: data.phone || '+593',
            address_line1: data.address_line1 || '',
            address_line2: data.address_line2 || '',
            city: data.city || '',
            zip_code: data.zip_code || '',
          });
        }
      });

    // Fetch orders
    setOrdersLoading(true);
    supabase.from('orders').select('*, order_items(*)').eq('customer_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => {
        setOrders(data || []);
        setOrdersLoading(false);
      });
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    await supabase.from('customers').update({ ...form, updated_at: new Date().toISOString() }).eq('id', user.id);
    setSaving(false);
    alert('Perfil actualizado con éxito');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="app-container">
      <Header />
      
      <main className="profile-container">
        <header className="profile-header">
          <div className="profile-title-group">
            <h1>Mi Cuenta</h1>
            <span className="profile-email">{user?.email}</span>
          </div>
          <button onClick={handleSignOut} className="dropdown-link logout-btn" style={{ border: 'none', background: 'none' }}>
            Cerrar Sesión
          </button>
        </header>

        <nav className="profile-tabs">
          <button 
            className={`tab-btn ${activeTab === 'datos' ? 'active' : ''}`}
            onClick={() => setActiveTab('datos')}
          >
            Mis Datos
          </button>
          <button 
            className={`tab-btn ${activeTab === 'pedidos' ? 'active' : ''}`}
            onClick={() => setActiveTab('pedidos')}
          >
            Mis Pedidos
          </button>
        </nav>

        <section className="profile-content">
          <div className="tab-content-wrapper">
          {activeTab === 'datos' ? (
            <div className="profile-grid-container">
              <form onSubmit={handleSave} className="profile-card">
                <div className="form-grid">
                  <div className="profile-field full-width">
                    <label>👤 Nombre completo</label>
                    <input
                      className="profile-input"
                      type="text"
                      value={form.full_name}
                      onChange={(e) => setForm(f => ({ ...f, full_name: e.target.value }))}
                      placeholder="Ej. Juan Pérez"
                    />
                  </div>

                  <div className="profile-field">
                    <label>📞 Teléfono (Ecuador)</label>
                    <div className="phone-input-group">
                      <input
                        className="profile-input"
                        type="tel"
                        value={form.phone}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val.startsWith('+593') || val === '+' || val === '') {
                            setForm(f => ({ ...f, phone: val }));
                          } else if (!val.startsWith('+')) {
                            setForm(f => ({ ...f, phone: '+593' + val.replace(/^0/, '') }));
                          }
                        }}
                        placeholder="+593 9 0000 0000"
                      />
                    </div>
                    <small style={{ fontSize: '0.65rem', color: '#aaa', marginTop: '0.2rem' }}>Incluye el código +593</small>
                  </div>

                  <div className="profile-field">
                    <label>🏙️ Ciudad</label>
                    <input
                      className="profile-input"
                      type="text"
                      value={form.city}
                      onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))}
                      placeholder="Ej. Guayaquil"
                    />
                  </div>

                  <div className="profile-field full-width">
                    <label>📍 Dirección principal</label>
                    <input
                      className="profile-input"
                      type="text"
                      value={form.address_line1}
                      onChange={(e) => setForm(f => ({ ...f, address_line1: e.target.value }))}
                      placeholder="Calle, número, conjunto"
                    />
                  </div>

                  <div className="profile-field">
                    <label>🏢 Depto / Referencia</label>
                    <input
                      className="profile-input"
                      type="text"
                      value={form.address_line2}
                      onChange={(e) => setForm(f => ({ ...f, address_line2: e.target.value }))}
                      placeholder="Ej. Apto 402, junto a..."
                    />
                  </div>

                  <div className="profile-field">
                    <label>📮 Código postal</label>
                    <input
                      className="profile-input"
                      type="text"
                      value={form.zip_code}
                      onChange={(e) => setForm(f => ({ ...f, zip_code: e.target.value }))}
                      placeholder="000000"
                    />
                  </div>
                </div>
                <button type="submit" className="btn-brand" disabled={saving} style={{ width: '100%', padding: '1.2rem', marginTop: '1rem' }}>
                  {saving ? 'Guardando...' : 'Guardar Datos de Envío'}
                </button>
              </form>

              <aside className="profile-sidebar">
                <div className="sidebar-card">
                  <h4>Privacidad</h4>
                  <p>Tus datos están protegidos y solo se utilizan para gestionar tus pedidos y envíos.</p>
                </div>
                <div className="sidebar-card">
                  <h4>Ayuda</h4>
                  <p>¿Necesitas ayuda con tu cuenta? Contáctanos vía WhatsApp para soporte inmediato.</p>
                </div>
              </aside>
            </div>
          ) : (
            <div className="orders-list">
              {ordersLoading ? (
                <div className="empty-state">
                  <span className="empty-icon">⏳</span>
                  <p>Cargando tu historial...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="empty-state profile-card">
                  <span className="empty-icon">🍌</span>
                  <h3>Aún no hay pedidos</h3>
                  <p>Explora nuestra tienda y encuentra la mejor tecnología.</p>
                  <Link to="/" className="btn-brand" style={{ display: 'inline-block', marginTop: '2rem', textDecoration: 'none', padding: '1rem 2rem' }}>
                    Ir a la tienda
                  </Link>
                </div>
              ) : (
                orders.map(order => (
                  <div key={order.id} className="order-item">
                    <div className="order-info">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <h3>Pedido #{order.id.slice(0, 8)}</h3>
                        <span className={`order-status status-${order.status}`}>
                          {order.status === 'pending' ? 'Pendiente' : order.status}
                        </span>
                      </div>
                      <div className="order-meta">
                        <span>💰 ${order.total.toLocaleString()}</span>
                        <span>📅 {new Date(order.created_at).toLocaleDateString()}</span>
                        <span>📦 {order.order_items?.length || 0} productos</span>
                      </div>
                    </div>
                    <div className="order-action">
                       <span style={{ color: 'var(--color-purple)', fontWeight: 800 }}>VER DETALLES →</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
          </div>
        </section>

        <footer style={{ marginTop: '4rem', textAlign: 'center' }}>
          <Link to="/" style={{ color: '#aaa', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>
            ← Volver a la página principal
          </Link>
        </footer>
      </main>
    </div>
  );
};

export default ProfilePage;
