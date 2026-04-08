import React from 'react'
import { Routes, Route } from 'react-router-dom'
import StorePage from './pages/StorePage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import ProductPage from './pages/ProductPage'
import CategoryPage from './pages/CategoryPage'
import SubcategoryPage from './pages/SubcategoryPage'
import AdminApp from './admin/AdminApp'
import ProtectedRoute from './components/ProtectedRoute'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<StorePage />} />
      <Route path="/categoria/:catId" element={<CategoryPage />} />
      <Route path="/categoria/:catId/:subId" element={<SubcategoryPage />} />
      <Route path="/producto/:id" element={<ProductPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/perfil" element={<ProfilePage />} />
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute requireSuperAdmin>
            <AdminApp />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App
