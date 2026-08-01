# Registration Checklist

A theme is registered when someone who wasn't in the conversation can find it, choose it, and build with it. That takes five edits, not one.

Work through them in order and verify each landed — these are string edits into large files, and a silently missed replacement leaves the theme half-registered.

---

## 1. Source file → the tenant's design-sources folder

Copy the `DESIGN-*.md` **unchanged** to the tenant's design-sources folder (commonly `config/tenant-brands/<tenant>/references/design-systems/`).

Unchanged matters: it stays round-trippable with the tooling that produced it, and it remains the record of what the brand actually is, separate from what we decided to do with it.

Add a row to the folder's README mapping table:

```markdown
| Source file | Theme | THEMES.md | Reference asset |
|---|---|---|---|
| `DESIGN-<brand>.md` | <Theme> | § N | `ui_kits/linkedin_infographic/<Theme>IconsType.html` |
```

If the folder doesn't exist yet, create it with a README explaining why sources and themes both exist — a future reader will otherwise assume one is a stale copy of the other.

---

## 2. New section in THEMES.md

Insert `## N. <Theme>` immediately **before** the `## Quick comparison table` heading, so themes stay contiguous.

Use `assets/theme-section-template.md` as the skeleton. Match the existing sections' shape exactly — same heading order, same two-column tables, same `**Example files:**` line at the end. People read these by scanning to the same row in a different section; a section that reorders things is measurably harder to use.

---

## 3. Column in the quick comparison table

Every row gets a value for the new theme. This is the table people actually use to choose, and a blank cell reads as "unknown" rather than "not applicable" — write `—` or `**None** (deliberate)` instead.

The table is wide and edited by string replacement. Two things go wrong:

- The header separator row (`|---|---|...`) needs one more `|---|` or the table stops rendering.
- Several rows have near-identical text. Match on the full row including its leading label to avoid replacing the wrong one.

Verify by reading the rendered table back, not by trusting the replacement count.

---

## 4. Usage rules

The tenant-wide rules at the bottom of THEMES.md enumerate per-theme behaviour in a few places — commonly the tags/pills rule and any font-family statement in the intro.

Add the new theme to each enumeration it belongs in. Also update the theme count in the opening line ("Five visual themes…" → "Six…"), which is easy to miss and immediately signals a stale document when wrong.

---

## 5. Tenant README

Two edits:

**Theme list** — a short entry matching the format of the existing ones. Cover background, cards, text, accent, type, artwork, what it's for, and where the template lives. Keep it to what someone needs in order to pick; the full spec is in THEMES.md.

**Selection guide table** — one row: `| <what the user wants to convey> | **<Theme>** |`. Write it from the reader's intent, not the theme's features. "Editorial warmth, magazine feel" is useful; "white canvas with signature cards" is a description they'd have to decode.

Update the theme count here too.

---

## Verification

Before reporting done:

```bash
grep -n "<Theme>" THEMES.md README.md references/design-systems/README.md
```

Expect hits in: the new section, the comparison table header and every row, the usage rules, the README theme list, the README selection guide, and the sources mapping. A missing hit means a replacement silently no-opped.

Then confirm the reference asset path in the `**Example files:**` line actually exists — it's written before the asset is built, and it's the line people follow to see the theme.
