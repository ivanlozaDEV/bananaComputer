# BananaComputer Design Guidelines

## Philosophy
BananaComputer combines the nostalgia of the 1980s Apple Macintosh with modern web capabilities. The result is a **Retro-Futuristic** interface that feels solid, premium, and playful.

## Color Palette
Inspirada en el logo original:
- **Banana Yellow:** `#FBDD33` (Primary Action)
- **Sunset Orange:** `#F48C37`
- **Raspberry Red:** `#D13B53`
- **Deep Purple:** `#4B467B` (Backgrounds/Accents)
- **Ocean Cyan:** `#2D8B9B`
- **Mint Green:** `#7AB19A`

## Typography
- **Primary:** `Inter`, system-ui, sans-serif. Use bold weights (700, 800) for headers.
- **Retro Accents:** Use a thick, slightly rounded monospace font for product tags or system messages.

## UI Elements
### 1. The "System" Window (Glassmorphism)
- Background: `rgba(255, 255, 255, 0.1)`
- Backdrop-filter: `blur(12px)`
- Border: `1px solid rgba(255, 255, 255, 0.2)`
- Shadow: `0 8px 32px 0 rgba(0, 0, 0, 0.37)`

### 2. Retro Buttons
- Solid borders (2px)
- Sharp corners or slight 4px radius.
- "Pressed" state with a slight offset-shadow shift.

### 3. Navigation (Menu Bar)
- Top-fixed bar mirroring the classic MacOS menu.
- Translucent with a thin bottom border.
