# Conversion Brief Contract

Use one entry per target slide. Store project-wide aesthetic decisions in `visual-direction.yaml`, not in this per-slide brief.

```yaml
slide: 2
source_svg: "#slide-2 .slide-viz > svg"
semantic_claim: "The revised workflow reduced manual intervention while improving completion."
facts:
  - "Manual intervention fell from 5.4 to 3.3 events per session"
  - "Completion doubled on the hardest tasks"
visual_mechanism: "A monitored route becomes more autonomous while reaching more successful outcomes."
element_mapping:
  - element: "human checkpoint"
    meaning: "manual intervention"
  - element: "completed route"
    meaning: "successful task completion"
analogy_rationale: "The route directly represents workflow progress; checkpoint frequency and successful arrival represent the two measured outcomes."
misreading_risks:
  - "A generic road scene could imply speed instead of autonomy."
critical_subjects:
  - "human monitor"
  - "active workflow route"
  - "successful destination"
style_family: "project-approved editorial illustration"
layout: right
scene_region: "left 62%"
information_region: "right 38%"
negative_space_proof: "right 38% contains only uninterrupted wall"
brand_assets: []
generated_text_policy: "forbidden"
final_asset: "images/slide-02-infographic.png"
rendered_slide: "slide-02.png"
```

`layout` is one of `top`, `bottom`, `left`, `right`, or `negative-space`.

List every exact fact and label that a reader must retain. `critical_subjects` are prompt invariants and visual-QA requirements. `element_mapping` must account for every major object introduced by the visual mechanism. If the mapping is weak, revise the concept before generating.

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
      "foundation_asset": "images/foundations/slide-02.png",
      "final_asset": "images/slide-02-infographic.png",
      "rendered_slide": "slide-02.png"
    }
  ],
  "pdf": "carousel.pdf"
}
```
