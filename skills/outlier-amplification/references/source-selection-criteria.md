<overview>
Not every source the research agents find should become a Knowledge Item. These criteria filter research results into the strongest candidates for LinkedIn content that drives engagement from the target ICP.
</overview>

<primary_criteria>
Every candidate KI must pass ALL five:

**1. Has named companies or hard numbers**
Abstract thought pieces don't generate outlier-level engagement. The source must contain at least one of:
- Named firm(s) with specific outcomes
- Hard metrics (percentages, dollar amounts, hours saved, sample sizes)
- Direct quotes from named individuals

**2. Published within the last 18 months**
Stale data undermines credibility. Legal leaders check dates. If the source is older than 18 months, it must contain data that is still current and verifiable. Survey data older than 24 months should be rejected.

**3. Business-accessible language**
Even if the source is a technical report, the key finding must be expressible in business terms without jargon. If explaining the finding requires a technology primer, it's too technical for the target audience.

**4. Maps to one of the 5 emotional registers**
Every KI must have a clear primary register and optionally a secondary. If the source doesn't trigger any of the five registers, it's informational but not engaging. See `references/emotional-registers.md`.

**5. Gives the author a credibility bridge**
The finding must connect naturally to the author's expertise. The audience reaction should be "who can help me do this?" with the implicit answer being the author. If there's no bridge, the post becomes journalism, not thought leadership.
</primary_criteria>

<secondary_criteria>
Use these to rank among candidates that pass all five primary criteria:

**Novelty:** Has this data been widely shared on LinkedIn already? Over-circulated stats (e.g., "AI will automate X% of jobs") trigger feed blindness. Prefer less-known findings from credible sources.

**Debate potential:** Will this finding generate comments? Data that people agree with gets likes. Data that people disagree about gets comments. The algorithm rewards comments more than likes.

**Carousel/infographic potential:** Can the finding be visualized? Data with clear before/after, step frameworks, or comparison tables maps well to carousel slides and infographics.

**ICP geographic relevance:** Sources from the target ICP's region (e.g., GCC, Middle East, EU) get higher weight than US-only sources when the ICP operates in those regions. Global data with regional breakdowns is ideal.
</secondary_criteria>

<source_categories>
Research agents should cover these categories. Not all will be relevant for every amplification campaign — select based on the outlier's theme:

| Category | What to look for | Typical sources |
|---|---|---|
| Named-firm case studies | Specific deployment stories with metrics | Vendor customer pages, press releases, Forrester TEI studies |
| Industry survey data | Adoption rates, ROI data, trend lines | Clio, Thomson Reuters, Wolters Kluwer, ACC, CLOC annual reports |
| Governance/regulatory | Court rules, bar association opinions, regulatory frameworks | ABA, DIFC Courts, EU AI Act, SDAIA, state bar associations |
| Strategy/disruption | Business model changes, pricing shifts, market structure | McKinsey, BCG, Deloitte legal sections, Georgetown Law, VC analysis |
| Contrarian/cautionary | Failure rates, reality checks, cancelled projects | Gartner predictions, Forrester reality checks, court sanctions |
| Talent/culture | Associate surveys, hiring trends, skills gaps | Chambers, Axios, law school reports, NALP data |
</source_categories>

<url_verification>
Before presenting candidates to the user:

1. **Check accessibility:** Is the URL publicly accessible or gated behind a form/paywall?
2. **For gated URLs:** Find a public alternative — analysis articles, press coverage, or blog posts that cover the same findings with sufficient detail.
3. **For dead URLs (404):** Search for the content at an alternative URL or archived version.
4. **For Content-only approach:** If no public URL exists but the user can provide the document (PDF, report), use the Content field without a Source URL. The ingester handles this path.

Flag all URL issues to the user during Phase 4 (Curation) before creating records.
</url_verification>

<supporting_stats_mapping>
Each primary KI should carry 2-4 supporting stats in its Content field. Map supporting stats based on:

1. **Reinforcement:** The supporting stat strengthens the primary KI's argument (e.g., an adoption survey stat supporting a case study)
2. **Context setting:** The supporting stat establishes the market reality the primary KI illustrates (e.g., "$6B in legal tech funding" contextualizes a specific firm's adoption)
3. **Credibility stacking:** Multiple independent sources saying the same thing is more persuasive than one source with one number

Format supporting stats with source attribution and `---` delimiters:
```
---
Supporting evidence from independent industry sources:

- [Specific stat with number]
  ([Source name, date, sample size if applicable])

- [Another stat]
  ([Source name, date])
---
```
</supporting_stats_mapping>
