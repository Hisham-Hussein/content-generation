# Raster Carousel QA Checklist

Inspect every final slide at full size.

Hard fail when:

- A required subject is cropped, hidden, or covered.
- A statistic, label, or explanatory message from the source SVG is missing.
- Text is below the defined font floors, overflows, or lacks contrast.
- A text card intersects the scene region without verified negative space.
- The image is decorative but does not explain the slide.
- The source carousel changed.
- A target authored SVG remains or a runtime icon/logo was removed.
- Footer, page number, slide copy, or brand chrome is clipped.
- The rendered PNG or PDF is stale after a correction.

Verify programmatically: asset loading, region separation, text overflow, raster count, SVG inventory, artboard dimensions, footer gap, PNG dimensions, and PDF page count.
