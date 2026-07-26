---
name: plan-carousel
description: "Use when a finished LinkedIn post caption needs a matching carousel but the slides do not exist yet — it authors the carousel deck (slide text plus a designer-quality visual direction per slide) from the caption and its knowledge item. Triggers on 'make a carousel from this post', 'carousel from the caption', 'turn this post into a carousel', 'plan the carousel', 'build carousel slides from the caption', or any time someone has a caption and wants a carousel to go with it. Use this BEFORE content-generation:generate-carousel: generate-carousel only renders slides that already exist, so reach for plan-carousel first whenever the slides still need to be written from the caption."
---

<objective>
Turn an approved post caption into a render-ready LinkedIn carousel. Decompose the caption (and its source knowledge item) into a one-idea-per-slide deck, write scannable slide text, and author a strong per-slide visual direction — then, once the user approves the deck, hand the slides to generate-carousel to produce the PNGs and PDF.

This skill owns **authoring**: deciding what each slide says and what its visual should convey. `content-generation:generate-carousel` owns **production**: turning each visual direction plus the tenant brand kit into rendered SVG, PNGs, and a PDF. The two are chained deliberately — authoring is cheap and iterative, rendering is slow and token-heavy — so the user approves the slide text *before* the render runs.
</objective>

<quick_start>
Give the skill a finished caption (a `post.txt`, pasted text, or an Airtable Posts record id), the tenant folder path, and a theme name. It reads the caption and its knowledge item, decomposes them into a one-idea-per-slide deck, writes `slides.txt` (slide text plus a designer visual direction per slide) and `titles.txt`, shows you the deck for approval, and on your go-ahead invokes generate-carousel to render the PNGs and PDF.

Minimum invocation: "Plan a carousel from this caption for tenant at `<tenant-folder>` using theme `<theme>`."
</quick_start>

<essential_principles>

**One idea per slide.** A slide holding two ideas scans as none — the reader bounces before the second one lands. Give each key point, each workflow, each step its own slide. Slide count is driven by the content, not a fixed number: a deck runs anywhere from ~6 to ~15 slides. If a slide starts holding two ideas or dense text, split it into more slides rather than cramming.

**The deck must stand on its own.** Carousels get shared and screenshotted without the caption. A reader who never sees the caption must still get the *full* point. That means terms are defined in the slide text (not only in the caption or the diagram), and the slides progress logically with no seam that only the caption bridges.

**Slide text is scannable in about five seconds.** The diagram does the heavy lifting and the caption holds the full detail, so slides carry short lines: ~2–3 short bullets, real `•` bullets (not the caption's `↳` plain-text hack), short titles (a long title wraps to two lines and looks broken, and on the cover it steals room from the hero). The cover is a ≤2-line title drawn from the caption's hook plus a dominant hero visual plus no body text.

**The visual direction is this skill's real product, not decoration.** generate-carousel renders your `Visual:` line faithfully — its governing rule is "stay faithful to the visual direction's intent." So the quality of the rendered slide is bounded by the quality of your direction. A weak "three icons in a row" direction renders as a weak slide. Because it is the leverage point, Step 5 authors the directions as a **three-agent sequence** (art-director sets one motif → a single whole-deck author writes every `Visual:` line → a deck-level critic reviews them and loops back to revise). The craft principles live in `references/visual-direction-craft.md`.

**No color words in a visual direction — the brand kit owns the palette.** This is the handoff contract with generate-carousel. A `Visual:` line directs layout, icon, hierarchy, and emphasis intent only ("lower emphasis", "hero element", "dead center", "dwarfed by"), never color ("red arrow", "green badge"). Color and contrast come from the theme; naming them here fights the brand system and produces off-theme renders.

**Every slide obeys the same anti-AI-writing bar as the caption.** No em dashes, no "it's not X, it's Y" negative parallelism, no tailing negations ("no guessing", "not a blank page"), no forced rule-of-three. If a phrasing is banned in the caption, it is banned on a slide. Run the humanizer lens over slide text.

**ICP jargon hides in the labels (Dimension 13).** The words a reader sees *inside* the graphic — a gauge label, an axis caption, a node name — must use language the post's ICP grasps instantly. This is the sneakiest place for jargon because the caption's own checks never see label text. Propose a plain-language swap or a ≤4-word inline definition for each too-technical term across titles, bullets, AND diagram labels; the user confirms each. Pillar-calibrated: a deck for a technical ICP legitimately keeps more terms — over-simplifying dilutes depth.

**Approve before you render.** Authoring is cheap; rendering (Playwright, a QA subagent, up to three retry passes per slide) is slow and expensive. Present the finished deck and get an explicit go-ahead before invoking generate-carousel. Propose, don't impose — the user steers the deck.

</essential_principles>

<workflow>

**Step 1: Resolve inputs**

Require:
- The caption — from a generated `post.txt`, pasted text, or an Airtable Posts record id (then read the Body Text field and the linked Knowledge Item).
- The source Knowledge Item (its summary + key insights) if one is linked — the carousel needs the same source depth the caption drew on.
- The tenant folder path (local filesystem) — needed for the render handoff.
- The theme name (e.g., `quiet-aurora`) — must match a theme generate-carousel can render.

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

Short scannable lines, ~2–3 short `•` bullets per slide. Short titles (a few words). Cover = ≤2-line title drawn from the caption's hook + a dominant hero visual + no body text. Apply the anti-AI-writing bar. Surface Dim-13 jargon swaps and let the user confirm each — never bulk-strip technical terms.

**Step 5: Author the visual directions — three-agent sequence**

The visual direction is this skill's real product and the render is bounded by it, so the designer pass runs as **three specialist agents in strict sequence**, not an inline pass. Spawn each with the Agent tool (general-purpose), in order, feeding each the prior agent's output. Do NOT fan out one agent per slide — a single author that sees the whole deck at once is what keeps the motif coherent; per-slide isolation produces locally-clever but globally-inconsistent directions, and a per-slide critic cannot see cross-slide drift.

**GUARDRAIL — this step MUST run as three spawned agents. It is not optional and you do not do it yourself.**
- First action of Step 5: create three todos (5a art-director, 5b visual author, 5c critic) with TodoWrite. This makes the spawn commitment visible and trackable.
- Spawn each agent with the Agent tool using the ready-made role prompt in `references/visual-agent-prompts.md` (fill its `{{...}}` slots) — do not improvise a thin prompt; the prompts are calibrated to force art-director-grade, artistic, varied, scroll-stopping output.
- You MUST NOT write or hand-edit any `Visual:` line yourself. That is agent 5b's job exclusively. If you catch yourself composing a Visual line directly, stop — you are violating the process. The orchestrator's only jobs here are: prep inputs, spawn the three agents in order, run the 5b↔5c revise loop, and relay results.
- Skipping an agent, merging two into one, or inlining the authoring is a process violation. Three agents, in sequence, every time.

Before spawning, write the current deck (the Step 4 slide text, with any draft `Visual:` lines) to `slides.txt` so each agent reads and edits the file directly. Read both `references/visual-direction-craft.md` and `references/visual-agent-prompts.md` yourself, and pass the craft reference to every agent, along with: the theme name and its temperament (from the tenant `THEMES.md`), and the caption + knowledge-item arc.

<read_before>
- `references/visual-direction-craft.md` — the designer-pass principles and worked before/after examples (read it yourself, and hand it to every agent)
</read_before>

- **5a — Art-director (motif, runs once).** One agent. Input: the whole deck's slide text, the theme, the story arc. Output: a short deck-wide visual system — the ONE recurring motif (a pipeline, a locator map, a consistent node style), the cover's single hero metaphor, and the emotional-staging plan (which slides enlarge or shrink what, to carry meaning). It writes no per-slide `Visual:` lines. This is the coherence anchor: decided once, obeyed by every slide.

- **5b — Visual author (all slides, runs once).** ONE agent, never one per slide. Input: 5a's motif spec, every slide's text, the craft reference. It writes the `Visual:` line for every slide directly into `slides.txt`, each obeying the 5a motif, each with a single hero focal point, real brand/tool names (so the renderer uses their logos), zero color words, and Dim-13-clean labels. Seeing the whole deck in one pass is what enforces motif consistency and stops two slides sharing a composition. Bar-not-floor: a direction that is already strong passes through unchanged.

- **5c — Visual critic (deck-level, runs once) + revise loop.** One agent reviews ALL directions together — the only vantage from which coherence defects are visible. It returns a punch-list: motif consistency across every slide, one clear focal point per slide, no two slides with the same composition, zero color words, real brands named, and Dim-13 label jargon. Route the findings back to the 5b author for a revise pass, then re-critique. Bound the loop to 2 rounds; if items remain after round 2, surface them to the user rather than looping forever. A per-slide critic is explicitly wrong here — coherence is a whole-deck property.

**Step 6: Standalone-readability gate**

Re-read the whole deck start to finish as if the caption did not exist. Fix any seam where one slide does not bridge into the next, any term defined only in the caption, any slide that only makes sense with the caption. The deck must deliver the FULL value alone. This is the same discipline the caption gets: an edit made for one slide can break the flow of another, and your in-memory model is the pre-edit version — so read the saved deck fresh, don't score it from memory.

**Step 7: Write the bundle**

Write into the resolved output folder:
- `slides.txt` — the format generate-carousel reads: `## Slide N`, a bold title, `•` bullets, then a `Visual:` line. One block per slide.
- `titles.txt` — 3 LinkedIn document titles, each under 58 characters (count them): one curiosity-led (stops the scroll), one SEO/keyword-led (surfaces in LinkedIn search), one benefit-led (clear value exchange).

**Step 8: Approval gate**

Present the deck — slide text, visual directions, and titles — to the user. Iterate until they approve. This is the cheap moment to fix problems, before the expensive render.

**Step 9: Render**

On approval, invoke `content-generation:generate-carousel` with the slides, the tenant folder path, and the theme. It reads the brand kit, composes the SVG, renders the PNGs, runs programmatic validation and a QA subagent, and exports the combined PDF into the same bundle folder.

</workflow>

<anti_patterns>

- **Fixed-count decks.** Forcing every post into 8 slides. Count follows content (~6–15).
- **Cramming two ideas onto one slide** to hit a target count. Split instead.
- **Color words in a visual direction** ("red arrow", "green badge"). Palette is the brand kit's job — direct layout, icon, hierarchy, and emphasis only.
- **Weak or generic visual directions** ("three icons in a row"). The render is only as good as the direction; a generic direction wastes the slide.
- **A deck that only makes sense next to the caption.** It will be screenshotted alone.
- **Rendering before the user has approved the slide text.** The render is the expensive step; approve first.
- **Jargon on a diagram label** the caption never had to explain. Label text is where technical terms hide from the caption's checks.
- **Em dashes, "it's not X, it's Y", or tailing negations on slides.** Same anti-AI bar as the caption.
- **Fanning out one visual agent per slide.** The Step 5 author (5b) and critic (5c) are BOTH deck-level. Per-slide isolation breaks the shared motif and hides cross-slide drift — the very defects the step exists to prevent.

</anti_patterns>

<success_criteria>

- `slides.txt` written: one idea per slide, scannable, standalone-readable, real `•` bullets, cover = title + hero + no body.
- Every slide has a render-ready `Visual:` direction with a clear focal point, a coherent motif across the deck, no color words, and no slide-placement words (describe the diagram, not where it sits on the slide or the air around it — generate-carousel owns placement and spacing).
- The visual directions were authored by the Step 5 three-agent sequence (art-director → single whole-deck author → deck-level critic + revise loop), not an inline or per-slide pass.
- Slide text and diagram labels pass the anti-AI bar and the Dim-13 jargon pass (swaps user-confirmed).
- `titles.txt` written: 3 titles under 58 chars (curiosity / SEO / benefit).
- The user approved the deck BEFORE rendering.
- generate-carousel invoked on approval; PNGs, PDF, and manifest land in the bundle folder.

</success_criteria>

<reference_index>
**Step 5 agent role prompts (ready to paste):** references/visual-agent-prompts.md
**Designer pass (visual direction craft):** references/visual-direction-craft.md
**Sibling render skill:** content-generation:generate-carousel
**Plugin art-direction floor:** ../../references/shared-art-direction-principles.md
</reference_index>
