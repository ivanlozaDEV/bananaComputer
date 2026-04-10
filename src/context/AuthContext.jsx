import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for auth changes (fires on load too with INITIAL_SESSION event)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setRole(session?.user?.app_metadata?.role ?? 'customer');
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = (email, password) =>
    supabase.auth.signInWithPassword({ email, password });

  const signUp = (email, password) =>
    supabase.auth.signUp({ email, password });

  const signOut = () => supabase.auth.signOut();
  
  const signInWithGoogle = () =>
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });

  const resetPassword = (email) =>
    supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

  const updatePassword = (newPassword) =>
    supabase.auth.updateUser({ password: newPassword });

  const isSuperAdmin = ['admin', 'superadmin'].includes(role);

  return (
    <AuthContext.Provider value={{ 
      user, role, isSuperAdmin, loading, 
      signIn, signUp, signInWithGoogle, signOut, resetPassword, updatePassword 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
