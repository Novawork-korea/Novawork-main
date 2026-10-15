# NOVAWORK website

Static HTML, CSS and JavaScript. GitHub Pages deploys main / root to novawork.kr.
Node/Playwright dependencies are development-only security checks; the deployed
site still has no install/build step or runtime package dependency.

## Active design system (2026-10-05)

- `nw-studio.css`: shared responsive layout, page styles and optional CSS motion.
- `nw-motion.js`: native-scroll reveals, small parallax, card hover, mobile menu, filters with always-enabled motion. No route interception or smooth-scroll library.
- `nw-contact.js`: simple enquiry form with existing Google Apps Script contract, validated frame responses and truthful unconfirmed states. It does not automatically save personal data or clear edited inputs.
- `nw-visual-*.svg`: six original, script-free interface concept images. These are illustrative examples, never evidence of customer results.
- HTML pages load only the active files above. Old `css/` and `js/` files remain as an inactive rollback reference and must not be loaded alongside the new system.

Keep marketing copy focused on services and customer benefits. Do not reintroduce package prices, revision counts, delivery windows or numeric response promises. Scope the free example preview to web systems and data automation. Preserve service URL paths, business details, CNAME and the existing GTM container on marketing pages. Contact and portal pages intentionally exclude analytics; see the security maintenance section.

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

### Native-engine fixes, 2026-10-14

The homepage reserves the full native scroll section height from the initial HTML/CSS load. Scroll anchoring is disabled only inside the moving composition so reload/history restoration does not shift by the section expansion. Short desktop compositions use smaller internal example headings to keep body text clear of their button.

Mobile menu keyboard focus now uses preventScroll on every Tab step, preserving the underlying page position in Chromium and WebKit while retaining focus containment and Escape.

## Security maintenance (2026-10-14 review branch)

The source review covered all 15 HTML pages, active and inactive authored scripts,
local assets, deployment boundaries and the 85 fetched Git commits at base
`194eb60`. No active DOM XSS, arbitrary portal redirect, or credential-pattern
candidate was found. The history scan used common credential patterns across
567 text blobs; it does not prove that every possible secret is absent.

The public GA4 configuration observed on 2026-10-14 enables automatic detection
of email, phone and address data. This establishes a collection capability, not
evidence that visitor information was transmitted. `contact.html` now excludes
GTM entirely, and its CSP permits no analytics scripts or connections. This
intentionally removes analytics from the inquiry page, including form/conversion
events there. The existing GTM container and marketing click tracking remain on
the other 13 marketing pages. `portal.html` remains analytics-free. Do not restore
third-party analytics on the inquiry page without reviewing its data collection.

All pages have an early meta Content Security Policy, before script/resource
loads. It allows local assets, exact inline-script hashes, and the current
marketing GA/GTM destinations where applicable. It denies unapproved inline
scripts, event handlers, eval, plugins and base elements. Only the contact page
may submit forms, to the existing Apps Script deployment and its Google response
redirect host. No `unsafe-inline` or `unsafe-eval` exception is used. CSSOM style
updates used by the existing animations remain supported. New GTM tags may need
reviewed source permissions; do not solve a blocked tag by broadly allowing all
HTTPS hosts or inline/eval execution.

`scripts/security_policy.py` is the policy source. After changing an inline
script, JSON-LD, or policy rules, run `npm run security:write`, review the hashes
and allowed hosts, and run the checks below. GitHub Pages serves the checked-in
HTML directly; it does not run this script during deployment.

Contact and portal use `no-referrer`; other pages explicitly use
`strict-origin-when-cross-origin`. Contact responses run in an iframe sandbox
with only forms, scripts and same-origin identity enabled. Popups and top-level
navigation are blocked while the existing origin AND current-frame-tree checks
remain required for success. Only declared service aliases can prefill the
optional context; prototype property names cannot populate it. Existing disabled
no-script submission, consent validation, PII draft cleanup, duplicate protection,
and truthful unconfirmed states are retained.

Local/CI checks:

```sh
npm ci --ignore-scripts
npm test
npx playwright install chromium
npm run test:browser
```

`CHROMIUM_PATH` may select an existing Chromium binary for local browser checks.
Browser requests to outside services are intercepted and fulfilled locally or
blocked, with a deny-only local proxy preventing unmocked traffic. Contact tests
use synthetic data: one check verifies that Chromium permits the expected 302
destination under CSP, then blocks that request at the proxy; separate checks
fulfill a nested Google response locally. This split is necessary because
Playwright does not reroute later requests in an HTTP redirect chain. It does
not verify a live GAS redirect/receipt end to end. The workflow runs
these checks with read-only repository permissions and commit-pinned actions.
It does not deploy the site. Enabling a required status check is a separate
repository administration change.

Review-branch verification passed 12 static/policy tests, 11 contact state/trust
tests and 8 Chromium browser groups (Chromium 154 / Playwright 1.64). These include
all 15 pages, menu focus/scroll, the 17-piece logo and native scroll composition,
FAQ, fixed portal navigation, CSP rejection probes, contact sandbox and response
trust, preserved edits and timeouts. Cached copies of the current public GTM/GA
scripts also ran without CSP violations while all collection requests were
intercepted locally. `npm audit` reported zero dependency advisories at review.
These results do not establish live delivery, physical-device behavior or a
complete audit of external services.

Remaining boundaries and follow-up:

- The Apps Script server is outside this repository. Its recipient selection,
  input/consent validation, quotas/rate limiting, spreadsheet formula handling,
  storage access and retention still need a server-side audit. Browser controls
  cannot stop direct HTTP clients. `recipient_email` and other hidden fields
  must never be trusted by that server. A live end-to-end receipt is unverified.
- Portal authentication/data controls belong to the separate portal repository
  and were not audited as part of this main-site change.
- Observed production Pages responses lacked CSP, HSTS, nosniff, frame protection
  and Permissions-Policy headers. The new meta policy works in the document but
  cannot enforce `frame-ancestors`, HSTS, nosniff or Permissions-Policy. Applying
  those needs a hosting/proxy response-header change; a Pages `_headers` file or
  a meta `frame-ancestors` directive would not implement it. HTTP-to-HTTPS redirect
  was already working. No claim of clickjacking protection is made here.
- At review time, main had no branch protection, required checks or rulesets.
  Require the new security checks and a review before merging when configuring
  deployment governance. No administration settings were changed in this branch.
- Inactive `js/` rollback code has weaker response checks and inquiry draft
  storage. It is not loaded by any page. Automated script inventory checks guard
  this boundary; restoring it requires a new security review. Vendored GSAP and
  ScrollTrigger are also inactive, with no current production loading path.

This review branch and its PR do not change production. The existing owner
confirmation requirement for a main/Pages rollout still applies.
## Subpage content and consultation context (2026-10-14)

The approved follow-up changes `portfolio.html`, `services.html`, and `about.html` with the scoped `nw-subpages.css`. The home assembly sequence and portal application are not changed. The About logo retains all 17 original SVG paths, in order, as a static mark.

- Portfolio separates the delivered PC Chrome/Google Sheets program, the in-house portal test environment, and two design studies. Illustrations are reconstructed with example data, not customer screenshots. Preserve the execution conditions and unverified integration notes.
- Process explains preparation and five stages, with visitor actions and tangible review outcomes. Cost, schedule, revisions and support remain subject to agreed scope; do not add package/price or numeric delivery guarantees.
- About introduces the studio's work and three design/verification/handover principles. It does not duplicate the five-stage process or add assembly animations.
- Case consultation URLs use `contact.html?case=naver-rank|customer-portal|order-demo|inflow-demo`. `nw-contact.js` maps only those allowlisted slugs into an empty optional context field. Existing/restored input wins; an allowlisted legacy service value takes precedence over a case. `intent=preview` can coexist. The existing Apps Script action and field contract are unchanged. No customer message text is inserted and no query string is recorded in tracking fields.
- Keep the contact/portal analytics exclusion, early CSP, strict origin/frame response checks, sandbox attributes and referrer policies added by the security review.

`npm test` includes the case-context allowlist, restored-value priority and existing form field-contract checks. `npm run test:subpages` checks Chromium and WebKit at 360×640, 390×844, 820×900, 1440×900, 1440×480 and 820×360, including reduced motion at 390px, document/text overflow, normal scrolling, menus, FAQ, reload, case-link navigation/back, and local form validation. These browser checks block external form/API requests; they do not prove live enquiry delivery or email receipt. The security workflow runs both the original browser security suite and the subpage suite.

## Page motion and home entry response (2026-10-15)

The homepage introduction now scrolls in normal document flow. The single full-page assembly begins while the stage enters, before sticky positioning, with a shorter 4.5-viewport desktop / 4-viewport portrait section. Initial geometry remains reserved before deferred setup. Original logo assembly, short-height fallback, native reverse scroll and history restoration are preserved.

`nw-page-motion.js` runs only on portfolio, services and about. Portfolio uses four labelled illustrative flows, each playing once and retaining its final state; hidden tabs pause playback, and fast scrolling past a scene completes it. Process uses an ordinary-flow five-step list with a changing desktop document illustration and inline portrait illustrations. About retains its original static 17-piece logo and uses typography and native-scroll principle emphasis. No wheel/touch interception, reduced-motion gate, new runtime dependency, live data request or form behavior is introduced.

The browser suite adds actual native wheel input at the home pin entrance, on-stage part visibility, reverse scroll, illustrative final states, process reverse navigation and principle emphasis in Chromium/WebKit with reduced motion enabled. Reload position restoration is calibrated against a static document without application JavaScript: the CI WebKit build also discarded its position on that control. Where the engine supports native reload restoration, exact position is asserted; all engines check reserved document height and responsive native scrolling after reload. Logs explicitly report this limitation rather than claiming WebKit position restoration. These are desktop engines at CSS viewports, not physical-device evidence. Production verification is recorded separately after merge and Pages deployment.

## Cinematic case studies and studio (2026-10-15 follow-up)

`nw-cinematic.css` and `nw-cinematic.js` are loaded only by portfolio and about.
Services continues to use the unchanged `nw-page-motion.js` and its existing layout.
The homepage, shared navigation, contact handling and portal application are unchanged.

Portfolio's four explicitly labelled illustrations move complete input/result windows
across a large stage, then retain their result. On portrait widths, movement and final
layout are vertical. Playback pauses outside the viewport and in hidden documents;
fast scrolling beyond a case completes it. The static HTML/CSS baseline exposes all
content without JavaScript. There are no live API calls or interactive fake submits.

About moves the original, complete 17-path logo as one mark. Native scroll changes
perspective, focus and handover views of one complete program illustration. The
three editorial principles remain normal-flow content. At widths up to 900px or
heights up to 700px, inline illustrations replace the desktop sticky stage. No
scroll interception, assembly, reduced-motion gate or new runtime dependency is added.

The browser checks now distinguish deliberately clipped animation planes from
actual page overflow, and assert that final panels fit their stage, do not overlap,
and do not clip text. Natural timed progression and reversible studio transforms
are checked in Chromium/WebKit at the existing six viewports. This release's actual
results are recorded only after the candidate workflow and production verification.
