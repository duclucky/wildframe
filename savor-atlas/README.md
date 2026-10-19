# Savor Atlas

An English-language cooking website, built independently inside WildFrame’s `savor-atlas` child folder. No framework or bundler is required.

- The home globe keeps WildFrame’s mouse-follow rotation and easing, with 60 cards from 12 dishes representing 12 countries.
- The globe is decorative: hovering and clicking dishes do not show details or open recipes. Use Explore recipes to enter the collection.
- The kitchen retains the supplied Savor Atlas rotating table, staggered recipe carousel, flying plate, spinning transition and reverse close animation.
- The kitchen collection fits one viewport with a responsive table, dish summary and recipe picker. Only the full recipe dialog has a scrolling reading area.
- Choose 1, 2 or 4 servings, check off ingredients and follow the cooking steps. There is no ordering or image-generation flow.
- Links such as `#dish=chicken-pho` open a specific recipe. Returning to the globe preserves the camera angle.
- Effects follow the system motion preference by default. The globe’s options menu offers an explicit per-site override that persists and synchronizes between both views. The kitchen has no top header; its footer provides a return to the globe. The user’s preview has effects enabled.

After editing `source/recipes.json` or the source templates, run:

```powershell
python scripts/assemble.py
python -m http.server 4174 --bind 127.0.0.1
```

Open `http://127.0.0.1:4174`. Serve over HTTP rather than opening with `file://`; the globe and kitchen communicate through origin-checked messages.

Build the public output for separate deployment:

```powershell
node scripts/build-static.cjs
```

Set the hosting project’s Root Directory to `savor-atlas`. The parent WildFrame deployment remains unchanged. The build publishes only the current recipe images and explicitly selected public assets, excluding source, QA, tests and credentials.

The table interface, furniture texture, original ingredient atlas, icons and fonts originate in the user-supplied, audited ZIP. The 12 international dish photographs and a supplementary 20-cell ingredient atlas were created with built-in ImageGen; final images and globe thumbnails are saved in `assets/cooking/`. All 32 featured ingredient catalog entries have illustrations; the supplementary atlas also corrects lime and sesame imagery. Exact generation prompts, sprite cell order and output filenames are recorded in [source/artwork-prompts.json](source/artwork-prompts.json). Images are illustrative.

Recipes are practical home-kitchen adaptations written for this prototype, not a collection of kitchen-tested original recipes. Timings depend on equipment, thickness and batch size; increasing servings does not automatically increase cooking time. Food-safety notes link to [USDA FSIS](https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/safe-temperature-chart) and [FDA egg guidance](https://www.fda.gov/food/buy-store-serve-safe-food/what-you-need-know-about-egg-safety). The Be Vietnam Pro license is retained at `assets/cooking/fonts/BeVietnamPro-OFL.txt`.

Globe thumbnails preserve the entire plate and the original alpha transparency inside a 480×320 frame. Globe tiles have no rectangular background, border or shading overlay; depth is expressed through the plate image’s opacity. Rebuild thumbnails with `node scripts/build-thumbnails.cjs` when dish images change; that local image utility uses this workstation’s bundled Sharp. Production serves the prepared WebP files directly and shares each thumbnail across repeated globe tiles, with no runtime canvas conversion.

Local verification uses `tests/cooking-flow.cjs`, `tests/sphere-and-layout.cjs`, `tests/motion-preference.cjs`, `tests/world-recipes.cjs`, `tests/mobile-ux.cjs` and `tests/kitchen-fit.cjs`. The test scripts reference this workstation’s bundled Playwright and Edge installation; production requires neither.
