# Design Plan for Redesign

## 1. Color System
- Primary text: `#111111` for light mode, `#FFFFFF` for dark mode
- Primary background: `#FAFAFA` (light), `#111111` (dark)
- Card surface: `#FFFFFF` (light), `#1B1B1B` (dark)
- Accent: **unchanged** — keep `#6C5CE7` (user explicitly requested not to change the accent color)
- Status badges: Use existing badge colors with adjusted contrast for better visibility

## 2. Typography
- Display headings (h1-h3): Outfit, weights 600-700, scale:
  - h1: 28px (4.5rem), weight 700
  - h2: 24px (3.8rem), weight 600
  - h3: 20px (3.2rem), weight 600
- Body text: Plus Jakarta Sans, weight 400, size 14px (2.25rem)
- Caption/secondary: 12px (1.9rem), weight 400
- Line height: 1.5 for body, 1.3 for headings
- Consistent typographic hierarchy with intentional weights

## 3. Layout
- AppShell: 
  - Desktop: Left sidebar navigation with bottom bar for mobile (<768px)
  - Main content: Max-width 1200px, centered, 2rem padding
  - Grid: 12-column layout with 1.5rem gutters
- ProjectCard:
  - 10px radius (`var(--radius)`)
  - Subtle elevation (1-3px shadow) with hover elevation (6px)
  - Consistent vertical spacing (1.5rem between sections)
- ProjectFilters:
  - Filter chips: min-height 36px, rounded 8px, adequate touch targets
  - Consistent spacing between filter elements (1rem)
- Navigation elements: Clear focus states with 2px solid outline

## 4. Signature Element
- Landing page hero: Custom animated illustration with fade-in (150ms) and slide-up motion
- Uses the existing indigo accent (`#6C5CE7`) for visual emphasis
- Serves as memorable signature element embodying collaborative workflow

## 5. Component Updates
- ProjectCard:
  - Increased vertical padding for better touch targets
  - Refined icon sizing (20px consistent)
  - Improved status badge placement and contrast
  - Enhanced focus ring visibility
- ProjectFilters:
  - Larger filter chips (36px min-height)
  - Consistent border radius (8px)
  - Better spacing between filter elements
- AppShell navigation:
  - Updated Lucide icons with consistent stroke width
  - Improved hover states and focus indicators

## 6. Motion Principles
- Transitions: 150ms cubic-bezier(0.16, 1, 0.3, 1)
- Animations: fade-in, slide-up for hero elements
- Respect `prefers-reduced-motion` media query

## 7. Accessibility
- Focus states: visible 2px solid outline
- Color contrast: ensure 4.5:1 minimum contrast
- Keyboard navigation: all interactive elements focusable
- Reduced motion support: instant opacity transitions when disabled