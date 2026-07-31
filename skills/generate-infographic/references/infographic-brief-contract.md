# Infographic Brief Contract

Canonical purpose:

- the internal structured brief used to drive infographic generation

Canonical format in version one:

- lightweight structured contract, not a heavy schema system

Minimum fields:

- `working_title`
- `target_audience`
- `core_message`
- `key_supporting_points`
- `concrete_specifics`
- `proof_points`
- `claim_guardrails`
- `visual_angle`
- `visual_registers`
- `micro_visuals`
- `source_attribution_requirements`
- `layout_profile`

Density and richness fields:

- `concrete_specifics` — for each entry in `key_supporting_points`, the actual
  options, mechanisms, examples, or consequences drawn from the source. A point
  with no specifics is a label, and an asset of labels fails the density floor in
  `linkedin-mobile-optimization.md`. If a point genuinely has no specifics in the
  source, say so explicitly rather than leaving it empty.
- `visual_registers` — the distinct visual modes the asset will use, named. Two
  minimum, three preferred. The same register repeated across a grid counts once;
  listing "three cards" is one register, not three.
- `micro_visuals` — what graphic token each content block carries and what it
  encodes. `"none"` for a block is a flag to reconsider, not a valid default.

These three exist so richness and density are agreed at the review gate rather
than discovered after a render. See `visual-richness-requirements.md`.

When a liked reference asset has been supplied, also include:

- `reference_devices` — devices extracted from it, and any device rejected for a
  failed precondition plus what replaced it. See `reference-benchmarking.md`.

Optional fields (present only when a template catalog exists in the tenant folder):

- `recommended_template` — template name and file from the catalog (e.g., "Data Pipeline — `DataPipeline_QuietAurora.html`")
- `template_rationale` — one line explaining why this template fits the content structure

Brief review rule:

- the derived brief must always be surfaced for user review before generation proceeds
- the user may approve it, request changes, or stop
- if required fields cannot be derived confidently, stop at brief review and surface the gaps clearly

Diagram type rule:

- `diagram_type` — the SVG diagram type from the catalog in `svg-content-diagram-rules.md` (e.g., `"pipeline"`, `"venn"`, `"quadrant"`), or `"none"` when the visual argument uses CSS-native layout (checklists, comparison tables, before/after splits)
- required for `single_idea_infographic` layout profile
- selected using the content-to-diagram heuristic in `svg-content-diagram-rules.md`
- value `"none"` is valid — it means the agent chose a CSS-native visual argument instead of an SVG diagram
- must be approved at brief review alongside the visual angle

Optional diagram field:

- `diagram_description` — one sentence describing the specific visual concept (e.g., "narrowing pipeline with 3 gate nodes filtering raw AI into trusted output")
- present when `diagram_type` is not `"none"`
- helps the agent commit to a specific composition before generating HTML

Layout profile rule:

- `layout_profile` must be explicitly chosen before generation
- allowed version-one values:
  - `single_idea_infographic`
  - `stat_poster`
