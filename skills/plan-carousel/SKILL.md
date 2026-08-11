---
name: plan-carousel
description: "Use when a finished LinkedIn post caption needs a matching carousel but the slides do not exist yet — it authors the carousel deck (slide text plus a designer-quality visual direction per slide) from the caption and its knowledge item. Triggers on 'make a carousel from this post', 'carousel from the caption', 'turn this post into a carousel', 'plan the carousel', 'build carousel slides from the caption', or any time someone has a caption and wants a carousel to go with it. Use this BEFORE content-generation:generate-carousel: generate-carousel only renders slides that already exist, so reach for plan-carousel first whenever the slides still need to be written from the caption."
---

<objective>
Turn an approved post caption into a render-ready LinkedIn carousel. Decompose the caption (and its source knowledge item) into a one-idea-per-slide deck, write two to three sentences of natural, self-contained prose per slide, and author a strong per-slide visual direction — then, once the user approves the deck, hand the slides to generate-carousel to produce the PNGs and PDF.

This skill owns **authoring**: deciding what each slide says and what its visual should convey. `content-generation:generate-carousel` owns **production**: turning each visual direction plus the tenant brand kit into rendered SVG, PNGs, and a PDF. The two are chained deliberately — authoring is cheap and iterative, rendering is slow and token-heavy — so the user approves the slide text *before* the render runs.
</objective>

<quick_start>
Give the skill a finished caption (a `post.txt`, pasted text, or an Airtable Posts record id), the tenant folder path, and a theme name. It reads the caption and its knowledge item, decomposes them into a one-idea-per-slide deck, writes `slides.txt` (slide text plus a designer visual direction per slide) and `titles.txt`, shows you the deck for approval, and on your go-ahead invokes generate-carousel to render the PNGs and PDF.

Minimum invocation: "Plan a carousel from this caption for tenant at `<tenant-folder>` using theme `<theme>`."
</quick_start>

<essential_principles>

**One idea per slide.** A slide holding two ideas scans as none — the reader bounces before the second one lands. Give each key point, each workflow, each step its own slide. Slide count is driven by the content, not a fixed number: a deck runs anywhere from ~6 to ~15 slides. If a slide starts holding two ideas or dense text, split it into more slides rather than cramming.

**The deck must stand on its own.** Carousels get shared and screenshotted without the caption. A reader who never sees the caption must still get the *full* point. That means terms are defined in the slide text (not only in the caption or the diagram), and the slides progress logically with no seam that only the caption bridges.

**Slide text is flowing prose, never bullets.** The visual is the prominent element on every slide and the text supports it, so a slide carries **two to three sentences, maximum**.

**Body-text length: aim for 150 characters, hard ceiling 200.** The sentence count alone does not protect the slide, because two long sentences still render as a wall on a phone, and these decks are read on mobile. Measure it, never eyeball it. Target ~150 characters of body text per slide and only spend up to 200 when the slide genuinely needs the room. **When a slide will not fit, split it into two slides rather than cramming it** — adding slides is free and always the right trade, and a deck of short slides outperforms a shorter deck of dense ones. This is the rule that makes the ~6–15 count a guideline rather than a limit: at a 150-character target, content-rich posts legitimately land at 20+ slides. Do NOT respond to this rule by making slides cryptic — every slide still carries complete natural sentences that deliver its message standalone. Shorter per slide, more slides, same total substance. Check with:

```bash
python3 - <<'PY'
import re
t=open('slides.txt',encoding='utf-8').read()
for blk in t.split('## Slide ')[1:]:
    n=blk.split('\n',1)[0].strip()
    lines=[l for l in blk.split('\n') if l.strip()]
    body=' '.join(l for l in lines[1:] if not l.startswith('**') and not l.startswith('Visual:')).strip()
    if not body: print(f"S{n}  cover"); continue
    f='  OVER 200' if len(body)>200 else ('  over target' if len(body)>150 else '')
    print(f"S{n}  {len(body)}{f}")
PY
```
 They must read naturally, the way a page of a well-written ebook reads: complete sentences that carry the reader, not clipped fragments chopped into a list. Those two or three sentences must still deliver the slide's message on their own, so a reader who never sees the caption gets the point from the slide alone. Do NOT use `•` bullets, and do NOT use the caption's `↳` hack either. Titles stay short (a long title wraps to two lines and looks broken, and on the cover it steals room from the hero). The cover is a ≤2-line title drawn from the caption's hook plus a dominant hero visual plus no body text.

**Evidence, so this is not "helpfully" reverted:** the two best-performing decks to date (the Claude Code 6-layer harness post and the legal-engineer post) are both written as free-flowing sentences with no bullets anywhere. A bullet convention was added to this skill after both shipped, and neither winner follows it. Prose is the standard; do not reinstate bullets.

**The visual direction is this skill's real product, not decoration.** generate-carousel renders your `Visual:` line faithfully — its governing rule is "stay faithful to the visual direction's intent." So the quality of the rendered slide is bounded by the quality of your direction. A weak "three icons in a row" direction renders as a weak slide. Because it is the leverage point, Step 5 authors the directions as a **four-agent sequence** (art-director sets the drawing conventions and assigns each slide its own form → a single whole-deck author writes every `Visual:` line → a deck-level critic reviews them and loops back to revise → a cold reader who has seen nothing but the `Visual:` lines says what each picture actually communicates). The craft principles live in `references/visual-direction-craft.md`.

**Two hard constraints on every visual: decodable, and SVG-renderable.** The first is that a non-specialist reads it in about three seconds. The second is that generate-carousel builds it as flat vector, so a direction it cannot draw comes out as meaningless shapes however good the idea was ("a block of ice half melted on a stone counter, hand-cut contours, one plane of light and shadow" rendered as a blue box with a semicircle). Within those two, each slide's form is free — it does not have to belong to a known system, and it does not have to match the slide before it. Available: shapes, strokes, arrows, cards, nodes, silhouettes, icons, bars, dials, panels, interface mockups, isometric and cutaway construction, charts. Not available: texture, painterly light, organic irregular contours, still-life realism.

**Clarity first, beauty second, variety third.** A visual must be immediately obvious to the deck's ICP — a non-specialist reads it in about three seconds, before any label. Beauty means captivating and elegant (one confident silhouette, strong negative space, a shape worth remembering), never intricate or encoded; the fix for a dull frame is a better idea, never more machinery. Variety is the last tie-breaker and never a licence to get obscure. **Literal first:** the default picture for a slide is a plain, direct drawing of that slide's own content — three layers as three stacked labelled bands, a failed run as numbered steps with one marked. An analogy asks the reader to translate between two worlds in two seconds using a mapping the caption never taught them, so it must be chosen only when it genuinely beats the literal drawing, and what it shows must already be named in the deck text. What the anti-jargon rule actually forbids is an object nobody can name on sight (a caliper, a core log, a title block), not a plain drawing of the subject itself. The full priority order, the literal-first rule, the object rule, the decodability gate and the beauty gate live in `references/visual-direction-craft.md` and are pasted verbatim into all four Step 5 agent prompts.

**No color words in a visual direction — the brand kit owns the palette.** This is the handoff contract with generate-carousel. A `Visual:` line directs layout, icon, hierarchy, and emphasis intent only ("lower emphasis", "hero element", "dead center", "dwarfed by"), never color ("red arrow", "green badge"). Color and contrast come from the theme; naming them here fights the brand system and produces off-theme renders.

**Every slide obeys the same anti-AI-writing bar as the caption.** No em dashes, no "it's not X, it's Y" negative parallelism, no tailing negations ("no guessing", "not a blank page"), no forced rule-of-three. If a phrasing is banned in the caption, it is banned on a slide. Run the humanizer lens over slide text.

**ICP jargon hides in the labels (Dimension 13).** The words a reader sees *inside* the graphic — a word on a signpost, a caption under an object, a name on a label — must use language the post's ICP grasps instantly. This is the sneakiest place for jargon because the caption's own checks never see label text. Propose a plain-language swap or a ≤4-word inline definition for each too-technical term across titles, slide prose, AND picture labels; the user confirms each. Pillar-calibrated: a deck for a technical ICP legitimately keeps more terms — over-simplifying dilutes depth. Labels are the last mile of clarity, not the first — a picture that only makes sense once its labels are read has already failed the decodability gate.

**Approve before you render.** Authoring is cheap; rendering (Playwright, a QA subagent, up to three retry passes per slide) is slow and expensive. Present the finished deck and get an explicit go-ahead before invoking generate-carousel. Propose, don't impose — the user steers the deck.

</essential_principles>

<workflow>

**Step 1: Resolve inputs**

Require:
- The caption — from a generated `post.txt`, pasted text, or an Airtable Posts record id (then read the Body Text field and the linked Knowledge Item).
- The source Knowledge Item (its summary + key insights) if one is linked — the carousel needs the same source depth the caption drew on.
- The tenant folder path (local filesystem) — needed for the render handoff.
- The theme name (e.g., `quiet-aurora`) — must match a theme generate-carousel can render.
- The ICP — one or two sentences naming who reads this deck (roles, seniority, how technical they are). Resolve in this order: (1) if the caption came from an Airtable Posts record, read the linked persona's Strategy row (Target Job Titles `fld0sBcM7jpIE3KAi`, Target Industries `fldTrSRD8MUN7BP7p`) and condense it, then calibrate the technical register from the post's **Pillar** — a Claude Code deck legitimately tolerates more technical imagery than an Awareness deck, the same pillar-calibration Dim 13 already uses; (2) an ICP or strategy note in the tenant folder; (3) ask the user. Write the resolved sentence down verbatim — it fills the `{{ICP}}` slot in all four Step 5 agent prompts and is the yardstick for the decodability gate, the beauty gate and the Dim-13 pass. Do NOT keep a static ICP sentence in the tenant folder as the primary source: it duplicates a fact Airtable already owns and freezes the pillar calibration.

If any is missing, stop and ask. Do not infer defaults.

**Output-folder rule (mirror generate-carousel):** if the caption came from an existing `<tenant>/generated/<slug>/` bundle, THAT folder is the output — write `slides.txt`/`titles.txt` into it. Only when starting a brand-new bundle do you derive a slug, and that happens at write time (Step 7), not here. Do not enumerate `generated/` now.

**Step 2: Read the caption and the knowledge item**

<read_before>
- The caption (the `post.txt` file, pasted text, or the record's Body Text)
- The linked Knowledge Item's summary and key insights, if available
</read_before>

Extract the story arc (hook → payoff), the hero facts and stats, and the real frameworks. The carousel carries the post's structure visually, so it needs the source's actual frameworks — not a surface restatement.

**Step 3: Decompose one idea per slide**

Map the arc to slides: a cover, the context or "before" state, the method or turning point, each key point on its OWN slide, the pivotal constraint or insight (often the most important beat and the one most easily dropped — protect it), a recap, and the payoff. Let the count follow the content (~6–15). Name the moments a caption-only reader would miss and give them slides.

**Step 4: Write the slide text**

Flowing prose, two to three sentences per slide, maximum. Complete natural sentences that read like a page of a well-written ebook, never bullets and never clipped fragments. The visual leads; the text supports it, and still delivers the slide's message standalone. Short titles (a few words). Cover = ≤2-line title drawn from the caption's hook + a dominant hero visual + no body text. Apply the anti-AI-writing bar. Surface Dim-13 jargon swaps and let the user confirm each — never bulk-strip technical terms.

**Step 5: Author the visual directions — four-agent sequence**

The visual direction is this skill's real product and the render is bounded by it, so the designer pass runs as **four specialist agents in strict sequence**, not an inline pass. Spawn each with the Agent tool (general-purpose), in order, feeding each the prior agent's output. Do NOT fan out one agent per slide — a single author that sees the whole deck at once is the only way to catch two slides resolving to the same picture; per-slide isolation produces locally-clever but globally-repetitive directions, and a per-slide critic cannot see it.

**GUARDRAIL — this step MUST run as four spawned agents. It is not optional and you do not do it yourself.**
- First action of Step 5: create four todos (5a art-director, 5b visual author, 5c critic, 5d cold reader) with TodoWrite. This makes the spawn commitment visible and trackable.
- Spawn each agent with the Agent tool using the ready-made role prompt in `references/visual-agent-prompts.md` (fill its `{{...}}` slots) — do not improvise a thin prompt; the prompts are calibrated to force clear-first, beautiful-second, varied output.
- You MUST NOT write or hand-edit any `Visual:` line yourself. That is agent 5b's job exclusively. If you catch yourself composing a Visual line directly, stop — you are violating the process. The orchestrator's only jobs here are: prep inputs, spawn the four agents in order, run the 5b↔5c revise loop, run the 5d blind read, and relay results.
- Skipping an agent, merging two into one, or inlining the authoring is a process violation. Four agents, in sequence, every time.

Before spawning, write the current deck (the Step 4 slide text, with any draft `Visual:` lines) to `slides.txt` so each agent reads and edits the file directly. Read both `references/visual-direction-craft.md` and `references/visual-agent-prompts.md` yourself, and pass the craft reference to every agent, along with: the theme name and its temperament (from the tenant `THEMES.md`), the ICP sentence resolved in Step 1, and the caption + knowledge-item arc. Fill the `{{ICP}}` slot in all four prompts with that sentence, and paste the visual contract from `references/visual-agent-prompts.md` verbatim into each prompt's `{{VISUAL_CONTRACT}}` slot — clarity first, beauty second, variety third is stated identically to all four agents or it does not hold.

<read_before>
- `references/visual-direction-craft.md` — the visual contract, the designer-pass principles and worked before/after examples (read it yourself, and hand it to every agent)
- `../../references/shared-art-direction-principles.md` — the plugin art-direction floor (three-second grasp, the negative-pattern blacklist). Read it yourself; its load-bearing clarity lines are folded into the craft reference the agents receive.
</read_before>

- **5a — Art-director (conventions + form assignment, runs once).** One agent. Input: the whole deck's slide text, the theme, the ICP, the story arc. Output: (a) the **drawing conventions** the deck holds to — how emphasis is marked, what any repeated visual state means, label style and length, overall density — and nothing more; and (b) a **per-slide form assignment**: the one literal form that draws each slide's own content most clearly, with a one-line reason, plus the cover's single hero image, the emotional-staging plan, and the deck's mood (theme-matched, mood only, never subject matter). It does NOT pick a motif, a metaphor, or a small kit of shapes every slide reuses. **Coherence comes from the brand kit** (typeface, weight scale, stroke weight, icon treatment, palette, tag pill, footer), which generate-carousel applies to every slide no matter what each visual draws — so buying coherence with repeated shapes is paying twice and getting a monotonous deck. Twenty slides should produce roughly twenty different pictures. It writes no per-slide `Visual:` lines.

- **5b — Visual author (all slides, runs once).** ONE agent, never one per slide. Input: 5a's conventions and form assignment, every slide's text, the ICP, the craft reference. It writes the `Visual:` line for every slide directly into `slides.txt`, each holding to 5a's conventions and drawing 5a's assigned form, each passing the decodability gate and the beauty gate for the Step 1 ICP, each with a single hero focal point, real brand/tool names (so the renderer uses their logos), zero color words, and Dim-13-clean labels. Seeing the whole deck in one pass is what stops two slides resolving to the same picture. Bar-not-floor: a direction that is already strong passes through unchanged.

- **5c — Visual critic (deck-level, runs once) + revise loop.** One agent reviews ALL directions together — the only vantage from which coherence defects are visible. It returns a punch-list in severity order: undecodable imagery, unearned analogies and unnameable objects first (all top severity), then beauty failures (flat, or over-encoded), then convention drift, focal point, monotony (every pair, not just neighbours, plus the whole-deck read), color words, slide-placement words, real brands named, and Dim-13 label jargon. Route the findings back to the 5b author for a revise pass, then re-critique. Bound the loop to 2 rounds; if items remain after round 2, surface them to the user rather than looping forever. A per-slide critic is explicitly wrong here — coherence is a whole-deck property.

- **5d — Cold reader (blind decode, runs once after 5c converges).** Every check above is run by an agent that already knows the answer: 5b invented the metaphors, and 5c read the whole deck before judging the pictures. Anyone holding that context finds an obscure image obvious, which is how a deck of engineering imagery once cleared two adversarial critique rounds intact. **Give 5d the `Visual:` lines ONLY** — strip the slide titles, body prose, caption, art-director brief, theme and knowledge item before spawning; handing it any of them destroys the step. It answers two questions per line: what idea does this picture convey, and with no words on it would you stop scrolling and what shape would you remember. Compare the first answer against the slide's actual claim: a mismatch, a hedge or "I cannot tell" is a failed slide, routed back to 5b as a concept change. The second answer is the only cold read on beauty in the pipeline.

**Step 6: Standalone-readability gate**

Re-read the whole deck start to finish as if the caption did not exist. Fix any seam where one slide does not bridge into the next, any term defined only in the caption, any slide that only makes sense with the caption. The deck must deliver the FULL value alone. This is the same discipline the caption gets: an edit made for one slide can break the flow of another, and your in-memory model is the pre-edit version — so read the saved deck fresh, don't score it from memory.

**Step 7: Write the bundle**

Write into the resolved output folder:
- `slides.txt` — the format generate-carousel reads: `## Slide N`, a bold title, two to three sentences of prose (no bullet characters), then a `Visual:` line. One block per slide.
- `titles.txt` — 3 LinkedIn document titles, each under 58 characters (count them): one curiosity-led (stops the scroll), one SEO/keyword-led (surfaces in LinkedIn search), one benefit-led (clear value exchange).

**Step 8: Approval gate**

Present the deck — slide text, visual directions, and titles — to the user. Iterate until they approve. This is the cheap moment to fix problems, before the expensive render.

**Step 9: Render**

On approval, invoke `content-generation:generate-carousel` with the slides, the tenant folder path, and the theme. It reads the brand kit, composes the SVG, renders the PNGs, runs programmatic validation and a QA subagent, and exports the combined PDF into the same bundle folder.

</workflow>

<anti_patterns>

- **Fixed-count decks.** Forcing every post into 8 slides. Count follows content (~6–15).
- **Cramming two ideas onto one slide** to hit a target count. Split instead.
- **Bulleted or fragmented slide text.** `•` bullets, the caption's `↳` hack, or sentences chopped into clipped list items. Slides carry two to three complete sentences that read naturally on their own. The deck's two best performers are both written this way.
- **Color words in a visual direction** ("red arrow", "green badge"). Palette is the brand kit's job — direct layout, icon, hierarchy, and emphasis only.
- **Weak or generic visual directions** ("three icons in a row"). The render is only as good as the direction; a generic direction wastes the slide.
- **A deck that only makes sense next to the caption.** It will be screenshotted alone.
- **Rendering before the user has approved the slide text.** The render is the expensive step; approve first.
- **Jargon on a picture's label** the caption never had to explain. Label text is where technical terms hide from the caption's checks.
- **Directions the renderer cannot draw.** Texture, grain, painterly light and shadow, hand-inked contours, still-life realism. generate-carousel builds flat vector; anything else renders as noise. Name the primitives or do not write the line.
- **A painterly or illustrative aesthetic register.** Invent any visual language you like, but it must be constructible from flat vector primitives. A cookbook-plate or picture-book idiom is not.
- **Cryptic visual directions.** A caliper, a core log, a weld section, a title block, a rating plate. Imagery that needs domain literacy to decode. Clever is worthless if the reader cannot read it in three seconds.
- **Relocating the deck into an invented world.** Turning "execution, context, compute" into a staircase, a hire cabin and a hanging lamp. The reader has to learn a mapping the caption never taught them, on a two-second scroll. Draw the slide's own content unless an analogy clearly beats it.
- **Objects nobody can name on sight.** A caliper, a core log, a weld section, a title block. This, not technical subject matter, is what makes a visual cryptic.
- **Reading "artistic" as "intricate".** Beauty here is elegance and a strong silhouette, not elaborate encoding. The fix for a dull slide is a better idea, never more machinery.
- **Handing the cold reader (5d) any context.** Slide text, the caption, the art-director brief — any of them turns the blind decode into another informed opinion, which is the one thing the pipeline already has too many of.
- **Em dashes, "it's not X, it's Y", or tailing negations on slides.** Same anti-AI bar as the caption.
- **Fanning out one visual agent per slide.** The Step 5 author (5b) and critic (5c) are BOTH deck-level. Per-slide isolation hides the defect the step exists to catch: two slides that resolve to the same picture.
- **Buying coherence with repetition.** One recurring motif, one metaphor world, or a fixed kit of four or five shapes reused across the deck. The brand kit already makes the deck one artifact. Repeating shapes on top of it just makes it monotonous, and a reader stops expecting a new picture around slide 10.

</anti_patterns>

<success_criteria>

- `slides.txt` written: one idea per slide, standalone-readable, two to three natural sentences of prose per slide with no bullet characters, cover = title + hero + no body.
- Every slide has a render-ready `Visual:` direction a non-technical ICP reader decodes in about three seconds: a clear focal point, a literal drawing of the slide's own content wherever that is clearest, no two slides resolving to the same picture, no color words, and no slide-placement words (describe the illustration, not where it sits on the slide or the air around it — generate-carousel owns placement and spacing).
- The visual directions were authored by the Step 5 four-agent sequence (art-director → single whole-deck author → deck-level critic + revise loop → cold reader), not an inline or per-slide pass.
- The visual contract (clarity → beauty → variety, literal-first, the object rule, decodability gate, beauty gate) was pasted into all four agent prompts; 5c reported no undecodable slides, no unearned analogies and no unnameable objects; and 5d, seeing only the `Visual:` lines, named the right idea for every slide and found a shape worth stopping for.
- Slide text and picture labels pass the anti-AI bar and the Dim-13 jargon pass (swaps user-confirmed).
- `titles.txt` written: 3 titles under 58 chars (curiosity / SEO / benefit).
- The user approved the deck BEFORE rendering.
- generate-carousel invoked on approval; PNGs, PDF, and manifest land in the bundle folder.

</success_criteria>

<reference_index>
**Step 5 agent role prompts + the visual contract (ready to paste):** references/visual-agent-prompts.md
**Designer pass (visual contract + direction craft):** references/visual-direction-craft.md
**Sibling render skill:** content-generation:generate-carousel
**Plugin art-direction floor (read at Step 5):** ../../references/shared-art-direction-principles.md
</reference_index>
