# BananaComputer 2026: Design & Brand Guidelines

## Philosophy
BananaComputer is a premium mainstream retailer for global tech brands in Ecuador. We are a **2026-era startup** focused on reliability, official local warranty, and price-match guarantees. The aesthetic is clean, professional, and high-contrast, moving away from retro-nostalgia toward a "Modern Mainstream" retail experience.

## Digital Design System (CSS Variables)

Define these in `src/index.css` as the single source of truth:

### 1. Color Palette
- **Primary Brand (Purple):** `--color-purple: #4B467B;` (Main accent, scrolled header, featured badges).
- **Primary Action (Yellow):** `--color-banana: #FBDD33;` (Add to Cart buttons, sale highlights).
- **Alerts:** `--color-raspberry: #D13B53;` (Badges).
- **Success:** `--color-mint: #7AB19A;` (Add feedback).
- **Backgrounds:**
  - `--bg-cream: #fbfbf9;` (Main page background)
  - `--bg-pure: #ffffff;` (Sidebar background)
  - `--bg-dark: #0a0a12;` (Scrolled Navbar background)

### 2. Typography
- **Headings:** `var(--font-pixel)` for main categories and branding only.
- **Body:** `Inter`, 400-500 weight.
- **CTAs:** `Inter`, 700-800 weight, uppercase.

## UI Components & Patterns

### 1. Navigation (The Header)
- **Top Bar:** Translucent with a thin bottom border.
- **Scrolled State:** Shifts to solid **Purple** (`#4B467B`) with white text.
- **Cart Button:** Dynamic badge:
  - White Navbar -> Purple Badge (`#4B467B`).
  - Purple/Black Navbar -> Yellow Badge (`#FBDD33`).

### 2. Product Presentation (The Grid)
- **Grouping:** Products **must** be grouped by Category name.
- **Prioritization:** Show up to 3 **Featured** (Purple badge) and then up to 3 **New Arrivals** (Yellow badge).
- **Pricing:** Show final price clearly. Must include the note **"Incluido impuestos"** in `0.6rem` muted text.

### 3. Action Buttons
- **Detail Buttons ("Info"):** Outline style using `--color-purple`.
- **Cart Buttons ("+ Carrito"):** Solid Yellow (`#FBDD33`) with black text.
- **Checkout Button:** Solid Purple (`#4B467B`) with white text, large padding (`1.25rem`).

### 4. Shopping Cart Sidebar
- **Visuals:** Slide-in from the right with blur overlay.
- **Financial Breakdown:**
  - Subtotal (sin IVA 15%)
  - IVA (15%)
  - Total (con IVA)
- **Empty State:** Use **Banana (🍌)** emojis as the primary visual.

## Global Consistency
Every new view or component added to the system (including Admin pages) should use these CSS variables to maintain a unified identity. Avoid hardcoding HEX values.
