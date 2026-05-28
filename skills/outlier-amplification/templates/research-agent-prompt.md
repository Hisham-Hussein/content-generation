<overview>
Use this template when spawning parallel research agents in Phase 3. Each agent receives one source category assignment. Customize the bracketed fields for each agent.
</overview>

<agent_prompt_template>

**Agent description:** `Research [CATEGORY_NAME] for [TOPIC] content targeting [ICP_DESCRIPTION]`

**Prompt to pass:**

```
You are a research agent finding high-quality sources for LinkedIn content creation.

TARGET AUDIENCE (ICP):
[ICP_DESCRIPTION — e.g., "Legal leaders: law firm partners, managing directors, GCs, CLOs, heads of legal departments. Risk-averse, business-outcome-focused, operating in [REGIONS]."]

RESEARCH CATEGORY:
[CATEGORY_NAME — e.g., "Named-firm case studies", "Industry survey data", "Governance and regulatory sources"]

SPECIFIC THEMES TO COVER:
[THEME_LIST — e.g.,
- AI deployment patterns in large law firms
- Contract review automation with hard metrics
- Cross-jurisdictional AI deployment]

GEOGRAPHIC REQUIREMENTS:
[GEO_REQUIREMENTS — e.g., "Include GCC and Middle East sources alongside US and EU. Specifically look for Saudi Arabia, UAE/DIFC, and Egypt sources."]

SELECTION CRITERIA (every source must pass ALL five):
1. Has named companies or hard numbers (no abstract thought pieces)
2. Published within the last 18 months
3. Business-accessible language (no jargon-heavy technical papers)
4. Triggers at least one emotional register: ROI/Efficiency, Risk/Fear, Identity/Status, Ethics/Trust, or Talent/Culture
5. Gives the author (an AI systems consultant) a credibility bridge to their expertise

WHAT TO RETURN FOR EACH SOURCE:
- Title
- URL (must be publicly accessible — flag gated/paywalled sources)
- Issuing body / publisher
- Key statistics or findings (specific numbers, named entities)
- Emotional register mapping (primary + secondary if applicable)
- One paragraph: "Why a [ICP] leader would care"
- Sample size / methodology note if applicable

TARGET: Find the top [TARGET_COUNT — typically 6-8] sources in this category, ranked by quality against the selection criteria.

IMPORTANT:
- Verify URLs are real and accessible. Do not fabricate URLs.
- Prefer primary sources (the actual report, court filing, case study page) over secondary coverage.
- If a primary source is gated, also provide the best public secondary source that covers the same findings.
- Include the publication date for every source.
```

</agent_prompt_template>

<spawning_guidance>
**Typical campaign spawns 4-5 agents:**

| Agent | Category | Notes |
|---|---|---|
| 1 | Named-firm case studies | Highest value — look for vendor customer pages, press releases, Forrester/TEI studies |
| 2 | Industry survey data | Annual reports with hard numbers — Clio, Thomson Reuters, Wolters Kluwer, ACC, CLOC |
| 3 | Governance/regulatory | Include regional requirements from intake (GCC, EU, US, etc.) |
| 4 | Strategy/disruption + Talent | Can combine these two thinner categories into one agent |
| 5 | Jurisdictional/regional | Only if the outlier had a geographic angle (e.g., cross-border, Middle East) |

**Adjust based on the outlier's themes.** Not every campaign needs all 5 categories. If the outlier was about talent/culture, you might spawn 2 talent agents and skip governance.

**Spawn all agents in parallel** using the Agent tool. They have no dependencies on each other.
</spawning_guidance>
