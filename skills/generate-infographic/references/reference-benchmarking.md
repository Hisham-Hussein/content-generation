# Reference Benchmarking

Use when someone supplies an asset they like and asks for something of that
quality — "make it like this one," "look at this example," a link to a published
infographic.

The instinct is to reproduce the reference's layout with new text. That is the
wrong move and it is obvious to the person who supplied it: they know their own
content does not have the same shape, and a cloned layout with swapped words reads
as a template, not a design.

---

## A. Extract Devices, Not Layout

A **device** is a transferable technique. A **layout** is one arrangement of one
piece of content.

| Transferable (devices) | Not transferable (layout) |
|---|---|
| register variety — how many distinct visual modes | which register sits where |
| micro-artwork inside content blocks | the specific chart type used |
| an anchor band interrupting the field | that the band is at the top |
| icons in tinted containers | those particular icons |
| a ghost word in negative space | that the word is cropped right |
| scale contrast between hero and label | that the hero is a percentage |
| an annotation pointing at a gap | that the annotation says "THE GAP" |

Write the device list down before building. If the list reads like a description
of the reference's *content*, extract again — it is not devices yet.

## B. The Precondition Test

For every device on the list, ask what the reference's **source material** supplied
that made the device possible, then check whether the current source supplies it.

The most common mismatch: **the reference is data-rich and the current source has
no numbers.** Bars, slope charts, hero numerals and headroom brackets all encode
quantity. Against a source with no measurements, every one of them is unavailable.
Fabricating numbers to make the device work violates the brief's claim guardrails
and is never the answer.

When a device fails its precondition, **substitute an equivalent that the source
can support** — usually by encoding *state* rather than *quantity* (see
`visual-richness-requirements.md` § B). The goal is to match the reference's
richness, not its instruments.

## C. Brand Boundary

A supplied reference may be off-brand — a different typeface, a different palette,
a competitor's or publication's house style. Decide explicitly which layer is being
adopted:

- **the structural device** — usually safe and usually the point
- **the visual identity** (typeface, palette, weight) — usually not, because it
  overrides the tenant's brand materials

State the split before building. Adopting a reference's serif display face or its
signature colour because it looked good in the reference is how a tenant's asset
stops looking like the tenant's.

If the reference is a previously generated asset for the same tenant, it is still
only a quality bar. It is not a template, and it is not the tenant's brand
specification — the tenant's brand materials are.

## D. Record It

In the manifest, record: the reference used, the devices extracted, any device
rejected for a failed precondition and what replaced it, and any part of the
reference's identity deliberately not adopted.

This makes the next run's benchmarking reviewable rather than re-argued.

## E. Hard Rejects

- the output's structure matches the reference block-for-block
- a device was carried over whose precondition the source does not meet
- numbers were invented so a quantity device could be used
- the reference's typeface or palette silently overrode the tenant's brand
