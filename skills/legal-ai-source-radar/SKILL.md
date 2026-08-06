---
name: legal-ai-source-radar
description: Use when sourcing external AI-in-legal or AI-in-GRC resources for LinkedIn content — the weekly research sweep that finds articles, reports, guides, repos, and videos, fetches and reads each one in full, scores them against the sourcing brief, and writes a digest to the Legal AI Source Radar Notion database for approval. Triggers on "run the legal AI radar", "source radar", "find legal AI resources", "weekly legal AI sources", or a scheduled weekly run. Runs locally because it requires real page fetching, which the cloud routine sandbox cannot do.
---

# Legal AI Source Radar

Weekly sourcing sweep for AI-in-legal and AI-in-GRC content candidates.

**This skill exists because it must run locally.** The cloud routine version was disabled:
its sandbox blocks all outbound HTTP, so it could only judge sources from search snippets.
That is not good enough. Every accepted source must be fetched and read, because
`packages/content-extractor` fetches Source URL when ingesting a Knowledge Item — a source
this skill cannot fetch is a source the pipeline cannot ingest.

## The non-negotiable rule

**Never accept a source you have not fetched and read.** No exceptions, no "the snippet
looks strong," no "it is probably inside." If WebFetch fails on a URL, that source is
rejected — not deferred, not accepted with a caveat. A fetch failure here predicts an
ingestion failure downstream.

## Step 1 — Load the rubric

Read `docs/context/legal-ai-sourcing-brief.md`. It is authoritative for buyer, subject
scope, geography weighting, objections, pillars, gates, source tiers, the open-source rule,
the vendor carve-out, dedup rules, composition quota, the twenty search angles, and the
output contract. Do not improvise any of it. If the file is missing, stop and say so.

## Notion access

The database is **Legal AI Source Radar**, id `aad845dda7654065bf186cd19ecc0b0c`, nested
under The Law Firm AI Resource Library.

**Always use the REST API, never the Notion MCP.** The MCP connector is absent in headless
and cron runs, so MCP-based steps would work interactively and silently fail on the
scheduled run. The API path works in both.

```bash
set -a && source .env && set +a          # provides NOTION_API_KEY
curl -s -X POST "https://api.notion.com/v1/databases/aad845dda7654065bf186cd19ecc0b0c/query" \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Notion-Version: 2022-06-28" -H "Content-Type: application/json" -d '{"page_size":50}'
```

Create a page with `POST /v1/pages` (parent `database_id`, properties Name/Week Of/Accepted/
Review Status/Themes, body blocks as `children`). Append to an existing page with
`PATCH /v1/blocks/{page_id}/children`. Notion caps `children` at 100 blocks per request, so
write the page in batches.

## Step 2 — Load prior coverage

Query the database and read every existing page. Collect the URLs and the specific claims
already surfaced, and combine with the already-used URL list in the brief.

Dedup on **URL and specific claim only**. Never reject because the topic, publisher, or
regulator appeared before.

## Step 3 — Search

Run all twenty search angles in the brief. Angles 16–20 (GRC and GCC/Middle East) are
mandatory every week even if the global angles already filled the quota.

Dispatch parallel `Explore` or `general-purpose` agents across angle groups so the sweep
runs concurrently. Each agent returns candidate URLs with a one-line reason, nothing more —
scoring happens after fetching, not from snippets.

## Step 4 — Fetch and read every candidate

For each candidate URL, WebFetch it and read the content.

- **Fetch fails, 404s, paywalls, or returns a login wall** → reject. Record it in the
  rejected list with the reason "not fetchable — would fail ingestion."
- **Fetch returns a stub, cookie banner, or JS shell with no substantive text** → reject
  for the same reason. The extractor would get the same nothing.
- **Fetch succeeds with real content** → now score it.

Fetch candidates in parallel batches. This is the slow step and the whole point of the
skill, so do not shortcut it to save time.

## Step 5 — Score

Apply the brief's gates and criteria against **the fetched content**, not the snippet.
Because you have the full text, the brief's specifics, extractable spine, and angle fields
must be grounded in what the source actually says. Quote real numbers and real section
structure.

Respect the composition quota in the brief. If a category comes up empty, say so rather
than backfilling.

## Step 6 — Write the Notion page

Create an entry in the Legal AI Source Radar database titled `Week of YYYY-MM-DD` using
today's date. Set Week Of, Accepted, Review Status = Pending Review, and a one-line Themes
summary.

If a page for today already exists, update it in place rather than creating a duplicate row.

Page body, in order:

1. **RUN STATUS** — number of candidates found, number fetched successfully, number
   rejected for fetch failure, number accepted. State plainly that every accepted source
   was fetched and read in full.
2. **COMPOSITION** — count per category (provider, how-to, career, GRC, regional, stats)
   and per pillar against the quota, plus the Global vs GCC split.
3. **Executive summary** — the shape of the week, the strongest two or three finds and
   why, any cross-cutting theme.
4. **Accepted sources** — one section each, carrying every field in the brief's output
   contract including Region. Add **Fetch status: verified** and the approximate content
   length, so ingestion readiness is visible.
5. **Considered and rejected** — near misses with a one-line reason, and a separate short
   list of sources rejected specifically for fetch failure.

## Step 7 — Notify

Write a plain-text summary to `artifacts/research/legal-ai-radar/YYYY-MM-DD.md` in the
repo: the Notion page URL, the composition counts, the executive summary, and each accepted
source as title, link, and at most two sentences. This is the headless-safe record.

If running interactively and the Gmail MCP is available, also create a draft to
hisham@isemantics.ai with the same content, subject
`Legal AI Source Radar - week of YYYY-MM-DD`. The connector cannot send, only draft. Skip
this silently when the tool is absent — do not fail the run over it.

Send a PushNotification with the accepted count when running interactively.

## Step 8 — Stop

Do not write to Airtable. Approval is Hisham's call. When he approves items from the Notion
page, ingest those into Knowledge Items (base `appXFk4T8KyNf4odQ`, table `tblDBOtvJlto1L6ST`)
with Pillar Alignment and Persona set, then flip that week's Review Status to
`Ingested to Airtable`.

## Style

Write plainly. No em dashes. Do not inflate a thin week. Report fewer sources rather than
padding, and never claim you read something you did not.
