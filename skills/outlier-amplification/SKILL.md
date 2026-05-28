---
name: outlier-amplification
description: Use when a LinkedIn post outperformed expectations and the user wants to systematically research and create more Knowledge Items to reproduce that success. Triggers on "amplify this outlier", "mine this post", "more like post X", "this post performed well", "expand on this post's success", or when the user identifies a high-performing post and wants to create similar content fuel.
---

<essential_principles>

**1. The hook is a first-class artifact, not an afterthought.**
Hook analysis in Phase 1 and hook sketching in Phase 4 ensure research is optimized for scroll-stopping content. A Knowledge Item that can't support a strong hook is a weak KI regardless of how interesting the data is.

**2. The 5-register framework prevents content monotony.**
Without it, every post sounds like "AI saves time and money." The registers force emotional diversity across the content calendar. See `references/emotional-registers.md`.

| Register | What it triggers |
|---|---|
| ROI/Efficiency | "This makes business sense" |
| Risk/Fear | "My competitor is ahead" |
| Identity/Status | "Careful people like me are doing this" |
| Ethics/Trust | "I need to get this right" |
| Talent/Culture | "This affects my people" |

**3. Named firms and hard numbers are non-negotiable.**
Post 12 proved this: nobody engaged because of the technology. They engaged because A&O Shearman, JPMorgan, 4,000 lawyers, 43 jurisdictions, 360,000 hours. Abstract thought pieces don't generate outlier-level engagement.

**4. Supporting stats are embedded, not separate records.**
Primary KIs carry supporting evidence in the Content field. This works with the existing ingestion pipeline (knowledge-ingester.ts concatenates Content after URL extraction). No schema changes needed.

**5. Collaborative where judgment matters, autonomous where mechanical.**
Phases 1, 2, and 4 require the user's domain expertise and editorial judgment. Phases 3, 5, and 6 are execution. Never skip the collaborative checkpoints.

**6. URL verification before commitment.**
Never create a KI with a dead or gated URL. Verify first, find public alternatives, or use Content-field-only approach.

**7. Outlier lineage closes the feedback loop.**
Every new KI traces back to the outlier that inspired it. When future posts generated from these KIs perform (or don't), trace back to measure which amplification campaigns actually work.

</essential_principles>

<objective>
When a LinkedIn post outperforms expectations, this skill systematically decomposes what made it work (hook, emotional register, data elements, ICP resonance), expands into adjacent themes, researches high-quality sources via parallel agents, and creates new Knowledge Items in Airtable to fuel future posts of similar quality. It transforms a single outlier into a content campaign.
</objective>

<quick_start>
Provide a post identifier (number, Airtable record ID, or generated folder path). The skill walks through 6 phases:

1. **Decompose** the outlier (hook, registers, data, ICP resonance) — collaborative
2. **Expand** into adjacent themes using the 5-register framework — collaborative
3. **Research** via parallel agents across source categories — autonomous
4. **Curate** the shortlist, verify URLs, sketch hooks — collaborative
5. **Create** Knowledge Items in Airtable with supporting stats — autonomous
6. **Validate** with a quick generation test — autonomous
</quick_start>

<intake>
To begin, provide the outlier post. Accepted formats:

- Post number: "post 12", "number 12"
- Generated folder path: `config/tenant-brands/{tenant}/generated/{folder-name}/`
- Airtable record ID: `recXXXXXXXXXXXXXX`

Also share any qualitative observations:
- What engagement did you see? (followers, comments, DMs, ICP profile of responders)
- Which ICP segment responded most strongly?
- What surprised you about the response?

**Wait for the user to provide the post before proceeding.**
</intake>

<routing>
This skill has one primary workflow. After intake, proceed to:

**`workflows/amplify-outlier.md`** — The 6-phase amplification workflow.

**After reading the workflow, follow it exactly.**
</routing>

<reference_index>
All domain knowledge in `references/`:

**Frameworks:** emotional-registers.md (5-register framework for content diversity)
**Analysis:** hook-patterns.md (hook dissection methodology and pattern library)
**Research:** source-selection-criteria.md (quality filters for research sources)
</reference_index>

<templates_index>
**Research:** templates/research-agent-prompt.md (agent spawn template for parallel research)
</templates_index>

<success_criteria>
The skill is complete when:

- Outlier post is fully decomposed (hook pattern, registers, data elements, ICP resonance)
- Adjacent themes are identified across all 5 emotional registers
- Research agents have returned ranked sources
- A structured research document exists in `artifacts/research/`
- 7-10 Knowledge Items are created in Airtable with verified URLs and supporting stats
- At least one KI has been validated with a quick generation test
- Research index (`artifacts/research/RESEARCH_INDEX.md`) is updated
</success_criteria>
