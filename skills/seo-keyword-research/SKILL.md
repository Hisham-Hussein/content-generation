---
name: seo-keyword-research
description: Plans a product's SEO content from real keyword data - pillars, seed keywords, DataForSEO keyword and competitor fetches, relevance scoring, Google's top results for the keywords that matter, and a page plan (one primary keyword per page) saved to the product's Airtable base. Use whenever Hisham wants keyword research, an SEO content plan, a keyword-to-page map, competitor keywords, what ranks on Google for our keywords, "what should we write for SEO", or to refresh or extend an existing keyword plan for Kastio or any product with a .agents/product-marketing.md, including Arabic / MENA markets, even if he doesn't say "DataForSEO" or "Airtable". Also use it to check a few named keywords in their markets without a full run (a keyword check): "check this keyword", "how hard is X to rank for", "volume of X in Saudi", "what ranks for X".
---

# SEO keyword research

A run turns a product's marketing context into a living keyword plan in its Airtable base: **Pillars → Pages → Keyword Ideas**, plus one run-log row in Search Requests. A script (the content-engine CLI) does every fetch, merge and write; you make every judgment. Re-runs extend the same plan.

Design spec, if a rule here is unclear: `~/ai-agency/content-engine/docs/superpowers/specs/2026-11-14-seo-keyword-research-skill-design.md`.

## Ground rules

These come from how Hisham works and from the spec's anti-goals; each has a reason.

- **Money and Airtable need his yes, every time.** DataForSEO calls cost real money, and the base is his live plan. Never pass `--confirm` to `fetch`, `intent`, `results`, `traffic` or `check`, never run `save` or `check --save` without `--dry-run`, and never run `provision`, until Hisham has said yes to that step in this conversation. Show the number (dollars, or rows to create/update) when you ask. One yes covers a whole keyword check (figures, Google's results and traffic): `check --confirm` is the one paid step, so a later `check --collect` that sends the traffic calls it paid for needs no new yes.
- **Never read raw API rows.** Raw responses sit in `<product>/.agents/seo/raw/<runId>/` (Google's results under `results/`, traffic under `traffic/`) and can be thousands of rows; they burn context and invite you to quote numbers out of context. Read only `summary.txt`. For one keyword's full record, its Google results and traffic figures included, use `detail`.
- **Never invent values.** Volume, difficulty, intent, position, competitor ranks, Google's results and traffic figures come from the API or stay empty. Your judgments go only into the plan's own fields (relevance, intent in `claude` mode, page scores, why).
- **Never guess domains or IDs.** Competitor domains, the base ID and record IDs come from Hisham, the summary or a command's output.
- **Short updates.** Hisham isn't an SEO specialist and wants brief answers: what happened, what it costs, what you need from him.

## Running the CLI

Every command goes through the bundled wrapper, which loads content-engine's `.env` (DataForSEO and Airtable secrets live there, never in the product repo) and builds the CLI (quick when nothing changed):

```bash
S=<this skill's directory>/scripts
bash $S/seo.sh <command> --product <absolute path of the product repo> [options]
```

`--product` must be absolute. Each command prints one JSON line on stdout, except `check --confirm`, which prints the figures line first and the final report after it (read the last line for the report); errors go to stderr with exit code 1. Commands:

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
| `results --run <id>` | Estimate for Google's results: keywords to post (`toPost`) and dollars, plus `pending` / `done` / `failed` tasks and `failedPermanent` (failed keywords never posted again) | Free |
| `results --run <id> --confirm` | Posts a Google results task for each keyword scored 2–3 in `scores.json` with volume above 0 (never one already pending or done), then collects for up to 8 minutes | **Paid** |
| `results --run <id> --collect` | Collects pending tasks only; posts nothing | Free |
| `traffic --run <id> [--plan <file>]` | Estimate for the monthly traffic of the top results of each page's primary keyword | Free |
| `traffic --run <id> [--plan <file>] --confirm` | Runs the traffic calls | **Paid** |
| `detail --run <id> --key <merge key> --market <label>` | One keyword with every source row, its Google results (`results`), traffic figures (`traffic`) and Kw. per URL (`kw`: the keywords that URL ranks for) | Local only |
| `save --run <id> [--plan <file>] --dry-run` | Validates the plan, prints create/update counts | Free read |
| `save --run <id> [--plan <file>]` | Writes the plan to Airtable | **Writes** |
| `check --input <file>` | Creates a keyword check run, prints its `runId` and estimate | Local only |
| `check --run <id> --confirm [--compare]` | Fetches the check's figures, posts its Google results tasks, collects, then sends its traffic calls | **Paid** |
| `check --run <id> --collect [--compare]` | Collects pending tasks; sends the traffic calls the confirm paid for once none is pending | Free (paid at confirm) |
| `check --run <id> --save [--compare] [--dry-run]` | Writes the checked keywords and a run-log row to Airtable; `--dry-run` prints what it would write | **Writes** / free read |

A market label is `<location_name>/<language_name>` as DataForSEO spells them, e.g. `Egypt/Arabic`, `United Arab Emirates/English`.

## Keyword check

A keyword check looks up a few named keywords in their markets without a full run, Ahrefs Keywords Explorer style: volume, difficulty, CPC, intent and trend, Google's top results with each URL's traffic and Kw., traffic potential, and the results group. It is a run of its own (Run ID `check-…`), so it never touches a run's files.

1. **Write the input file** in a scratch place (e.g. `/tmp/check-input.json`): `{ "keywords": [{ "keyword": "…", "markets": ["Saudi Arabia/Arabic"] }] }`. Spell each keyword as Hisham gave it, since the check reports that spelling. Take the markets from his request, else from the context file's markets; ask when it's unclear. List each keyword once with all its markets: the CLI rejects a keyword named twice, and allows at most 100 keywords in a market.
2. `check --input <file>` creates the check and prints its estimate (`estimate.total` in dollars, at caps, so the real cost is usually lower). Show Hisham the dollars and ask for his yes. In the same question offer the compare option unless he already asked for it: a free read of his Airtable plan that says which planned page a keyword's results group belongs to.
3. On yes: `check --run <id> --confirm`, plus `--compare` if he said yes to it, with a 600000 ms Bash timeout, since it collects Google's results for up to 8 minutes. Both lines come back at the end: the figures line first, the report on the last line. If the timeout cuts it short, run `--confirm` again (it pays for nothing already recorded) or `--collect`. If it stops with `may have been sent before the command stopped`, a request may have been charged with no answer saved: tell Hisham and don't re-run on a guess.
4. While the report's `pending` is above 0, run `check --run <id> --collect` (the same `--compare` choice), each with a 600000 ms timeout; Google's first results take about 5 minutes. The loop ends: a task still pending after 3 collects becomes failed, and failed tasks are reported. `unconfirmedPosts` in the output means a results request may have been charged without being recorded: tell Hisham to check the DataForSEO task list.
5. **Present it from the last line's report only**, never from the raw files (`detail` does not work on a check run). Keep it brief, as a table per market when there are more than a few keywords: per keyword and market, volume, KD (null is "no KD", never 0), CPC, intent and trend; the top results with traffic and Kw. per URL; traffic potential (the #1 result's traffic, Ahrefs' definition); people also ask; whether Google shows an AI overview and the domains it cites; and the results group. With `--compare`, a group's `stored` names the planned keyword it joined, its page and its Results date: say "this keyword belongs to the page you planned for X". List `noData` keywords as "DataForSEO has no data" and `figuresFailed` keywords as "figures call failed (check again to retry)". Report `stopped` (a part cost more than its share of the estimate, so the check paid nothing more) and failed tasks plainly.
6. **Save only when Hisham asks.** Run `check --run <id> --save --dry-run` (the same `--compare` choice), show him the new and updated rows, the keywords saved with empty figures (`noData`, `figuresFailed`), the `results` records to create, update and delete, and the cost, then `check --run <id> --save` after his yes. Saved rows get `check` in Sources, and each keyword's Google results land in the SERP Results table, one record per result with its traffic and Kw., linked to the row. New rows are gap keywords with no relevance or page, so a later run can place them; an existing row keeps its page, relevance and spelling, because the plan owns those.

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
3. A new base needs `provision` once (ask first; it adds tables and fields), and so does a base after the tool adds a table or field (e.g. SERP Results, 2026-11-22): a save or check that reports the base is missing one needs the same yes, then `provision`. If it exits 1, its `manualMissing` list names fields the API cannot create; give Hisham those names and types to add by hand, then run it again.

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
2. `summary --run <id>` → read the file at `path`. Sections: `# notes`, `# keywords` (one tab-separated line per keyword: keyword, merge_key, market, volume, kd, intent, trend_yearly, sources, variants, comp_ranks, position, current_page, results_group), `# pillars`, `# pages` (stored pages with record IDs, status and keywords), `# gap keywords`, `# seed calls`, `# domain calls`, `# failed calls`, `# empty calls`, `# seeds with no market`.
   An empty `comp_ranks` or `position` means "not in that call's capped list", not "does not rank". `results_group` is the merge key of the main keyword of its Google results group, and `-` until step 5 fetches the results.

### 5. Relevance, then Google's results (paid)

Google's top results for a keyword show what kind of page it rewards and which keywords one page can rank for together. They cost money per keyword, so score first and fetch them only for the keywords worth a page.

1. **Score every keyword in the run** (the results step and the save reject scores that skip one):
   - **Relevance 0–3:**
     3 = a buyer of the product would search it and the product serves it directly;
     2 = a buyer plausibly searches it and a page could target it;
     1 = related but probably not a buyer;
     0 = no angle.
     Only new keywords scored 2–3, and every keyword placed on a page, are saved; the rest stay in the raw files.
   - **Intent** (`claude` mode only): informational, navigational, commercial or transactional, for every keyword. The save needs it on every keyword scored 2–3 and every keyword on a page, and a page may later take a keyword you scored 0–1. In `dataforseo` mode leave intent out.

   Write the scores to `<runDir>/scores.json`: an array of `{mergeKey, market, relevance, intent?}`, one per `# keywords` row, `mergeKey` and `market` copied exactly from the row. The results step picks its keywords from this file and the plan's keywords are assembled from it, so it is the one place scores live. It holds run keywords only; the results step rejects any other.

   **Large runs.** Above roughly 400 keywords, split the scoring so no single context holds thousands of rows:

   ```bash
   node $S/plan-tools.mjs split <runDir>/summary.txt <runDir>/chunks 300
   ```

   Dispatch one helper agent per chunk with: the product context file path, the chunk path, the relevance rubric and intent rule above, the intent mode, and the output path `<runDir>/chunks/scores-NN.json` (an array of `{mergeKey, market, relevance, intent?}`, one per row, `mergeKey` and `market` copied exactly from the row). Then merge the chunks:

   ```bash
   node $S/plan-tools.mjs scores <runDir>/scores.json <runDir>/chunks/scores-*.json
   ```

   It prints `{"keywords": n, "duplicates": [...]}`; `n` should equal the summary's keyword count, or a helper skipped rows. Exit 1 means a keyword was scored twice: keep one entry in the chunk files and merge again. Exit 2 means a usage, read or JSON error: read stderr. When it names a chunk file that is not a JSON array or not valid JSON, dispatch that chunk again.
2. `results --run <id>` → the estimate. If `toPost` is 0, nothing is paid: skip to item 4, collecting first if `pending` is above 0. Otherwise show Hisham the keywords to post and the dollars ($0.0012 a keyword) in a line or two, plus `failedPermanent` when above 0 (keywords DataForSEO refused, which are not posted again), and ask for a yes.
3. On yes: `results --run <id> --confirm`. Run it, and every `--collect`, with a 10-minute Bash timeout (600000 ms): each can collect for 8 minutes.
   - If the output has `stopped`, DataForSEO charged more per keyword than the estimate and nothing more was posted. Report it to Hisham and post nothing more until he decides: the price he said yes to no longer holds. Collecting what was posted stays free.
   - If the command fails with `may already be charged` or `may have been sent before the command stopped`, a request may have created and charged tasks the ledger does not know. Stop and tell Hisham. Every later `results` run, the estimate too, stops on it until the intent file the message names (`results/post-<n>.intent.json`) is deleted; `--collect` still collects and lists such requests in `unconfirmedPosts`. Re-run only after the DataForSEO dashboard's task list shows whether that batch was created, and delete the intent file only on Hisham's yes: if the batch was created, the next `--confirm` pays for those keywords again (up to $0.12 a batch).
   - If `pending` is above 0, run `results --run <id> --collect` (free, posts nothing) until it is 0. A task still pending after its third collect is recorded as failed, so this ends.
   - Report done, failed and `postCostUsd` in a line. Failed keywords are planned from their other data; a later run of this step posts again only temporary failures (its own estimate and yes, cost added), never a refused request (`failedPermanent`). A keyword Google has no results for counts as done, with no results.
4. Re-run `summary --run <id>` and read it again: the `results_group` column is now filled.

### 6. Judgment

This is the part only you can do. Use `marketing-skills:content-strategy` ("Prioritizing Content Ideas", "Searchable vs Shareable", "Content Types") for page scoring and format.

- **Keyword scores come from `scores.json`.** Re-score there when judging the pages changes your view, because the plan's keywords are assembled from it. A keyword you raise to 2–3 has no Google results yet: if it has volume, run step 5's results commands again for it (its own estimate and yes).
- **Pages:** start the clusters from the results groups. Keywords in one group share at least 3 of Google's top results, so one page can usually rank for all of them; a group is a suggestion, not a page. Keywords in one-keyword groups, common in noisy Arabic results, and keywords without results (`-`) are grouped by judgment. Groups never span markets, because Google localises results, so whether countries share a page stays the rule below. Each page gets exactly one primary keyword plus supporting ones, and each keyword sits on at most one page. One page per language serves every market in that language (one Arabic page for Egypt, Saudi Arabia and the UAE); give a country its own page only when the topic exists only there (Mawthooq: Saudi Arabia) or that country's own words have real search volume. When a keyword is weak (relevance 0–1) or locked elsewhere in one market, narrow the page's markets or leave that keyword off. Extend before you add: if a stored page already covers a cluster, list it with its `id` and its full new keyword set; a stored Saudi-only page can be widened to the other markets of its language.
- **Read the results before setting each page:** run `detail` for its primary keyword in each of its markets and read `results`, because Google's top results show what it rewards for that search:
  - the kind of page that ranks (list, tool, guide, product page) sets the content type and what the title may promise;
  - a broad keyword whose results cover the whole topic suits a hub;
  - forums and social posts in the top results mean easy competition: the check on a KD of 0 or none;
  - the people-also-ask questions are candidate subheadings; note them in "why this page" only when they change the page.
- **Hubs (Corey's hub and spoke, `content-strategy` "Hub and Spoke"):** each pillar with several pages in a language gets one hub page: a comprehensive overview targeting the pillar's broad, short keyword. Its narrower long-tail pages set `hub` to it; a spoke can itself be the hub of narrower pages when the topic has that depth. A page that fits no cluster can stand alone. Existing pages get their hubs when you list them.
- **Re-score the whole backlog:** list every stored page whose status is planned or empty and that has a market in this run, with fresh scores; the save rejects a plan that leaves one out. Pages outside the run's markets keep their scores until a run covers them, so a run across all markets re-scores the whole backlog. Retire a planned page that was merged into another or is obsolete with a drop entry. A keyword on a page whose status is writing or published is locked to that page and role.
- **Page scores:** score each page 1–10 on customer impact (against the run's objective: an awareness run ranks awareness pages higher, a sales run decision pages), content fit and resources. Search potential is computed by the CLI from the page's volume and its primary keyword's difficulty; never set it. Set buyer stage, format and content type, and write "why this page" in one or two plain sentences grounded in the summary's numbers.
- **Before saving, three checks:** (1) do the pillars still fit the data? Rename, merge or add pillars (a renamed pillar is new; the old one keeps the pages you don't list). (2) the mix: the dry run prints page counts by buyer stage, intent and format for the top 10 and for all planned pages; compare them with the objective and rebalance customer impact if they don't fit. Corey's 60% searchable, 30% shareable, 10% experimental is a starting ratio, not a rule. (3) Hubs: the dry run's `withoutHub` lists planned pages with no hub that no page has as hub; give each a hub, or keep it standalone only when it fits no cluster.

**Write the plan.** Read `references/plan-format.md` for the exact JSON shape, field values and the save's validation rules. Write your pillars and pages to `<runDir>/judgment.json` (`{runId, notes?, pillars, pages}`), then build the plan from it, in every run, large or small:

```bash
node $S/plan-tools.mjs assemble <runDir>/judgment.json <runDir>/plan.json <runDir>/scores.json
```

This makes the plan's keywords exactly `scores.json`, the scores the results step used, so never write them into the plan by hand. Assemble again after every change to either file.

**Traffic of the top results (paid).** Once the pages are drafted in `plan.json`:

1. `traffic --run <id>` → the estimate (`estimate` in dollars, `calls`, `urls`, `withoutResults`). Show Hisham the dollars, the URL count and the primary keywords in `withoutResults` (no Google results, so nothing to measure), and ask for a yes.
2. On yes: `traffic --run <id> --confirm`; report `costUsd` and any `failedCalls`. If `traffic` fails with `may have been sent before the command stopped`, a call may have been charged with no answer saved. Stop and tell Hisham. Every later `traffic` run stops on it until the intent file the message names (`traffic/call-<n>.intent.json`) is deleted: delete it only on Hisham's yes, after the DataForSEO dashboard shows whether the call was charged, because the next `--confirm` sends that call again.
3. Read the figures with `detail` (its `traffic` key: estimated monthly visits per top URL; `kw`: the keywords each URL ranks for). They inform the judgment and never decide it: a URL can show 0, or a one-off spike.

A primary in `withoutResults` is judged from its other data; running step 5's results commands after the plan names it fetches its results if it qualifies (scored 2–3, volume above 0). Running `traffic` again after you change a primary pays only for URLs not measured yet.

### 7. Save

1. Make sure `<runDir>/plan.json` (the default path `save` reads) is assembled from your latest `judgment.json` and `scores.json`.
2. `save --run <id> --dry-run`. Errors are printed one per line; fix `judgment.json` or `scores.json`, assemble again, and repeat until it prints the counts.
3. Show Hisham the counts (pillars, pages, keywords to create / update), the pages to be deleted by name, the mix against the objective, the pages left without a hub and the top pages by priority. On yes: `save --run <id>`.
4. Finish in at most three short lines: what was saved, the full cost (fetch, intent, results and traffic), anything he must do (e.g. review pages in Airtable).

Besides the plan, the save writes each keyword's Google results from this run: on its Keyword Ideas row the SERP link, people also ask, AI overview and its cites, results group and results date; in the SERP Results table one record per organic result (position, title, URL, domain, market, results date, and for a page's primary keyword the traffic and Kw. once traffic was fetched), linked to the row, so Hisham sorts and filters them like Ahrefs' SERP overview. The dry run's keyword counts include the row changes and its `results` counts the records to create, update and delete. A keyword with no result this run (not fetched, or its task failed) keeps its stored results fields and records, so a re-run never blanks them. The run's logged cost adds the results and traffic costs to fetch and intent.

Saving the same plan twice changes nothing, so a re-run of `save` after an interruption is safe.
