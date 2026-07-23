# Conversion Brief Contract

Use one entry per slide that contains an authored content SVG.

```yaml
slide: 2
source_svg: "#slide-2 .slide-viz > svg"
message: "Success rose while human step-ins fell."
facts:
  - "5.4 to 3.3 human step-ins per session"
  - "2x success on hardest tasks"
critical_subjects:
  - "human monitor"
  - "AI agent on the active path"
scene: "A widening illuminated path where the human can observe without blocking progress."
layout: right
scene_region: "left 62%"
information_region: "right 38%"
negative_space: "none"
generated_text: false
final_asset: "images/slide-02-infographic.png"
```

`layout` is one of `top`, `bottom`, `left`, `right`, or `negative-space`.

List every exact fact and label that a reader must retain. `critical_subjects` are prompt invariants and visual-QA requirements, not optional decoration.

After approval and composition, add every converted slide to the variant's
`conversion-manifest.json`. The validator uses this as its explicit completion
contract:

```json
{
  "source_carousel": "/absolute/path/to/carousel.html",
  "source_sha256": "...",
  "variant_carousel": "/absolute/path/to/carousel-v2/carousel.html",
  "targets": [
    {
      "slide_id": "slide-2",
      "final_asset": "images/slide-02-infographic.png"
    }
  ]
}
```
