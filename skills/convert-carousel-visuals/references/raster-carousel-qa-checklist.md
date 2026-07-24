# Raster Carousel QA Checklist

Inspect every target at four levels and at full size.

## 1. Foundation

Hard fail when the foundation:

- Contains words, letters, numbers, statistics, logos, or readable UI.
- Uses a visual mechanism that does not map clearly to the slide's claim.
- Violates `visual-direction.yaml`.
- Places a critical subject inside the declared information region.
- Provides false negative space that contains meaningful content.

## 2. Flattened infographic

Hard fail when:

- An annotation hides, competes with, or visually merges with scene content.
- Exact text is missing, incorrect, too small, clipped, or low contrast.
- A required logo is unofficial, distorted, optically misaligned, or detached from its intended grouping.
- The final asset is not a single flattened raster.

## 3. Complete slide

Hard fail when:

- A required subject is cropped, hidden, or covered.
- A statistic, label, or explanatory message from the source is missing.
- Text is below the defined font floors, overflows, or lacks contrast.
- A text card intersects the scene region without verified negative space.
- The image is decorative but does not explain the slide.
- The source carousel changed.
- A target authored SVG, diagram fragment, or separate content overlay remains.
- Footer, page number, slide copy, or brand chrome is clipped.

## 4. Export

Hard fail when:

- A rendered slide predates its flattened infographic.
- The PDF predates any rendered slide.
- Slide count, dimensions, ordering, or PDF page count is incorrect.
- The PDF differs visually from the verified PNGs.

Verify programmatically: asset loading, single-raster ownership, SVG inventory, overlay inventory, declared asset paths, render freshness, source hash, artboard dimensions, PNG dimensions, and PDF page count.

Manual inspection remains mandatory for semantic fidelity, false negative space, optical logo centering, and subtle visual collisions.
