# Composition and Flattening

Use this ownership model:

```text
text-free scene foundation
          +
deterministic text, statistics, and official brand assets
          ↓
one flattened information-bearing PNG
          ↓
one content image inside the converted slide container
```

## Foundation ownership

The generated foundation owns scenery, people, objects, texture, lighting, and non-readable abstract marks. It does not own typography, statistics, brand marks, readable UI, or explanatory cards.

## Compositor ownership

The compositor owns:

- Exact statements, labels, and numbers.
- Information panels, pills, and dividers.
- Official logos and icons.
- Measurable alignment, spacing, and safe-region boundaries.

Declare logo anchors against the compositor artboard, not the final slide container. Preserve aspect ratio and use official assets. Verify geometric centering first, then optical centering at full size.

## Integration ownership

The carousel HTML owns the flattened PNG, slide copy, page number, theme chrome, and footer. It must not recreate content annotations or brand marks as separate positioned siblings of the flattened visual.

For each converted `.slide-viz`, allow exactly one content element with class `v2-raster-infographic`. Remove authored diagram markup, orphan labels, and content overlays. Runtime navigation or theme icons outside the converted visual remain untouched.

If the composition cannot be made safe without covering foundation content, change the layout or regenerate the foundation. Do not use opacity, blur, or a large panel to hide the conflict.
