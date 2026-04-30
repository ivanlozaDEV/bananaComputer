# WHITELABEL AGENT GUIDE
# Guía operativa para el agente IA — OmniCommerce Engine
# 
# CONTEXTO: Este archivo fue creado en el repositorio BananaComputer (la fuente original).
# Cuando el usuario te referencie a este archivo desde el NUEVO repositorio,
# ya estarás trabajando sobre una copia limpia del código. Tu misión es
# eliminar toda referencia a "Banana Computer" y generalizar la identidad
# visual sin romper NINGUNA lógica de negocio.
#
# ESTADO: El nuevo repo es una copia 1:1 de BananaComputer.
# OBJETIVO: Transformarlo en un template genérico y neutral de marca.
# ═══════════════════════════════════════════════════════════════════════

## REGLA DE ORO
Solo puedes tocar la IDENTIDAD VISUAL. NUNCA toques la lógica de negocio.
Si un archivo maneja carrito, precios, órdenes, DB, pagos, IA o atributos → NO LO TOQUES.
Si un archivo muestra un color, un nombre, un emoji de banana o un texto de Banana → LÍMPIALO.

---

## FASE 1 — Crear `.env.example` y borrar `.env`
**Primero que todo.** El `.env` real contiene credenciales de Banana Computer y NO debe existir en el nuevo repo.

### Acción:
1. Borrar el archivo `.env` del nuevo repo.
2. Crear `.env.example` con esta estructura exacta:

```bash
# ── Supabase ──────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# ── AI (Groq / OpenAI-compatible) ────────────────────────────
GROQ_API_KEY=

# ── Payphone Payments ─────────────────────────────────────────
NEXT_PUBLIC_PAYPHONE_TOKEN=
NEXT_PUBLIC_PAYPHONE_STORE_ID=
PAYPHONE_TOKEN=

# ── Email (SMTP) ──────────────────────────────────────────────
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
SMTP_FROM_NAME=

# ── WhatsApp ──────────────────────────────────────────────────
NEXT_PUBLIC_WHATSAPP_NUMBER=

# ── Identidad de Marca ────────────────────────────────────────
NEXT_PUBLIC_STORE_NAME=
NEXT_PUBLIC_STORE_URL=
NEXT_PUBLIC_STORE_DESCRIPTION=
NEXT_PUBLIC_STORE_PHONE=
NEXT_PUBLIC_STORE_EMAIL=
NEXT_PUBLIC_STORE_LOCATION=
NEXT_PUBLIC_LOGO_URL=
```

3. Asegurarse de que `.env` está en el `.gitignore`.

---

## FASE 2 — Tokens de Color en `app/globals.css`
**Por qué:** Todos los componentes usan clases como `bg-purple-brand` o `text-banana-yellow`. Al renombrar los tokens CSS aquí, toda la app hereda el cambio.

### Acción — Renombrar en el bloque `@theme`:
| Token actual | Token nuevo |
|---|---|
| `--color-purple-brand` | `--color-brand-primary` |
| `--color-purple` | `--color-brand-primary` (alias) |
| `--color-banana-yellow` | `--color-brand-accent` |
| `--color-banana` | `--color-brand-accent` (alias) |
| `--color-raspberry` | `--color-brand-danger` |
| `--color-cream-bg` | `--color-brand-bg` |
| `--color-dark-nav` | `--color-brand-nav` |

**IMPORTANTE:** Los valores HEX actuales se quedan como están (son los defaults del template). El cliente los cambia en su propio fork.

---

## FASE 3 — `lib/whatsapp.js`
**Por qué:** El número de teléfono de Banana está hardcodeado.

### Acción:
Reemplazar la línea:
```js
const phone = "593999046647"; // Banana Computer ventas
```
Por:
```js
const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "000000000000";
```

---

## FASE 4 — `context/StoreContext.js`
**Por qué:** El objeto `INITIAL_HERO` tiene "BANANA COMPUTER" hardcodeado como fallback.

### Acción:
Reemplazar:
```js
const INITIAL_HERO = {
  title: 'BANANA COMPUTER',
  subtitle: 'Computadoras potentes al mejor precio en Ecuador.',
  ...
};
```
Por:
```js
const INITIAL_HERO = {
  title: process.env.NEXT_PUBLIC_STORE_NAME || 'STORE NAME',
  subtitle: process.env.NEXT_PUBLIC_STORE_DESCRIPTION || 'Tu tienda online.',
  primary_cta: 'Explorar Productos',
  secondary_cta: 'Más información',
  image_url: null,
};
```

---

## FASE 5 — `app/api/email/order/route.js` y `app/api/email/quote/route.js`
**Por qué:** Los emails enviados al cliente dicen "Banana Computer" en el asunto y el cuerpo.

### Acción en ambos archivos:
Buscar cualquier string literal `"Banana Computer"` o `"Banana"` y reemplazarlo por:
```js
process.env.SMTP_FROM_NAME || process.env.NEXT_PUBLIC_STORE_NAME || 'La Tienda'
```

---

## FASE 6 — `components/BananaLoader.js` → renombrar a `BrandLoader.js`
**Por qué:** Es el spinner de carga entre páginas. Tiene el emoji 🍌 y está vinculado a `purple-brand`.

### Acción:
1. Renombrar el archivo a `components/BrandLoader.js`.
2. Eliminar el `<span>` con el emoji 🍌.
3. Reemplazar por un spinner CSS genérico (por ejemplo, un círculo animado con `border-brand-primary`).
4. Actualizar el import en `app/layout.js`:
   - `import BananaLoader from '@/components/BananaLoader'` → `import BrandLoader from '@/components/BrandLoader'`
   - `<BananaLoader />` → `<BrandLoader />`

---

## FASE 7 — `components/Logo.js`
**Por qué:** Es el logo animado con rayas de colores y el emoji 🍌. Completamente específico de Banana.

### Acción:
Reemplazar todo el contenido del componente por una versión que cargue una imagen:
```jsx
import React from 'react';

const Logo = ({ size = 'medium', animated = false }) => {
  const sizeMap = { small: '32px', medium: '48px', large: '80px' };
  return (
    <img
      src={process.env.NEXT_PUBLIC_LOGO_URL || '/logo-placeholder.png'}
      alt="Logo"
      style={{ height: sizeMap[size] || '48px', width: 'auto' }}
      className={animated ? 'animate-slide-up' : ''}
    />
  );
};

export default Logo;
```
El archivo `Logo.module.css` se puede eliminar.

---

## FASE 8 — `components/Footer.js`
**Por qué:** Tiene "Banana Computer", la dirección de Guayaquil, el teléfono y el email hardcodeados.

### Acción:
Reemplazar todos los datos de contacto con variables de entorno:
- `"Banana Computer"` → `process.env.NEXT_PUBLIC_STORE_NAME`
- `"Guayaquil, Ecuador"` → `process.env.NEXT_PUBLIC_STORE_LOCATION`
- `"+593 99 904 6647"` → `process.env.NEXT_PUBLIC_STORE_PHONE`
- `"ventas@banana-computer.com"` → `process.env.NEXT_PUBLIC_STORE_EMAIL`

Los links de "Laptops", "Monitores" etc. del footer se deben cargar dinámicamente desde Supabase (tabla `categories`) en lugar de estar hardcodeados.

---

## FASE 9 — `components/Header.js`
**Por qué:** El nombre de la tienda visible en el navbar puede tener referencias a Banana.

### Acción:
Buscar cualquier string `"Banana"` o `"Banana Computer"` y reemplazarlo por:
```js
process.env.NEXT_PUBLIC_STORE_NAME || 'Mi Tienda'
```

---

## FASE 10 — `app/layout.js`
**Por qué:** Los metadatos de SEO (title, description, keywords, openGraph, Twitter cards) están hardcodeados con "Banana Computer".

### Acción:
Convertir el objeto `metadata` estático en una función `generateMetadata()` dinámica:
```js
export async function generateMetadata() {
  const storeName = process.env.NEXT_PUBLIC_STORE_NAME || 'Mi Tienda';
  const storeUrl = process.env.NEXT_PUBLIC_STORE_URL || 'https://example.com';
  const storeDesc = process.env.NEXT_PUBLIC_STORE_DESCRIPTION || 'Tu tienda online.';
  return {
    title: { default: storeName, template: `%s | ${storeName}` },
    description: storeDesc,
    openGraph: { url: storeUrl, siteName: storeName, ... },
    // etc.
  };
}
```
También actualizar el JSON-LD de `Organization` y `WebSite` con las mismas variables.

---

## FASE 11 — `app/HomeClient.js`
**Por qué:** Es la homepage. Tiene emojis de banana 🍌, texto "DISTINCIÓN BANANA COMPUTER" y textos de FeatureCards hardcodeados.

### Acciones puntuales:
1. **Emojis 🍌:** Eliminar los tres `<span>🍌</span>` del efecto de "Floating Bananas" en el botón CTA.
2. **Texto "DISTINCIÓN BANANA COMPUTER":** Reemplazar por `// DISTINCIÓN` o leerlo de Supabase hero_content.
3. **FeatureCards:** Los textos "Equipos Originales", "Garantía Real", "Canal distribuidor oficial de ASUS, Lenovo y HP" → reemplazar por textos genéricos como "Productos Originales", "Garantía Oficial", etc., o hacerlos configurables desde Supabase.
4. **Fallback del `heroContent`:** Revisar que el fallback no diga "Banana Computer".

---

## FASE 12 — `app/admin/components/Sidebar.js`
**Por qué:** El header del sidebar tiene un emoji 🍌 y el footer dice "Banana Computer Mgmt 2.0".

### Acción:
1. Reemplazar `<span className="text-2xl">🍌</span>` por el logo genérico: `<Logo size="small" />`.
2. Cambiar `"Banana Computer Mgmt 2.0"` → `"${process.env.NEXT_PUBLIC_STORE_NAME || 'OmniCommerce'} Admin"`.

---

## FASE 13 — `app/admin/layout.js`
**Por qué:** El `<title>` de las páginas de admin puede mencionar a Banana.

### Acción:
Asegurarse de que el título use:
```js
title: `Admin | ${process.env.NEXT_PUBLIC_STORE_NAME || 'OmniCommerce'}`
```

---

## FASE 14 — Assets y `package.json`

### Acción:
1. Reemplazar `app/icon.png` y `public/favicon.ico` por versiones placeholder genéricas.
2. En `package.json`, cambiar:
   ```json
   "name": "banana-computer"
   ```
   por:
   ```json
   "name": "omnicommerce-engine"
   ```

---

## FASE 15 — Verificación Final

Antes de hacer el commit final, buscar en TODO el proyecto estas palabras clave y asegurarse de que no quede ninguna en código visible al usuario:

```bash
grep -ri "banana" . --include="*.js" --include="*.jsx" --include="*.ts" --include="*.css" --exclude-dir=node_modules
grep -ri "banana-computer.com" . --include="*.js" --exclude-dir=node_modules
grep -ri "593999046647" . --include="*.js" --exclude-dir=node_modules
```

Las únicas menciones aceptables de "Banana" después de la limpieza son:
- Este archivo `WHITELABEL_AGENT_GUIDE.md` (que puedes borrar o mantener).
- El `README_OMNICOMMERCE.md`.
- Comentarios de código de contexto histórico (no visibles al usuario).

---

## ARCHIVOS QUE JAMÁS DEBES TOCAR

Estos archivos son lógica pura. Si los tocas, rompes el sistema:

```
lib/pricing.js              ← Cálculo de IVA y descuentos
lib/productUrl.js           ← Lógica de slugs SEO
lib/inventory.js            ← Gestión de stock
lib/ollama.js               ← Motor de IA
lib/supabase.js             ← Conexión a DB
hooks/useProductForm.js     ← Formulario de producto admin
hooks/useOllama.js          ← Hook de IA
context/CartContext.js      ← Carrito de compras
context/AuthContext.js      ← Autenticación
context/SearchContext.js    ← Búsqueda
context/ToastContext.js     ← Notificaciones
app/api/checkout/           ← Lógica de Payphone
app/api/chat/               ← API de IA
app/checkout/page.js        ← Flujo de pago completo
app/categoria/              ← Páginas de catálogo
app/admin/products/         ← Gestión de productos
app/admin/orders/           ← Gestión de pedidos
app/admin/categories/       ← Gestión de categorías
app/admin/quotes/           ← Cotizaciones
app/admin/components/ProductModal.js
app/admin/components/ProductTable.js
app/admin/components/BulkBadgeEditor.js
app/admin/components/OllamaImportSection.js
components/ProductCard.js
components/ProductGrid.js
components/ProductDetailView.js
components/ProductFilters.js
components/CategoryDetailView.js
components/SearchOverlay.js
components/AIAssistant.js
components/HeroBanner.js
components/WaitlistForm.js
components/WaitlistModal.js
supabase/migrations/        ← Toda la DB
```

---

## RESUMEN DE ARCHIVOS A MODIFICAR (15 en total)

| # | Archivo | Tipo de cambio |
|---|---|---|
| 1 | `.env` | Eliminar |
| 2 | `.env.example` | Crear nuevo |
| 3 | `app/globals.css` | Renombrar tokens de color |
| 4 | `lib/whatsapp.js` | 1 línea: número a env var |
| 5 | `context/StoreContext.js` | INITIAL_HERO a env vars |
| 6 | `app/api/email/order/route.js` | Nombre tienda a env var |
| 7 | `app/api/email/quote/route.js` | Nombre tienda a env var |
| 8 | `components/BananaLoader.js` | Renombrar + quitar 🍌 |
| 9 | `components/Logo.js` | Reemplazar por `<img>` |
| 10 | `components/Logo.module.css` | Eliminar |
| 11 | `components/Footer.js` | Datos de contacto a env vars |
| 12 | `components/Header.js` | Nombre tienda a env var |
| 13 | `app/layout.js` | Metadata dinámica |
| 14 | `app/HomeClient.js` | Quitar 🍌 y textos Banana |
| 15 | `app/admin/components/Sidebar.js` | Quitar 🍌 y texto "Banana Mgmt" |
| 16 | `app/admin/layout.js` | Título dinámico |
| 17 | `app/icon.png` | Reemplazar por placeholder |
| 18 | `package.json` | Cambiar "name" |
