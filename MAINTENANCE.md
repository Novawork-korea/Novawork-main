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

`nw-brand.css` adds the brand layout without replacing the logo assembly or menu scripts. At mobile widths the header prioritizes project consultation; the customer portal remains available in the mobile menu.

## Customer workspace entry (2026-10-05)

`portal.html` is a noindex entry page with the existing marketing header and footer. It uses `location.replace` to send visitors to the fixed deployed origin `https://novawork-portal-test.novawork-korea.workers.dev/`, and provides a visible manual link when automatic navigation or JavaScript is unavailable. Its copy explicitly limits this setup to one test program. The destination is also defined in `build_brand_portal.py` so rebuilding preserves the connection.

The entry page contains no login form, authentication/session logic, credential storage, or GTM analytics. It does not accept redirect targets from URL parameters, fragments or storage, and does not forward those values to the portal. A no-referrer policy covers navigation to the portal. Login and remembered-session handling occur on the portal's own origin; an existing authorized session opens its assigned program there.

The core connection-release checks passed on 2026-10-05 against the deployed Worker and actual Supabase project: the owner-controlled test account logged in, created/renamed/completed a disposable task, confirmed persistence after refresh, and deleted that task. Three synthetic seed tasks remain. A new tab restored the remembered session automatically; logout in one tab immediately cleared the other tab's private UI. After logout, following the homepage link and navigating Back showed a fresh portal login form with no task controls. Both actual-project RLS and login-limiter SQL regressions also passed.

The fixed-address public entry is deployed and verified. Clicking **고객 포털** in the actual `novawork.kr` homepage header navigated through `novawork.kr/portal.html`, automatically opened exactly `https://novawork-portal-test.novawork-korea.workers.dev/`, and displayed the portal login screen. The entry was published in `Novawork-main` commit `87f0c548a295be83f75b41030fdd0f51c1fbaad3`. No physical mobile-device portal test or real contact-form/email submission is claimed. Keep the workspace limited to synthetic test data.

The public website and portal use separate deployments: public `Novawork-main` commits deploy automatically through GitHub Pages, while Worker releases are manual Cloudflare deployments. A GitHub Pages commit does not deploy the Worker. The Worker now uses supported manual upstream redirects and explicitly rejects every 3xx response rather than forwarding credentials to a redirect target.


## Editorial flow refinement (2026-10-13)

- `nw-editorial.css` loads last on every marketing page. It owns the neutral
  white/ink/gray palette, limited orange accent, open service rows, unboxed
  support content, and compact mobile portal entry. Do not load inactive CSS.
- Homepage capability illustrations are labelled, synthetic workflow examples.
  The original 17-piece logo assembly and menu behavior are retained.
- Workflow and project-process animations loop continuously in CSS with no
  replay control, no preference toggles, and no new runtime dependency, matching
  the owner's always-on motion request. Print output is static.
- Three relevant service details include the same explanatory flow language.
  No live integration, result, delivery status, or customer metrics are implied.
- Authentication, portal data, contact submission logic, existing business
  details, URLs and GTM are unchanged. Marketing changes deploy via Pages only.

## Production-story redesign (2026-10-13 candidate)

- `nw-unified.css` is the final shared stylesheet for all marketing pages. It
  owns the neutral paper/graphite/copper palette and common control colors.
  Customer portal `frontend/app.css` uses the same role tokens; portal auth
  scripts and data contracts are unchanged.
- Home loads `nw-home.css` after unified and `nw-home.js` for three larger
  assembly previews. Their 7.8-second cycles begin on first viewport entry,
  pause offscreen or when the document is hidden, and resume on return.
  Completed screens are the HTML baseline when animation is unavailable.
- About loads `nw-build-story.css` and `nw-build-story.js`. Three large native
  scroll stages assemble a website, a program and their connection. Progress
  follows measured chapter/pin/header geometry in both scroll directions.
  Short landscape uses normal document flow with entrance-linked assembly.
  Do not put overflow auto/hidden on ancestors of the sticky stages.
- Both home and About retain all original 17 logo paths and their order. The
  logo runs once for 2.8 seconds and holds; it is not part of scroll progress.
- No authored motion is disabled by OS reduced-motion settings, as explicitly
  requested. There are no new playback controls, scroll locks or dependencies.
- Demo UI and status text are illustrative examples. They are not delivered
  customer screens, live connections, or verified customer results.
- Candidate checks include syntax/reference validation, original-logo
  comparison, portal DOM regression and offline scroll-controller behavior.
  These checks do not replace browser rendering or physical-device testing.
  During the original 2026-10-13 preparation session, the GitHub browser
  runtime could not resume its protected credential state, so that session
  performed no actual browser rendering check, upload or production deployment.
  This is historical preparation context, not the status of later review runs.


## Candidate handoff review (2026-10-14 KST; production pending)

- Reviewed against main commit `f8b80d18d6bd41b553ee4692918b5f08b95b4368`.
  Latest source files were read through the GitHub browser UI; the attached
  23 marketing files were applied by path, not as a repository replacement.
- Real Chrome 154 rendering was checked in an isolated HTTPS preview with
  CSS viewports 360x640, 390x844, 820x900, 1440x900, 1440x480 and 820x360.
  About's website/program/connection stages were inspected before, during
  and after assembly using the original native-scroll controller. Fast reverse
  scrolling, intermediate refresh, menu navigation and Back restored the
  expected state. Low landscape uses ordinary vertical scrolling.
- Home's automatic logo start and completed 17-piece hold were observed.
  The visible demo runs while offscreen demos pause. Additional labelled
  WAAPI samples were used to inspect timed assembly frames; those samples
  are not proof of natural playback or a production playback control.
- Browser review corrected two CSS issues: the mobile About WORKSPACE label
  now stays on one line; home's decorative website planes use explicit depth
  separation so the copper front plane stays in front at tablet width.
- Static checks on 15 pages passed: 420 local references, 22 fragment targets,
  15 JSON-LD blocks, 10 SVG documents and five JavaScript syntax checks.
  Header/footer/GTM/contact markup and the original logo paths are preserved.
  nw-motion.js, nw-contact.js, CNAME, robots.txt and sitemap.xml are unchanged.
- Portal changes are maintained in its separate repository. Its current-base
  regression run passed 150 tests and built successfully. Preview login
  layout was checked at the same six sizes with synthetic health responses.
  No live account login, customer-data write or enquiry submission was made.
- WebKit, physical devices and native OS reduced-motion ON were unavailable
  in this browser environment and remain unverified. Source inspection
  confirms the new animations have no reduced-motion opt-out gate. The
  historical live checks above do not validate this candidate.
- The standalone design-preview HTML and the browser QA harness, synthetic
  APIs and preview-only routing are NOT production deployment files.
- Review-branch commits and draft PRs do not constitute production deployment.
  Main Pages (main/root) and the separate portal Worker require the owner's
  final confirmation and separate release records before production rollout.

## Full-page home sequence (2026-10-14; supersedes the assembly locations above)

- The owner corrected the scope after the cinematic release: use the whole
  page for one main-page assembly sequence, rather than repeated framed demos.
  `index.html`, `nw-home.css` and `nw-home.js` now own a single edge-to-edge
  sticky viewport beneath the live header. Structure, website content, workflow
  and connection are phases of this one continuous native-scroll composition.
- Reference direction: the scroll-driven exploded product/inner-system/diagram
  sequence described by Noomo at
  `https://noomoagency.com/insights/easy-way-to-implement-3d-in-web`, and Quo's
  fullscreen layered reveal at `https://atquo.com/work/apple-webflow`.
  These informed the staging; no reference asset or code is copied.
- No frame encloses the story, no timed assembly loop is used, and there is no
  scroll interception. Current section/header geometry determines progress on
  forward/reverse/fast scrolling, refresh and `pageshow`. Text remains in the
  document and a complete composition is the no-script baseline.
- Portrait mobile repositions the content vertically. During the pullback the
  website keeps a large headline while decorative art and controls leave the
  stage, creating room for the workflow below. Very short usable viewports
  use ordinary document flow with a completed composition instead of pinning
  unreadable content. The authored animation has no reduced-motion gate.
- The original 17-piece home logo retains its one-time 2.8-second entrance.
  About retains the same original paths as a static logo and is now an
  editorial company/process page. It no longer loads `nw-logo-intro.js` or
  `nw-build-story.js`. The old build controller is inactive rollback source.
- Demo content is illustrative. Native menu behavior, enquiry logic, existing
  metadata/GTM, business details, routes, header/footer and CNAME are retained.
- Initial source checks passed JS syntax, local references, unique IDs, one h1
  and exact logo path/order checks for the edited pages. Actual visual and
  deployment verification must refer to the new release record; earlier
  three-stage/browser checks above do not validate this replacement.
