# Banana Premium: Admin Design Guidelines

To maintain a professional, high-density, and premium "Pro" feel in the BananaComputer administrative dashboard, follow these design principles and technical guidelines.

## 🏆 Core Principles

1. **High Data Density**: Avoid "gigantic" layouts. Information should be compact and scannable.
2. **Glassmorphism Aesthetic**: Use subtle transparency, blurs, and elevated surfaces (Light Cream/White focus).
3. **Brand Consistency**: Use `Purple-brand` (#7000FF) for primary actions/accents and `Banana-yellow` (#FFE500) for highlights.
4. **Professional Typography**: Use `DotGothic16` for brand elements and high-contrast, bold sans-serifs for interface metadata.

---

## 📏 Layout & Spacing

### Modals & Containers
- **Max Width**: Keep modals to `max-w-4xl` for complex forms and `max-w-lg` for simple ones.
- **Padding**: Use `p-6` or `p-8` max for large containers. Avoid `p-12` or higher.
- **Gaps**: Standardize unit gaps:
  - `gap-4` or `gap-6` for main sections.
  - `gap-2` for input-label relationships.
  - `gap-1` for micro-elements.

### Grids
- Use responsive grids (`grid-cols-1 md:grid-cols-2 lg:grid-cols-4`) to distribute content horizontally rather than vertically.

---

## 🔠 Typography

| Element | Class | Purpose |
| :--- | :--- | :--- |
| **Main Headers** | `text-xl font-black tracking-tight` | Page or Modal titles |
| **Section Headers** | `text-[10px] font-black uppercase tracking-[0.2em]` | Group labels (e.g. "Core Data") |
| **Input Labels** | `text-[9px] font-black uppercase tracking-widest` | Field labels |
| **Table Data** | `text-[11px] font-bold` or `text-xs` | Primary data rows |
| **Metadata** | `text-[9px] font-black uppercase tracking-widest` | Tags, SKUs, timestamps |

---

## 🎨 Component Styles

### Inputs & Selects
- **Class**: `bg-gray-50 border border-black/5 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all`
- **Focus**: `focus:border-purple-brand/30 focus:outline-none`
- **Placeholder**: Use low-contrast colors like `placeholder:text-gray-200`.

### Buttons (Primary)
- **Class**: `px-6 py-2.5 bg-purple-brand text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 shadow-lg shadow-purple-brand/20`

### Badges/Tags
- **Class**: `px-2 py-0.5 bg-gray-100 rounded-lg text-[9px] font-black uppercase tracking-widest text-gray-400`

---

## 🛠️ Accessibility & Dev Tips

- **Iconography**: Standardize on `lucide-react` with size `14` or `16` for UI actions, `18`-`20` for section icons.
- **Transitions**: Every interactive element should have `transition-all` with durations between `200ms`-`300ms`.
- **Shadows**: Use custom colored shadows (e.g. `shadow-purple-brand/10`) for a more premium look than generic black shadows.

> [!TIP]
> When in doubt, scale down. If an element feels "too big," it probably is. Aim for an interface that feels like high-end productivity software.
