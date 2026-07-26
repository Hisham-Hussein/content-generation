# Visual Direction Craft — the designer pass

A `Visual:` line tells generate-carousel what a slide's diagram should **convey** and how it should be **composed**. The renderer is faithful to your intent, so the rendered slide is only as good as the direction. This file is the "designer pass": read it at Step 5 and elevate every `Visual:` line against the principles below.

**Hard constraint, repeated:** no color words. Palette and contrast come from the theme. Direct layout, icon, hierarchy, emphasis, composition, and mood only — never "red", "green", "blue", "gold", etc.

**Second hard constraint:** no slide-placement words. Describe the diagram, never where it sits on the slide or how much air surrounds it — generate-carousel owns placement and spacing (principle 7).

---

## The principles

**1. A consistent visual language, never a repeated composition.** Give the deck a shared vocabulary (a recurring node style, a common grid, one type system, the theme's palette) so it reads as one system, not N unrelated diagrams. But coherence is a shared *language*, NOT the same picture on every slide. Every slide must earn its own composition: vary the vantage, scale, layout, and focal element from slide to slide. Reuse the language, reinvent the shot. Repeating one identical layout across a run of slides (the same three boxes 15 times) is the single fastest way to make a deck boring, and a reader swipes away. If three or more slides could be swapped without a reader noticing, that is monotony masquerading as coherence, and it is a defect, not a virtue. Even a genuinely repeated content unit (a glossary, a checklist) must change its vantage, scale, or layout each slide so no two frames read as the same shot.

**2. One hero focal point per slide.** Each slide has a single dominant element. Promote the emotional payload — the transformation stat, the pivotal concept — to a hero element ("large and bold beneath the flow", "dead center, drawn larger than the nodes feeding it"), not a buried callout. A slide with five equally weighted elements has no focal point and the eye finds nothing.

**3. Hierarchical and emotional staging.** Use scale and emphasis to *carry meaning*, not just to decorate. Dwarf a backlog with a small human figure so the reader *feels* the weight. Subordinate the "wrong path" or secondary elements ("lower emphasis", "small and de-emphasized in a corner"). Let the layout argue the point: a "pain first, tech second" slide should visually shrink the technology.

**4. The cover is a single strong hero metaphor.** A ≤2-line title (drawn from the caption's hook) plus one dominant image that conveys the whole thesis with restraint, plus no body text. Stay in the theme's temperament — restraint, not a busy collage (you never name colors, but you do direct simplicity). A long cover title wraps and steals room from the hero.

**5. Screenshot-worthy reference slides.** Recap or checklist slides get generous whitespace and even weighting so a reader can save the single slide standalone and still have the whole takeaway.

**6. Name real brands and tools so the renderer uses their logos.** If a slide involves Slack, Google Docs, Claude, and so on, say so by name — generate-carousel maps named brands to real logo assets. "a Slack icon", "the Claude node", "a Google Docs mockup" render better than "a chat app" or "a document tool".

**7. Describe the visual, never its position in the slide.** A `Visual:` line owns what the diagram *is* — its subject, composition, vantage, scale, hierarchy, and internal cropping. It does NOT own where the diagram sits on the slide, how much air surrounds it, or how it relates to the title, the body copy, or the footer. generate-carousel places the visual and distributes the whitespace between text, diagram, and footer; a direction that also tries to place it fights the renderer and produces uneven, lopsided slides.

Compose *within the frame of the visual itself*, which is the only frame a direction may refer to. "Cropped hard by the edges", "fills its frame edge to edge", "small and dead centre in a large empty field" all describe the diagram's own composition and are fine. "Bottom-anchored", "sitting low in the slide", "top two thirds of the slide left empty", "generous empty air above for the title", "the base of the slide belongs to the band alone" are slide-placement instructions: strip them.

- Weak: "WIDE horizontal march, bottom-anchored, top two thirds of the frame empty. A baseline hairline runs left to right."
- Strong: "WIDE horizontal march. A baseline hairline runs left to right, with the row of ticks standing on it low in the composition."
- Why: the second describes the diagram's internal balance; the first tries to lay out the slide.

**8. Dimension 13 on the labels.** The words *inside* the graphic — a gauge label, an axis caption, a node name — must use language the post's ICP grasps. This is the sneakiest place for jargon because the caption never contains label text, so the caption-level checks never catch it (this is where a term like "eval pass rate" slips onto a cover). Propose a plain-language swap for each too-technical label; the user confirms; pillar-calibrated.

---

## Before / after (from a real deck)

**Cover — single hero metaphor**
- Weak: "Scales of justice icon intersecting with a gear or AI symbol."
- Strong: "Cover. Short bold title anchored low. Hero image fills the frame: scales of justice, perfectly balanced, with a legal document on one pan and a network of AI nodes on the other. Law and AI in equilibrium. No body text."
- Why: one hero metaphor that conveys the whole thesis (law and AI in balance), not two clip-art symbols side by side.

**Recap — screenshot-worthy**
- Weak: "Numbered list 1 to 5 with an icon next to each."
- Strong: "Five clean numbered rows, each with one distinct icon and a few-word label, evenly spaced with generous whitespace. Designed to scan in seconds and be screenshot-worthy as a standalone checklist."
- Why: names the intent (a saveable reference) and the composition (whitespace, even weighting).

**The pivotal slide — hero focal point + motif**
- Weak: "A pipeline with AI outputs and a human check."
- Strong: "The hero frame of the deck. Several AI outputs flow along a single track toward the exit, but every one must pass through a prominent human approval gate positioned dead center and drawn larger than the AI nodes feeding it. Nothing bypasses the gate. The gate is unmistakably the focal point."
- Why: gives the slide a clear hero (the gate), reinforces the deck's motif (the recurring gate), and stages hierarchy (gate larger than nodes).

**Emotional staging**
- Weak: "A stamp and some files."
- Strong: "An oversized DENIED stamp pressing down onto a tall, leaning stack of pending files. A small figure stands beside the stack, dwarfed by it, conveying backlog and drag. Heavy, weighed-down mood."
- Why: the reader *feels* the backlog through scale, rather than reading a neutral icon.

**Layout that argues the point**
- Weak: "A whiteboard with three questions and some tool icons."
- Strong: "A whiteboard as the focal point, the three handwritten questions dominant. A bold arrow leads from the questions to a short, prioritized task list. Tool and app icons sit small and de-emphasized in a corner, clearly subordinate to the pain list."
- Why: the composition itself says "pain first, tech second" by shrinking the tech.

---

## Quick check before handing off

- Every `Visual:` line names a single focal point.
- The deck shares a recurring visual language, not N unrelated diagrams.
- No run of slides repeats an identical composition. Every slide, including any glossary or checklist run, has its own vantage/scale/layout. Sameness is a defect, not coherence.
- Zero color words anywhere in the directions.
- Real brands/tools named where they appear.
- No jargon in any label a non-expert ICP would not grasp (proposed swaps confirmed).
