# Shared Art-Direction Principles

These are plugin-level visual quality rules for content-generation skills.

They are tenant-agnostic. They do not replace tenant brand materials.

Use this reference for any visual workflow that generates branded marketing, educational, or authority assets from source content.

## Core Model

- Translate the post argument into a visual diagnostic, not a decorative recap of the full caption.
- One asset should carry one main job and one main argument. "One argument" bounds
  how many *separate claims* compete for the reader — it does not bound the evidence
  behind the claim you chose. Dense, fully-supported assets are what get saved and
  re-shared; sparse ones read as filler.
  (For carousels this applies per slide: one argument per slide, fully supported.)
- The HTML/CSS artboard is the editable design source.
- The PNG is the primary publishing asset.
- The PDF is a derivative export from the verified PNG.

## Structural Principles

- Choose one dominant visual system for the whole asset:
  - framework
  - comparison
  - workflow
  - system map
  - decision sheet
  - stat poster
- Choose one memorable structural motif only when it improves the message:
  - central gap
  - directional flow
  - stacked progression
  - radial system
  - annotated strip
- Do not mix multiple competing systems in one image.
- Bound supporting content by **legibility**, not by a fixed count: as much as holds
  at the type floor with real spacing and visible section boundaries. If the argument
  genuinely needs a second image to stay clear, the single-image composition is wrong
  — but "it looks full" is not that test.
- Proof should support the message, not take over the composition.

## Visual Argument Requirement

- Infographics that describe processes, frameworks, comparisons, workflows, or data stories must include a dominant visual element — either an SVG content diagram or a CSS-native visual argument (styled checklist, comparison layout, stat blocks).
- The visual element should carry the argument — text annotates it, not the other way around.
- A layout where the reader sees mostly text blocks with thin CSS lines or faint decorative effects as the only "visuals" is a hard reject — it is a styled document, not an infographic.
- The visual element should occupy a substantial portion of the vertical content area between the headline and footer.
- Text-only layouts are acceptable only for stat posters where a single hero number is the visual (`layout_profile: stat_poster`).
- Refer to skill-specific references for the diagram type catalog and selection heuristic.

## Composition Principles

- Build save-worthy structure, not a generic social card.
- Use strong hierarchy before decorative effects.
- Remove copy before shrinking type or lowering contrast.
- Keep cards, borders, and dividers selective. Blanket framing creates clutter fast.
- Tighten vertical rhythm deliberately. Good layouts feel composed, not merely fitted.
- Use whitespace as structure, not empty filler.
- Preserve explicit section boundaries so the eye can group the page instantly.

## Readability Principles

- Mobile scan speed outranks mood.
- Important text must read clearly without zooming.
- Dark editorial styling never justifies low-contrast reading copy.
- If the layout feels crowded, the answer is usually less copy, not smaller text.
- A visually premium asset is still a failure if the argument is hard to grasp in the first three seconds.

## Negative Patterns To Reject

- caption poured into a frame with no visual argument
- caption decoration instead of visual argument
- repeated bordered cards around every line item
- multiple competing motifs or metaphors
- generic robot imagery, hype visuals, or magic-wand AI symbolism
- decorative gradients or glow doing more work than hierarchy
- branding, CTA, or proof treatment overpowering the educational message
- technically correct but compositionally weak outputs

## Brand Boundary

- Tenant brand materials decide expression:
  - palette
  - tone
  - typography choices
  - motif flavor
  - trust signals
  - approved and rejected visual examples
- These shared principles define the quality floor, not the tenant look.

## Skill Obligations

- Every visual generation skill in this plugin should read this file before generating.
- If tenant approved examples exist, treat them as a quality floor.
- If tenant rejected examples exist, treat them as an active blacklist.
- If the render is technically valid but visually generic, crowded, muddy, or weak, revise it.
- Do not present an output as complete just because the renderer and validator succeeded.
