# OmniCommerce Engine: Especificaciones Técnicas

Este documento detalla todas las capacidades lógicas y funcionales del motor de comercio electrónico **OmniCommerce**. Este sistema ha sido diseñado como un núcleo de alto rendimiento, escalable y modular, ideal para despliegues de marca blanca.

## 1. Arquitectura de Catálogo Dinámico
*   **Motor de Atributos Flexibles:** Sistema que permite definir especificaciones técnicas (RAM, Almacenamiento, Material, etc.) de forma dinámica por categoría o subcategoría.
*   **Jerarquía Inteligente:** Organización de productos por categorías y subcategorías ilimitadas con soporte para relaciones Many-to-Many.
*   **Gestión de Inventario Pro:** Soporte para SKUs únicos, control de stock en tiempo real, estados de producto (activo/inactivo) y selección de productos destacados.
*   **Galerías Multi-Imagen:** Sistema de gestión de imágenes con orden dinámico y almacenamiento optimizado en la nube.
*   **Hojas Técnicas (Datasheets):** Almacenamiento estructurado en JSONB para especificaciones detalladas que alimentan tanto el frontend como el asistente de IA.

## 2. Experiencia de Usuario de Alta Fidelidad
*   **Fichas de Producto Inteligentes:** Visualización de "Pills" (pastillas de especificaciones) que se adaptan automáticamente según el tipo de producto y la relevancia configurada.
*   **Sistema de Navegación SEO:** Generación automatizada de "Super-Slugs" para URLs amigables que mejoran el posicionamiento en buscadores.
*   **Componentes Visuales Premium:** Marquees de noticias (tickers), banners animados, y layouts optimizados para conversión.
*   **Buscador Global:** Motor de búsqueda con filtros avanzados por categoría y especificaciones técnicas.

## 3. Checkout y Flujo de Pago Integrado
*   **Pasarela Payphone Ready:** Integración completa con Payphone para cobros seguros con tarjeta de crédito/débito y transferencias.
*   **Cálculo Contable Estándar:** Gestión precisa de base imponible, cálculos de impuestos (IVA), y descuentos por transferencia automatizados.
*   **Flujo de Pedidos Automatizado:** Generación inmediata de órdenes de compra con seguimiento de estados (Pendiente, Pagado, Enviado, etc.).
*   **Libreta de Direcciones:** Gestión granular de perfiles de cliente con múltiples direcciones de envío guardadas.
*   **Guest Checkout:** Opción de compra rápida para usuarios no registrados.

## 4. Panel de Administración (Control Center)
*   **Dashboard Operativo:** Interfaz completa para la gestión de todo el ecosistema desde un solo lugar.
*   **Sistema de Cotizaciones Pro:** Generador de proformas en PDF de alta fidelidad, listas para impresión, con diseño profesional y validez comercial.
*   **Gestión de Promociones:** Control total sobre los mensajes de la marquesina, banners principales y secciones de ofertas.
*   **Configurador de Sitio:** Posibilidad de cambiar textos, CTAs y contenidos de la landing page directamente desde la base de datos sin tocar código.

## 5. Inteligencia Artificial y Recomendaciones
*   **Asistente Asesor IA:** Chatbot integrado que actúa como un experto en el catálogo, capaz de recomendar productos basados en las necesidades del usuario.
*   **Estrategia "Technical Truth":** La IA utiliza las hojas técnicas (datasheets) reales para responder, evitando alucinaciones y garantizando precisión técnica absoluta.
*   **Onboarding Conversacional:** Flujo de bienvenida dinámico que guía al usuario según sus intereses detectados por la IA.

## 6. Comunicaciones y Leads
*   **Automatización de Emails:** Envío automático de confirmaciones de orden, comprobantes de pago y generación de proformas al correo del cliente.
*   **Sistema de Waitlist:** Captura de leads para productos agotados, notificando a los administradores el interés del cliente.
*   **Notificaciones Administrativas:** Sistema de alerta para nuevos pedidos y solicitudes de contacto.

---

## Stack Tecnológico
*   **Frontend:** Next.js (App Router), Tailwind CSS.
*   **Backend & DB:** Supabase (PostgreSQL) con Row Level Security (RLS).
*   **Pagos:** Payphone SDK.
*   **Documentación:** PDF-Lib para generación de proformas.
*   **IA:** Integración con modelos de lenguaje vía API.
