"use client";
import { useState, useEffect, useCallback } from 'react';
import imageCompression from 'browser-image-compression';
import { supabase } from '@/lib/supabase';

const emptyProduct = {
  sku: '', name: '', model_number: '', tagline: '', marketing_subtitle: '',
  marketing_body: '', description: '', price: '', stock: '0',
  category_id: '', subcategory_id: '', image_url: '',
  images: [], subcategory_ids: [],
  is_featured: false, is_active: true,
  banana_review: null,
};

export function useProductForm(categories, onSaveSuccess) {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyProduct);
  const [attrDefs, setAttrDefs] = useState([]);
  const [attrValues, setAttrValues] = useState({});
  const [datasheetRaw, setDatasheetRaw] = useState('');
  const [datasheetParsed, setDatasheetParsed] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // Merge category-level + subcategory-specific attributes
  useEffect(() => {
    const cat = categories.find(c => c.id === form.category_id);
    if (!cat) { setAttrDefs([]); return; }
    
    // Simplificación: Cargar todos los atributos de la categoría sin distinción de subcategoría
    setAttrDefs(cat.attribute_definitions || []);
  }, [form.category_id, categories]);

  const openNew = useCallback(() => {
    setForm(emptyProduct);
    setAttrValues({});
    setDatasheetRaw('');
    setDatasheetParsed(null);
    setErrors({});
    setModal('new');
  }, []);

  const openEdit = useCallback(async (product) => {
    // Fetch associated subcategories
    const { data: subs } = await supabase.from('product_subcategories').select('subcategory_id').eq('product_id', product.id);
    const subIds = (subs || []).map(s => s.subcategory_id);

    setForm({ 
      ...emptyProduct, 
      ...product, 
      price: String(product.price), 
      stock: String(product.stock),
      images: product.images || (product.image_url ? [product.image_url] : []),
      subcategory_ids: subIds.length > 0 ? subIds : (product.subcategory_id ? [product.subcategory_id] : [])
    });
    setDatasheetRaw(product.datasheet ? Object.entries(product.datasheet).map(([k,v]) => `${k}\t${v}`).join('\n') : '');
    setDatasheetParsed(product.datasheet || null);
    
    const { data: existing } = await supabase.from('product_attributes').select('*').eq('product_id', product.id);
    const vals = {};
    (existing || []).forEach(a => { vals[a.attribute_id] = a.value; });
    setAttrValues(vals);
    setErrors({});
    setModal(product);
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const path = `products/${Date.now()}-${safeName}`;
    
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1200,
      useWebWorker: true
    };

    try {
      const compressedFile = await imageCompression(file, options);
      const { error } = await supabase.storage.from('product-images').upload(path, compressedFile, { upsert: true });
      
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path);
      setForm(f => ({ 
        ...f, 
        images: [...(f.images || []), publicUrl],
        image_url: f.image_url || publicUrl
      }));
    } catch (err) {
      console.error('Upload error:', err);
    }
    setUploading(false);
  };

  const removeImage = (url) => {
    setForm(f => ({ ...f, images: (f.images || []).filter(i => i !== url) }));
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setErrors({});
    
    // Validation
    const validationErrors = {};
    if (!form.name?.trim()) validationErrors.name = 'El nombre es obligatorio';
    if (!form.sku?.trim()) validationErrors.sku = 'El SKU es obligatorio';
    if (!form.category_id) validationErrors.category_id = 'Selecciona una categoría';
    
    const price = parseFloat(form.price);
    if (isNaN(price) || price <= 0) validationErrors.price = 'Precio inválido';
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setSaving(false);
      return;
    }

    const stock = parseInt(form.stock);

    const payload = {
      sku: form.sku, name: form.name, model_number: form.model_number, tagline: form.tagline,
      marketing_subtitle: form.marketing_subtitle, marketing_body: form.marketing_body,
      description: form.description, price,
      stock: isNaN(stock) ? 0 : stock, 
      category_id: form.category_id || null,
      subcategory_id: form.subcategory_ids?.[0] || form.subcategory_id || null, 
      image_url: form.images?.[0] || form.image_url || null,
      images: form.images || [],
      datasheet: datasheetParsed, is_featured: form.is_featured, is_active: form.is_active,
      banana_review: form.banana_review,
    };

    let productId;
    try {
      if (modal === 'new') {
        const { data, error } = await supabase.from('products').insert(payload).select().single();
        if (error) throw error;
        productId = data?.id;
      } else {
        const { error } = await supabase.from('products').update(payload).eq('id', modal.id);
        if (error) throw error;
        productId = modal.id;
        await Promise.all([
          supabase.from('product_attributes').delete().eq('product_id', productId),
          supabase.from('product_subcategories').delete().eq('product_id', productId)
        ]);
      }

      if (productId) {
        const attrs = Object.entries(attrValues).filter(([,v]) => v?.trim()).map(([attribute_id, value]) => ({ product_id: productId, attribute_id, value }));
        if (attrs.length) await supabase.from('product_attributes').insert(attrs);

        const subs = (form.subcategory_ids || []).map(sid => ({ product_id: productId, subcategory_id: sid }));
        if (subs.length) await supabase.from('product_subcategories').insert(subs);
      }

      setModal(null);
      if (onSaveSuccess) onSaveSuccess();
    } catch (err) {
      console.error('Save error:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleDatasheetFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setDatasheetRaw(evt.target.result);
      setDatasheetParsed(null);
    };
    reader.readAsText(file);
  };

  const mapOllamaResult = useCallback((result) => {
    setForm(f => ({
      ...f,
      name:               result.product_name      || f.name,
      model_number:       f.model_number || result.model_number || f.model_number,
      sku:                f.sku || result.sku_suggestion || f.sku,
      tagline:            result.tagline            || f.tagline,
      marketing_subtitle: result.marketing_subtitle || f.marketing_subtitle,
      marketing_body:     result.marketing_body     || f.marketing_body,
      description:        result.description        || f.description,
      banana_review:      result.banana_review      || f.banana_review,
    }));

    const rawSpecs = result.specs || result.featured_specs;
    if (rawSpecs) {
      const mapped = {};
      const attrDefsLower = attrDefs.map(a => ({ ...a, nameLower: a.name.toLowerCase().trim() }));
      
      for (const [key, value] of Object.entries(rawSpecs)) {
        if (!value) continue;
        const keyLower = key.toLowerCase().trim();
        
        // 1. Precise Match (ID)
        const directMatch = attrDefs.find(a => a.id === key);
        if (directMatch) {
          mapped[directMatch.id] = String(value);
          continue;
        }

        // 2. Exact Name Match
        const exactNameMatch = attrDefsLower.find(a => a.nameLower === keyLower);
        if (exactNameMatch) {
          mapped[exactNameMatch.id] = String(value);
          continue;
        }

        // 3. Close Name Match (only if specific keywords match)
        const partialMatch = attrDefsLower.find(a => 
          a.nameLower.includes(keyLower) || keyLower.includes(a.nameLower)
        );
        if (partialMatch) {
          // Additional safety: ignore very short keys or overly generic matches
          if (keyLower.length > 2) {
            mapped[partialMatch.id] = String(value);
          }
        }
      }
      setAttrValues(v => ({ ...v, ...mapped }));
    }

    if (result.datasheet) {
      setDatasheetParsed(result.datasheet);
      // We ONLY update datasheetRaw if it was previously empty or much shorter than the result
      // This prevents losing the original pasted text if the IA returns a truncated version.
      setDatasheetRaw(prev => {
        if (!prev || prev.trim().length < 50) {
          return Object.entries(result.datasheet).map(([k,v]) => `${k}\t${v}`).join('\n');
        }
        return prev;
      });
    }
  }, [attrDefs]);

  return {
    modal, setModal,
    form, setForm,
    attrDefs,
    attrValues, setAttrValues,
    datasheetRaw, setDatasheetRaw,
    datasheetParsed, setDatasheetParsed,
    uploading,
    saving,
    openNew,
    openEdit,
    handleImageUpload,
    removeImage,
    handleSave,
    handleDatasheetFile,
    mapOllamaResult,
    errors
  };
}
