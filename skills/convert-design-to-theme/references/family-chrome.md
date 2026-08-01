# Family Chrome

The elements that make unrelated themes read as one system. A source design file will never contain them — they belong to the tenant, not the brand being converted.

Work through this list explicitly. Each item states what it is, why it exists, and how to adapt it to a new source without losing either side.

---

## 1. The tag pill

**What:** a small category chip, **first child of the canvas, top-left**, sitting above the headline.

**Why it matters most:** it is the only element that appears in the same *position* in every theme. A viewer scrolling a feed sees the same opening gesture whether the asset is black, white, or coral. Palette variation is what makes themes different; the pill is what keeps them related.

**How to adapt:** keep the shape and the position; take the colour, fill, and type from the source.

- Outline-on-light source → white fill, source's hairline colour, source's muted text
- Monochrome source with filled buttons → filled black, inverse text
- Source with a mono/label typeface → set the pill in it, uppercase, with the source's tracking

**Common conflict:** a source that reserves pill radius for one sub-system (Airtable does this for pricing). Keep the pill anyway and log the deviation. The alternative — a square tag — breaks the one gesture that ties the family together, and the source's rule was written about its own website, not about the tenant's feed.

**Watch for:** in a column-flex canvas, `display: inline-block` is not enough. `align-items: stretch` will pull the pill to full width. Add `align-self: flex-start`.

---

## 2. Background watermark type

**What:** an oversized ghost word or numeral behind the content, typically 2–5% opacity, often bleeding off an edge.

**Why:** it gives the canvas a printed, composed feel and fills negative space that would otherwise read as an unfinished layout.

**How to adapt:** set it in the source's display face at its display weight, in the source's ink colour at low alpha. Pick a word or numeral the content earns — a count ("3" for three decisions), the topic, the brand of the theme in a specimen.

**Precondition:** genuine negative space. Behind dense text it reads as smudge. If the layout is full, skip it and say so.

**Implementation that avoids a false failure:** decorative type is not content. Put the glyph in a CSS pseudo-element and mark the container `aria-hidden`:

```css
.big-type::before { content: attr(data-word); }
```
```html
<div class="big-type" data-word="3" aria-hidden="true" style="font-size:340px;top:56px;right:-18px"></div>
```

A 4% ghost numeral will fail any contrast check that treats it as text — correctly, since it *is* illegible. Moving it to the presentation layer is the honest fix: screen readers stop announcing a meaningless glyph, and the checker stops testing decoration as if it were copy. Do not reach for an override token for this.

---

## 3. The body field

**What:** the surface *around* the artboard, visible when the HTML is opened in a browser. It never appears in the export.

**Why:** it's how the asset looks while you're working on it. An arbitrary grey makes a light theme look muddy during authoring and leads to wrong colour decisions.

**How to adapt:** take a real token from the source — its soft-surface or subtle-grey role. Light themes want something a shade off the canvas so the artboard edge is visible.

---

## 4. The author footer

**What:** the tenant's dual signature — author photo, name, role on the left; brand mark and domain on the right; separated from the body by a hairline.

**Why:** attribution and recognition. It's the tenant's identity, not the source brand's, so its *structure* never changes across themes.

**How to adapt:** only the styling. Hairline colour, type face, weight, and colour come from the source. If the source bans a muted text tier, set the role line in the source's alternative — a mono face, or a lighter weight of the same face — rather than importing a grey from elsewhere.

**The footer is where the type floor gets forgotten.** Web design systems set footer text at 12–18px, and that figure carries over unnoticed because the footer feels like chrome rather than content. It is still text on a phone: **every footer row is ≥24px**, same as body copy. Check the footer row explicitly — it is the single most common place the floor is breached.

**Two places, two jobs.** The theme section documents the *footer treatment* (catalog element 14: logo + url). The *dual-signature author footer* — photo, name, role on the left, mark and domain on the right — belongs in the reference asset and in every real asset built from the theme. A specimen without it is not showing the theme as it will actually ship.

---

## 5. The icon system

**What:** the tenant's icon library (commonly Lucide), at the tenant's stroke width.

**Why:** hand-drawn glyphs are subtly wrong and inconsistent with each other. Redrawing an icon the library already ships is pure loss.

**How to adapt:** the *container* takes the source's language — circle, rounded square, radius, fill. The glyph itself stays library-standard.

**Third-party brand marks** are different: those must be the real asset file (Slack's mark, not a Lucide chat bubble). Follow the tenant's own sourcing rules — usually check the tenant's brand-logo folder, then a public icon source, and prefer the *product* logo over the parent company's.

**Verify icon names exist.** Lucide names drift between versions. A missing name renders as nothing at all and only shows up as a console warning. Check the render.

---

## 6. Type floors and the LinkedIn scale

**What:** nothing below 24px in the published composition; headline ≥52px; section ≥34px.

**Why:** the asset is read on a phone. A source's 18px body and 12px caption are sized for a desktop browser at arm's length and become unreadable at feed size.

**How to adapt:** scale up, but preserve the source's *ratios and behaviour* rather than its absolute numbers. If the source pulls -1.72px tracking at 86px and near-zero at body size, keep that relationship at the new sizes. Publish the mapping as a small table in the theme section so the next person doesn't re-derive it.

---

## 7. Tenant-wide laws the theme cannot override

These sit in the tenant's usage rules and apply to every theme, including the new one:

- **One text unit, one colour.** A sentence, headline, or label takes exactly one colour, and never a gradient. Different units may take different colours — that's how hierarchy works. Recolouring part of a phrase is one of the loudest tells of machine-made design.
- **Footer structure is constant** across themes; only its styling changes.
- **No hover states.** Themes document default and active/pressed only.
- **Block ceilings and safe padding** come from the output-format rules, not from the source's spacing system.

If the source's do's-and-don'ts contradict one of these, the tenant law wins and the conflict goes in Documented deviations.
