# Branding

Brand identity, voice, and the visual rules that keep gutted. recognisable across every surface.

---

## Identity

### Name
**gutted.** -- always lowercase, always with the trailing period.

The period is part of the mark. It signals completeness: *"we've got this handled."* Never write **Gutted** or **gutted** without the period in product or marketing copy.

### Tagline
**Know your gut.**

Direct, empowering, second-person. It positions the user as the agent of change, not the patient.

### Marketing line
*"Voice-log your symptoms. Upload your tests. Get a meal plan that actually fits your gut."*

Used on the landing page and in longer marketing contexts. Variants are fine, but the three-clause structure (log -> understand -> act) is the brand pattern.

### One-line elevator
*"gutted. turns your gut symptoms, test results, and food choices into one personalised AI plan."*

### Sales hook (for AI agents pitching at scale)
*"Stop Googling your gut tests."*

More variants in [VALUE_PROP.md](./VALUE_PROP.md).

### Domain
`https://www.gutted.app` -- canonical with `www`.

`metadataBase: new URL('https://www.gutted.app')` is set in `src/app/layout.tsx`. The OpenGraph title is `gutted. - Know your gut.`, description `AI-powered gut health companion.`

---

## Voice

| Trait | What it sounds like | What it doesn't |
|---|---|---|
| Direct | *"Track this for a week and we'll show you the pattern."* | *"Embark on your wellness journey."* |
| Empowering | *"You're in control of your gut."* | *"Let us take care of you."* |
| Warm but clinical | *"That sounds rough -- here's what the pattern looks like."* | *"Per your data..."* |
| Modern | Speaks like a knowledgeable friend. | Reads like a textbook. |
| Careful | Always nudges toward professional care for serious symptoms. | Never claims to diagnose, treat, or cure. |
| Plain-English | "This may suggest lactose sensitivity." | "Possible lactase deficiency in the duodenum." |

We never:
- Use surveillance, intrusive, or shame-coded language.
- Reduce the user to a patient. They are an active operator of their gut.
- Imply medical diagnoses or treatment claims.
- Use ALL CAPS for emphasis.
- Use em dashes (`--` is the project convention; replaced everywhere as of recent work).

---

## Brand values

1. **Clarity.** Make complex health data understandable.
2. **Convenience.** Remove every friction point possible.
3. **Personalisation.** One-size-fits-all doesn't work for guts.
4. **Privacy.** Your health data belongs to you.
5. **Honesty.** We are a tool, not a doctor.

---

## Visual identity

### Logo assets

| Asset | Path | Use |
|---|---|---|
| App icon | `/public/icon.png` | Favicon, PWA icon, email templates |
| Wordmark / logo | `/public/logo.png` | Header lockups, marketing |
| Favicon | `/public/favicon.ico` | Browser tab |
| Hero video | `/public/gutted-bg.mp4` | Landing-page background (MP4, faststart, dark overlay) |

Reference screenshots are in the project root (`gutted-landing-*.png`, `gutted-dashboard.png`, `gutted-coach-page.png`, etc.) and are useful as visual proof points in marketing decks.

### Colour palette

#### Primary
| Token | Value | Use |
|---|---|---|
| Teal | `#00B4B4` | Primary accent, links, active states, focus rings |
| Green | `#4ADE80` | Secondary accent, success, score >=7 |
| Brand gradient | `linear-gradient(to right, #00B4B4, #4ADE80)` | CTAs, brand wordmark, feature headlines |

#### Surfaces
| Token | Value | Use |
|---|---|---|
| Background | `#000000` | App background (OLED-friendly) |
| Surface | `rgba(255,255,255,0.05)` | Cards, elevated surfaces |
| Hover surface | `rgba(255,255,255,0.10)` | Hover state on cards/buttons |
| Border | `rgba(255,255,255,0.10)` | Dividers, card borders |
| Focus border | `rgba(0,180,180,0.5)` | Focused inputs, dialogs |

#### Text
| Token | Value | Use |
|---|---|---|
| Primary | `#FFFFFF` | Headings, body |
| Secondary | `rgba(255,255,255,0.5)` | Labels, descriptions |
| Tertiary | `rgba(255,255,255,0.3)` | Placeholders, hints |

#### Status
| Token | Value | Use |
|---|---|---|
| Good | `#4ADE80` | Score 7-10, success |
| Moderate | `#FBBF24` | Score 4-6, warning |
| Poor | `#F87171` | Score 1-3, danger |

### Typography

- **Family:** Inter (web font), with native fallbacks.
- **Stack:** `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`.
- **Rendering:** antialiased; `-webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale`.

### Gradient usage

The teal-to-green gradient is **the** brand signal. Reserved for:
- Primary CTAs.
- The wordmark / brand name in display contexts.
- Feature headlines on the landing page.
- Active navigation indicators.
- Score highlights on hero numbers.

Don't use it on body text. Don't use it as a card background.

### Iconography

Outline SVGs at `1.5px` stroke width, 24x24 default, 20x20 small. `text-white/50` inactive, `#00B4B4` active.

---

## PWA & metadata

`public/manifest.json`:

```json
{
  "name": "gutted.",
  "short_name": "gutted.",
  "description": "Know your gut. AI-powered gut health companion.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#000000",
  "theme_color": "#000000",
  "icons": [
    { "src": "/icon.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

Document metadata (`src/app/layout.tsx`):
- `title: "gutted. - Know your gut."`
- `description: "Voice-log your symptoms. Upload your tests. Get a meal plan that actually fits your gut."`
- OpenGraph title/description set; canonical `/`.

---

## Avatar system

Six gut-themed avatars users select on the profile page. Each is a stylised character; the selected `avatar_id` is plain text on `profiles.avatar_id` (no migrations needed to add a new avatar -- update the registry in `src/components/avatars/index.ts`).

| ID | Character |
|---|---|
| `bloat-balloon` | Bloat Balloon |
| `dash-runner` | Dash Runner |
| `fiber-friend` | Fiber Friend |
| `gurgle-sleuth` | Gurgle Sleuth |
| `probiotic-pal` | Probiotic Pal |
| `zen-guru` | Zen Guru |

Avatars appear on the profile button (replacing the older plan badge) and in settings.

---

## Brand do's and don'ts

### Do
- Always lowercase, always with the period: `gutted.`.
- Keep CTAs in gradient teal-to-green.
- Default to dark surfaces. The app is dark-only by design.
- Use plain English. Translate medical jargon for the user.
- Lead with the user's outcome, not the technology.

### Don't
- Don't capitalise as `Gutted`.
- Don't drop the period in `gutted.`.
- Don't use the gradient on body copy or small text.
- Don't introduce a light theme.
- Don't surveil or shame the user in copy.
- Don't use em dashes -- the project uses double-hyphens (`--`) consistently.
- Don't use medical-grade language without a plain-English alternative.

---

## Boilerplate snippets

### One-line product description
> *"gutted. is the AI gut-health companion -- voice-log symptoms, upload any test, get a meal plan that fits your gut."*

### Two-sentence about
> *"gutted. closes the loop between gut symptoms, lab results, and meal planning. Voice-log in seconds, upload any gut test for instant AI interpretation, and get a weekly meal plan personalised to your data."*

### Pricing one-liner
> *"Free to try. Core $14/mo. Pro $29/mo."*

### Disclaimer footer
> *"gutted. is a tracking and insight tool. It is not a medical device and does not provide diagnosis or treatment. For serious symptoms, consult a healthcare professional."*

For the visual rules and tokens in code, see [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md). For how to apply them in product surfaces, see [VISUAL_GUIDELINES.md](./VISUAL_GUIDELINES.md).
