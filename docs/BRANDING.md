# Branding

## Brand Identity

### Name
**gutted.** (lowercase, with trailing period)

The period is part of the brand mark -- it signals completeness and finality. "We've got this handled."

### Tagline
**"Know your gut."**

Short, direct, empowering. It positions the user as someone taking control of their health.

### Extended Tagline (Marketing)
*"Voice-log your symptoms. Upload your tests. Get a meal plan that actually fits your gut."*

Used on the landing page and in marketing contexts where more explanation is needed.

### Brand Voice
- **Direct** -- No fluff, no medical jargon
- **Empowering** -- You're in control of your health
- **Warm but clinical** -- Trustworthy without being cold
- **Modern** -- Speaks like a knowledgeable friend, not a textbook
- **Careful** -- Always recommends consulting healthcare professionals

### Brand Values
1. **Clarity** -- Make complex health data understandable
2. **Convenience** -- Remove every friction point possible
3. **Personalization** -- One-size-fits-all doesn't work for guts
4. **Privacy** -- Your health data belongs to you
5. **Honesty** -- We're a tool, not a doctor

---

## Visual Identity

### Logo Assets
| Asset | Path | Usage |
|-------|------|-------|
| App icon | `/public/icon.png` | App stores, PWA icon, favicon base |
| Logo | `/public/logo.png` | Marketing, headers, splash screens |
| Favicon | `/public/favicon.ico` | Browser tabs |

### Color Palette

#### Primary Colors
| Color | Hex | Usage |
|-------|-----|-------|
| Teal | `#00B4B4` | Primary accent, links, active states |
| Green | `#4ADE80` | Secondary accent, success states, scores >= 7 |
| Gradient | `#00B4B4 → #4ADE80` | CTAs, brand elements, headings |

#### Background & Surface
| Color | Value | Usage |
|-------|-------|-------|
| Background | `#000000` | App background (pure black for OLED) |
| Surface | `rgba(255,255,255,0.05)` | Cards, elevated surfaces |
| Border | `rgba(255,255,255,0.1)` | Dividers, card borders |

#### Text
| Color | Value | Usage |
|-------|-------|-------|
| Primary | `#FFFFFF` | Headings, body text |
| Secondary | `rgba(255,255,255,0.5)` | Descriptions, labels |
| Tertiary | `rgba(255,255,255,0.3)` | Placeholders, hints |

#### Status Colors
| Color | Hex | Usage |
|-------|-----|-------|
| Green | `#4ADE80` | Good (score >= 7), success |
| Amber | `#FBBF24` | Moderate (score 4-6), warning |
| Red | `#F87171` | Poor (score < 4), error, danger |

### Typography
- **Primary font:** Inter (Google Fonts)
- **Fallbacks:** -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
- **Rendering:** Antialiased (`-webkit-font-smoothing: antialiased`)

### Gradient Usage
The teal-to-green gradient is the signature brand element:
```css
background: linear-gradient(to right, #00B4B4, #4ADE80);
```
Used for:
- Call-to-action buttons
- Feature headings on landing page
- Brand name styling
- Active navigation indicators
- Score highlights

---

## PWA Identity

```json
{
  "name": "gutted.",
  "short_name": "gutted.",
  "description": "Know your gut. AI-powered gut health companion.",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#000000",
  "background_color": "#000000"
}
```

## Metadata

```
Title: "gutted. - Know your gut."
Description: "Voice-log your symptoms. Upload your tests. Get a meal plan that actually fits your gut."
```

## Brand Don'ts
- Don't capitalize "gutted" -- it's always lowercase
- Don't omit the trailing period -- "gutted." not "gutted"
- Don't use the gradient on body text -- only headings and accents
- Don't use a light theme -- the app is dark-only by design
- Don't use medical terminology in user-facing copy without plain-English alternatives
