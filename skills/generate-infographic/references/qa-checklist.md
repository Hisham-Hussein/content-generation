# QA Checklist

Every generated infographic must pass screenshot review by the agent before it is treated as complete.

Validator pass is required before render. QA does not replace validator enforcement.

Apply this checklist together with `../../references/shared-art-direction-principles.md`.

## Allowed Outcomes

- `pass`
- `revise-and-retry`
- `stop-and-escalate`

## Hard Reject Conditions

Reject before final output if any of these are true:

- any section overlaps another
- the footer or signature zone interferes with content
- important text is hard to read
- important text is too small for comfortable mobile reading
- important text uses the wrong contrast tier
- content is clipped, hidden, or pushed outside the intended frame
- the page reads like a compressed article or caption recap instead of a visual argument
- more than one dominant visual system is competing for attention
- there is no clear structural motif or the motif is decorative rather than useful
- structural motifs are overused to the point of clutter
- borders or cards visually collide or merge
- hierarchy is weak or confusing on first glance
- the layout feels crowded, muddy, or overloaded for a single-image infographic
- there are too many blocks or too much copy for a clean LinkedIn mobile asset
- the output looks generic, templated, or interchangeable with low-context social graphics
- branding, logos, CTA treatment, or proof annotations overpower the educational message
- safe padding is weak and the layout sits too close to edges
- the asset looks obviously wrong to a human reviewer within the first second of inspection
- the pre-render validator was skipped or failed without an explicit override token from the user
- the post-render bounds check was not run or failed (footer clipped, content overflowing canvas, sections touching with less than 12px gap)
- QA was declared based on a thumbnail or reduced-size preview instead of the full-size PNG or programmatic checks
- the infographic describes a process, framework, workflow, or data story but has no SVG content diagram and no CSS-native visual argument — it is a text document with a dark background
- the infographic has a visual element but it is small decoration rather than the dominant structural element carrying the argument
- the infographic could be fully understood by extracting only the text — the visual design adds no structural meaning
- SVG text labels overflow their enclosing containers
- SVG elements are clipped at viewBox boundaries
- SVG text labels are below the 22px font-size floor
- SVG shape fills use the 0.01-0.04 opacity range (invisible without backdrop-filter)
- large whitespace gaps exist between sections that could be used for larger, more readable content
- SVG text containers use hardcoded widths instead of getBBox auto-sizing (caught by post-render validator)

Note: `stat_poster` layout is exempt from the SVG diagram requirement — the hero number is the visual.

## First-Glance Quality Check

- Is the main idea understandable in about 3 seconds?
- Is one visual system clearly dominant?
- Is the page organized around one intentional structural move rather than scattered parts?
- Does the layout feel designed, not merely fitted?
- Does the SVG diagram (or CSS visual argument) carry the argument, or is it decorative?
- Could this infographic work as plain text? If yes, the visual design failed.

## Comparative Quality Check

- If the tenant provides approved examples, compare the output against them before passing QA.
- Reject the output if it is clearly weaker in readability, hierarchy, density control, or overall polish.
- If the tenant provides rejected examples or banned patterns, reject any output that drifts into them even if the render is technically clean.

## QA Loop Rule

- Playwright success does not mean the asset is acceptable.
- Validator success does not mean the asset is acceptable.
- A technically correct render can still fail QA if the composition is weak.
- A compositionally stronger revision is required when the current output is generic, muddy, or obviously below the tenant's approved-example quality floor.
- If the asset is fixable, revise the HTML and re-render.
- If the asset still fails after a small bounded number of attempts, stop and escalate instead of presenting it as accepted output.
