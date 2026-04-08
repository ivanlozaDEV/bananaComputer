import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Header from '../components/Header';
import Breadcrumbs from '../components/Breadcrumbs';
import './CategoryPage.css';

const CategoryPage = () => {
  const { catId } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        setLoading(true);
        // Fetch category info
        const { data: catData, error: catError } = await supabase
          .from('categories')
          .select('*')
          .eq('id', catId)
          .single();

        if (catError) throw catError;
        setCategory(catData);

        // Fetch subcategories
        const { data: subData, error: subError } = await supabase
          .from('subcategories')
          .select('*')
          .eq('category_id', catId)
          .order('name');

        if (subError) throw subError;
        setSubcategories(subData || []);
      } catch (err) {
        console.error('Error fetching category:', err);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryData();
  }, [catId, navigate]);

  if (loading) {
    return (
      <div className="category-page-loading">
        <Header />
        <div className="loading-spinner">Cargando categoría...</div>
      </div>
    );
  }

  return (
    <div className="category-page">
      <Header />
      
      <main className="category-content">
        <Breadcrumbs items={[{ label: category.name }]} />

        <header className="category-header">
          <h1 className="category-title">{category.name}</h1>
          <p className="category-subtitle">Explora nuestras soluciones especializadas en {category.name.toLowerCase()}.</p>
          <div className="rainbow-stripe"></div>
        </header>

        <div className="cat-grid">
          {subcategories.map(sub => (
            <a key={sub.id} href={`/categoria/${catId}/${sub.id}`} className="cat-card">
              <div className="cat-card-img">
                {sub.image_url ? (
                  <img src={sub.image_url} alt={sub.name} className="cat-sub-img" />
                ) : (
                  <div className="cat-card-icon">📂</div>
                )}
              </div>
              <div className="cat-card-info">
                <h3 className="cat-card-title">{sub.name}</h3>
                <p className="cat-card-desc">{sub.description || `Explora lo mejor en ${sub.name}`}</p>
                <span className="cat-card-btn">Ver productos →</span>
              </div>
            </a>
          ))}
        </div>
      </main>

      <footer className="footer-simple">
        <p>&copy; 2026 Banana Computer. Calidad y Confianza.</p>
      </footer>
    </div>
  );
};

export default CategoryPage;
