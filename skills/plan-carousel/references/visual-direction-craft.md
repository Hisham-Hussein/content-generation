# Visual Direction Craft — the designer pass

A `Visual:` line tells generate-carousel what a slide's illustration should **convey** and how it should be **composed**. The renderer is faithful to your intent, so the rendered slide is only as good as the direction. This file is the "designer pass": read it at Step 5 and elevate every `Visual:` line against the visual contract and the principles below.

**Hard constraint, repeated:** no color words. Palette and contrast come from the theme. Direct layout, icon, hierarchy, emphasis, composition, and mood only — never "red", "green", "blue", "gold", etc.

**Second hard constraint:** no slide-placement words. Describe the illustration, never where it sits on the slide or how much air surrounds it — generate-carousel owns placement and spacing (principle 7).

---

## The visual contract — this outranks every principle below

**Priority order, in this exact order. 1. CLARITY. 2. BEAUTY. 3. VARIETY.** Every principle further down this file is subordinate to it. If a direction is more interesting but less immediately readable, it is wrong. A slide the reader has to work out is a failed slide even if it is the most original frame in the deck.

**1 — Clarity.** The picture must be self-explanatory to the deck's ICP in about three seconds, with no thinking required, before a single label is read. If the reader has to decode the picture before they can decode the idea, the visual failed. A visually premium slide is still a failure when the argument is hard to grasp in the first three seconds.

**2 — Beauty.** Beautiful means visually captivating and elegant. In craft terms: one confident silhouette you could recognise in outline, strong negative space, a memorable shape that survives an hour after the swipe, few elements each earning its place, one surprising but instantly legible juxtaposition, a sense of light and depth even in flat art. Beautiful does NOT mean intricate, encoded, technical, or clever. Elaborate detail is not artistry, it is noise. Elegance comes from subtraction, so the fix for a dull frame is a better idea, never more machinery. When beauty and clarity pull apart, clarity wins and you simplify.

**3 — Variety.** No two slides may resolve to the same picture, and a deck that reads as a few shapes cycled over and over is a failure even when every slide is individually correct (principle 1). Variety is the LAST tie-breaker and never a reason to reach for a stranger subject: get it by giving each slide the form its own content wants, never by getting more obscure and never by trading a literal drawing for an invented one.

**Constraint 1: draw the thing the slide is actually about. Literal first, analogy only if it beats literal.** The default illustration for a slide is a plain, direct picture of its own content: three layers drawn as three stacked bands, a failed run drawn as a row of numbered steps with one marked, three lifespans drawn as three bars of different length. Literal is not boring, it is the fastest thing a reader can decode, and it needs no bridge because the slide text already names everything in it.

An analogy is a substitution — it asks the reader to map one world onto another in two seconds, using a mapping the caption never taught them. It has to earn that cost. Before choosing one, draw the literal version in your head and ask whether the analogy is genuinely clearer. Usually it is not, and the whole deck then reads as a puzzle nobody asked for. A deck whose slide text says "execution, context, compute" and whose pictures say "staircase, hire cabin, hanging lamp" has made every slide harder, not easier, and the author of the post could not decode his own deck.

**The single object rule, which is what the anti-jargon rule actually means:** never use an object the reader cannot name on sight. A caliper, a borehole log, a weld section, a title block or a manifold fails because nobody can name it, not because the topic is technical. A labelled band, a bar, a numbered step, a card, an arrow, a door, a box and a clock all pass. Drawing the subject's own content in plain shapes is not "mirroring the domain" — it is the clearest thing available. Test on every object: would a non-technical founder say its name out loud on sight? If not, replace that object, and prefer the plainest replacement over the most inventive one.

**Constraint 2: it must be SVG-renderable.** generate-carousel builds every visual as flat vector. A direction the renderer cannot draw comes out as meaningless shapes no matter how good the idea was. This killed a deck once: "a block of ice half melted on a worn stone counter, hand-cut contours, one plane of light and one of shadow" rendered as a blue box with a semicircle stuck to it.

You may invent any visual language you like — it does not have to be a known system, and the best decks here invented their own. It only has to be **buildable from flat vector primitives**:

- **Available:** geometric shapes, flat fills, strokes and hairlines, arrows, rounded cards, labelled nodes, silhouettes, simple icons, bars, dials, sliders, gauges, grids, panels, interface mockups, isometric and cutaway construction, charts, connectors. Depth comes from overlap, scale and hierarchy.
- **Not available:** texture, grain, painterly light and shadow modelling, hand-inked or irregular organic contours, still-life realism, anything whose meaning depends on material rendering.

Test: name the primitives the direction is built from. If you cannot list them, the renderer cannot draw it. This is a constraint on the MEDIUM, not on ambition. Flat vector is what every strong editorial infographic already uses, and it has no quality ceiling.

**The decodability gate — a hard gate, not advice.** Before a `Visual:` line is final, answer all five. Any failure means changing the concept, not rewording it.

1. **Is a direct, literal drawing of the slide's own content clearer than this? If yes, use the direct one.** Ask this FIRST, before the concept is chosen, not as a last check on a metaphor you already like.
2. What relationship does this slide assert — cause, comparison, hierarchy, sequence, or transformation?
3. What does each major element in the picture mean, and does the slide text name it? If an element appears in the picture but nowhere in the words, the reader has to learn it cold.
4. Could a NON-TECHNICAL member of this deck's ICP recover that relationship from the picture alone, in three seconds, with every label covered? "An informed viewer could work it out" is NOT a pass. The test is the actual ICP, cold.
5. What plausible but WRONG reading could this picture create?

Novelty does not compensate for semantic weakness, and a visually dramatic metaphor is not automatically an explanatory one.

**The beauty gate — the second objective, with the same weight as the first.** Answered per slide, alongside the decodability gate.

1. With every word covered, would a stranger stop scrolling for this frame?
2. Is there one shape here they would still remember an hour later?
3. Does it look composed, or assembled from parts?
4. Would someone screenshot this for how it *looks*, independent of what it says?
5. Is anything in the frame doing nothing? If yes, remove it.

A slide that passes decodability and fails this is not finished. Clarity is the floor; beauty is the reason anyone stops.

---

## The principles

**1. Consistent conventions, twenty different pictures.** Coherence does NOT come from repeating shapes. It comes from the brand kit, which generate-carousel applies to every slide whatever each visual draws: one typeface and weight scale, one stroke weight, one icon treatment, the theme palette, the tag pill, the footer. On top of that the deck holds to a thin set of conventions — how emphasis is marked, what any repeated visual state means, label style and length, overall density — and nothing more.

Do NOT give a deck one recurring motif, one metaphor world, or a small kit of forms every slide reuses. Both failures on record came from that instruction: a deck relocated into a house-and-street analogy, and a deck built from four geometric forms cycled across twenty slides, where a blind reader said "by slide 10 I stopped expecting a new shape." Each slide takes the clearest literal form for its OWN content — a timeline where the content is time, a fan where things converge, a container where something is being missed, a ring where it loops, a ladder, a gauge, a counter, a two-column comparison, a before and after, a nesting, a map.

The defect to hunt is two slides resolving to the same picture, judged across every pair and not just neighbours, plus the whole-deck read: if a reader scrolling it would say "the same few shapes over and over", it fails however each line is worded. Fix it by giving the slide a genuinely different form, never a different crop of the same one. The only repeat that survives is one the deck is arguing (a real before-and-after, a deliberate callback), and it is stated as deliberate. Variety still ranks BELOW clarity: reach for a clearer form that is simply different, never a subject the reader has to decode.

**2. One hero focal point per slide.** Each slide has a single dominant element. Promote the emotional payload — the transformation stat, the pivotal concept — to a hero element ("large and bold beneath the flow", "dead center, drawn larger than the nodes feeding it"), not a buried callout. A slide with five equally weighted elements has no focal point and the eye finds nothing.

**3. Hierarchical and emotional staging.** Use scale and emphasis to *carry meaning*, not just to decorate. Dwarf a backlog with a small human figure so the reader *feels* the weight. Subordinate the "wrong path" or secondary elements ("lower emphasis", "small and de-emphasized in a corner"). Let the layout argue the point: a "pain first, tech second" slide should visually shrink the technology.

**4. The cover is a single strong hero metaphor.** A ≤2-line title (drawn from the caption's hook) plus one dominant image that conveys the whole thesis with restraint, plus no body text. Stay in the theme's temperament — restraint, not a busy collage (you never name colors, but you do direct simplicity). A long cover title wraps and steals room from the hero.

**5. Screenshot-worthy reference slides — and the enumeration trap.** Recap or checklist slides get generous whitespace and even weighting so a reader can save the single slide standalone and still have the whole takeaway.

**A slide whose job is to NAME things is allowed to be a labelled diagram of the actual thing, and usually should be.** If the text says "an agent system splits into three layers: execution, context, and compute", the right picture is three stacked labelled bands. Not a metaphor. The reader's eye goes to the picture, reads three, reads the names, and moves on. That is a success, not a failure of imagination.

The one thing to avoid is drawing a set as a row of equals when the set has a real relationship in it — stacking, dependency, sequence, containment, relative permanence. Layers stack, so stack them; stages follow, so sequence them; tools serving one thing touch that thing. The relationship costs nothing to draw and it turns an inventory into a picture. But when the relationship genuinely is "these are peers", a plain row is the honest drawing, and a plain row is far better than an invented scene.

Break up visual sameness across a run of naming slides with vantage, scale and crop, never by swapping the literal drawing for an analogy.

**6. Name real brands and tools so the renderer uses their logos.** If a slide involves Slack, Google Docs, Claude, and so on, say so by name — generate-carousel maps named brands to real logo assets. "a Slack icon", "the Claude node", "a Google Docs mockup" render better than "a chat app" or "a document tool".

**7. Describe the visual, never its position in the slide.** A `Visual:` line owns what the illustration *is* — its subject, composition, vantage, scale, hierarchy, and internal cropping. It does NOT own where the diagram sits on the slide, how much air surrounds it, or how it relates to the title, the body copy, or the footer. generate-carousel places the visual and distributes the whitespace between text, diagram, and footer; a direction that also tries to place it fights the renderer and produces uneven, lopsided slides.

Compose *within the frame of the visual itself*, which is the only frame a direction may refer to. "Cropped hard by the edges", "fills its frame edge to edge", "small and dead centre in a large empty field" all describe the diagram's own composition and are fine. "Bottom-anchored", "sitting low in the slide", "top two thirds of the slide left empty", "generous empty air above for the title", "the base of the slide belongs to the band alone" are slide-placement instructions: strip them.

- Weak: "WIDE horizontal march, bottom-anchored, top two thirds of the frame empty. A row of doors recedes into the distance."
- Strong: "WIDE horizontal march. A row of doors recedes into the distance along a single floor line, standing low in the composition."
- Why: the second describes the diagram's internal balance; the first tries to lay out the slide.

**8. Dimension 13 on the labels.** The words *inside* the graphic — a word on a signpost, a caption under an object, a name on a label — must use language the post's ICP grasps. This is the sneakiest place for jargon because the caption never contains label text, so the caption-level checks never catch it (this is where a term like "eval pass rate" slips onto a cover). Propose a plain-language swap for each too-technical label; the user confirms; pillar-calibrated. Labels are the last mile of clarity, not the first: a picture that only makes sense once its labels are read has already failed the decodability gate.

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

**The pivotal slide — hero focal point**
- Weak: "A pipeline with AI outputs and a human check."
- Strong: "The hero frame of the deck. Several AI outputs flow along a single track toward the exit, but every one must pass through a prominent human approval gate positioned dead center and drawn larger than the AI nodes feeding it. Nothing bypasses the gate. The gate is unmistakably the focal point."
- Why: gives the slide a clear hero (the gate) and stages hierarchy (gate larger than nodes). Note this form belongs to this slide alone; the next slide takes whatever form its own content wants.

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

- Every `Visual:` line passes the decodability gate: a non-technical ICP reader names each object on sight and gets the relationship in three seconds with the labels covered.
- Every `Visual:` line passes the beauty gate: a stranger would stop for it with the words covered, and one shape in it is memorable.
- Every slide either draws its own content literally, or its analogy was chosen because it beat the literal drawing on clarity, and the deck text names what the picture shows.
- No object in any direction is one the ICP could not name on sight.
- Every `Visual:` line names a single focal point.
- No two slides resolve to the same picture, and the deck does not read as a few shapes cycled. Coherence is carried by the brand kit and the stated conventions, never by repeating a form.
- No run of slides repeats an identical composition. Every slide, including any glossary or checklist run, has its own form. Sameness is a defect, not coherence.
- Zero color words anywhere in the directions.
- Real brands/tools named where they appear.
- No jargon in any label a non-expert ICP would not grasp (proposed swaps confirmed).
