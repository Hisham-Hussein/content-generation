---
name: build-icp-list
description: Use when building or refreshing the ICP target-account list for an industry cluster — sourcing candidate companies and buying-committee contacts, tiering them by signals, and presenting a scored bench for Hisham's approval before onboarding. Triggers on "build the ICP list", "source ICP candidates", "find target accounts for [industry]", "fill the [edtech/legal/retail/marketing] cluster", "who else should we target", "refresh the bench", "promote from the bench", or whenever Hisham names an industry and wants companies/people to pursue. Also use to re-tier existing accounts when campaign feedback or new triggers arrive.
---

<objective>
Source, qualify, and tier up to ~50 candidate companies per industry cluster for the iSemantics ABM motion (strategy §8), map their buying-committee contacts, and present a scored bench document for Hisham's approval. NOTHING enters Airtable without approval; approved accounts chain into the `onboard-icp-account` skill. The skill's job is founder-attention allocation: each manual reach-out must count, so every recommendation carries evidence.
</objective>

<essential_principles>

**Canonical sources (read before running):**
- Strategy: `/home/hisham/ai-agency/content-engine/docs/marketing/isemantics/strategy.md` — §8 (ABM rules, tiers, cap), §11 (ICP definition + anti-ICP), §1 (shipped proof by cluster)
- Prior research: `/home/hisham/ai-agency/content-engine/artifacts/research/RESEARCH_INDEX.md` — check for existing cluster scans before re-researching (e.g., `arabic-ai-learning-companion-market-scan.md` for edtech)
- Tiering details + tie-break worksheet: `references/tiering-model.md` (read it whenever assigning tiers)

**Airtable IDs (iSemantics Content Engine, base `appXFk4T8KyNf4odQ`):**
- Companies: `tblJL67KxgQQhoLvD` (Industry `fldw4y1bH3RYsKeDC`, Tier `fldtq3CFkMsbJO4H3`, Warm Path `fldoORk6qbtDlre6Z`, Progression `fldgrAAIX0UArtnZI`)
- ICP Accounts (contacts): `tblOY0n0NKqp9iDsJ` · Outreach: `tblQ9Gi0e5d7OlSfP` · Personas: `tblQ4ggCKuBmkSZ6B`

**Never fabricate.** Company names, LinkedIn URLs, triggers, and warm paths come from search results, scrapes, directories, or Hisham — never from guessing. A LinkedIn URL is only trusted after a scrape verifies the person/company. "No trigger found" is a valid, honest finding — record it; never invent a trigger to justify a candidate (Almentor was onboarded as proof-match-only and that was recorded as such).

**Approval boundary.** The bench document is the skill's output. Airtable writes happen only for accounts Hisham approves, and only via the `onboard-icp-account` chain. Unapproved candidates live in the bench file, not in the base — the Companies table is the *working* list, and Progression Stage has no "candidate" state by design.

**Cost discipline (CLAUDE.md Operating Principle 2).** Web search and research agents are free; profile scraping costs (~$0.003/profile via Apify). Use the two-pass funnel: screen the long list on free evidence (search results, directory data, headlines), scrape only finalists — and confirm with Hisham before any bulk scrape (>10 profiles).

**Outreach copy is out of scope.** This skill ends at onboarding. DMs are drafted later, in English only (Hisham renders Arabic himself), via the Outreach-table flow.

</essential_principles>

<process>

**Step 1: Inputs**

Get from Hisham (or the invocation): the industry cluster (EdTech, Legal, Retail, Marketing/Influencer agencies — the four decided sectors), geography (default: Egypt + GCC; US only for warm/inbound paths per §12), and target bench size (default 50, the §8 per-industry cap).

**Step 2: Load context and dedup baseline**

List existing Companies + ICP Accounts records for the cluster (they are the dedup baseline — a candidate already in the base is never re-sourced, but MAY be re-tiered). Read the strategy sections and any prior research artifacts for the cluster. Note the cluster's shipped proof (§1) — it sets the Validated Demand signal for every candidate.

**Step 3: Source candidates (4 channels, parallel research agents)**

Spawn parallel web-research agents (one per channel or per sub-question), each instructed to return evidence with URLs and to report absence honestly:

1. **Peer mapping** (strongest channel): start from known accounts and clients in the cluster — "who competes with / resembles Almentor, Iqraaly, Aroob, Boom's clients?" One good seed yields many lookalikes. Prior scans often contain ready candidates (the edtech market scan surfaced Noon Academy, Edraak, Nafham, Abwaab).
2. **Sector lists and directories:** industry directories, accelerator/incubator portfolios (§16.5), award lists, market-landscape articles. For legal: the LawNext Directory and Legaltech Hub (both already in the base as amplifiers) are sourcing databases.
3. **LinkedIn discovery:** find people via web search that surfaces LinkedIn URLs (search "<company> CEO LinkedIn", "<role> <industry> <geo> site:linkedin.com"), then verify by scraping. There is no verified people-search actor — never construct profile slugs from names.
4. **Own intent data:** engagers captured by `capture-post-engagers`, amplifier comment sections, and existing base records flagged for the cluster.

Cache agent findings; every candidate carries its source URL(s).

**Step 4: Gate (anti-ICP, §11 — pass/fail, before any scoring)**

Exclude, with the reason recorded: tender-only cold pursuits (a formal RFP with no warm path, no partner, no adjacent shipped proof — an RFP *with* those is pursuable, e.g. IsDB via IFAAS); pre-revenue startups cofounder-hunting; price-shoppers for commodity automations; no nameable pain or no real intent to pay. No signal compensates for failing the gate.

**Step 5: Tier the survivors**

Assign Tier A / B / C per `references/tiering-model.md`. Summary: **A** = gate + (genuine warm path OR fresh live trigger OR validated demand + peers responding) → founder attention this week. **B** = gate + validated demand, no live signal → light touch, watch. **C** = gate only → monitored bench. Apply the three movement rules: warm path promotes a tier (10–20x conversion evidence); triggers decay (full <30 days, half to 90, expired after); 2+ cold peers in the cluster replying promotes the remaining cluster accounts one tier. Use the worksheet's points only to order accounts *within* a tier.

**Step 6: Map buying committees (Tier A + upper Tier B only)**

For each priority company, identify 1–5 contacts with the two-track model: the **entry point** (accessible: posts actively, relevant remit, recent job change — this person gets the first DM; data: C-levels reply ~7% cold, operators ~10%) and the **destination** (role power — the person who must eventually say yes, reached by multithreading from the entry point). Small companies (≤50 people) may collapse both into one person (Iqraaly: the CEO). This is the second scraping pass — confirm cost if >10 profiles.

**Step 7: Calibration (first run per cluster only)**

Before presenting, retro-tier the cluster's known accounts (e.g., edtech: Almentor, Iqraaly, King Fahad, plus one known anti-ICP) with the same rules and check the result matches reality (Iqraaly must come out Tier A on warm path; the anti-ICP must fail the gate). If the model mis-ranks knowns, fix the application — do not present a bench built on rules that fail the calibration.

**Step 8: Present the bench**

Write the bench document to `/home/hisham/ai-agency/content-engine/docs/marketing/isemantics/icp-bench/<cluster>.md` using this exact structure:

```
# <Cluster> ICP bench
**Run date:** <date> · **Sources:** <channels used> · **Calibration:** passed/details
## Tier A — founder attention this week
| Company | Why this tier (signal + evidence URL) | Proposed contacts (entry → destination) | Proof-match |
## Tier B — light touch, watch for signals
| Company | Validated demand basis | Known signals watchlist |
## Tier C — monitored bench
| Company | Gate-pass basis |
## Gated out (with reasons)
## Honest gaps
<candidates where research found no trigger/warm path — stated plainly>
```

Present the Tier A recommendations in conversation (spelled out, not just the file) and ask Hisham which accounts to approve. Never onboard from the bench without explicit per-account approval.

**Step 9: Chain approved accounts into onboarding**

For each approved account, invoke `onboard-icp-account` (its Step 3b creates the Companies record with Industry, Tier, honest Warm Path text, Progression = Unaware; contacts follow). Bench entries that were onboarded get marked `→ onboarded <date>` in the bench file.

**Step 10: Maintenance mode (re-tiering)**

When invoked to re-tier: apply trigger decay, process campaign feedback (2+ cluster replies → promote the cluster's bench accounts one tier; a converted peer maxes Validated Demand for the cluster), promote/demote bench entries, and update both the bench file and — for already-onboarded accounts, with Hisham's confirmation — the Companies records.

</process>

<verification_checklist>
Before presenting any bench, verify with evidence (never from memory):
- [ ] Every candidate has at least one source URL; every claimed trigger/warm path has evidence; every "no trigger found" is stated, not omitted
- [ ] No candidate duplicates an existing Companies/ICP record (dedup list from Step 2 checked by name AND LinkedIn URL)
- [ ] Every gated-out candidate has its gate reason recorded
- [ ] Calibration knowns tier correctly (first run per cluster)
- [ ] No LinkedIn URL appears that wasn't returned by search/scrape (zero constructed slugs)
- [ ] Scrape spend was confirmed with Hisham before any >10-profile pass
- [ ] Zero Airtable writes occurred before per-account approval
- [ ] The bench file exists at the canonical path with all six sections
</verification_checklist>

<success_criteria>
- Bench document written with tiers, evidence URLs, committees, gate exclusions, and honest gaps
- Tier A actionable this week: each has a named entry-point contact and the signal that earned the tier
- Hisham approved/rejected per account; approved ones onboarded via the chain; nothing else touched Airtable
- The verification checklist above passed with observed evidence
</success_criteria>
