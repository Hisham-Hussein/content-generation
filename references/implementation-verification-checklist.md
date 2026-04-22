# Implementation Verification Checklist

Use this after changing shared visual guidance or the `generate-infographic` skill.

Implementation is not complete until every check below passes.

## 1. Boundary Correctness

- Shared art-direction rules live at plugin level.
- Infographic-specific workflow rules live in `skills/generate-infographic/`.
- Tenant expression rules remain in tenant materials, not in the plugin.
- No tenant-specific palette, persona, or footer behavior leaked into shared plugin guidance.

## 2. Shared Art-Direction Coverage

- The shared plugin guidance explicitly covers:
  - visual diagnostic, not caption decoration
  - one dominant visual system
  - one memorable structural motif
  - selective cards, borders, and dividers
  - reduce copy before shrinking type
  - strong hierarchy and scanability
  - technically valid but compositionally weak outputs must be revised
- The guidance is written as workflow-driving instructions, not buried historical notes.

## 3. Generate-Infographic Skill Wiring

- `skills/generate-infographic/SKILL.md` explicitly reads the shared plugin guidance before generation.
- The skill still reads tenant brand materials directly.
- The skill still requires brief review before generation.
- The skill explicitly rejects the following even after successful render:
  - crowded layouts
  - muddy grouping
  - compressed-article behavior
  - generic template feel
  - weak first-glance hierarchy

## 4. Runtime QA Strength

- The infographic QA checklist covers:
  - mobile readability
  - composition quality
  - structural clarity
  - decorative overuse
  - branding-vs-teaching balance
  - comparison against approved tenant examples when available
- The QA checklist is stricter after the change, not weaker.
- The validator still acts as a hard gate for numeric mobile rules.

## 5. Local Baseline Parity Review

When working alongside the paired `content-engine` repo, compare the standalone plugin against the current local quality baseline:

- `/home/hisham/ai-agency/content-engine/artifacts/generated/isemantics-infographics/INFOGRAPHIC_GENERATION_LEARNINGS.md`
- `/home/hisham/ai-agency/content-engine/config/tenant-brands/hisham-personal/README.md`
- `/home/hisham/ai-agency/content-engine/config/tenant-brands/hisham-personal/SKILL.md`
- `/home/hisham/ai-agency/content-engine/config/tenant-brands/hisham-personal/references/mobile-linkedin-rules.md`
- `/home/hisham/ai-agency/content-engine/config/tenant-brands/hisham-personal/references/qa-checklist.md`

Pass only if the standalone plugin now captures the generic quality lessons from those sources without absorbing Hisham-specific brand expression into shared plugin guidance.

## 6. Golden-Run Verification

Run at least two end-to-end infographic generations through the standalone plugin:

- one Hisham case using real tenant materials
- one second case with a meaningfully different structure

For each run, verify:

- brief quality
- brand intake correctness
- mobile readability
- composition quality
- PNG fidelity
- PDF-from-PNG fidelity
- manifest completeness

Do not call the implementation complete if the generated outputs are visibly weaker than the previous local workflow baseline.

## 7. Regression Checks

- No contradiction remains between artboard rules and render settings.
- No contradiction remains between shared plugin guidance and skill-specific workflow.
- No contradiction remains between plugin guidance and tenant-local brand guidance.
- Existing validator tests still pass.

## 8. Final Human Review

- The updated standalone plugin would guide a fresh agent toward outputs that are at least as intentional, readable, and visually disciplined as the local best-practice workflow.
- Another agent with no prior context could find the right files and follow the intended quality bar.
- The plugin now reduces quality drift instead of merely documenting process steps.
