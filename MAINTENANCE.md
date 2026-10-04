# NOVAWORK website

Static HTML, CSS and JavaScript. GitHub Pages deploys main / root to novawork.kr.

## Active design system (2026-10-05)

- `nw-studio.css`: shared responsive layout, page styles and optional CSS motion.
- `nw-motion.js`: native-scroll reveals, small parallax, card hover, mobile menu, filters and motion preference. No route interception or smooth-scroll library.
- `nw-contact.js`: simple enquiry form with existing Google Apps Script contract, validated frame responses and truthful unconfirmed states. It does not automatically save personal data or clear edited inputs.
- `nw-visual-*.svg`: six original, script-free interface concept images. These are illustrative examples, never evidence of customer results.
- HTML pages load only the active files above. Old `css/` and `js/` files remain as an inactive rollback reference and must not be loaded alongside the new system.

Keep marketing copy focused on services and customer benefits. Do not reintroduce package prices, revision counts, delivery windows or numeric response promises. Scope the free example preview to web systems and data automation. Preserve service URL paths, business details, CNAME and the existing GTM container.

## Verification

Before publishing, check all HTML local references, fragment targets, unique IDs, one h1 per page, JSON-LD, SVG/XML syntax and JS syntax. Check mobile and desktop layout, menu focus and scroll restoration, filters, native FAQ disclosures, OS/visitor reduced motion and contact validation.

The existing GAS server is outside this repository. Iframe navigation alone never confirms receipt. A matching source/origin/payload is required. If receipt cannot be confirmed, preserve the user's text and provide email/Kakao alternatives. Do not submit a real test enquiry or change the backend without authorization. No live enquiry was sent during the redesign.

Privacy policy text is retained; only the collected field inventory is reconciled with the shorter form. Native scrolling and navigation must remain functional without the animation script.

## 2026-10-05 interaction refinement

- `nw-logo-intro.js` and `nw-logo-intro.css` preserve the original 17-piece SVG logo assembly on the home page. Playback waits until visible and never locks scrolling.
- `nw-motion.js` owns the mobile backdrop, visual viewport sizing, focus and scroll restoration. Initial `pageshow` must not close an open menu.
- `nw-contact.js` accepts only explicit results from an allowed Apps Script origin inside the current request iframe tree; iframe load and timeout do not prove success.
- The footer uses a definition list for stable mobile business-information alignment.
- Service details explain use cases, deliverables and feature scope without transactional package terms.
