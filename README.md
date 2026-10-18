# WildFrame

A curated prompt atlas for AI wildlife and artistic landscapes. Explore an image, understand its Prompt DNA, compare visual languages, and save your own remixes.

Live site: https://wildframe.vercel.app · Usability study: https://wildframe.vercel.app/try

## Run locally

```sh
python -m http.server 4173 --bind 127.0.0.1
```

Open http://127.0.0.1:4173. No framework, bundler or app dependency installation is required.

## Edit and build

Edit `source/index.template.html`, browser behavior in `source/*.js`, and curated records in `assets/`. Then:

```sh
python scripts/prepare-prompt-annotations.py
python scripts/assemble-wildframe.py
node scripts/build-static.cjs
```

`index.html` embeds the app CSS, scripts and data. `dist/` contains only allowlisted public pages and images. The Vercel build runs the Node-only static packaging step against the committed `index.html`; it does not need Python or third-party packages.

## Features

- 59 library recipes and 6 additional experiment recipes, all available on the 65-image globe; generated examples and reference studies are labelled separately.
- Optional first-remix guide with skip/back routes; completion follows a successful save.
- The globe follows actual mouse movement without holding a button, including on touch-capable computers. Reduced motion uses direct movement with no easing or inertia; overlays and view-lock pause rotation. Touch dragging remains available.
- Dwell previews identify the image under the cursor. Lock/reset controls and arrow-key/Enter navigation offer direct control of the globe; touch selection resolves the image at the actual contact point.
- The smaller globe fits between navigation and actions within one viewport. The home page has no vertical scroll; the library and editor keep their own scrolling areas.
- Search and filters stay below the header on every screen size. Active filter chips can be removed individually; closing a recipe restores the library position, focus and last-viewed highlight.
- Prompt DNA with exact-source reading notes and links to the relevant Studio field.
- Two visual studies, each with photography, oil-painting and ink-wash examples.
- Search, filters, saved collections, direct recipe links, clipboard fallback and JSON export.
- Named remix history, restoration, text comparison and legacy-data migration.
- A voluntary usability-study page at `/try`, with local JSON download and no automatic submission.

Saved data stays in each browser. Editing a prompt does not generate a new image. Localhost recipe links become externally accessible after deployment.

## Deployment

The root `vercel.json` selects the static build and `dist` output. Vercel's production URL is used for canonical and social-preview links. Deploy with the Vercel CLI or connect this repository for automatic deployments from `main`.

Source, QA artifacts, local credentials and backups are excluded from public output. The repository includes generated PNG sources, while hosting serves optimized WebP images and one existing PNG social preview.

## Verification

```sh
python scripts/validate-lab.py
node tests/lab-core.cjs
node tests/wildframe.cjs
node tests/wildframe-lab.cjs
node tests/wildframe-motion.cjs
node tests/wildframe-audit.cjs
node tests/wildframe-visuals.cjs
node tests/wildframe-journey.cjs
node tests/study-kit.cjs
node tests/sphere-follow.cjs
node tests/sphere-density.cjs
node tests/atlas-ux.cjs
node tests/viewport-fit.cjs
```

Browser checks currently reference the bundled Playwright runtime and Edge executable on the development Windows machine. Adjust those two paths if running elsewhere. `tests/deployment-smoke.cjs` accepts `TEST_BASE_URL` for the deployed origin. Automated study-form checks are not participant research results; see `USABILITY-TEST.md`.

## Sources

45 example images were made with the built-in ImageGen tool, including 18 new atlas scenes in photography, oil painting, ink wash and dreamscape styles. Exact prompts and original paths are recorded in `assets/*/manifest.json`. Reference-study prompts do not claim to be the original prompts behind the supplied reference images. Public source credits are available at `/credits`.

SpotlightCard and FadeContent are adapted from [React Bits](https://github.com/DavidHDev/react-bits); its MIT + Commons Clause terms are preserved in `THIRD_PARTY_NOTICES.md` and the generated HTML. No blanket license is asserted over third-party reference images.
