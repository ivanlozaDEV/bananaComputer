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
  const [brandLogos, setBrandLogos] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBrandLogos = async () => {
    const { data } = await supabase.from('brand_logos').select('*').order('created_at', { ascending: true });
    if (data) setBrandLogos(data);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: heroData } = await supabase.from('hero_content').select('*').single();
      if (heroData) setHeroContentState(heroData);
      
      await fetchBrandLogos();
      setLoading(false);
    };
    fetchData();
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

  const updateBrandLogos = async (logos) => {
    // This is a helper for the admin to save all at once if needed, 
    // but we'll likely do individual uploads.
    setBrandLogos(logos);
  };

  const addBrandLogo = async (logo) => {
    const { data, error } = await supabase.from('brand_logos').insert(logo).select().single();
    if (data) {
      setBrandLogos(prev => [...prev, data]);
      return data;
    }
    return null;
  };

  const deleteBrandLogo = async (id) => {
    const { error } = await supabase.from('brand_logos').delete().eq('id', id);
    if (!error) {
      setBrandLogos(prev => prev.filter(l => l.id !== id));
      return true;
    }
    return false;
  };

  return (
    <StoreContext.Provider value={{
      heroContent, setHeroContent,
      brandLogos, addBrandLogo, deleteBrandLogo, fetchBrandLogos,
      loading,
    }}>
      {children}
    </StoreContext.Provider>
  );
};
