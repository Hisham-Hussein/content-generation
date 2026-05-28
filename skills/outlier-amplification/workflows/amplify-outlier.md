<required_reading>
**Read these reference files NOW before proceeding:**
1. `references/emotional-registers.md` — The 5-register framework
2. `references/hook-patterns.md` — Hook dissection methodology
3. `references/source-selection-criteria.md` — Research quality filters
</required_reading>

<process>

<phase number="1" name="Decompose the Outlier" mode="collaborative">

**Step 1.1 — Pull the post and its source KIs**

- Read the post text from the generated folder (look for `post-text.txt` or `post.txt`)
- Identify the post's linked Knowledge Items from Airtable (check the Posts table for linked KI records)
- Note any engagement data the user shared (follower count, ICP profile of responders, comments, DMs)

**Step 1.2 — Hook dissection**

Using the methodology from `references/hook-patterns.md`:

- Isolate lines 1-3 (the pre-fold hook)
- Classify the hook pattern: belief-reversal, data-shock, curiosity-gap, contrarian, or story-entry
- Identify the specificity anchors (exact words that carry weight: numbers, names, scale markers)
- Analyze the tone (confrontational? respectful? authoritative?)
- Map to audience psychology: why did THIS pattern work for THIS ICP?
- Extract the transferable formula for reuse with different data

**Step 1.3 — Body and structure analysis**

- Identify the emotional register(s) from `references/emotional-registers.md`
- Map data elements: named firms, hard numbers, before/after contrasts, direct quotes
- Identify the credibility bridge: how does the author connect external data to their own expertise?
- Identify the CTA pattern: generic engagement bait vs. specific question tied to content
- Note the "so what for you" bridge: how does the post scale the insight to the reader's own situation?

**Step 1.4 — ICP resonance mapping**

- Which ICP segment responded? (job titles, industries, seniority)
- Which product/pillar does this post connect to?
- Why did THIS topic resonate with THIS ICP? (their specific fears, ambitions, pressures)

**Step 1.5 — Present decomposition to user**

Present a structured summary covering:
- Hook pattern + formula
- Emotional registers used
- Data elements and credibility bridge
- ICP resonance + product connection
- Transferable patterns for new content

**Ask the user to confirm, correct, or add qualitative observations.** Do not proceed to Phase 2 until the user confirms.

</phase>

<phase number="2" name="Expand Themes" mode="collaborative">

**Step 2.1 — Adjacent theme brainstorming**

From the outlier's topic, propose 5-8 adjacent themes the same ICP would care about:

- Use the 5-register framework to ensure theme diversity (not all ROI, not all fear)
- Include at least one theme the user didn't mention — challenge their initial list
- Include at least one contrarian/skeptical theme for trust-building content
- Consider geographic angles relevant to the user's ICP (GCC, Middle East, EU, US)

**Step 2.2 — Source category design**

Define research source categories tailored to the themes. Use the categories from `references/source-selection-criteria.md` as starting points:

- Named-firm case studies
- Industry survey data with hard numbers
- Governance/regulatory sources (specify regional requirements)
- Strategy/disruption pieces
- Contrarian/cautionary data
- Talent/culture studies

For each category, confirm the selection criteria from `references/source-selection-criteria.md` apply, and note any additions specific to this campaign.

**Step 2.3 — Target and register spread**

Propose:
- Target KI count (typically 7-10)
- Register coverage target (reference the table in `references/emotional-registers.md`)
- Number of research agents to spawn and their category assignments

**Present the full research plan to the user. Do not proceed to Phase 3 until the user confirms.**

</phase>

<phase number="3" name="Research" mode="autonomous">

**Step 3.1 — Spawn parallel research agents**

Read `templates/research-agent-prompt.md` for the agent prompt template.

For each source category agreed in Phase 2:
- Customize the template with: ICP description, category name, specific themes, geographic requirements, target count
- Spawn the agent using the Agent tool
- All agents run in parallel (no dependencies between them)

**Step 3.2 — Synthesize into research document**

After all agents return:

- Invoke the deep-dive research skill (`taches-cc-resources:research:deep-dive`) for structured synthesis
- Output: research artifact in `artifacts/research/` following naming convention: `YYYY-MM-DD-{topic}-deep-dive.md`
- The document must include:
  - All sources ranked with selection rationale
  - Register coverage map
  - Rejected sources with reasoning
  - Supporting data points (sources useful as supplementary stats but not standalone KIs)

**Present a summary of findings to the user before proceeding to Phase 4.** Include:
- Total sources found across all agents
- Top highlights (most striking stats, strongest case studies)
- Any gaps in register coverage
- Any URL issues discovered

</phase>

<phase number="4" name="Curate" mode="collaborative">

**Step 4.1 — Present ranked shortlist**

Deduplicate across agents and present the top N candidates:

| Column | What to show |
|---|---|
| Title | Descriptive, includes strongest stat or named entity |
| Source | Publisher/issuing body |
| Strongest finding | The one number or fact that would stop the scroll |
| Register | Primary (+ secondary if applicable) |
| Post angle | One-line hook concept |
| URL status | Public / Gated (alternative found) / Content-only |

Show the register coverage table — are all 5 registers represented?

**Step 4.2 — URL verification**

For every candidate:
1. Verify the URL is accessible (not 404, not gated behind a form)
2. For gated URLs: propose a public alternative or flag for Content-field-only approach
3. For dead URLs: search for the content at an alternative URL
4. Present the corrected URL list to the user

**Step 4.3 — Supporting stats mapping**

For each primary KI, propose 2-4 supporting stats from other sources (using the mapping guidance from `references/source-selection-criteria.md`):

| Primary KI | Supporting Stats | Why These |
|---|---|---|
| [KI title] | [Stat + source] | [Reinforcement / context / credibility stacking] |

**Step 4.4 — Hook sketches**

For each selected KI, sketch a hook using the pattern identified in Phase 1 (or an alternative pattern from `references/hook-patterns.md` if better suited):

- 2-3 lines maximum per sketch
- These are proof of concept, not final copy
- If you can't write a strong hook from the KI's data, flag it — the KI may be too abstract

**Present the complete curation package to the user. Do not proceed to Phase 5 until the user confirms selections.**

</phase>

<phase number="5" name="Create Knowledge Items" mode="autonomous">

**Step 5.1 — Prepare KI records**

For each confirmed KI, prepare the Airtable record with these fields:

| Field | Value |
|---|---|
| Title | Descriptive title with strongest stat or named entity |
| Type | "External Knowledge" |
| Source URL | Verified public URL (or blank if Content-only) |
| Content | Supporting stats formatted per `references/source-selection-criteria.md` |
| Pillar Alignment | Link to appropriate pillar record(s) from tenant config |
| Priority | "High" |
| Origin | "Manual" |

**Step 5.2 — Add outlier lineage tag**

In each KI's Content field, prepend the lineage tag:

```
[Amplified from: {outlier post title or number} — {date of amplification}]

---
Supporting evidence from independent industry sources:
...
```

This traces the KI back to the outlier that inspired it for future performance measurement.

**Step 5.3 — Create records in Airtable**

- Use the Airtable MCP tools to create all KI records
- Batch where possible (Airtable supports up to 10 records per create call)
- Confirm record IDs after creation
- Present the complete inventory table to the user

**Step 5.4 — Verify URL extractability (for Source URL KIs)**

For KIs with Source URLs, note that the ingestion pipeline will extract content from the URL. If you identified any URLs during Phase 4 that may have extraction issues (JavaScript-heavy pages, PDF-only, etc.), flag them here so the user can provide the content manually if needed.

</phase>

<phase number="6" name="Validate" mode="autonomous">

**Step 6.1 — Quick generation test**

Pick the strongest KI (highest quality data, clearest hook potential). After the ingestion pipeline has processed it (or if summary/key insights are already populated):

- Spawn a lightweight agent (Haiku) with ONLY the Extracted Summary and Key Insights fields
- Ask it to draft a post from these two fields alone
- Present the draft to the user with an honest critique:
  - Does the KI data produce a coherent post?
  - Is there enough specificity for a strong hook?
  - Are the data elements (names, numbers, quotes) preserved in the summary?
  - What would the full generation pipeline improve? (voice matching, credibility bridge, CTA patterns)

This validates that the KI data quality is strong enough for the pipeline.

**Step 6.2 — Update research index**

Add the new research artifact to `artifacts/research/RESEARCH_INDEX.md`:

```markdown
| Date | Title | Trigger | KIs Created |
|---|---|---|---|
| YYYY-MM-DD | {Research title} | Outlier amplification from Post {N} | {count} KIs |
```

**Step 6.3 — Summary report**

Present to the user:

- Total KIs created with record IDs
- Register coverage achieved vs. target
- Pillar alignment breakdown
- Any follow-up actions needed:
  - Gated URLs needing user-provided documents
  - KIs needing manual Content enrichment
  - Suggested ingestion trigger timing
- Outlier lineage tag format used (for future performance tracking)

</phase>

</process>

<success_criteria>
This workflow is complete when:

- [ ] Outlier post fully decomposed: hook pattern, registers, data elements, ICP resonance
- [ ] Adjacent themes identified across all 5 emotional registers
- [ ] Research agents returned ranked sources from all assigned categories
- [ ] Research document saved in `artifacts/research/` with proper naming
- [ ] User confirmed the curated shortlist (7-10 KIs)
- [ ] All URLs verified as accessible (or alternatives found)
- [ ] Supporting stats mapped to each primary KI
- [ ] Hook sketches written for all selected KIs
- [ ] All KI records created in Airtable with outlier lineage tags
- [ ] At least one KI validated with quick generation test
- [ ] Research index updated
- [ ] Summary report presented to user
</success_criteria>
