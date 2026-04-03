# Visual Guidelines

## Overview

gutted. follows a dark, minimal, premium visual language. Every screen should feel clean, focused, and modern — like a high-end health device interface.

---

## Core Principles

1. **Dark canvas, bright data** — Black backgrounds make health data and scores pop
2. **Less is more** — Remove every element that doesn't serve the user's immediate goal
3. **Motion with purpose** — Animations communicate state changes, never decorative
4. **Mobile-native feel** — Every interaction should feel like a native app, not a website
5. **Accessible hierarchy** — Information importance is clear at a glance through size, weight, and opacity

---

## Color Application

### Backgrounds
| Element | Color | Example |
|---------|-------|---------|
| App background | `#000000` | All pages |
| Card surface | `white/5` | Dashboard cards, form containers |
| Elevated surface | `white/10` | Hover states, active inputs |
| Modal overlay | `black/80` | Backdrop for dialogs |

### Text
| Level | Color | When to use |
|-------|-------|-------------|
| Primary | `#FFFFFF` | Headings, scores, primary content |
| Secondary | `white/50` | Labels, descriptions, supporting text |
| Tertiary | `white/30` | Placeholders, timestamps, disabled text |
| Accent | Gradient | Brand name, feature titles on landing page |

### Borders & Dividers
| State | Color |
|-------|-------|
| Default | `white/10` |
| Hover | `white/20` |
| Focus | `#00B4B4/50` |
| Active | `#00B4B4` |

### Status Indicators
Always use these exact colors for health status:
| Status | Color | Score Range |
|--------|-------|-------------|
| Good | `#4ADE80` (green) | 7-10 |
| Moderate | `#FBBF24` (amber) | 4-6 |
| Poor | `#F87171` (red) | 1-3 |

---

## Typography Rules

### Hierarchy
```
Page Title:     text-2xl font-bold text-white          (24px, bold)
Section Head:   text-xl font-semibold text-white       (20px, semibold)
Card Title:     text-lg font-medium text-white         (18px, medium)
Body Text:      text-base text-white                   (16px, regular)
Label:          text-sm text-white/50                  (14px, regular)
Caption:        text-xs text-white/30                  (12px, regular)
```

### Rules
- Never use more than 3 levels of text hierarchy on a single screen
- Headings are always `text-white` — never muted
- Body text can be `white` or `white/70` depending on density
- Numbers and scores should be `font-bold` to stand out
- The gradient text effect is reserved for brand elements and landing page headings only

---

## Iconography

### Style
- All icons are inline SVG (not icon fonts)
- Default size: 24x24 (`w-6 h-6`)
- Small icons: 20x20 (`w-5 h-5`)
- Stroke width: 1.5px
- Style: Outline (not filled) — consistent with Heroicons

### Color
| State | Color |
|-------|-------|
| Default/inactive | `white/50` |
| Active/selected | `#00B4B4` |
| Interactive hover | `white` |
| Disabled | `white/20` |

### Usage
- Navigation tabs: icon + label, stacked vertically
- Quick action buttons: icon only with tooltip/label below
- Inline with text: icon left of label, vertically centered

---

## Card Design

### Standard Card
```
┌──────────────────────────────┐
│  bg-white/5                  │
│  border border-white/10      │
│  rounded-2xl                 │
│  p-4 or p-6                 │
│                              │
│  Content area               │
│                              │
└──────────────────────────────┘
```

### Glow Card (for featured content)
```
┌──────────────────────────────┐
│  bg-white/5                  │
│  border border-white/10      │
│  rounded-2xl                 │
│  shadow-lg shadow-cyan-500/10│
│  p-6                        │
│                              │
│  Featured content           │
│                              │
└──────────────────────────────┘
```

### Rules
- Cards never have a solid white background
- Border radius is always `rounded-2xl` (16px) for cards
- Padding is `p-4` for compact cards, `p-6` for spacious cards
- Cards do not nest inside other cards
- Maximum card width follows page container (`max-w-sm`)

---

## Button Design

### Primary CTA (Gradient)
```
Background:   linear-gradient(to right, #00B4B4, #4ADE80)
Text:         white, font-semibold
Radius:       rounded-xl (12px)
Height:       44px (md), 36px (sm), 48px (lg)
Full width:   Use when it's the main action on screen
```

### Secondary (Outline)
```
Background:   transparent
Border:       white/20
Text:         white
Radius:       rounded-xl
```

### Rules
- Only ONE gradient button per screen (the primary action)
- Outline buttons for secondary actions
- Ghost buttons for tertiary actions (no border)
- Danger buttons (`bg-red-500/20 text-red-400`) only for destructive actions
- Always show loading spinner when an action is processing
- `active:scale-95` on all interactive buttons

---

## Spacing System

### Page Layout
```
Page padding:        px-4 (16px sides)
Top padding:         pt-12 (48px, accounts for status bar)
Bottom padding:      pb-24 (96px, accounts for navigation)
Section gap:         mb-8 (32px between major sections)
Card gap:            gap-4 (16px between cards)
```

### Inside Cards
```
Card padding:        p-4 or p-6
Element spacing:     space-y-3 (12px between elements)
Label to input:      mb-1 (4px)
```

---

## Animation Guidelines

### Acceptable Animations
| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| Button press | `scale(0.95)` | 150ms | ease-out |
| Card hover | border color change | 200ms | ease |
| Page transition | opacity fade | 200ms | ease |
| Gut score fill | circular progress | 1200ms | custom ease-out |
| Voice recorder bars | height change | 150ms | ease |
| Loading spinner | rotate 360 | 1000ms | linear (infinite) |

### Rules
- No bounce animations
- No slide-in animations for page content
- Loading states use a simple spinner, never skeleton screens
- Gut score is the only element with a "dramatic" animation
- Transitions default to 200ms — never slower than 300ms for UI elements

---

## Image & Media

### Hero Video
- Background video on landing page: `/public/Gutted background.mp4`
- Auto-play, muted, looped
- Dark overlay to maintain text readability

### Uploaded Images
- Displayed at full card width
- `rounded-xl` for image corners
- `object-cover` for consistent aspect ratio

### Empty States
- Use text-based empty states with a relevant emoji or icon
- Never show a blank page — always guide the user to their next action
- Example: "No logs yet. Tap the mic to record your first entry."

---

## Do's and Don'ts

### Do
- Use the gradient sparingly — it's a highlight, not a base
- Maintain consistent spacing with Tailwind's scale
- Show loading states for all async operations
- Use color to communicate status (green/amber/red)
- Keep text concise — mobile screens have limited space

### Don't
- Don't use colored backgrounds on cards (only `white/5`)
- Don't use drop shadows except for the glow card variant
- Don't center-align body text (left-align everything except headings)
- Don't use more than 2 font weights on a single card
- Don't use the gradient on text smaller than `text-lg`
- Don't add decorative elements that don't serve a function
