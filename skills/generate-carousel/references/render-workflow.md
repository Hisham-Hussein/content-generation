<overview>
Multi-slide render workflow for carousel production with Playwright. Covers environment preflight, per-slide rendering, PDF export, and asset bundling.
</overview>

<render_environment_preflight>

Before any render attempt, check for existing runtimes in this order:

1. **Existing Playwright module** — check known-good paths first:
   - `~/.nvm/versions/node/*/lib/node_modules/@playwright/cli/node_modules/playwright`
   - `./node_modules/playwright`
   - `~/.npm/_npx/*/node_modules/playwright`

2. **Existing Chromium binary** — check Playwright-managed cache:
   - `~/.cache/ms-playwright/chromium-*/chrome-linux64/chrome`
   - Use the latest numbered directory if multiple exist

3. **Fallback install** — only if both checks fail

Quick check commands:
```bash
find ~/.nvm -path "*/playwright/index.js" 2>/dev/null | head -3
find ~/.cache/ms-playwright -name "chrome" -type f 2>/dev/null | head -3
```

Prefer existing runtimes. "Not installed in the repo" does not mean "not installed on the machine."

</render_environment_preflight>

<html_assembly>

Assemble the carousel as a single HTML document:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>[Carousel Title]</title>
<!-- Lucide icons: include if any slide's visual direction uses icons -->
<script src="https://unpkg.com/lucide@0.460.0/dist/umd/lucide.min.js"></script>
<link rel="stylesheet" href="../../colors_and_type.css">
<link rel="stylesheet" href="../../colors_and_type_mobile.css">
<link rel="stylesheet" href="../../ui_kits/linkedin_carousel/carousel.css">
<style>
html,body{margin:0;overflow:hidden}
/* background color comes from the tenant's theme CSS — do not hardcode */
/* Any carousel-specific inline styles (e.g., .tech-label variants) */
</style>
</head>
<body>
<!-- One .infographic section per slide -->
<div class="infographic" id="slide-1">...</div>
<div class="infographic" id="slide-2">...</div>
...
</body>
</html>
```

Each slide section uses `class="infographic"` for the 80px safe padding. Content goes inside `.slide-content` or `.slide-content-center`.

**Note:** The brand kit README documents `<deck-stage>` with `<section>` elements for interactive browser preview. For Playwright rendering, we bypass `deck-stage` and use flat `.infographic` divs — the web component's navigation JS is unnecessary and complicates headless rendering. The prototype carousel uses this same flat-div approach.

**CSS relative paths:** The output goes in `<tenant-folder>/generated/<asset-slug>/`, which is two levels below the tenant root. So CSS and asset references use `../../` relative paths (e.g., `../../colors_and_type.css`, `../../ui_kits/linkedin_carousel/carousel.css`, `../../assets/[photo]`). Derive actual filenames from the brand kit README and assets directory.

</html_assembly>

<per_slide_render_loop>

Render each slide individually:

```javascript
const playwright = await import('[resolved-playwright-path]');

const browser = await playwright.chromium.launch({
  executablePath: '[resolved-chromium-path]',
  args: ['--no-sandbox']
});
const context = await browser.newContext({
  viewport: { width: 1080, height: 1350 },
  deviceScaleFactor: 2
});
const page = await context.newPage();

await page.goto('file://' + htmlPath, { waitUntil: 'networkidle' });
await page.waitForLoadState('load');
// Wait for fonts
await page.evaluate(() => document.fonts.ready);

for (let i = 1; i <= slideCount; i++) {
  // Scroll to slide or use clip region
  const slideEl = await page.$(`#slide-${i}`);
  await slideEl.screenshot({
    path: `slide-${String(i).padStart(2, '0')}.png`,
    type: 'png',
    scale: 'device'
  });
}

await browser.close();
```

- Device scale factor: 2 (for retina-quality PNGs)
- Wait for fonts before each screenshot
- Screenshot each slide element individually, not the full viewport

</per_slide_render_loop>

<post_render_validation>

After rendering all PNGs, run `scripts/validate-carousel-slides.mjs` against the HTML in a Playwright session:

- Evaluates DOM bounding rects for every slide
- Checks footer position, content overlap, SVG bounds, element overflow
- Returns structured pass/fail per slide with specific violation details

Hard fail and fix HTML if any check fails. Do not proceed to QA with a clipped layout.

</post_render_validation>

<pdf_export>

After all slides pass QA:

**Primary: Combine individual PNGs into PDF (img2pdf)**
Embeds verified PNGs directly — no re-rendering, no color reinterpretation. Always use this method.

```python
import img2pdf
slides = [f'slide-{str(i).zfill(2)}.png' for i in range(1, slide_count + 1)]
with open('carousel.pdf', 'wb') as f:
    f.write(img2pdf.convert(slides))
```

Install if needed: `pip install img2pdf`

Verify the PDF:
- Page count matches slide count
- Each page is 1080×1350 ratio
- Colors match the source PNGs exactly

**Fallback: Browser print-to-PDF**
Only if img2pdf is unavailable. WARNING: Chromium's print pipeline re-renders the HTML through a different color engine, which can shift colors (especially custom backgrounds and rgba fills). If used, visually compare the PDF against the PNGs and re-export with img2pdf if colors differ.

```javascript
await page.pdf({
  path: 'carousel.pdf',
  width: '1080px',
  height: '1350px',
  printBackground: true,
  margin: { top: 0, right: 0, bottom: 0, left: 0 }
});
```

</pdf_export>

<asset_bundle>

Write to `<tenant-folder>/generated/<asset-slug>/`:

```
<asset-slug>/
├── carousel.html          # Editable source
├── slide-01.png           # Individual slide PNGs
├── slide-02.png
├── ...
├── slide-NN.png
├── carousel.pdf           # Combined multi-page PDF
└── manifest.yaml          # Metadata
```

Manifest fields:
```yaml
title: [carousel title]
slide_count: [N]
dimensions: 1080x1350
theme: [tenant theme name from brand kit]
render_method: playwright-chromium
playwright_reused: true|false
chromium_reused: true|false
validation_result: pass
qa_result: pass
timestamp: [ISO 8601]
```

Remove any temporary or debug artifacts from the output folder.

</asset_bundle>
