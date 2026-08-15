# Page Spine proof of concept

This proof validates the Learnly homepage transformation hero and one curated study folio before the wider redesign begins. The public library, document detail, and admin workspace remain outside this proof.

## Rendered proof

| Surface | Light | Night |
| --- | --- | --- |
| Hero | [Desktop light hero](desktop-light-hero.jpg) | [Desktop night hero](desktop-night-hero.jpg) |
| Folio | [Desktop light folio](desktop-light-folio.jpg) | [Desktop night folio](desktop-night-folio.jpg) |

- [320px mobile proof](mobile-320.jpg)
- [Bricolage Grotesque and Recursive comparison](type-comparison.jpg)

## Contrast findings

The badges were checked at their rendered size of 10.24px, while the Page Spine was checked with 3–4px ticks.

| Pair | Contrast | Result | Usage decision |
| --- | ---: | --- | --- |
| Highlighter `#E5F06A` and Indexed Green `#2C7A68` | 4.16:1 | Visually distinct at the rendered sizes | Keep the colors adjacent only as fills or indicators, not as a foreground/background text pair |
| Graphite `#20262F` on Highlighter | 12.32:1 | WCAG AAA | Use for the Intermediate badge |
| Desk Paper `#F5F7F4` on Indexed Green | 4.77:1 | WCAG AA | Use for topic badges |
| Highlighter on Desk Paper | 1.15:1 | Fails WCAG | Never use Highlighter as light-mode text or as an unoutlined meaningful indicator |
| Highlighter on Graphite | 12.32:1 | WCAG AAA | Safe for night-mode emphasis |

Highlighted Page Spine ticks sit on a Graphite track. Lifecycle meaning is always stated in text, so the motif never carries status through color alone.

## Typography findings

Bricolage Grotesque renders the homepage headline at 68px on a 1440px viewport. It scales to 57.34px at 1024px, 51.2px at 768px, and 44.8px at 320px.

The comparison uses these Learnly-specific strings:

1. “A PDF goes in. A study path comes out.”
2. “Turn dense pages into something you can study.”
3. “Every page, ready when you return.”

Bricolage Grotesque is retained. Its irregular proportions make the transformation headline feel more personal and study-oriented, while Recursive reads as a more conventional technical-product face. The copy still does most of the product-specific work; the typeface supports it without becoming the main visual event.

## Responsive, motion, and accessibility checks

- No horizontal overflow at 320px, 768px, 1024px, or 1440px.
- The hero and folio remain present at every tested width.
- The hero sequence completes in 880ms at most and does not repeat.
- `prefers-reduced-motion` removes the reveal animation and interaction transitions.
- The hero uses one level-one heading, the folio has labelled section and article headings, and decorative Page Spine marks are hidden from assistive technology.
- Links have visible focus treatments with a Highlighter outline and Graphite separation ring.
- The browser displayed no framework error overlay and reported no console errors during the proof checks.
