---
name: convert-design-to-theme
description: Converts a third-party brand design spec (a DESIGN-*.md file describing another company's design system — Airtable, Figma, Linear, Stripe, whatever) into a fully registered visual theme for a tenant's THEMES.md, then proves it by rendering a reference asset. Use this whenever the user supplies a design system markdown file and wants it usable for their content, or says anything like "add this brand as a theme", "convert this design md", "make a theme out of this", "do the same exercise with this one", "I have another design file for you", or drops a path to a DESIGN-*.md. Also use when a theme already exists but is missing catalog elements or family chrome, or when the user asks why an asset in a converted theme doesn't look like the rest of their content. Do not skip this skill on the assumption that applying the design file's tokens is enough — a raw brand spec describes a website and cannot produce a valid social asset on its own, and the gap between the two is exactly what this skill closes.
---

# Convert a Design System into a Tenant Theme

## What this is actually for

Someone hands you a beautifully specified design system for another company's *website*. It documents nav bars, form inputs, pricing tabs, breakpoints, hover states. You need to produce a 1080×1350 social asset.

Those are not the same problem, and the difference is the whole job. The source file has no vocabulary for the things you actually place — the diagram opacity tiers, the minimum type size a phone can read, the tag pill that makes every asset in the tenant's feed recognisably theirs. Copying tokens across gets you a palette, not a theme.

So the output here is not a translation of the source. It is a **production translation**: the source's visual identity, mapped onto the tenant's element catalog, with the tenant's shared chrome added, conflicts resolved deliberately, and the result proven by rendering.

Keep the source file unchanged. It is the record of what the brand actually is; the theme entry is what we do with it.

## The six steps

Work through these in order. Steps 1–3 are reading and mapping, 4 is judgment, 5 is registration, 6 is proof.

### 1. Read both sides before writing anything

Read the source `DESIGN-*.md` in full — the front-matter tokens *and* the prose. The prose carries the rules that tokens can't express ("never two colour blocks in one viewport", "weight, not opacity, carries hierarchy"), and those rules are usually what makes the brand recognisable.

Then read the tenant's `THEMES.md`, specifically:
- the **element catalog** near the top — the list every theme must define
- **two existing themes in full**, ideally the ones closest in surface mode (a light source → read the light themes)
- the **usage rules** at the bottom — these are tenant-wide laws the new theme must obey

Also read the tenant `README.md` theme section and the infographic template catalog if one exists. You are looking for conventions, not inspiration.

### 2. Map the source onto every catalog element

The catalog is the contract: **every element gets a value, even if that value is "None."** A theme with gaps produces assets that silently fall back to another theme's look.

`None` is a legitimate answer and sometimes the most characteristic one — a system built on whitespace should say "Dot grid: **None** — deliberate" with the reason attached. What's not legitimate is silence, because the next person can't tell whether you decided or forgot.

Where the source is silent on an element (most sources say nothing about stat bars or takeaway cards), derive it from the source's own logic rather than importing another theme's values. Ask: if this brand had to draw a progress bar, what would it look like given everything else it does? A monochrome system fills it black; a signature-colour system fills it with the signature.

### 3. Add the family chrome

This is the step that makes it belong. Read `references/family-chrome.md` for the full checklist and the reasoning behind each item — the tag pill, the watermark, the body field, the footer, the icon library, the type floor.

The short version: a handful of elements appear in the *same position* in every theme, and that constancy is what makes visually unrelated themes read as one system. A source design file will not contain them, because they're the tenant's, not the brand's.

### 4. Resolve conflicts as documented deviations

The source's rules and the tenant's chrome will sometimes contradict each other outright. This is normal and it's where the real design decisions live.

The default resolution: **family chrome wins on structure, the source wins on style.** The pill's *shape and position* are the tenant's; its *colour, fill, and type* are the source's. A reader should recognise the tenant's format and the brand's palette at the same time.

Whatever you decide, record it in the theme section under **Documented deviations**, with the reason. An undocumented deviation looks identical to a mistake six months later, and someone will "fix" it.

Read `references/adaptation-rules.md` before this step — it covers the recurring conflicts (web type scales below the mobile floor, viewport rules that assume scrolling, colour rules that assume a large canvas) and how each has been resolved before.

### 5. Register it in all four places

A theme that exists only in your head, or only in one file, isn't usable. See `references/registration-checklist.md` for the exact edits. In brief: the new section in `THEMES.md`, a column in the quick comparison table, a line in the tenant-wide usage rules where relevant, and an entry in the tenant `README.md` theme list and selection guide.

Use `assets/theme-section-template.md` as the skeleton so the new section matches the shape of the existing ones. Matching shape matters more than it sounds — people read these by scanning to the same row in a different section.

Store the source file unchanged under the tenant's design-sources folder (commonly `references/design-systems/`) and add it to the source→theme mapping table there.

### 6. Render a reference asset and QA it by eye

**An unproven spec is a guess.** Every conversion so far has shipped at least one error that reading could not catch: a colour pair that measures below 3:1 in practice, an icon name that doesn't exist in the library, a bar fill that doesn't render because inline elements ignore height, 250px of dead space nobody predicted.

Build a neutral **element specimen** — not real content — that exercises the theme's characteristic elements: tag pill, headline, the signature surface, cards, one data register, takeaway, and the **dual-signature author footer** (photo, name, role, mark, domain). The author footer is easy to skip in a specimen because it feels like boilerplate; leaving it out means the specimen isn't showing the theme as it will actually ship, and the first real asset then has nowhere to copy from.

Name it to match the tenant's convention (commonly `<Theme>IconsType.html` in the infographic kit) and point the theme section's **Example files** line at it.

Before rendering, sweep the spec for type sizes below the floor. The footer and caption rows are where a web system's 12–18px slips through unnoticed.

Two bundled scripts make this fast, and both exist because this work was done by hand three times before:

```bash
# check every foreground/background pair in the palette BEFORE writing the spec
node scripts/check-palette-contrast.mjs '<theme-json-or-inline-pairs>'

# render + validate + measure in one pass
node scripts/render-and-validate.mjs <path-to-html> [--out <png-path>]
```

`render-and-validate.mjs` renders at 1080×1350 (deviceScaleFactor 2), runs the mobile compliance and post-render validators if the generate-infographic skill is installed, reports each section's measured top/bottom so you can find dead space, confirms the webfont actually resolved, and only writes the PNG when validation passes.

Then **look at the PNG**. The validators check geometry and contrast; they cannot see that the specimen is ugly, unbalanced, or bottom-heavy. If more than ~100px of empty canvas sits above the footer, scale the hero up rather than leaving the gap — the tenant's QA checklist treats large unexplained whitespace as a defect.

## Variants

When the source contains two genuinely different dialects — a restrained marketing surface and a playful product surface, a light mode and a dark mode — it's often better to register a **variant** (`§ 7b`) than to force one spec to cover both or to burn a second theme number.

A variant inherits everything from its parent and overrides a named short list. Give it its own discipline rules and its own reference asset; otherwise "relaxed variant" becomes "the rules don't apply here" and the output goes muddy.

Only do this when the source itself shows both dialects. If you're inventing the second flavour because the first felt restrictive, you're editing the brand, not translating it — say so to the user and let them decide.

## Working with the user

Surface these rather than deciding silently:

- **Conflicts you resolved.** They may feel differently about which side should win, and it's their brand.
- **Elements you set to `None`.** Especially when every other theme has one.
- **Anything the render caught.** It's evidence the spec was wrong, and it's the most useful thing you'll report.
- **Whether the source's constraints match their intent.** Someone who picks a colourful brand because they want colour will not enjoy discovering the source forbids more than one colour block per page. Ask before you enforce it into their asset.

Report at the end in a few lines: what was registered, where the files are, which deviations were logged, and what the render caught. Keep the reasoning in the theme section and the manifest, not in the chat.
