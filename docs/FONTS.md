# Font Configuration Guide

AgentifUI uses a modern combination of Chinese and English fonts to provide an elegant reading experience.

## Font Combinations

| Use Case            | Font                            | Tailwind Class | Description                                        |
| :------------------ | :------------------------------ | :------------- | :------------------------------------------------- |
| UI Text             | Inter + Noto Sans SC            | `font-sans`    | Modern and clean, suitable for UI elements         |
| Reading Content     | Crimson Pro + Noto Serif SC     | `font-serif`   | Elegant and legible, suitable for long-form text   |
| Decorative Headings | Playfair Display + Noto Sans SC | `font-display` | Highly decorative, suitable for important headings |

## Usage

### Basic Usage

```tsx
// Default UI font
<div className="font-sans">Interface Text</div>

// Reading font
<div className="font-serif">Reading content</div>

// Decorative heading font
<h1 className="font-display">Display Title</h1>
```

### Responsive Font Sizes

```tsx
// Responsive Heading
<h1 className="font-display text-2xl md:text-3xl lg:text-4xl">
  Responsive Heading
</h1>

// Responsive Body Text
<p className="font-serif text-base md:text-lg">
  Responsive body content
</p>
```

## Font Weights

Supported weights: `font-light`, `font-normal`, `font-medium`, `font-semibold`, `font-bold`

```tsx
<p className="font-sans font-medium">Medium weight text</p>
<p className="font-serif font-bold">Bold serif text</p>
```

## Font Characteristics

- **Inter + Noto Sans SC**: A modern sans-serif font, clear and highly legible.
- **Crimson Pro + Noto Serif SC**: An elegant serif font for a comfortable reading experience.
- **Playfair Display**: A decorative serif font, ideal for headings.

All fonts are loaded via Google Fonts and support mixed Chinese and English display.
