# Design System

## Foundation

gutted. uses a dark-first, mobile-first design system built on Tailwind CSS 4 with custom tokens.

---

## Colors

### Core Palette
```
Background:     #000000        (pure black -- OLED optimized)
Surface:        white/5        (rgba(255,255,255,0.05))
Surface Hover:  white/10       (rgba(255,255,255,0.10))
Border:         white/10       (rgba(255,255,255,0.10))
Border Focus:   #00B4B4/50     (teal at 50% opacity)
```

### Text Hierarchy
```
Primary:        #FFFFFF        (white -- headings, body)
Secondary:      white/50       (labels, descriptions)
Tertiary:       white/30       (placeholders, hints)
```

### Accent Colors
```
Teal:           #00B4B4        (primary accent)
Green:          #4ADE80        (secondary accent)
Gradient:       #00B4B4 → #4ADE80  (brand signature)
```

### Status Colors
```
Success/Good:   #4ADE80        (green -- gut score >= 7)
Warning/Mid:    #FBBF24        (amber -- gut score 4-6)
Error/Poor:     #F87171        (red -- gut score < 4)
```

---

## Typography

### Font Stack
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;
```

### Scale
| Class | Size | Weight | Usage |
|-------|------|--------|-------|
| `text-3xl font-bold` | 30px / 700 | Bold | Page titles |
| `text-2xl font-bold` | 24px / 700 | Bold | Section headings |
| `text-xl font-semibold` | 20px / 600 | Semibold | Card titles |
| `text-lg font-medium` | 18px / 500 | Medium | Subheadings |
| `text-base` | 16px / 400 | Normal | Body text |
| `text-sm` | 14px / 400 | Normal | Labels, captions |
| `text-xs` | 12px / 400 | Normal | Badges, timestamps |

### Gradient Text
```css
.gradient-text {
  background: linear-gradient(to right, #00B4B4, #4ADE80);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

---

## Spacing

Based on Tailwind's 4px grid:

| Token | Value | Usage |
|-------|-------|-------|
| `p-4` | 16px | Standard card padding |
| `p-6` | 24px | Section padding |
| `gap-3` | 12px | Between form elements |
| `gap-4` | 16px | Between cards |
| `gap-6` | 24px | Between sections |
| `space-y-4` | 16px | Vertical list spacing |
| `mb-8` | 32px | Section separation |

---

## Components

### Button
Four variants, three sizes:

**Variants:**
- `gradient` -- Teal-to-green gradient background (primary CTA)
- `outline` -- Transparent with white/20 border
- `ghost` -- Transparent, no border
- `danger` -- Red background for destructive actions

**Sizes:**
- `sm` -- `px-3 py-1.5 text-sm`
- `md` -- `px-4 py-2.5 text-sm` (default)
- `lg` -- `px-6 py-3 text-base`

**States:**
- Hover: `opacity-90`
- Active: `scale-95`
- Disabled: `opacity-50 cursor-not-allowed`
- Loading: Spinner icon + disabled

**Border radius:** `rounded-xl` (12px)

### Card
Semi-transparent container with optional glow effect.

```
Background:     bg-white/5
Border:         border border-white/10
Border radius:  rounded-2xl (16px)
Padding:        p-4 or p-6
Glow:           shadow-lg shadow-cyan-500/10 (optional)
```

### Badge
Inline status indicator.

**Variants:**
- `green` -- `bg-green-500/20 text-green-400`
- `amber` -- `bg-amber-500/20 text-amber-400`
- `red` -- `bg-red-500/20 text-red-400`
- `teal` -- `bg-teal-500/20 text-teal-400`
- `neutral` -- `bg-white/10 text-white/70`

### Input Fields
```
Background:     bg-white/5
Border:         border border-white/10
Border focus:   border-[#00B4B4]/50
Border radius:  rounded-xl (12px)
Padding:        px-4 py-3
Text:           text-white
Placeholder:    text-white/30
```

### Navigation (Bottom Tab Bar)
```
Position:       fixed bottom-0
Background:     bg-black/90 backdrop-blur
Border top:     border-t border-white/10
Items:          5 tabs (Home, Log, Upload, Meals, History)
Active:         text-[#00B4B4]
Inactive:       text-white/50
Safe area:      pb-safe (env(safe-area-inset-bottom))
```

---

## Layout Patterns

### Page Container
```html
<div class="min-h-screen bg-black text-white">
  <div class="max-w-sm mx-auto px-4 py-6 pb-24">
    <!-- Content -->
  </div>
</div>
```

### Dashboard Page
```html
<div class="min-h-screen bg-black text-white pb-24">
  <div class="max-w-sm mx-auto px-4 pt-12">
    <h1 class="text-2xl font-bold mb-6">Page Title</h1>
    <!-- Content sections -->
  </div>
  <Navigation />
</div>
```

### Auth Page
```html
<div class="min-h-screen bg-black flex items-center justify-center px-4">
  <div class="w-full max-w-sm">
    <Card>
      <!-- Form content -->
    </Card>
  </div>
</div>
```

---

## Animation

### Transitions
```css
transition-all duration-200    /* Default for interactive elements */
transition-all duration-300    /* Cards, modals */
transition-transform duration-150  /* Button press */
```

### Gut Score Animation
- Easing: Custom cubic-bezier via `requestAnimationFrame`
- Duration: 1200ms
- Effect: Counter + circular progress fill

### Voice Recorder
- 20 animated frequency bars
- Random height during recording (10-100%)
- 150ms transition per bar

### Scroll Behavior
```css
scroll-behavior: smooth;
```

---

## Iconography

- **Style:** Outline icons, 24x24 default
- **Stroke width:** 1.5px
- **Source:** Heroicons (inline SVG)
- **Active color:** `#00B4B4` (teal)
- **Inactive color:** `white/50`

---

## Responsive Breakpoints

Mobile-first with minimal breakpoints:

| Breakpoint | Width | Usage |
|------------|-------|-------|
| Default | 0px+ | Mobile (primary target) |
| `sm:` | 640px+ | Small tablet adjustments |
| `md:` | 768px+ | Landing page grid changes |
| `lg:` | 1024px+ | Landing page max-width |

The dashboard is designed for `max-w-sm` (384px) -- fully mobile-optimized.
