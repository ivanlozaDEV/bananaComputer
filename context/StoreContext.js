"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const StoreContext = createContext();

export const useStore = () => useContext(StoreContext);

const INITIAL_HERO = {
  title: 'BANANA COMPUTER',
  subtitle: 'Computadoras potentes al mejor precio en Ecuador.',
  primary_cta: 'Explorar Sistemas',
  secondary_cta: 'Más información',
  image_url: null,
};

export const StoreProvider = ({ children }) => {
  const [heroContent, setHeroContentState] = useState(INITIAL_HERO);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHero = async () => {
      setLoading(true);
      const { data } = await supabase.from('hero_content').select('*').single();
      if (data) setHeroContentState(data);
      setLoading(false);
    };
    fetchHero();
  }, []);

  const setHeroContent = async (updates) => {
    const { data } = await supabase
      .from('hero_content')
      .update(updates)
      .eq('id', heroContent.id)
      .select()
      .single();
    if (data) setHeroContentState(data);
  };

  return (
    <StoreContext.Provider value={{
      heroContent, setHeroContent,
      loading,
    }}>
      {children}
    </StoreContext.Provider>
  );
};
