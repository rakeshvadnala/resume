# Rakesh Vadnala — IAM Portfolio

A single-page portfolio site for an Identity & Access Management (IAM) Technical
Consultant, built with plain HTML5, CSS3, and vanilla JavaScript (ES6+). No
frameworks, no build tools — open `index.html` and it runs.

**Design concept:** the site borrows its visual language from the world of
identity governance itself — an animated digital access badge in the hero,
an "audit trail" timeline for work history, and status/clearance styling
throughout — so the design reinforces what the content is about.

---

## Features

- Single-page layout: Hero, About, Expertise (SailPoint vs. Saviynt), Experience
  timeline, filterable Capabilities grid, Certifications, and Contact.
- Animated "ID badge" hero visual with scanline sweep and mouse-tilt interaction.
- Dark/light theme toggle with `localStorage` persistence and system-preference
  fallback.
- Typing animation, scroll-spy navigation, smooth scrolling, and a scroll
  progress bar.
- Scroll-triggered reveal animations and animated stat counters.
- Filterable capability cards (Provisioning, Governance, Integration, Security).
- Certification badges link out to each credential's public verification page.
- Contact form with client-side validation and a simulated submit flow
  (no backend — see *Wiring the contact form* below).
- Copy-to-clipboard email button, résumé download, and a back-to-top button.
- Ambient "identity graph" canvas background — capped node count, pauses when
  the tab is hidden, and respects `prefers-reduced-motion`.
- Fully responsive, keyboard-accessible (visible focus states, skip link),
  and safe for GitHub Pages as-is.

---

## Folder structure

```text
portfolio/
│
├── index.html
├── Rakesh_Vadnala_Resume.pdf   (linked by the "Download Résumé" buttons)
├── css/
│   ├── custom-ui.css           (effects, animation, badge, theme polish)
│   └── style.css                (tokens, layout, typography, responsive)
├── js/
│   ├── custom-ui.js             (reveals, counters, tilt, canvas nodes)
│   └── script.js                 (nav, theme, form, filtering, utilities)
└── README.md
```

---

## Customization guide

**Colors, type, spacing** — every design token lives at the top of
`css/style.css` inside `:root` (dark theme) and `[data-theme="light"]`
(light theme). Change a hex value once and it propagates everywhere.

**Content** — all copy lives directly in `index.html`, grouped by section
with HTML comments (`<!-- ============ HERO ============ -->`, etc.). Edit
text in place; no templating layer to fight with.

**Capability filter categories** — each card in the Capabilities section
carries a `data-category` attribute (`provisioning`, `governance`,
`integration`, `security`). Add a new card with the right attribute and it's
automatically picked up by the existing filter buttons; add a new filter
button with a matching `data-filter` value to introduce a new category.

**Typing animation words** — edit the `WORDS` array near the top of
`js/script.js`.

**Ambient background node count** — tune `NODE_COUNT` and `LINK_DIST` in the
`initNodes()` function inside `js/custom-ui.js` if you want a denser or
sparser effect.

**Certification verification links** — each badge in `#certifications` is an
`<a>` tag pointing at its issuer's public verification page:

```html
<a class="cert-badge reveal-up" href="YOUR_VERIFICATION_URL" target="_blank" rel="noopener noreferrer">
  <div class="cert-badge__seal">✓</div>
  <h3>Certification name</h3>
  <span class="cert-badge__issuer">Issuer</span>
  <span class="cert-badge__verify">Verify credential ...</span>
</a>
```

Swap the `href` to update where a badge links, or drop the `<a>` wrapper down
to a plain `<div class="cert-badge reveal-up">` (and remove the
`cert-badge__verify` line) for a certification with no public link — it'll
still render as a static, non-clickable badge.

---

## How to update your résumé information

1. **Page content** — edit the relevant section directly in `index.html`
   (Profile Summary → `#about`, IT Forte → `#about` panel, work history →
   `#experience`, certifications → `#certifications`, contact details →
   `#contact`).
2. **Downloadable PDF** — replace `Rakesh_Vadnala_Resume.pdf` at the project
   root with your updated file, keeping the same filename (or update the two
   `href="Rakesh_Vadnala_Resume.pdf"` references in `index.html` if you
   rename it).
3. **Certification links** — see *Certification verification links* above.

### Wiring the contact form

The form validates input and shows a success state, but it doesn't send
anywhere yet — there's no backend in a static site. To make it functional,
either:

- Point the `<form>` at a form-backend service (e.g. Formspree, Getform) and
  let it submit natively, or
- Replace the `setTimeout` simulation in the `submit` handler inside
  `js/script.js` with a real `fetch()` call to your endpoint of choice.

---

## Deploying to GitHub Pages

1. Create a repository and push the contents of this `portfolio/` folder to
   the `main` branch (`index.html` should sit at the repository root, or in
   `/docs` if you prefer that layout).
2. In the repository, go to **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **Deploy from a branch**.
4. Select the `main` branch and the `/ (root)` folder (or `/docs`), then save.
5. GitHub publishes the site at `https://<username>.github.io/<repo>/` within
   a few minutes — no build step required, since this is plain static HTML/CSS/JS.

---

## Browser compatibility

Built on standard, widely-supported web platform features:

- CSS: custom properties, Grid, Flexbox, `backdrop-filter`, `color-mix()`.
- JS: `IntersectionObserver`, `requestAnimationFrame`, Clipboard API (with a
  `document.execCommand` fallback), `localStorage`.

Tested against current versions of Chrome, Edge, Firefox, and Safari. Older
browsers without `color-mix()` or `backdrop-filter` support will still render
correctly with slightly flatter surfaces (both are used for polish, not
layout-critical).

---

## License

Free to use, adapt, and deploy for personal or commercial purposes.
