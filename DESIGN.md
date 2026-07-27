# Design Specification

## System Overview
- **Register**: Product (Dashboard, Search, Admin Console, App Shell)
- **Platform**: Web (Next.js 16 + Tailwind CSS v4)
- **Theme Strategy**: Restrained dual-theme system (Light `#FAFAFA` / Dark `#111111`) with functional semantic badges.

## Color Tokens & Palette

### Light Mode (`:root`)
- `--background`: `#FAFAFA` (Off-white canvas)
- `--card`: `#FFFFFF` (Pure white container surface)
- `--foreground`: `#111111` (High-contrast ink)
- `--primary`: `#000000` / `--primary-foreground`: `#FFFFFF`
- `--secondary`: `#F4F4F4` / `--secondary-foreground`: `#111111`
- `--muted`: `#F7F7F7` / `--muted-foreground`: `#666666`
- `--border`: `rgba(0, 0, 0, 0.07)`

### Dark Mode (`.dark`)
- `--background`: `#111111` (Deep dark canvas)
- `--card`: `#1B1B1B` (Dark card surface)
- `--foreground`: `#FFFFFF` (White text)
- `--primary`: `#FFFFFF` / `--primary-foreground`: `#111111`
- `--secondary`: `#242424` / `--secondary-foreground`: `#FFFFFF`
- `--muted`: `#1F1F1F` / `--muted-foreground`: `#888888`
- `--border`: `rgba(255, 255, 255, 0.08)`

### Status Badges
- **Open / Success**: `rgba(34, 197, 94, 0.1)` (`#16a34a` light / `#4ade80` dark)
- **Full / Warning**: `rgba(245, 158, 11, 0.1)` (`#d97706` light / `#fbbf24` dark)
- **Closed / Error**: `rgba(239, 68, 68, 0.1)` (`#dc2626` light / `#f87171` dark)

## Typography

- **Headings (`h1` - `h6`)**: `Outfit`, `Plus Jakarta Sans`, system-ui
- **Body & Controls**: `Plus Jakarta Sans`, system-ui, sans-serif
- **Logo Font**: `Bricolage Grotesque`, `Space Grotesk`
- **Scale**: Fixed rem scale (tighter ratio 1.125 - 1.25)
- **Line Length**: 65 - 75ch for prose; dense multi-column grids for tables & cards.

## Layout & Components

- **Card Radius**: `10px` (`var(--radius)`)
- **Elevation**: Subtle 1px-3px box shadows (`rgba(0, 0, 0, 0.06)`), expanding to `0 6px 20px` on hover.
- **Buttons**:
  - `.btn-primary`: Solid high-contrast fill (`#000` / `#FFF`), rounded `8px`.
  - `.btn-secondary`: Light surface border (`var(--secondary)`), rounded `8px`.
  - `.btn-ghost`: Subtle transparent hover target (`var(--secondary)`).
- **Navigation**: Dual layout (Left Sidebar on desktop, Bottom Navigation Bar on mobile screens `<768px`).

## Motion Principles

- **Duration**: Fast 150ms - 250ms transitions (`cubic-bezier(0.16, 1, 0.3, 1)`).
- **Keyframe Animations**: `animate-fade-up`, `animate-fade-in`, `animate-slide-up`.
- **Accessibility**: `@media (prefers-reduced-motion: reduce)` overrides animations to instant opacity transitions.
