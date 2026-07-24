# Visual Direction Contract

Create `visual-direction.yaml` before generating foundations. This file records project-specific taste so the skill can remain general.

```yaml
visual_goal: "Clear, authoritative, and visually cohesive"
audience: "Professional social-media readers"
approved_references:
  - source: "path or slide identifier"
    qualities: ["restrained palette", "editorial texture", "clear hierarchy"]
prohibited_treatments:
  - treatment: "project-specific rejected pattern"
    reason: "why it conflicts with the intended direction"
style_families:
  - name: "editorial illustration"
    use_when: "explaining systems, causality, or abstraction"
    references: ["path or slide identifier"]
  - name: "conceptual photography"
    use_when: "human scale or physical realism materially improves comprehension"
    references: ["path or slide identifier"]
treatment_budgets:
  - treatment: "any visually dominant treatment"
    maximum_slides: 2
brand_asset_policy: "official assets, compositor-owned, flattened"
generated_text_policy: "forbidden"
```

Select budgets according to the project rather than imposing universal aesthetic quotas. Use them to prevent accidental repetition and style drift.

When feedback changes the direction, update this file before regenerating more slides. Record the transferable visual quality, not only the identity of the accepted or rejected slide.

Use no more style families than the deck can support coherently. Each slide's conversion brief names its family and explains why that family fits the claim.
