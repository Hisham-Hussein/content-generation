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
- the asset is **boxes and connector lines only** — rectangles, arrows and labels with no other visual register
- every content block uses the same visual register (three headed text columns is one register, not three)
- one or more content blocks carry no micro-visual at all
- the diagram's structure asserts something other than `core_message` — most often by placing negative or optional material inside the flow
- the asset carries only the source's labels and none of its concrete specifics
- caption-native characters were transplanted into the artwork (`↳`, `✅`, `1️⃣`, emoji section markers)
- a URL, short link, or QR code is rendered into the image
- a third-party brand mark was hand-drawn in SVG instead of using the real logo asset
- an icon was hand-authored while the tenant's icon library ships that concept
- a device was borrowed from a reference without the precondition that makes it work
- the output's structure matches a supplied reference block-for-block
- corresponding elements across columns fail to share a baseline, or a final word is orphaned on its own line
- a sentence, headline, or label uses more than one colour, or any text carries a gradient
- a card uses a thick coloured border on one edge (the "side-tab" accent tell)

Note: `stat_poster` layout is exempt from the SVG diagram requirement — the hero number is the visual.

## What The Validators Cannot See

Both validators check geometry and declared values. Passing them says the asset is
well-formed, not that it is correct or good. These failure classes are invisible
to them and must be checked by eye every run:

| Blind spot | How to check |
|---|---|
| **Semantic direction** | Read the diagram aloud as a sentence, following its own arrows and adjacency. Does it state `core_message`, or its opposite? In a top-to-bottom or left-to-right layout, adjacency reads as causation — anything placed between two stages will be read as part of the flow |
| **Register variety** | Count distinct visual registers. One register repeated is one |
| **Density adequacy** | Could the asset be rebuilt from the source's headings alone? |
| **Sibling alignment** | Do corresponding elements across columns share a baseline? |
| **Real contrast** | Opacity is not contrast. A fully opaque colour can still be illegible on its backdrop |
| **Beauty** | No check substitutes for looking at it |

## Semantic Correctness

A diagram makes a claim through its structure. Verify the claim before verifying
the pixels:

- Trace every connector from origin to destination. What does each assert?
- Anything sitting inside a flow is *part of* that flow. Negative or optional
  material (failure modes, caveats, alternatives) must sit visibly **outside** the
  flow — below a full-width rule, in a separate band, or in a distinct register —
  or the layout will assert that failures produce the outcome.
- Confirm the reading order the layout imposes matches the argument's order.

## Alignment And Typography

- Corresponding elements across columns share a baseline. Variable-length blocks
  need an explicit minimum height, or the longest one pushes its neighbours out of
  alignment.
- Markers, nodes, or icons sit where their labels start: centred markers over
  left-aligned labels always read as misaligned.
- No orphans — a final word alone on its own line. Set the break explicitly.
- Repeated elements share their spacing rhythm.

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
