---
name: Premium Editorial AI v2
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#444748'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f1f1f1'
  outline: '#747878'
  outline-variant: '#c4c7c7'
  surface-tint: '#5f5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1c1b1b'
  on-primary-container: '#858383'
  inverse-primary: '#c8c6c5'
  secondary: '#5f5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e4e2e1'
  on-secondary-container: '#656464'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#410003'
  on-tertiary-container: '#f2403c'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e5e2e1'
  primary-fixed-dim: '#c8c6c5'
  on-primary-fixed: '#1c1b1b'
  on-primary-fixed-variant: '#474646'
  secondary-fixed: '#e4e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1b1c1c'
  on-secondary-fixed-variant: '#474746'
  tertiary-fixed: '#ffdad6'
  tertiary-fixed-dim: '#ffb4ac'
  on-tertiary-fixed: '#410003'
  on-tertiary-fixed-variant: '#93000e'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
  accent-crimson: '#D62B2B'
  accent-gold: '#E3B341'
  surface-pure: '#FFFFFF'
  border-subtle: '#ECECEC'
  text-muted: '#666666'
  dark-surface: '#1A1A1A'
typography:
  display-xl:
    fontFamily: Playfair Display
    fontSize: 72px
    fontWeight: '900'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-lg:
    fontFamily: Playfair Display
    fontSize: 56px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Playfair Display
    fontSize: 28px
    fontWeight: '700'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  margin-max: 1440px
  container-width: 1200px
  gutter: 32px
  section-gap: 96px
  component-gap: 24px
  stack-sm: 8px
  stack-md: 16px
---

## Brand & Style

The design system embodies the intersection of elite print journalism and cutting-edge artificial intelligence. It targets a sophisticated audience of creators, investors, and technologists who value depth over clickbait. The brand personality is authoritative yet visionary, combining the timeless elegance of *GQ* with the functional precision of Apple News.

The visual style is **Minimalist-Luxury**. It utilizes heavy whitespace to create a "gallery" feel, where content is treated as art. This is augmented by **subtle Glassmorphism** to signify AI-native intelligence—translucent layers represent the AI "filtering" through data to find the essence. The aesthetic is bold, minimal, and unapologetically premium, emphasizing high-contrast typography and a disciplined monochrome palette.

## Colors

The color strategy is rooted in a refined monochrome foundation. 

- **Primary (#111111)**: Reserved for high-impact typography and core structural elements.
- **Secondary (#2A2A2A)**: Used for supporting text and UI elements that require a softer presence than pure black.
- **Accent Crimson (#D62B2B)**: Used with extreme intention for "Live" indicators, breaking news tags, and critical AI insights. It is a surgical strike of color in an otherwise neutral landscape.
- **Neutral (#F7F7F7)**: The canvas. It provides a soft, warm-gray alternative to stark white, reducing eye strain for long-form reading.

**Dark Mode Strategy**: Emulate the "Apple News" dark aesthetic. Avoid #000000; instead, use `#1A1A1A` for surfaces to maintain depth and allow for subtle shadows and glass effects to remain visible.

## Typography

The typographic hierarchy is the cornerstone of this design system. It relies on a high-contrast pairing between the serif **Playfair Display** and the sans-serif **Inter**.

- **Playfair Display**: Used for headlines and display text. We utilize the Black (900) weight for massive "magazine-style" headers to create immediate visual impact and an editorial feel.
- **Inter**: Used for all body copy and UI labels. It provides a clean, neutral balance to the expressive headlines. Body text uses a generous 1.6 line-height to ensure maximum readability during deep-dive sessions.
- **Information Architecture**: Varied weights (Regular, Medium, SemiBold) are used strategically in the UI to distinguish between metadata (reading time, category) and content.

## Layout & Spacing

This design system uses a **Fluid Editorial Grid** that transitions between 12 columns (Desktop), 8 columns (Tablet), and a single column (Mobile).

- **Grid Philosophy**: Unlike standard SaaS grids, we encourage varied column spans. A hero story might span 8 columns with a 4-column sidebar, or 12 columns for a dramatic "Cover" feel. This asymmetry creates the "magazine" rhythm.
- **Whitespace**: Significant vertical spacing (96px+) is used between major homepage sections to allow content to "breathe." 
- **Margins**: Large, generous margins (starting at 64px on desktop) frame the content, signaling luxury and focus.
- **Responsibility**: On mobile, margins reduce to 20px, and typography scales down to maintain legibility while preserving the editorial character.

## Elevation & Depth

Visual hierarchy is managed through a combination of **Tonal Layering** and **Glassmorphism**, moving away from traditional heavy drop shadows.

- **Surface Tiers**: Use the secondary neutral background (#F7F7F7) as the base, with primary content cards resting on pure white (#FFFFFF). 
- **AI-Native Glass**: AI widgets and overlays (like search and tooltips) use a backdrop-blur effect (20px blur) with a semi-transparent white (80% opacity) background. This suggests "intelligence" hovering over raw data.
- **Soft Shadows**: Where elevation is required, use "Ambient Shadows"—extremely diffused (30px-40px blur), low opacity (4-6%), with a slight tint of the primary color (#111111) to avoid a "dirty" look.

## Shapes

The shape language is refined and "Softly Geometric." 

- **Corner Radii**: Standard elements like buttons and input fields use a `0.5rem` (8px) radius. Larger containers, such as article cards, use `1rem` (16px) to feel more approachable and modern.
- **AI Elements**: Components specifically powered by AI (AI Insights, Sentiment Meters) can utilize "Pill-shaped" (3) radii to distinguish them from standard editorial content.
- **Consistency**: All image thumbnails must share the same corner radius as their parent containers to maintain a unified, "Apple-like" polish.

## Components

- **Article Cards**: These are the primary units. Features include a large thumbnail, a category label in `label-md` (uppercase Crimson), and a `headline-md` title. Hover states should trigger a subtle image scale (1.05x) and a slight shift in shadow depth.
- **AI Score Meters**: Use a horizontal progress track with a gradient transition from Neutral to Gold (#E3B341). These should feel high-tech, using monospaced numbers for the values.
- **Buttons**:
    - *Primary*: Solid #111111, white text, Inter Medium.
    - *Secondary/Ghost*: Outlined with #ECECEC, Inter Medium.
- **Chips/Badges**: Small, pill-shaped tags with #F7F7F7 backgrounds and #666666 text for categories like "Technology" or "Design."
- **Sentiment Icons**: Minimalist Lucide icons paired with AI Score meters to provide instant context (e.g., a "Sparkle" icon for high AI Quality).
- **Sticky Navigation**: A ultra-minimal bar. Transparent at the top of the page, morphing into a Glassmorphic blurred bar upon scroll.
- **Input Fields**: Clean, minimal borders (#ECECEC) that thicken to 2px Primary (#111111) on focus. No shadows on resting state.