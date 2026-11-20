---
name: seo-keyword-research
description: Plans a product's SEO content from real keyword data - pillars, seed keywords, DataForSEO keyword and competitor fetches, relevance scoring, and a page plan (one primary keyword per page) saved to the product's Airtable base. Use whenever Hisham wants keyword research, an SEO content plan, a keyword-to-page map, competitor keywords, "what should we write for SEO", or to refresh or extend an existing keyword plan for Kastio or any product with a .agents/product-marketing.md, including Arabic / MENA markets, even if he doesn't say "DataForSEO" or "Airtable".
---

# SEO keyword research

A run turns a product's marketing context into a living keyword plan in its Airtable base: **Pillars → Pages → Keyword Ideas**, plus one run-log row in Search Requests. A script (the content-engine CLI) does every fetch, merge and write; you make every judgment. Re-runs extend the same plan.

Design spec, if a rule here is unclear: `~/ai-agency/content-engine/docs/superpowers/specs/2026-11-14-seo-keyword-research-skill-design.md`.

## Ground rules

These come from how Hisham works and from the spec's anti-goals; each has a reason.

- **Money and Airtable need his yes, every time.** DataForSEO calls cost real money, and the base is his live plan. Never pass `--confirm` to `fetch` or `intent`, never run `save` without `--dry-run`, and never run `provision`, until Hisham has said yes to that step in this conversation. Show the number (dollars, or rows to create/update) when you ask.
- **Never read raw API rows.** Raw responses sit in `<product>/.agents/seo/raw/<runId>/` and can be thousands of rows; they burn context and invite you to quote numbers out of context. Read only `summary.txt`. For one keyword's full record, use `detail`.
- **Never invent values.** Volume, difficulty, intent, position and competitor ranks come from the API or stay empty. Your judgments go only into the plan's own fields (relevance, intent in `claude` mode, page scores, why).
- **Never guess domains or IDs.** Competitor domains, the base ID and record IDs come from Hisham, the summary or a command's output.
- **Short updates.** Hisham isn't an SEO specialist and wants brief answers: what happened, what it costs, what you need from him.

## Running the CLI

Every command goes through the bundled wrapper, which loads content-engine's `.env` (DataForSEO and Airtable secrets live there, never in the product repo) and builds the CLI if needed:

```bash
S=<this skill's directory>/scripts
bash $S/seo.sh <command> --product <absolute path of the product repo> [options]
```

`--product` must be absolute. Each command prints one JSON line on stdout; errors go to stderr with exit code 1. Commands:

| Command | What it does | Costs / writes |
|---|---|---|
| `provision` | Creates missing tables and fields in the base | Writes schema |
| `pillars` | Lists stored pillars `{id, name, rationale}` | Free read |
| `start --input <file>` | Creates a run, prints `{runId, runDir}` | Local only |
| `fetch --run <id>` | Prints the cost estimate | Free |
| `fetch --run <id> --confirm` | Runs the paid calls; re-running retries only calls not yet ok | **Paid** |
| `merge --run <id>` | Dedupes and folds Arabic variants into `merged.json` | Local only |
| `intent --run <id> [--confirm]` | DataForSEO intent (only in `dataforseo` mode); estimate first | **Paid** with `--confirm` |
| `summary --run <id>` | Writes `summary.txt`, prints its path and counts | Free read |
| `detail --run <id> --key <merge key> --market <label>` | One keyword with every source row | Local only |
| `save --run <id> [--plan <file>] --dry-run` | Validates the plan, prints create/update counts | Free read |
| `save --run <id> [--plan <file>]` | Writes the plan to Airtable | **Writes** |

A market label is `<location_name>/<language_name>` as DataForSEO spells them, e.g. `Egypt/Arabic`, `United Arab Emirates/English`.

## The run

### 1. Context and config

1. Find the product repo (usually the current directory; ask if unclear) and read `.agents/product-marketing.md` in full. It gives the product, buyers, markets and competitors.
2. Read `.agents/seo/keyword-research.json`. If it is missing, build it with Hisham:

   ```json
   {
     "airtableBaseId": "appXXXXXXXXXXXXXX",
     "airtableTokenEnv": "KEYWORD_AIRTABLE_TOKEN",
     "ownDomain": "kastio.ai",
     "competitorDomains": ["modash.io", "hypeauditor.com"],
     "markets": [
       { "location": "Egypt", "language": "Arabic" },
       { "location": "Saudi Arabia", "language": "Arabic" },
       { "location": "United Arab Emirates", "language": "English" }
     ],
     "caps": { "suggestions": 200, "related": 200, "ranked": 200, "site": 200 }
   }
   ```

   Ask for the base ID and the `.env` variable holding its token (Kastio: base `appDP2uUSfo8AC6ot`, `KEYWORD_AIRTABLE_TOKEN`). Propose competitor domains from the competitors the context file names and get Hisham's confirmation before saving — a wrong domain wastes paid calls on someone else's keywords. Domains are bare and lower case (`modash.io`, no `https://` or `www.`). `ownDomain`, `markets` and `caps` are optional; caps default to 200 results per call.
3. A new base needs `provision` once (ask first; it adds tables and fields). If it exits 1, its `manualMissing` list names fields the API cannot create; give Hisham those names and types to add by hand, then run it again.

### 2. Pillars and seeds

Invoke `marketing-skills:content-strategy` and work from its "Content Pillars and Topic Clusters" and "Keyword Research by Buyer Stage" sections.

- Run `pillars`. On a re-run, reuse stored pillar names exactly (matching is by name), so the plan grows instead of forking.
- Pick 3–5 pillars, each tied to what the product sells.
- **Objective:** every run has one: `launch` (decision and comparison pages first, with awareness basics), `awareness` or `sales`. Take it from Hisham's request, otherwise ask him. It goes in the input file and drives how you score customer impact.
- Markets come from the config's `markets`, otherwise from the context file; ask only if it doesn't settle them. Run every market they list; never narrow to one country on your own.
- Write seeds per pillar **in each market's language**, spread across buyer stages (awareness, consideration, decision, implementation) with the stage's modifiers ("what is", "best", "vs", "pricing", "how to"). A seed only runs in markets whose language matches its `language`, so an English seed needs an English market.
- Arabic seeds use the words buyers actually type, often colloquial and in the market's own dialect, which differs between Egypt, Saudi Arabia and the UAE (e.g. مشاهير), not formal Modern Standard terms; formal phrasings tend to return near-zero volume.
- Intent mode: `claude` (you tag intent, free) unless Hisham asks for DataForSEO's intent (`dataforseo`, a second paid step).

Write the input file outside the product repo (e.g. the session scratchpad):

```json
{
  "markets": [{ "location": "Egypt", "language": "Arabic" }],
  "objective": "launch",
  "intentMode": "claude",
  "seeds": [{ "keyword": "منصة مشاهير", "language": "Arabic", "pillar": "Influencer discovery" }]
}
```

### 3. Fetch (paid)

1. `start --input <file>` → note the `runId`.
2. `fetch --run <id>` → estimate. Show Hisham in a few lines: the pillars with their seeds, total estimated cost, number of calls, any `seedsWithoutMarket`. Ask for a yes.
3. On yes: `fetch --run <id> --confirm`. Report ok / empty / failed counts and actual cost. If some calls failed, offer one retry (same command; finished calls are skipped).

### 4. Merge and summary

1. `merge --run <id>`. In `dataforseo` mode it also prints `intentEstimate`: ask for a yes, then `intent --run <id> --confirm`, then `merge` is not needed again.
2. `summary --run <id>` → read the file at `path`. Sections: `# notes`, `# keywords` (one tab-separated line per keyword: keyword, merge_key, market, volume, kd, intent, trend_yearly, sources, variants, comp_ranks, position, current_page), `# pillars`, `# pages` (stored pages with record IDs, status and keywords), `# gap keywords`, `# seed calls`, `# domain calls`, `# failed calls`, `# empty calls`, `# seeds with no market`.
   An empty `comp_ranks` or `position` means "not in that call's capped list", not "does not rank".

### 5. Judgment

This is the part only you can do. Use `marketing-skills:content-strategy` ("Prioritizing Content Ideas", "Searchable vs Shareable", "Content Types") for page scoring and format.

- **Relevance 0–3 for every keyword in the run** (the save rejects a plan that skips one):
  3 = a buyer of the product would search it and the product serves it directly;
  2 = a buyer plausibly searches it and a page could target it;
  1 = related but probably not a buyer;
  0 = no angle.
  Only new keywords scored 2–3, and every keyword placed on a page, are saved; the rest stay in the raw files.
- **Intent** (`claude` mode only): informational, navigational, commercial or transactional, required for every keyword scored 2–3 and every keyword on a page. In `dataforseo` mode leave intent out.
- **Pages:** group keywords into clusters; each page gets exactly one primary keyword plus supporting ones, and each keyword sits on at most one page. One page per language serves every market in that language (one Arabic page for Egypt, Saudi Arabia and the UAE); give a country its own page only when the topic exists only there (Mawthooq: Saudi Arabia) or that country's own words have real search volume. When a keyword is weak (relevance 0–1) or locked elsewhere in one market, narrow the page's markets or leave that keyword off. Extend before you add: if a stored page already covers a cluster, list it with its `id` and its full new keyword set; a stored Saudi-only page can be widened to the other markets of its language.
- **Re-score the whole backlog:** list every stored page whose status is planned or empty and that has a market in this run, with fresh scores; the save rejects a plan that leaves one out. Pages outside the run's markets keep their scores until a run covers them, so a run across all markets re-scores the whole backlog. Retire a planned page that was merged into another or is obsolete with a drop entry. A keyword on a page whose status is writing or published is locked to that page and role.
- **Scores:** score each page 1–10 on customer impact (against the run's objective: an awareness run ranks awareness pages higher, a sales run decision pages), content fit and resources. Search potential is computed by the CLI from the page's volume and its primary keyword's difficulty; never set it. Set buyer stage, format and content type, and write "why this page" in one or two plain sentences grounded in the summary's numbers.
- **Before saving, two checks:** (1) do the pillars still fit the data? Rename, merge or add pillars (a renamed pillar is new; the old one keeps the pages you don't list). (2) the mix: the dry run prints page counts by buyer stage, intent and format for the top 10 and for all planned pages; compare them with the objective and rebalance customer impact if they don't fit. Corey's 60% searchable, 30% shareable, 10% experimental is a starting ratio, not a rule.

Exact JSON shape, field values and the save's validation rules: read `references/plan-format.md` before writing the plan.

**Large runs.** Above roughly 400 keywords, split the scoring so no single context holds thousands of rows:

```bash
node $S/plan-tools.mjs split <runDir>/summary.txt <runDir>/chunks 300
```

Dispatch one helper agent per chunk with: the product context file path, the chunk path, the relevance rubric above, the intent mode, and the output path `<runDir>/chunks/scores-NN.json` (an array of `{mergeKey, market, relevance, intent?}`, one per row, `mergeKey` and `market` copied exactly from the row). You design pillars and pages yourself from the scored keywords (relevance ≥ 2), write `judgment.json` (`{runId, notes?, pillars, pages}`), then:

```bash
node $S/plan-tools.mjs assemble <runDir>/judgment.json <runDir>/plan.json <runDir>/chunks/scores-*.json
```

### 6. Save

1. Write the plan to `<runDir>/plan.json` (the default path `save` reads).
2. `save --run <id> --dry-run`. Errors are printed one per line; fix the plan and repeat until it prints the counts.
3. Show Hisham the counts (pillars, pages, keywords to create / update), the pages to be deleted by name, the mix against the objective and the top pages by priority. On yes: `save --run <id>`.
4. Finish in at most three short lines: what was saved, the cost, anything he must do (e.g. review pages in Airtable).

Saving the same plan twice changes nothing, so a re-run of `save` after an interruption is safe.
