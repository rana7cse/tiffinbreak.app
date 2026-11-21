# TiffinBreak theme ("Fancy" version)

Static HTML export of the fancy design. Open `index.html` in a browser; all
pages link to each other. No build step.

```
theme/
├── css/theme.css     tokens (CSS variables) + every component class
├── js/demo.js        demo-only interactions (love, school search, write prompts)
├── assets/           logo SVGs (main, light, mark, small icon, favicon)
├── index.html        Landing
├── feed.html         Home feed
├── school.html       Add school / college (bottom sheet)
├── write.html        Write a story
├── story.html        Read a story
├── profile.html      Public profile
└── logo.html         Brand sheet (reference only)
```

## Converting to React

- **Styles:** import `css/theme.css` once (e.g. in `main.tsx`). Keep the class
  names; `class` → `className`. Tokens live on `:root` as `--tb-*`.
- **Components:** each page has `<!-- <ComponentName /> -->` comments marking
  where to cut components. Repeated blocks (story cards, prompt notes, profile
  rows, suggestions) are written out by hand; turn them into `.map()` over data.
- **Inline styles:** only one-off layout tweaks remain inline. Move them to
  classes or convert to `style={{ ... }}` objects.
- **Interactions:** `js/demo.js` is throwaway. Each block notes which
  component should own the state (`useState`). Don't port it as-is.
- **Icons:** inline SVGs. Pull them into an `icons.tsx` (Heart, Share, Pen,
  Home, User, School, Back, Close, Image) when converting.
- **Accent colour:** `--tb-accent` (#C0501D). Alternatives from the design:
  `#B4432F`, `#9A5B13`, `#23392E`.
- **Motion:** landing-page animations are enabled by the `.tb-anim` class on the
  root and respect `prefers-reduced-motion`.

## Fonts

Anek Bangla (body) and Baloo Da 2 (display), loaded from Google Fonts at the
top of `theme.css`. Move to `<link>` tags or self-host in the React app if you
prefer.
