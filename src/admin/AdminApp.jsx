import React from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Image, Tag, Package, LogOut, ExternalLink } from 'lucide-react';
import DashboardPage from './pages/DashboardPage';
import HeroEditorPage from './pages/HeroEditorPage';
import CategoriesPage from './pages/CategoriesPage';
import ProductsPage from './pages/ProductsPage';
import './AdminApp.css';

const NAV_ITEMS = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/hero', icon: Image, label: 'Hero' },
  { to: '/admin/categories', icon: Tag, label: 'Categorías' },
  { to: '/admin/products', icon: Package, label: 'Productos' },
];

const AdminApp = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-brand">🍌 Admin</div>
        </div>

        <nav className="admin-nav">
          {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <a href="/" target="_blank" rel="noopener noreferrer" className="admin-nav-item">
            <ExternalLink size={18} />
            <span>Ver tienda</span>
          </a>
          <button onClick={handleSignOut} className="admin-nav-item admin-signout">
            <LogOut size={18} />
            <span>Salir</span>
          </button>
        </div>
      </aside>

      <main className="admin-content">
        <Routes>
          <Route index element={<DashboardPage />} />
          <Route path="hero" element={<HeroEditorPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="products" element={<ProductsPage />} />
        </Routes>
      </main>
    </div>
  );
};

export default AdminApp;
