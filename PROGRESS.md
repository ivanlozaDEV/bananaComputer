# BananaComputer 2026: Project Progress

Este archivo sirve como fuente de verdad sobre el estado actual del desarrollo de BananaComputer. Está diseñado tanto para humanos como para asistentes de IA.

## 🚀 Visión General
BananaComputer es una plataforma de retail premium para el mercado ecuatoriano, enfocada en hardware oficial, garantía local y una experiencia de usuario moderna y minimalista.

## 🛠️ Stack Tecnológico
- **Frontend**: React 19 + Vite 8
- **Enrutamiento**: React Router Dom 7
- **Estilos**: Vanilla CSS (Basado en `GUIDELINES.md`)
- **Backend/Base de Datos**: Supabase
- **IA Local**: Ollama (Interfaciado vía `src/lib/ollama.js`)
- **Iconos**: Lucide React

## 📂 Estructura del Proyecto
- `src/admin`: Panel de control para gestión de inventario y contenidos.
- `src/components`: Componentes UI reutilizables (Head, ProductCard, Grid, etc.).
- `src/pages`: Vistas principales de la tienda (Home, Producto, Categoría).
- `src/lib`: Clientes de servicios externos (Supabase, Ollama).
- `src/data`: Módulos de datos estáticos o mocks.
- `scripts`: Herramientas de automatización personalizadas (importación de productos).

## ✅ Estado de Funcionalidades

### Tienda Pública
- [x] **Navegación**: Header dinámico con cambio de estado al hacer scroll.
- [x] **Catálogo**: Grillas de productos con filtrado por categorías y subcategorías.
- [x] **Detalle de Producto**: Vista completa del producto con precios e información técnica.
- [x] **Sistema de Diseño**: Implementación completa de variables CSS en `index.css`.
- [x] **Migas de Pan (Breadcrumbs)**: Navegación jerárquica funcional.
- [x] **Autenticación**: Página de login integrada.

### Panel de Administración
- [x] **Dashboard**: Vista principal del administrador.
- [x] **Gestión de Productos**: Listado y herramientas de importación/edición.
- [x] **Gestión de Categorías**: Organización del catálogo.

### Infraestructura & Seguridad
- [x] **Integración Supabase**: Cliente configurado y listo.
- [x] **Gestión de Clientes**:
    - Mapeo 1:1 con `auth.users` mediante la tabla `customers`.
    - Creación automática de perfiles mediante trigger `on_auth_user_created`.
    - Seguridad RLS implementada para privacidad de datos y pedidos.
- [x] **Integración Ollama**: Soporte para generación de contenido local.
- [ ] **Pasarela de Pagos**: Integración con Lemon Squeezy (En progreso/pendiente).

## 🤖 Instrucciones para la IA
Cuando trabajes en este repositorio:
1. **Sigue las GUIDELINES.md**: No uses frameworks de CSS como Tailwind a menos que se pida explícitamente. Usa las variables definidas.
2. **Modularidad**: Mantén el CSS acoplado a sus componentes correspondientes (ej: `ProductCard.jsx` -> `ProductCard.css`).
3. **Internacionalización**: El contenido principal es en Español (Ecuador). Asegúrate de incluir notas fiscales como "Incluido impuestos" según las guías.
4. **Contexto de IA**: Utiliza `src/lib/ollama.js` para cualquier funcionalidad que requiera procesamiento de lenguaje natural local.

---
*Última actualización: 2026-04-08*
