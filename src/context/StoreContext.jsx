import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

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
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const [heroRes, productsRes, categoriesRes] = await Promise.all([
        supabase.from('hero_content').select('*').single(),
        supabase.from('products').select('*, categories(name, slug)').eq('is_active', true),
        supabase.from('categories').select('*, attribute_definitions(*), subcategories(*, attribute_definitions(*))').order('name'),
      ]);

      if (heroRes.data) setHeroContentState(heroRes.data);
      if (productsRes.data) setProducts(productsRes.data);
      if (categoriesRes.data) setCategories(categoriesRes.data);
      setLoading(false);
    };

    fetchAll();
  }, []);

  const refreshProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*, categories(name, slug)')
      .eq('is_active', true);
    if (data) setProducts(data);
  };

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
      products, refreshProducts,
      categories,
      loading,
    }}>
      {children}
    </StoreContext.Provider>
  );
};
