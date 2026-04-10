import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Header from '../components/Header';
import Breadcrumbs from '../components/Breadcrumbs';
import ProductGrid from '../components/ProductGrid';
import Footer from '../components/Footer';
import './SubcategoryPage.css';

const SubcategoryPage = () => {
  const { catId, subId } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState(null);
  const [subcategory, setSubcategory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchParamsData = async () => {
      try {
        setLoading(true);
        const [catRes, subRes] = await Promise.all([
          supabase.from('categories').select('*').eq('id', catId).single(),
          supabase.from('subcategories').select('*').eq('id', subId).single()
        ]);

        if (catRes.error) throw catRes.error;
        if (subRes.error) throw subRes.error;

        setCategory(catRes.data);
        setSubcategory(subRes.data);
      } catch (err) {
        console.error('Error fetching subcategory context:', err);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchParamsData();
  }, [catId, subId, navigate]);

  if (loading) {
    return <div className="loading-full">Cargando productos...</div>;
  }

  const breadcrumbItems = [
    { label: category.name, path: `/categoria/${catId}` },
    { label: subcategory.name }
  ];

  return (
    <div className="subcategory-page">
      <Header />
      
      <main className="subcategory-content">
        <Breadcrumbs items={breadcrumbItems} />

        <header className="subcategory-header">
          <div className="sub-header-top">
            <span className="sub-label">// Categoría: {category.name}</span>
            <h1 className="subcategory-title">{subcategory.name}</h1>
          </div>
          <div className="rainbow-stripe"></div>
        </header>

        {/* Filtered Product Grid */}
        <ProductGrid subcategoryId={subId} />
      </main>

      <Footer />
    </div>
  );
};

export default SubcategoryPage;
