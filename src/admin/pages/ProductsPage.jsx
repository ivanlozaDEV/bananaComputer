import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Trash2, Pencil, Upload, X, Sparkles, FileText } from 'lucide-react';

const OLLAMA_HOST = 'http://localhost:11434';
const OLLAMA_MODEL = 'llama3.1:8b';

// ─── Check if Ollama is running ──────────────────────────────────
async function pingOllama() {
  try {
    const res = await fetch(`${OLLAMA_HOST}/api/tags`, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Sanitize LLM JSON (fixes trailing commas, smart quotes, etc.) ─
function sanitizeJson(text) {
  return text
    .replace(/[\u2018\u2019\u201C\u201D]/g, '"') // smart quotes → regular
    .replace(/,\s*([}\]])/g, '$1')               // trailing commas
    .replace(/\/\/.*$/gm, '')                    // JS-style comments
    .replace(/\t/g, ' ')                          // tabs → spaces
    .trim();
}

function parseOllamaJson(text) {
  try { return JSON.parse(text); } catch {}
  const clean = sanitizeJson(text);
  try { return JSON.parse(clean); } catch {}
  const match = clean.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch {}
    try { return JSON.parse(sanitizeJson(match[0])); } catch {}
  }
  throw new Error('Ollama no devolvió JSON válido');
}

// ─── Ollama analyze datasheet (streaming) ──────────────────────
async function analyzeWithOllama(rawText, attrDefs, onToken) {
  const attrNames = attrDefs.map(a => a.unit ? `${a.name} (${a.unit})` : a.name).join(', ');

  const prompt = `Extract product info from this datasheet. Return ONLY valid JSON, no markdown.

JSON schema:
{
  "product_name": "full commercial name",
  "sku_suggestion": "SHORT-CODE-UPPERCASE",
  "specs": { "AttributeName": "value without units" },
  "datasheet": { "FieldName": "value" },
  "tagline": "short catchy phrase in Spanish (max 8 words)",
  "marketing_subtitle": "descriptive subtitle in Spanish (max 15 words)",
  "marketing_body": "3-4 sentence product description in Spanish for casual buyers, highlight strengths",
  "description": "20-word max product summary in Spanish"
}

Rules:
- specs: extract ONLY these fields (use same key names): ${attrNames || 'RAM, Procesador, Almacenamiento, Pantalla, Batería, Peso'}
- datasheet: include ALL fields from the text, preserve original field names
- Values in specs must NOT include units, just the value (e.g. "8" not "8GB")
- Return ONLY the JSON object

DATASHEET:
${rawText}`;



  const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: OLLAMA_MODEL, prompt, stream: true, format: 'json' }),
  });

  if (!res.ok) throw new Error(`Ollama HTTP ${res.status}: ${await res.text()}`);

  // Read NDJSON stream chunk by chunk
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let accumulated = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    // Each line is a JSON object with a "response" field
    for (const line of chunk.split('\n').filter(Boolean)) {
      try {
        const parsed = JSON.parse(line);
        if (parsed.response) {
          accumulated += parsed.response;
          onToken?.(accumulated);
        }
        if (parsed.done) break;
      } catch { /* partial line, ignore */ }
    }
  }

  // Parse final accumulated JSON
  return parseOllamaJson(accumulated);
}

// ─── Empty Product Form ──────────────────────────────────────────
const emptyProduct = {
  sku: '', name: '', tagline: '', marketing_subtitle: '',
  marketing_body: '', description: '', price: '', stock: '0',
  category_id: '', subcategory_id: '', image_url: '',
  is_featured: false, is_active: true,
};

// ─── Datasheet text parser (fallback, no Ollama) ─────────────────
const parseDatasheet = (raw) => {
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
  const result = {};
  for (const line of lines) {
    let parts;
    if (line.includes('\t')) {
      parts = line.split('\t').map(s => s.trim()).filter(Boolean);
    } else {
      const colonIdx = line.indexOf(':');
      if (colonIdx > 0 && colonIdx < 40) {
        parts = [line.slice(0, colonIdx).trim(), line.slice(colonIdx + 1).trim()];
      } else {
        parts = line.split(/\s{2,}/).map(s => s.trim()).filter(Boolean);
      }
    }
    if (parts.length >= 2) {
      const key = parts[0];
      const value = parts.slice(1).join(' ');
      if (key && value) result[key] = value;
    }
  }
  return result;
};

// ─── Main Component ──────────────────────────────────────────────
const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyProduct);
  const [attrDefs, setAttrDefs] = useState([]);
  const [attrValues, setAttrValues] = useState({});
  const [datasheetRaw, setDatasheetRaw] = useState('');
  const [datasheetParsed, setDatasheetParsed] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState('checking');
  const [ollamaError, setOllamaError] = useState('');
  const [streamingText, setStreamingText] = useState('');
  const [copied, setCopied] = useState(false);
  const ollamaInterval = useRef(null);
  const streamBoxRef = useRef(null);

  const checkOllamaStatus = async () => {
    const ok = await pingOllama();
    setOllamaStatus(ok ? 'online' : 'offline');
  };

  // Auto-scroll streaming box when new tokens arrive
  useEffect(() => {
    if (streamBoxRef.current) {
      streamBoxRef.current.scrollTop = streamBoxRef.current.scrollHeight;
    }
  }, [streamingText]);

  // Single ping when modal opens — no interval to keep console clean
  useEffect(() => {
    if (!modal) {
      setOllamaStatus('checking');
      clearInterval(ollamaInterval.current);
      return;
    }
    checkOllamaStatus();
    // No interval — user can click refresh manually
  }, [modal]);

  const copyStartCommand = () => {
    navigator.clipboard.writeText('ollama serve');
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const fetchAll = async () => {
    const [p, c] = await Promise.all([
      supabase.from('products').select('*, categories(name)').order('created_at', { ascending: false }),
      supabase.from('categories').select('*, attribute_definitions(*), subcategories(*, attribute_definitions(*))').order('name'),
    ]);
    setProducts(p.data || []);
    setCategories(c.data || []);
  };

  useEffect(() => { fetchAll(); }, []);

  // Merge category-level + subcategory-specific attributes
  useEffect(() => {
    const cat = categories.find(c => c.id === form.category_id);
    if (!cat) { setAttrDefs([]); return; }
    const baseAttrs = (cat.attribute_definitions || []).filter(a => !a.subcategory_id);
    const sub = cat.subcategories?.find(s => s.id === form.subcategory_id);
    const subAttrs = (sub?.attribute_definitions || []);
    setAttrDefs([...baseAttrs, ...subAttrs]);
    setAttrValues({});
  }, [form.category_id, form.subcategory_id, categories]);

  const openNew = () => {
    setForm(emptyProduct);
    setAttrValues({});
    setDatasheetRaw('');
    setDatasheetParsed(null);
    setOllamaError('');
    setModal('new');
  };

  const openEdit = async (product) => {
    setForm({ ...emptyProduct, ...product, price: String(product.price), stock: String(product.stock) });
    setDatasheetRaw(product.datasheet ? Object.entries(product.datasheet).map(([k,v]) => `${k}\t${v}`).join('\n') : '');
    setDatasheetParsed(product.datasheet || null);
    setOllamaError('');
    const { data: existing } = await supabase.from('product_attributes').select('*').eq('product_id', product.id);
    const vals = {};
    (existing || []).forEach(a => { vals[a.attribute_id] = a.value; });
    setAttrValues(vals);
    setModal(product);
  };

  // ── Read a text/CSV file and return its content ────────────────
  const handleDatasheetFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setDatasheetRaw(evt.target.result);
      setDatasheetParsed(null);
      setOllamaError('');
    };
    reader.readAsText(file);
  };

  // ── Ollama: analyze and fill ALL form fields ───────────────────
  const handleOllamaAnalyze = async () => {
    if (!datasheetRaw.trim()) {
      setOllamaError('Primero sube o pega el datasheet del producto.');
      return;
    }
    setAnalyzing(true);
    setOllamaError('');
    setStreamingText('');
    try {
      const result = await analyzeWithOllama(datasheetRaw, attrDefs, (text) => {
        setStreamingText(text);
      });

      // Fill form fields
      setForm(f => ({
        ...f,
        name:               result.product_name      || f.name,
        sku:                f.sku || result.sku_suggestion || f.sku,
        tagline:            result.tagline            || f.tagline,
        marketing_subtitle: result.marketing_subtitle || f.marketing_subtitle,
        marketing_body:     result.marketing_body     || f.marketing_body,
        description:        result.description        || f.description,
      }));
      // Smart specs mapping: try UUID keys first, then name-based fallback
      const rawSpecs = result.specs || result.featured_specs;
      if (rawSpecs) {
        const specs = rawSpecs;
        const mapped = {};

        for (const [key, value] of Object.entries(specs)) {
          // 1. Try direct UUID match
          const directMatch = attrDefs.find(a => a.id === key);
          if (directMatch) {
            mapped[directMatch.id] = String(value);
            continue;
          }

          // 2. Fallback: match by attribute name (case-insensitive, partial)
          const keyLower = key.toLowerCase().trim();
          const nameMatch = attrDefs.find(a => {
            const aLower = a.name.toLowerCase();
            return aLower === keyLower
              || aLower.includes(keyLower)
              || keyLower.includes(aLower);
          });
          if (nameMatch) {
            mapped[nameMatch.id] = String(value);
          }
        }
        setAttrValues(mapped);
      }
      if (result.datasheet)      setDatasheetParsed(result.datasheet);
      setStreamingText(''); // clear stream, fields are now populated

    } catch (err) {
      setOllamaError(`Error de Ollama: ${err.message}. ¿Está Ollama corriendo? (ollama serve)`);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    // Sanitize filename: replace spaces & special chars
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const path = `products/${Date.now()}-${safeName}`;
    const { error } = await supabase.storage.from('product-images').upload(path, file, { upsert: true });
    if (error) {
      console.error('Storage upload error:', error);
      setOllamaError(`📸 Error al subir imagen: ${error.message}`);
    } else {
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path);
      setForm(f => ({ ...f, image_url: publicUrl }));
    }
    setUploading(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      sku: form.sku, name: form.name, tagline: form.tagline,
      marketing_subtitle: form.marketing_subtitle, marketing_body: form.marketing_body,
      description: form.description, price: parseFloat(form.price),
      stock: parseInt(form.stock), category_id: form.category_id || null,
      subcategory_id: form.subcategory_id || null, image_url: form.image_url || null,
      datasheet: datasheetParsed, is_featured: form.is_featured, is_active: form.is_active,
    };

    let productId;
    if (modal === 'new') {
      const { data } = await supabase.from('products').insert(payload).select().single();
      productId = data?.id;
    } else {
      await supabase.from('products').update(payload).eq('id', modal.id);
      productId = modal.id;
      await supabase.from('product_attributes').delete().eq('product_id', productId);
    }

    if (productId) {
      const attrs = Object.entries(attrValues).filter(([,v]) => v?.trim()).map(([attribute_id, value]) => ({ product_id: productId, attribute_id, value }));
      if (attrs.length) await supabase.from('product_attributes').insert(attrs);
    }

    setSaving(false);
    setModal(null);
    fetchAll();
  };

  const deleteProduct = async (id) => {
    if (!confirm('¿Eliminar este producto?')) return;
    await supabase.from('products').delete().eq('id', id);
    fetchAll();
  };

  const availableSubs = categories.find(c => c.id === form.category_id)?.subcategories || [];

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Productos</h1>
        <button className="admin-btn admin-btn-primary" onClick={openNew}><Plus size={16} /> Nuevo producto</button>
      </div>

      {/* Table */}
      <table className="admin-table">
        <thead>
          <tr><th>Producto</th><th>SKU</th><th>Categoría</th><th>Precio</th><th>Stock</th><th>Activo</th><th></th></tr>
        </thead>
        <tbody>
          {products.map(p => (
            <tr key={p.id}>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {p.image_url
                    ? <img src={p.image_url} alt="" style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '8px' }} />
                    : <div style={{ width: '36px', height: '36px', background: '#272727', borderRadius: '8px' }} />
                  }
                  <span style={{ color: '#fff', fontWeight: 600 }}>{p.name}</span>
                </div>
              </td>
              <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{p.sku}</td>
              <td>{p.categories?.name || '—'}</td>
              <td>${parseFloat(p.price).toFixed(2)}</td>
              <td>{p.stock}</td>
              <td><span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: p.is_active ? '#4ade80' : '#555' }} /></td>
              <td>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button className="admin-btn admin-btn-ghost" style={{ padding: '0.4rem 0.6rem' }} onClick={() => openEdit(p)}><Pencil size={14} /></button>
                  <button className="admin-btn admin-btn-danger" style={{ padding: '0.4rem 0.6rem' }} onClick={() => deleteProduct(p.id)}><Trash2 size={14} /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal */}
      {modal !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', zIndex: 1000, padding: '2rem' }}>
          <div style={{ background: '#161616', borderRadius: '20px', width: '100%', maxWidth: '760px', padding: '2rem', border: '1px solid #272727', position: 'relative' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 900 }}>{modal === 'new' ? 'Nuevo producto' : 'Editar producto'}</h2>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            {/* ── OLLAMA IMPORT SECTION ────────────────────────────── */}
            <div style={{ background: '#0f0f0f', border: '1px solid #2a2a2a', borderRadius: '14px', padding: '1.25rem', marginBottom: '1.5rem' }}>

              {/* Header row: title + live status indicator */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={16} style={{ color: '#a78bfa' }} />
                  <span style={{ color: '#a78bfa', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Importar con IA (Ollama)
                  </span>
                </div>

                {/* Status pill */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                    fontSize: '0.72rem', fontWeight: 700, padding: '0.25rem 0.65rem',
                    borderRadius: '99px', border: '1px solid',
                    background: ollamaStatus === 'online' ? '#052e16' : ollamaStatus === 'offline' ? '#1a0f0f' : '#111',
                    color:      ollamaStatus === 'online' ? '#4ade80' : ollamaStatus === 'offline' ? '#f87171' : '#555',
                    borderColor:ollamaStatus === 'online' ? '#166534' : ollamaStatus === 'offline' ? '#7f1d1d' : '#2a2a2a',
                  }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'currentColor', display: 'inline-block',
                      animation: ollamaStatus === 'online' ? 'none' : undefined
                    }} />
                    {ollamaStatus === 'online' ? 'Ollama activo' : ollamaStatus === 'offline' ? 'Ollama inactivo' : 'Verificando...'}
                  </span>

                  {/* Refresh */}
                  <button type="button" onClick={checkOllamaStatus}
                    style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: '0.75rem', padding: '0.2rem 0.4rem' }}>
                    ↻
                  </button>
                </div>
              </div>

              {/* Offline helper */}
              {ollamaStatus === 'offline' && (
                <div style={{ background: '#1a0f0f', border: '1px solid #3a1a1a', borderRadius: '10px', padding: '0.85rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  <div>
                    <p style={{ color: '#f87171', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>Ollama no está corriendo</p>
                    <p style={{ color: '#888', fontSize: '0.75rem' }}>Abre una terminal y ejecuta:</p>
                    <code style={{ color: '#fde68a', fontSize: '0.8rem', fontFamily: 'monospace', background: '#111', padding: '0.2rem 0.5rem', borderRadius: '6px', display: 'inline-block', marginTop: '0.25rem' }}>ollama serve</code>
                  </div>
                  <button type="button" onClick={copyStartCommand}
                    style={{ background: copied ? '#052e16' : '#1f1f1f', border: '1px solid', borderColor: copied ? '#166534' : '#3a3a3a', color: copied ? '#4ade80' : '#ccc', borderRadius: '10px', padding: '0.5rem 1rem', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                    {copied ? '✓ Copiado!' : '📋 Copiar comando'}
                  </button>
                </div>
              )}

              <p style={{ color: '#666', fontSize: '0.8rem', marginBottom: '1rem' }}>
                Sube el datasheet del fabricante (TXT, CSV) o pega el texto. La IA llenará todos los campos automáticamente — puedes editar después.
              </p>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', cursor: 'pointer', color: '#ccc', fontSize: '0.8rem', fontWeight: 600 }}>
                  <FileText size={14} />
                  Subir archivo
                  <input type="file" accept=".txt,.csv,.tsv,.md" onChange={handleDatasheetFile} style={{ display: 'none' }} />
                </label>

                <span style={{ color: '#444', fontSize: '0.75rem' }}>o pega el texto abajo</span>

                <button
                  type="button"
                  className="admin-btn"
                  disabled={analyzing || !datasheetRaw.trim() || ollamaStatus !== 'online'}
                  onClick={handleOllamaAnalyze}
                  style={{
                    background: analyzing ? '#2d1f4e' : '#4c1d95',
                    color: '#c4b5fd',
                    border: '1px solid #5b21b6',
                    marginLeft: 'auto',
                    opacity: (!datasheetRaw.trim() || ollamaStatus !== 'online') ? 0.4 : 1,
                  }}
                >
                  <Sparkles size={14} />
                  {analyzing ? 'Analizando...' : ollamaStatus !== 'online' ? 'Ollama inactivo' : 'Analizar con IA'}
                </button>
              </div>

              {/* Datasheet textarea */}
              <textarea
                style={{ marginTop: '0.75rem', width: '100%', minHeight: '110px', background: '#111', border: '1px solid #2a2a2a', borderRadius: '10px', color: '#9ca3af', fontFamily: 'monospace', fontSize: '0.78rem', padding: '0.75rem', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
                placeholder={`Pega aquí el datasheet del fabricante...\n\nEjemplo:\nRAM    8GB DDR4\nStorage    512GB NVMe SSD\nProcessor    Intel Core i5-1235U\n...`}
                value={datasheetRaw}
                onChange={e => { setDatasheetRaw(e.target.value); setOllamaError(''); }}
              />

              {/* Live streaming preview */}
              {analyzing && streamingText && (
                <div ref={streamBoxRef} style={{ marginTop: '0.75rem', background: '#080808', border: '1px solid #1a1a1a', borderRadius: '10px', padding: '0.75rem', maxHeight: '160px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.72rem', color: '#4ade80', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  <span style={{ color: '#555', display: 'block', marginBottom: '0.25rem' }}>▶ ollama ({OLLAMA_MODEL})</span>
                  {streamingText}<span style={{ opacity: 0.6 }}>▌</span>
                </div>
              )}
              {analyzing && !streamingText && (
                <p style={{ color: '#a78bfa', fontSize: '0.8rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Sparkles size={12} /> Conectando con Ollama...
                </p>
              )}
              {ollamaError && <p style={{ color: '#f87171', fontSize: '0.8rem', marginTop: '0.5rem' }}>⚠️ {ollamaError}</p>}
              {datasheetParsed && !analyzing && (
                <p style={{ color: '#4ade80', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                  ✓ {Object.keys(datasheetParsed).length} campos del datasheet procesados — revisa y edita los campos abajo.
                </p>
              )}
            </div>

            <form onSubmit={handleSave}>
              {/* Category selection — must be set before Ollama for correct attrs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="admin-form-group">
                  <label>Categoría</label>
                  <select className="admin-input" value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value, subcategory_id: '' }))}>
                    <option value="">Sin categoría</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="admin-form-group">
                  <label>Audiencia / Subcategoría</label>
                  <select className="admin-input" value={form.subcategory_id} onChange={e => setForm(f => ({ ...f, subcategory_id: e.target.value }))}>
                    <option value="">Sin subcategoría</option>
                    {availableSubs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Basic info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                {[['SKU', 'sku'], ['Nombre', 'name'], ['Precio ($)', 'price'], ['Stock', 'stock']].map(([label, key]) => (
                  <div key={key} className="admin-form-group">
                    <label>{label}</label>
                    <input className="admin-input" value={form[key]} required={key === 'sku' || key === 'name' || key === 'price'}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
                  </div>
                ))}
              </div>

              {/* Marketing copy */}
              {[['Tagline (marketing)', 'tagline'], ['Subtítulo marketing', 'marketing_subtitle'], ['Descripción corta (card)', 'description']].map(([label, key]) => (
                <div key={key} className="admin-form-group" style={{ marginBottom: '0.85rem' }}>
                  <label>{label}</label>
                  <input className="admin-input" value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
                </div>
              ))}
              <div className="admin-form-group" style={{ marginBottom: '1rem' }}>
                <label>Texto marketing largo</label>
                <textarea className="admin-input admin-textarea" value={form.marketing_body} onChange={e => setForm(f => ({ ...f, marketing_body: e.target.value }))} />
              </div>

              {/* Image */}
              <div className="admin-form-group" style={{ marginBottom: '1rem' }}>
                <label>Imagen principal</label>
                <input className="admin-input" value={form.image_url} placeholder="URL o sube un archivo"
                  onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} />
                <label className="admin-btn admin-btn-ghost" style={{ cursor: 'pointer', marginTop: '0.5rem', display: 'inline-flex' }}>
                  <Upload size={14} />{uploading ? 'Subiendo...' : 'Subir imagen'}
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                </label>
                {form.image_url && <img src={form.image_url} alt="" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', marginTop: '0.5rem' }} />}
              </div>

              {/* Spec card attributes */}
              {attrDefs.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <p style={{ color: '#555', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.75rem' }}>Especificaciones destacadas</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                    {attrDefs.sort((a,b) => a.display_order - b.display_order).map(attr => (
                      <div key={attr.id} className="admin-form-group">
                        <label>{attr.name}{attr.unit ? ` (${attr.unit})` : ''}</label>
                        <input className="admin-input" value={attrValues[attr.id] || ''}
                          onChange={e => setAttrValues(v => ({ ...v, [attr.id]: e.target.value }))} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Toggles */}
              <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
                {[['Destacado (Novedades)', 'is_featured'], ['Activo en tienda', 'is_active']].map(([label, key]) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#888', fontSize: '0.875rem' }}>
                    <input type="checkbox" checked={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))}
                      style={{ width: '16px', height: '16px', accentColor: '#fff' }}
                    />
                    {label}
                  </label>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setModal(null)}>Cancelar</button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
