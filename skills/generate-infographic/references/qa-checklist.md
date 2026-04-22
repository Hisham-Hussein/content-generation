# QA Checklist

Every generated infographic must pass screenshot review by the agent before it is treated as complete.

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
- structural motifs are overused to the point of clutter
- borders or cards visually collide or merge
- hierarchy is weak or confusing on first glance
- the layout feels crowded, muddy, or overloaded for a single-image infographic
- there are too many blocks or too much copy for a clean LinkedIn mobile asset
- branding, logos, CTA treatment, or proof annotations overpower the educational message
- safe padding is weak and the layout sits too close to edges
- the asset looks obviously wrong to a human reviewer within the first second of inspection

## QA Loop Rule

- Playwright success does not mean the asset is acceptable.
- A technically correct render can still fail QA if the composition is weak.
- If the asset is fixable, revise the HTML and re-render.
- If the asset still fails after a small bounded number of attempts, stop and escalate instead of presenting it as accepted output.
