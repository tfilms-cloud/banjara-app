---
name: Alpine Wanderer
colors:
  surface: '#fff8f5'
  surface-dim: '#e0d8d5'
  surface-bright: '#fff8f5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#faf2ee'
  surface-container: '#f4ece8'
  surface-container-high: '#eee7e3'
  surface-container-highest: '#e9e1dd'
  on-surface: '#1e1b19'
  on-surface-variant: '#3d4948'
  inverse-surface: '#33302d'
  inverse-on-surface: '#f7efeb'
  outline: '#6d7a79'
  outline-variant: '#bcc9c8'
  surface-tint: '#006a68'
  primary: '#006765'
  on-primary: '#ffffff'
  primary-container: '#008280'
  on-primary-container: '#f3fffd'
  inverse-primary: '#66d8d4'
  secondary: '#006a68'
  on-secondary: '#ffffff'
  secondary-container: '#96efec'
  on-secondary-container: '#006e6d'
  tertiary: '#aa2f13'
  on-tertiary: '#ffffff'
  tertiary-container: '#cd4729'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#84f5f1'
  primary-fixed-dim: '#66d8d4'
  on-primary-fixed: '#00201f'
  on-primary-fixed-variant: '#00504e'
  secondary-fixed: '#99f2ef'
  secondary-fixed-dim: '#7cd5d2'
  on-secondary-fixed: '#00201f'
  on-secondary-fixed-variant: '#00504e'
  tertiary-fixed: '#ffdad2'
  tertiary-fixed-dim: '#ffb4a3'
  on-tertiary-fixed: '#3d0600'
  on-tertiary-fixed-variant: '#8c1900'
  background: '#fff8f5'
  on-background: '#1e1b19'
  surface-variant: '#e9e1dd'
typography:
  display-hero:
    fontFamily: Outfit
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-section:
    fontFamily: Outfit
    fontSize: 19px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.015em
  headline-card:
    fontFamily: Outfit
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  body-base:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-semibold:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  caption:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.02em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 0.75rem
  margin: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system embodies an editorial, photo-first travel marketplace engineered for rugged journeys translated into effortless, tranquil mobile experiences. Merging the aspirational, visual storytelling of modern editorial platforms with the functional utility of global lodging engines, the aesthetic is airy, hyper-clean, and deeply trustworthy.

The visual tone relies on generous whitespace, expansive full-bleed imagery of northern valleys, crisp mountain streams, and warm local hospitality. Interfaces remain understated to celebrate landscape photography and verified host content. Elements feature soft geometry, ultra-diffused atmospheric depth, and purposeful, calm color accents that inspire confidence during remote logistics planning.

## Colors

The palette balances clean mineral whites with verdant valley teals and warm, sunlit accents:

- **Surface & Canvas:** Base canvas is `#F8FAFC`, providing a light mist tint that allows elevated cards (`#FFFFFF`) to float naturally without stark glare.
- **Brand Teal Core:** `#0F9B98` serves as the primary interactive anchor for primary CTA fills, active indicators, and prominent badges. Its deeper counterpart, `#0B7A78`, is strictly reserved for high-legibility inline text links, small navigational captions, and focused border states.
- **Accent Coral:** `#FF6B4A` is applied with surgical restraint for heart/favorite selections, limited availability alerts, urgent verification steps, and floating emergency assistance triggers.
- **Success Tone:** `#16B364` communicates confirmed bookings, certified driver clearances, and available transit slots.
- **Typography & Structure:** High-contrast neutral `#1C1917` establishes solid editorial authority on headings and primary strings. Neutral muted `#57534E` renders timestamps, subtitles, and secondary descriptions. Structural lines leverage `#E2E8F0` at hairline thickness.

## Typography

The typographic pairing provides architectural elegance alongside effortless mobile scanning:

- **Headlines (Outfit):** Geometric, modern, and open. The 24px hero headline gives editorial grace to destination introductions without overcrowding compact viewport viewports (390px). Section titles locked at 19px SemiBold command section hierarchies cleanly without aggressive weight.
- **Body & Labels (Plus Jakarta Sans):** Highly legible humanist curves with generous aperture that retain clarity on low-lit mountain routes or glaring alpine daylight. Used across cards, meta-information, inputs, and tab navigation.
- **Hierarchy Rules:** Maintain a strict distinction between editorial storytelling (Outfit) and utilitarian data/metrics (Plus Jakarta Sans). Prices and ratings rely on `body-semibold` or `headline-card` for instant readability.

## Elevation & Depth

Visual hierarchy avoids rigid borders and harsh drop shadows, opting instead for ultra-diffused atmospheric elevation inspired by daylight bouncing off mountain ridges:

- **Ambient Ground Level (Cards & Containers):** Flat white `#FFFFFF` surfaces resting on `#F8FAFC` use a dual-stop shadow: `0px 4px 20px -2px rgba(28, 25, 23, 0.04), 0px 2px 6px -1px rgba(28, 25, 23, 0.02)`. This establishes an airy 8% net optical density that feels organic.
- **Floating Controls (Pill CTAs, Floating Help, Like Triggers):** Raised utility pills utilize `0px 10px 24px -4px rgba(15, 155, 152, 0.16)` when primary-tinted, or `0px 12px 28px -4px rgba(28, 25, 23, 0.08)` when resting on a white container.
- **Media Overlays:** Image gradients employ an inverse tonal scrim (`linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(28,25,23,0.65) 100%)`) to guarantee AAA text contrast over complex landscape vistas.
- **Border Integration:** Hairline boundaries (`1px solid #E2E8F0`) are reserved exclusively for inner card segmentations and inputs; outer elevated cards rely purely on elevation and surface contrast.

## Shapes

The design system uses a hyper-rounded, welcoming shape aesthetic that softens logistical complexity:

- **Cards & Visual Containers:** Standard content cards, property spotlights, and jeep booking modules employ an expressive `20px` to `24px` radius. Large hero imagery containers and modal sheets scale to `28px` corner radii.
- **Pill Philosophy (Buttons, Chips, Badges):** All actionable UI elements—including primary booking buttons, filter chips, rating badges, search capsules, and floating assistance buttons—are fully pill-shaped (`9999px` border-radius).
- **Nested Inner Geometry:** Thumbnails, vehicle icons, and interior images nested within a parent card strictly mirror the card's radius scaled down proportionally (`12px` to `16px`) to ensure concentric geometric balance.

## Components

### Buttons & Interactive Pills
- **Primary CTA:** Pill-rounded (`9999px`), 48px height, solid `#0F9B98` fill, white `Plus Jakarta Sans` 14px SemiBold text. Pressed states animate down to scale `0.98` with `#0B7A78`.
- **Secondary / Ghost Button:** Transparent background, hairline border `1.5px solid #E2E8F0`, neutral `#1C1917` text.
- **Floating Accent / Urgency Action:** Pill-rounded, `#FF6B4A` fill, pure white label/icon, floating elevation with 12px blur.

### Chips & Filter Pills
- **Unselected:** Background `#FFFFFF`, border `1px solid #E2E8F0`, text `#57534E` (13px, weight 500), horizontal padding 16px, height 36px.
- **Selected:** Background `#0F9B98`, border `1px solid #0F9B98`, text `#FFFFFF` (13px, weight 600).
- **Urgency Indicator Chip:** Soft tinted fill `rgba(255, 107, 74, 0.1)`, text `#FF6B4A`, 11px uppercase bold caption, 24px height.

### Cards & Media Units
- **Listing Card:** Surface `#FFFFFF`, 24px corner radius, outer margin 0, bottom padding 16px. Hero image container nested with 20px radius, 4:3 aspect ratio, with a floating 36px circular white glass heart/save button in the upper right.
- **Transport / Jeep Route Card:** Two-column horizontal arrangement featuring vehicle silhouette, driver verification badge in `#16B364`, route time stamps, and fixed price lockup in Outfit SemiBold.

### Input Fields & Search Bars
- **Floating Global Search Capsule:** 56px height, pill-rounded (`9999px`), `#FFFFFF` surface with soft shadow, containing destination glyph, muted placeholder `#57534E`, and a compact circular teal search trigger button on the trailing end.
- **Form Inputs:** 48px height, 16px rounded corners, `#FFFFFF` surface, border `1px solid #E2E8F0`. Focus state shifts to border `1.5px solid #0F9B98` without harsh drop outlines.

### Checkboxes, Radios & Switches
- **Radio / Selection Dots:** 22px diameter circular indicators with `#0F9B98` active centers and `#E2E8F0` resting rings.
- **Toggle Switches:** Pill-rounded track (48px width x 28px height), background `#E2E8F0` when off, transitions to `#0F9B98` when active, containing an elevated pure white 24px circular thumb.

### Badges & Micro-Feedback
- **Host / Driver Verification:** Pill-shaped pill with 6px green dot (`#16B364`), background `rgba(22, 179, 100, 0.08)`, text `#16B364` (12px SemiBold).
- **Review Rating Capsule:** Frosted glass capsule floating on listing photos; blur 12px, background `rgba(28, 25, 23, 0.45)`, white text with gold star glyph.