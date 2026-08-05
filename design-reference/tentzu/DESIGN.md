---
name: Tentzu
colors:
  surface: '#f9f9fc'
  surface-dim: '#dadadc'
  surface-bright: '#f9f9fc'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f6'
  surface-container: '#eeeef0'
  surface-container-high: '#e8e8ea'
  surface-container-highest: '#e2e2e5'
  on-surface: '#1a1c1e'
  on-surface-variant: '#3b4949'
  inverse-surface: '#2f3133'
  inverse-on-surface: '#f0f0f3'
  outline: '#6b7a79'
  outline-variant: '#bacac9'
  surface-tint: '#006a6a'
  primary: '#006a6a'
  on-primary: '#ffffff'
  primary-container: '#00d7d7'
  on-primary-container: '#005959'
  inverse-primary: '#1adcdc'
  secondary: '#50606f'
  on-secondary: '#ffffff'
  secondary-container: '#d1e1f4'
  on-secondary-container: '#556474'
  tertiary: '#5a5f60'
  on-tertiary: '#ffffff'
  tertiary-container: '#bec2c2'
  on-tertiary-container: '#4b5050'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#50f9f9'
  primary-fixed-dim: '#1adcdc'
  on-primary-fixed: '#002020'
  on-primary-fixed-variant: '#004f4f'
  secondary-fixed: '#d4e4f6'
  secondary-fixed-dim: '#b8c8da'
  on-secondary-fixed: '#0d1d2a'
  on-secondary-fixed-variant: '#394857'
  tertiary-fixed: '#dfe3e3'
  tertiary-fixed-dim: '#c3c7c7'
  on-tertiary-fixed: '#181c1d'
  on-tertiary-fixed-variant: '#434848'
  background: '#f9f9fc'
  on-background: '#1a1c1e'
  surface-variant: '#e2e2e5'
typography:
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Be Vietnam Pro
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Be Vietnam Pro
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Be Vietnam Pro
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 64px
---

## Brand & Style

The brand personality for Tentzu is centered around nurturing guidance, youthful energy, and effortless reliability. It is designed to evoke a sense of safety and wonder, much like its mascot, Teno—a baby snow leopard characterized by soft features, large expressive eyes, and a small, approachable stature.

The design style follows a **Modern Minimalism** approach with **Soft Tactile** accents. This means the interface prioritizes clarity and heavy whitespace to ensure ease of use, while using rounded corners and subtle depth to mirror the plush, friendly nature of Teno. The goal is to make the user feel supported by a system that is as intelligent as it is endearing.

Targeting a modern, tech-savvy audience that values both efficiency and personality, the UI avoids the coldness of traditional corporate tools, opting instead for a warm, inviting digital environment.

## Colors

The palette is anchored by a **vibrant turquoise blue**, serving as the primary brand color. This color represents clarity, vitality, and the modern spirit of Tentzu. It is used strategically for primary actions, progress indicators, and key brand moments.

The secondary palette utilizes "Snow Leopard" tones—cool slates and soft grays—to provide a sophisticated backdrop that allows the turquoise to pop. The neutral tones are deep and high-contrast to ensure maximum legibility, while the tertiary background colors are kept extremely light and cool-toned to maintain an airy, open feel throughout the application.

## Typography

This design system uses **Plus Jakarta Sans** for headlines to provide a soft, rounded, and welcoming geometric look that complements the mascot's features. Headlines utilize a tighter letter spacing and bold weights to establish a clear hierarchy.

**Be Vietnam Pro** is used for body text and labels. Its contemporary, humanist qualities ensure high readability and a friendly tone for long-form content and data. The typographic scale is generous, prioritizing whitespace between lines to prevent cognitive overload, maintaining the "light and airy" brand promise of Tentzu.

## Layout & Spacing

The layout philosophy follows a **Fluid Grid** model based on an 8px spacing rhythm. This ensures mathematical harmony across all components.

On desktop, a 12-column grid is used with 24px gutters, allowing for flexible content arrangements. On mobile, the system transitions to a 4-column grid with 16px side margins. Layouts should prioritize vertical flow and ample "breathability." Grouping of elements is achieved through generous internal padding within containers, rather than heavy lines, to maintain the minimalist aesthetic.

## Elevation & Depth

Visual hierarchy is conveyed through **Tonal Layers** and **Ambient Shadows**. Instead of harsh borders, surfaces are differentiated by subtle shifts in background color (e.g., a white card on a soft gray background).

When depth is required for interactive elements like modals or primary buttons, the design system utilizes "Cloud Shadows"—extra-diffused, low-opacity shadows with a very slight turquoise tint (#00D7D7 at 5-10% opacity). This creates a sense of lightness, as if elements are floating softly rather than pressing down heavily on the interface.

## Shapes

The shape language is consistently **Rounded**. This choice reflects the soft, youthful features of Teno and avoids sharp, aggressive corners that might feel institutional.

Standard components like input fields and buttons use a 0.5rem radius. Larger containers, such as cards and onboarding modals, use a 1rem radius to emphasize a "contained and safe" feeling. Full pills (maximum rounding) are reserved for tags, chips, and status indicators to provide a distinct visual contrast against rectangular structural elements.

## Components

### Buttons
Primary buttons are solid Turquoise Blue with white text, using a slightly bolder weight. Secondary buttons use a ghost style with a turquoise outline. All buttons should have a subtle scale-down effect (98%) on press to provide tactile feedback.

### Input Fields
Inputs feature a soft gray background and a 2px turquoise border that appears only on focus. Labels are always positioned above the field in a bold, smaller size for maximum clarity.

### Cards
Cards are the primary container for content. They should have no border, a white background, and the signature "Cloud Shadow" to lift them from the page.

### Mascot Integration (Teno)
Teno should appear in "Empty States," onboarding flows, and success messages. The illustrations should use soft gradients and rounded line work. Teno’s eyes should always be large and expressive, often looking toward the primary call-to-action to guide the user's gaze.

### Chips & Tags
Used for categorization, chips should be fully rounded (pill-shaped) with low-saturation turquoise backgrounds and dark turquoise text to ensure accessibility while remaining on-brand.
