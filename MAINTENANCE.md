# NOVAWORK website

Static HTML, CSS and JavaScript. GitHub Pages deploys main / root to novawork.kr.

## Active design system (2026-10-05)

- `nw-studio.css`: shared responsive layout, page styles and optional CSS motion.
- `nw-motion.js`: native-scroll reveals, small parallax, card hover, mobile menu, filters with always-enabled motion. No route interception or smooth-scroll library.
- `nw-contact.js`: simple enquiry form with existing Google Apps Script contract, validated frame responses and truthful unconfirmed states. It does not automatically save personal data or clear edited inputs.
- `nw-visual-*.svg`: six original, script-free interface concept images. These are illustrative examples, never evidence of customer results.
- HTML pages load only the active files above. Old `css/` and `js/` files remain as an inactive rollback reference and must not be loaded alongside the new system.

Keep marketing copy focused on services and customer benefits. Do not reintroduce package prices, revision counts, delivery windows or numeric response promises. Scope the free example preview to web systems and data automation. Preserve service URL paths, business details, CNAME and the existing GTM container.

## Verification

Before publishing, check all HTML local references, fragment targets, unique IDs, one h1 per page, JSON-LD, SVG/XML syntax and JS syntax. Check mobile and desktop layout, menu focus and scroll restoration, filters, native FAQ disclosures, automatic logo playback, the three-line/N menu transition and contact validation.

The existing GAS server is outside this repository. Iframe navigation alone never confirms receipt. A matching source/origin/payload is required. If receipt cannot be confirmed, preserve the user's text and provide email/Kakao alternatives. Do not submit a real test enquiry or change the backend without authorization. No live enquiry was sent during the redesign.

Privacy policy text is retained; only the collected field inventory is reconciled with the shorter form. Native scrolling and navigation must remain functional without the animation script.

## 2026-10-05 interaction refinement

- `nw-logo-intro.js` and `nw-logo-intro.css` preserve the original 17-piece SVG logo assembly on the home page. Playback starts on page entry with no OS, storage or viewport preference gate and never locks scrolling.
- `nw-motion.js` owns the mobile backdrop, visual viewport sizing, focus and scroll restoration. Initial `pageshow` must not close an open menu.
- `nw-contact.js` accepts only explicit results from an allowed Apps Script origin inside the current request iframe tree; iframe load and timeout do not prove success.
- The footer uses a definition list for stable mobile business-information alignment.
- Service details explain use cases, deliverables and feature scope without transactional package terms.

## Always-on motion (2026-10-05)

Per the owner’s explicit request, animation preference controls and reduced-motion overrides are removed. The logo has no skip or replay button. Mobile navigation morphs between three horizontal bars and N, with opening/closing panel motion. Preserve race-safe rapid toggles and root-only scroll locking.

## Benefits and editorial refinement (2026-10-05)

The home page leads with free project previews. Scope this offer to web systems and data automation, and distinguish example screens from production data integration. Shared benefits are requirements/revision support, directly authored originals/settings, service-specific manuals and post-delivery support; do not add duration/count/price promises. Preserve professional, concrete copy across navigation, service details and enquiry states. Menu icon morph is 550 ms; panel opens in 450 ms and closes in 380 ms.

## Brand and portal preparation (2026-10-05)

The public website now introduces NOVAWORK as software development and IT solutions. Four broad capability groups organize the homepage; the six original detail URLs remain as implementation examples. Enquiries need not fit a service category. Free example previews remain prominent and scoped to web systems/data automation.

`nw-brand.css` adds the brand layout without replacing the logo assembly or menu scripts. At mobile widths the header prioritizes project consultation while the portal is pending. `portal.html` is a noindex preparation page with no login form, authentication redirect, or analytics. The customer portal backend is not yet connected or live. Do not replace this page with a working-login claim until real authentication, tenant isolation, and logout are verified.
