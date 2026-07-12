# NOVAWORK maintenance guide

This repository is a static HTML/CSS/JavaScript site deployed from GitHub.
No build step is required.

## Stylesheets

Every page loads `css/site.css`. Its imports are deliberately ordered:

1. `01-foundation.css` - reset, design tokens, base layout and shared components
2. `03-content.css` - page, service, contact and responsive content rules
3. `04-visual.css` - visual system and mobile composition
4. `05-interactions.css` - menu, reveal and stabilization rules
5. `06-conversion.css` - trust, form and contact refinements
6. `02-hero.css` - maintained home logo hero overrides
7. `07-home-redesign.css` - motion-led home sections and responsive layouts
8. `08-subpage-redesign.css` - shared visual system for every non-home page

Do not add numbered version-patch files. Place a rule in the closest maintained
layer and keep page-specific selectors scoped by the page body class.

The route-transition curtain remains separate in `css/critical` so it can run
before the main stylesheet is available.

## JavaScript

- `js/boot/` contains only scripts that must run from the document head.
- `js/modules/core-ui.js` owns navigation, tracking, floating actions and detail accordions.
- `js/modules/page-interactions.js` owns page reveals and FAQ controls.
- `js/modules/home-motion.js` owns the home SVG intro and scroll-linked motion.
- `js/modules/subpage-motion.js` owns non-home page reveals, parallax and page progress.
- `js/modules/inquiry-form.js` owns contact-form validation and submission.
- `js/vendor/` contains the locally served GSAP and ScrollTrigger runtime used by the home and redesigned subpages.

Scrolling is native browser scrolling. Do not add wheel-event smoothing or a
second home reveal system; extend `home-motion.js` instead.

Every redesigned non-home page carries the `nw-subpage-v2` body class. Keep
new subpage rules scoped to that class so the home composition stays isolated.

Motion is enabled on both pointer and touch devices without CPU, memory or
data-saver cutoffs. `prefers-reduced-motion` uses a short fade profile and
removes only large scroll-linked movement such as parallax; it does not switch
the site to a fully static presentation.

Keep each behavior in one module. Do not create a second implementation as a
temporary patch; update the owning module instead.

## Safe-change checklist

Before deployment, verify:

- JavaScript syntax for every file
- local CSS, JavaScript, image and page references
- the home SVG hero and all seven home sections
- reduced-motion and low-power fallbacks
- mobile menu open/close and body-scroll restoration
- internal page transitions
- service-detail accordions
- FAQ search and category controls
- inquiry-form validation and Google Apps Script submission
- desktop and mobile layouts, including horizontal overflow
- JSON-LD and sitemap integrity
