"use client";
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from './components/Sidebar';

export default function AdminLayout({ children }) {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push('/login');
    }
  }, [user, isAdmin, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-nav flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-white/10 border-t-banana-yellow rounded-full animate-spin"></div>
      </div>
    );
  }

  // Double check admin status before rendering sensitive layout
  if (!user || !isAdmin) return null;

  return (
    <div className="flex min-h-screen bg-cream-bg text-black">
      <Sidebar />
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
