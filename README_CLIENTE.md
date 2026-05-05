# 🛒 OmniCommerce Engine — Motor de E-Commerce de Alta Fidelidad

> Plataforma completa de comercio electrónico, lista para personalizar y lanzar bajo cualquier marca.

---

## ¿Qué es esto?

**OmniCommerce Engine** es un sistema de e-commerce de producción, construido con tecnología moderna y probado en el mundo real. No es una plantilla básica: es un motor funcional y completo que cubre todo el ciclo de vida de una tienda online — desde que el cliente llega al sitio hasta que el pedido queda registrado, pagado y notificado.

Está diseñado para ser **adaptado a cualquier marca** en cuestión de horas, no semanas.

---

## ✅ Lo que incluye

### 🏪 Tienda Pública

| Función | Descripción |
|---|---|
| **Landing Page dinámica** | Hero con título, subtítulo y CTAs configurables desde la base de datos — sin tocar código |
| **Catálogo por categorías** | Navegación jerárquica por categorías y subcategorías ilimitadas con URLs amigables (SEO) |
| **Fichas de producto premium** | Galería multi-imagen, especificaciones técnicas, pills de atributos, descripción de marketing y precio |
| **Búsqueda global** | Motor de búsqueda con overlay animado, filtros por categoría y resultados en tiempo real |
| **Filtros avanzados** | Filtros dinámicos por precio, atributos y subcategoría en la vista de catálogo |
| **Asistente IA** | Chatbot integrado que recomienda productos según las necesidades del usuario, con acceso al catálogo real |
| **Marquesina de noticias** | Ticker de mensajes promocionales desplazándose en tiempo real, editable desde el admin |
| **Banners promocionales** | Carrusel de banners en el hero, con enlace configurable y activación/desactivación por admin |
| **Waitlist (lista de espera)** | Captura de leads para productos agotados — el cliente deja su email y queda registrado |
| **Página de contacto** | Formulario de contacto integrado |
| **Páginas legales** | Sección de términos y condiciones / políticas de privacidad |

---

### 🛍️ Carrito y Checkout

| Función | Descripción |
|---|---|
| **Carrito de compras persistente** | Context global con persistencia en sesión, añadir/eliminar productos, cambiar cantidades |
| **Checkout completo** | Formulario de datos de envío, selección de método de pago, resumen de orden |
| **Libreta de direcciones** | El cliente registrado puede guardar múltiples direcciones y seleccionarlas al pagar |
| **Guest Checkout** | Compra sin registro — el usuario puede completar una orden sin crear cuenta |
| **Pasarela Payphone** | Integración lista con Payphone para cobros con tarjeta de crédito/débito |
| **Descuento por transferencia** | Precio diferenciado automático al pagar por transferencia bancaria |
| **Cálculo fiscal preciso** | Base imponible + IVA calculados correctamente en todos los estados del checkout |
| **Página de resultado** | Confirmación de compra con resumen de la orden después del pago |

---

### 👤 Cuentas de Usuario

| Función | Descripción |
|---|---|
| **Registro y Login** | Autenticación completa con Supabase Auth (email + contraseña) |
| **Confirmación de email** | Flujo de verificación de cuenta por correo electrónico |
| **Recuperación de contraseña** | Flujo completo de "olvidé mi contraseña" con email de reset |
| **Perfil de cliente** | El usuario puede ver y editar su nombre, teléfono y dirección |
| **Historial de pedidos** | El cliente puede ver sus órdenes anteriores y sus estados |

---

### 🧑‍💼 Panel de Administración

| Sección | Funcionalidades |
|---|---|
| **Dashboard** | Métricas en tiempo real: productos, pedidos pagados, categorías, clientes |
| **Gestión de Productos** | Crear, editar, duplicar y eliminar productos. Control de SKU, stock, precio, estado, imágenes y especificaciones técnicas |
| **Galería de imágenes** | Subida multi-imagen con compresión automática y orden de aparición configurable |
| **Atributos dinámicos** | Definición de especificaciones técnicas por categoría/subcategoría (RAM, GPU, Material, etc.) con ícono, unidad y tipo de dato |
| **Gestión de Categorías** | Crear y editar categorías y subcategorías con slug automático para SEO |
| **Gestión de Pedidos** | Vista de todas las órdenes con estado, datos del cliente y detalle de productos comprados |
| **Sistema de Cotizaciones** | Generador de proformas en PDF de alta fidelidad, con diseño profesional, especificaciones técnicas y validez comercial |
| **Banners Promocionales** | Subida y gestión de banners para el hero de la tienda, con enlace, orden y estado activo/inactivo |
| **Mensajes de Marquesina** | Editor de mensajes del ticker, con orden y activación |
| **Lista de Espera** | Vista de todos los leads registrados desde productos agotados |
| **Control de IA** | Panel para configurar el host del modelo de lenguaje y sincronizar el catálogo con el cerebro de la IA |
| **Editor de Hero** | Edición del título, subtítulo y CTAs de la página principal desde la base de datos |

---

### 🤖 Inteligencia Artificial

- **Asistente de Ventas IA**: Chatbot que entiende las necesidades del usuario y recomienda productos del catálogo real.
- **Estrategia "Technical Truth"**: La IA usa las hojas técnicas (datasheets) reales de los productos para responder con precisión técnica, sin inventar especificaciones.
- **Onboarding conversacional**: Flujo de bienvenida dinámico que detecta los intereses del usuario y adapta la conversación.
- **Tarjetas de recomendación**: La IA puede mostrar tarjetas de producto visuales directamente en el chat.
- **Base de conocimiento sincronizable**: El admin puede actualizar el conocimiento de la IA con un clic cuando cambia el catálogo.

---

### 📧 Comunicaciones Automáticas

| Evento | Qué se envía |
|---|---|
| **Compra completada** | Email de confirmación de orden con resumen de productos, precio y datos de envío |
| **Pago confirmado** | Comprobante de pago al correo del cliente |
| **Cotización generada** | PDF de proforma enviado al email del cliente |
| **Nuevo pedido** | Notificación interna al administrador |
| **Registro de cuenta** | Email de bienvenida y confirmación |
| **Reset de contraseña** | Email con enlace seguro de recuperación |

---

### 🔍 SEO y Rendimiento

- **URLs semánticas (Super-Slugs)**: `/categoria/laptops/gaming-fuerte/asus-rog-strix` — sin IDs en la URL.
- **Metadatos dinámicos**: Títulos, descripciones y Open Graph generados automáticamente por producto y categoría.
- **Sitemap XML** generado automáticamente con todas las categorías y productos activos.
- **robots.txt** configurado correctamente.
- **Datos estructurados (JSON-LD)**: Schema de `Organization` y `WebSite` para Google.
- **Imágenes optimizadas**: Next.js Image con compresión y formatos modernos (WebP/AVIF).

---

### 🗄️ Base de Datos y Seguridad

- **PostgreSQL en la nube** (Supabase) con Row Level Security activado en todas las tablas.
- **Acceso granular**: El catálogo es público, los pedidos son privados por usuario, el admin tiene acceso completo solo si está autenticado.
- **Triggers automáticos**: Al crear una cuenta, se genera automáticamente el perfil del cliente.
- **Storage seguro**: Imágenes subidas a un bucket protegido con políticas de acceso por rol.
- **Migraciones versionadas**: Todo el schema de la base de datos está documentado y es reproducible.

---

## 🧱 Stack Tecnológico

| Capa | Tecnología |
|---|---|
| **Frontend** | Next.js 15 (App Router) + Tailwind CSS |
| **Base de Datos** | Supabase (PostgreSQL) con RLS |
| **Autenticación** | Supabase Auth |
| **Pagos** | Payphone SDK |
| **Email** | SMTP (Nodemailer / cualquier proveedor) |
| **IA** | API compatible con OpenAI (Groq / Ollama / OpenAI) |
| **Generación PDF** | pdf-lib |
| **Storage de Imágenes** | Supabase Storage |
| **Deploy** | Render / Vercel / cualquier plataforma Node.js |

---

## ⚙️ Variables de Configuración

La identidad de la tienda se configura 100% por variables de entorno — **no se toca código fuente** para personalizar la marca:

```bash
NEXT_PUBLIC_STORE_NAME=       # Nombre de la tienda
NEXT_PUBLIC_STORE_URL=        # Dominio del sitio
NEXT_PUBLIC_STORE_DESCRIPTION=
NEXT_PUBLIC_STORE_PHONE=
NEXT_PUBLIC_STORE_EMAIL=
NEXT_PUBLIC_STORE_LOCATION=
NEXT_PUBLIC_LOGO_URL=         # URL del logo (imagen)
NEXT_PUBLIC_WHATSAPP_NUMBER=  # Número de WhatsApp para pedidos
NEXT_PUBLIC_PAYPHONE_TOKEN=
NEXT_PUBLIC_PAYPHONE_STORE_ID=
GROQ_API_KEY=                 # Para el asistente IA
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
SMTP_FROM_NAME=
```

---

## 🚀 Tiempo de Despliegue Estimado

| Tarea | Tiempo |
|---|---|
| Configurar variables de entorno | 30 minutos |
| Subir logo y assets de marca | 30 minutos |
| Cargar catálogo de productos | 1–4 horas (depende del volumen) |
| Configurar cuenta Payphone | 1–2 días (proceso del proveedor) |
| Configurar dominio y DNS | 30 minutos |
| **Total estimado** | **~1 semana** de trabajo real |

---

## 💡 Lo que NO necesitas construir desde cero

✔ Autenticación de usuarios  
✔ Carrito de compras  
✔ Integración de pagos  
✔ Panel de administración  
✔ Sistema de órdenes  
✔ Emails transaccionales  
✔ SEO técnico  
✔ Asistente de IA  
✔ Sistema de cotizaciones  
✔ Gestión de inventario  

---

*Este motor es una solución lista para producción. La personalización de marca (colores, logo, nombre) se realiza sin modificar la lógica de negocio.*
