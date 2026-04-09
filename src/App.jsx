import React from 'react'
import { Routes, Route } from 'react-router-dom'
import StorePage from './pages/StorePage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import ProductPage from './pages/ProductPage'
import CategoryPage from './pages/CategoryPage'
import SubcategoryPage from './pages/SubcategoryPage'
import AdminApp from './admin/AdminApp'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import ProtectedRoute from './components/ProtectedRoute'
import BananaLoader from './components/BananaLoader'
import ContactPage from './pages/ContactPage'
import LegalPage from './pages/LegalPage'
import './App.css'




function App() {
  return (
    <>
      <BananaLoader />
      <Routes>
      <Route path="/" element={<StorePage />} />
      <Route path="/categoria/:catId" element={<CategoryPage />} />
      <Route path="/categoria/:catId/:subId" element={<SubcategoryPage />} />
      <Route path="/producto/:id" element={<ProductPage />} />
      <Route path="/contacto" element={<ContactPage />} />
      <Route path="/legal/:section" element={<LegalPage />} />
      <Route path="/login" element={<LoginPage />} />


      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route 
        path="/perfil" 
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } 
      />
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute requireSuperAdmin>
            <AdminApp />
          </ProtectedRoute>
        }
      />
    </Routes>
    </>
  )
}


export default App
