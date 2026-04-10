"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;

    // 1. Check current session immediately
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          if (session?.user) {
            setUser(session.user);
            const userRole = session.user.user_metadata?.role;
            const appRole = session.user.app_metadata?.role;
            const allowedRoles = ['admin', 'superadmin', 'superuser'];
            const hasAdminRole = allowedRoles.includes(userRole) || allowedRoles.includes(appRole);
            
            console.log('Admin check:', { userRole, appRole, hasAdminRole });
            setIsAdmin(hasAdminRole);
          } else {
            setUser(null);
            setIsAdmin(false);
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    // 2. Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        if (session?.user) {
          setUser(session.user);
          const userRole = session.user.user_metadata?.role;
          const appRole = session.user.app_metadata?.role;
          const allowedRoles = ['admin', 'superadmin', 'superuser'];
          const hasAdminRole = allowedRoles.includes(userRole) || allowedRoles.includes(appRole);
          
          console.log('Auth Status Changed:', { userRole, appRole, hasAdminRole });
          setIsAdmin(hasAdminRole);
        } else {
          setUser(null);
          setIsAdmin(false);
        }
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = (email, password) => supabase.auth.signInWithPassword({ email, password });
  const signUp = (email, password) => supabase.auth.signUp({ 
    email, 
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/auth/callback`,
    }
  });
  const signInWithGoogle = () => supabase.auth.signInWithOAuth({ 
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/auth/callback`,
    }
  });
  const signOut = () => supabase.auth.signOut();

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, signIn, signUp, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
