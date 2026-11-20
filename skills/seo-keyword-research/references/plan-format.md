# Plan format

`save` reads `<runDir>/plan.json` (or `--plan <file>`). Unknown fields are rejected.

```json
{
  "runId": "2026-11-14-0930",
  "notes": "optional: one line on what this run changed",
  "pillars": [
    { "name": "Influencer discovery", "rationale": "Why buyers care", "connection": "How the product serves it" }
  ],
  "keywords": [
    { "mergeKey": "منصه مشاهير", "market": "Egypt/Arabic", "relevance": 3, "intent": "commercial" },
    { "mergeKey": "مشاهير سناب", "market": "Egypt/Arabic", "relevance": 1 }
  ],
  "pages": [
    {
      "title": "منصة للبحث عن مشاهير السوشال ميديا في مصر",
      "market": "Egypt/Arabic",
      "pillar": "Influencer discovery",
      "contentType": "landing page",
      "format": "searchable",
      "buyerStage": "decision",
      "intent": "commercial",
      "scores": { "customerImpact": 9, "contentFit": 9, "searchPotential": 6, "resources": 7 },
      "why": "Highest-volume buyer term in the run (1,300/month); the product does exactly this.",
      "keywords": [
        { "mergeKey": "منصه مشاهير", "role": "primary" },
        { "mergeKey": "منصه مؤثرين", "role": "supporting" }
      ]
    }
  ]
}
```

## Fields

| Field | Values |
|---|---|
| `runId` | The run's id, exactly |
| `pillars[]` | New pillars, or stored ones whose rationale/connection you are updating. Matched by name, ignoring case |
| `keywords[]` | Every keyword in the run's `# keywords` section exactly once. May also re-score a stored keyword |
| `keywords[].mergeKey`, `.market` | Copied from the summary's `merge_key` and `market` columns, never retyped from the display spelling (the merge key is folded: ة→ه, أ/إ/آ→ا, ى→ي) |
| `keywords[].relevance` | 0, 1, 2 or 3 |
| `keywords[].intent` | `informational`, `navigational`, `commercial`, `transactional`. `claude` mode: required when relevance ≥ 2 or the keyword is on a page. `dataforseo` mode: never present |
| `pages[].id` | Optional. A stored page's record ID (`rec…` from the summary's `# pages`) to update that page. Omit for a new page |
| `pages[].market` | One market label; every keyword on the page is in this market |
| `pages[].pillar` | A pillar in this plan or a stored pillar, by name |
| `pages[].hub` | Optional. The hub page of its cluster: a stored page's record ID, or another plan page's primary merge key (same market) |
| `pages[].contentType` | Free text, e.g. `landing page`, `comparison`, `how-to guide`, `use case`, `glossary` |
| `pages[].format` | `searchable`, `shareable`, `both` |
| `pages[].buyerStage` | `awareness`, `consideration`, `decision`, `implementation` |
| `pages[].intent` | As keyword intent; the intent the page serves |
| `pages[].scores` | Integers 1–10: `customerImpact`, `contentFit`, `searchPotential`, `resources` (10 = cheapest to make). The CLI computes priority with weights 0.4/0.3/0.2/0.1 |
| `pages[].keywords[]` | `{mergeKey, role}`, role `primary` or `supporting`; the page's full keyword set |

## What the save rejects

- A run keyword with no score, a score for an unknown keyword, or one scored twice.
- A missing or forbidden intent (see above).
- A page with zero or two primaries; a keyword twice on one page or on two pages.
- A page keyword not found in the page's market (in this run or already stored).
- A page `id` that is not a stored page, or one in another market.
- Two plan pages that resolve to the same stored page (a new page whose primary matches a stored page's primary is that page: list it with its `id` instead).
- An unknown hub, a hub in another market, a page as its own hub, or a hub cycle.
- Moving or re-roling a keyword whose page is writing or published.
- Any page left with other than one primary after the save. Listing a stored page replaces its keyword set: keywords you leave off become gap keywords, so include the ones you mean to keep.

## What the save leaves alone

Pages and pillars the plan doesn't list stay as they are. Page status and URL are Hisham's and never change. Keywords scored 0–1 that are new and not on a page are not written.
