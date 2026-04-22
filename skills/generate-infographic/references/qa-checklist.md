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
- the validator was skipped or failed without an explicit override token from the user

## First-Glance Quality Check

- Is the main idea understandable in about 3 seconds?
- Is one visual system clearly dominant?
- Is the page organized around one intentional structural move rather than scattered parts?
- Does the layout feel designed, not merely fitted?

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
