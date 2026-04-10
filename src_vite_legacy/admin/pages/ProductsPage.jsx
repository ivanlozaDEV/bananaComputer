import React, { useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus } from 'lucide-react';
import { useOllama } from '../../hooks/useOllama';
import { useProductForm } from '../../hooks/useProductForm';
import ProductTable from '../components/ProductTable';
import ProductModal from '../components/ProductModal';

const ProductsPage = () => {
  const [products, setProducts] = React.useState([]);
  const [categories, setCategories] = React.useState([]);
  
  const fetchAll = async () => {
    const [p, c] = await Promise.all([
      supabase.from('products').select('*, categories(name)').order('created_at', { ascending: false }),
      supabase.from('categories').select('*, attribute_definitions(*), subcategories(*, attribute_definitions(*))').order('name'),
    ]);
    setProducts(p.data || []);
    setCategories(c.data || []);
  };

  const productForm = useProductForm(categories, fetchAll);
  const ollama = useOllama();

  useEffect(() => { fetchAll(); }, []);

  // Sync Ollama status when modal opens
  useEffect(() => {
    if (productForm.modal) {
      ollama.checkStatus();
    } else {
      ollama.setError('');
      ollama.setStreamingText('');
    }
  }, [productForm.modal]);

  const deleteProduct = async (id) => {
    if (!confirm('¿Eliminar este producto?')) return;
    await supabase.from('products').delete().eq('id', id);
    fetchAll();
  };

  const handleOllamaAnalyze = async () => {
    await ollama.analyze(
      productForm.datasheetRaw, 
      productForm.attrDefs, 
      (result) => productForm.mapOllamaResult(result)
    );
  };

  const handleGenerateReview = async () => {
    const attrs = productForm.attrDefs.map(d => ({ name: d.name, value: productForm.attrValues[d.id] || '' }));
    await ollama.generateReview(
      productForm.form,
      attrs,
      (result) => productForm.setForm(f => ({ ...f, banana_review: result }))
    );
  };

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Productos</h1>
        <button className="admin-btn admin-btn-primary" onClick={productForm.openNew}>
          <Plus size={16} /> Nuevo producto
        </button>
      </div>

      <ProductTable 
        products={products} 
        onEdit={productForm.openEdit} 
        onDelete={deleteProduct} 
      />

      <ProductModal
        modal={productForm.modal}
        setModal={productForm.setModal}
        form={productForm.form}
        setForm={productForm.setForm}
        categories={categories}
        attrDefs={productForm.attrDefs}
        attrValues={productForm.attrValues}
        setAttrValues={productForm.setAttrValues}
        datasheetRaw={productForm.datasheetRaw}
        setDatasheetRaw={productForm.setDatasheetRaw}
        handleDatasheetFile={productForm.handleDatasheetFile}
        handleImageUpload={productForm.handleImageUpload}
        handleSave={productForm.handleSave}
        uploading={productForm.uploading}
        saving={productForm.saving}
        ollama={ollama}
        onOllamaAnalyze={handleOllamaAnalyze}
        onGenerateReview={handleGenerateReview}
      />
    </div>
  );
};

export default ProductsPage;
