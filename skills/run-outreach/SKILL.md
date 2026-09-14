---
name: run-outreach
description: Use when resuming, reviewing, logging, or drafting founder-led ABM outreach to ICP contacts. Triggers on "outreach", "where are we with outreach", "who's due", "what's pending", "I sent", "I messaged", "she replied", "he replied", "accepted my request", "no reply from", "draft a DM", "draft an InMail", "follow-up for", "log that", or any report of a message sent to or received from an ICP contact or partner.
---

<objective>
Keep iSemantics' founder-led outreach continuous across sessions. All outreach state lives in Airtable and the ICP bench files; this skill carries the fixed locations and the rules for reading, logging, and drafting against that state. A fresh session with no conversation history must be able to resume exactly where the last one stopped by running Status.
</objective>

<quick_start>
Hisham says "outreach" or "where are we" → run `workflows/status.md`.
Hisham reports an event ("I sent Yomna's message", "Ibrahim replied") → run `workflows/log-event.md`.
Hisham asks for copy ("draft Sara's follow-up") → run `workflows/draft-message.md`.
</quick_start>

<essential_principles>

**State in Airtable, instructions here.** Never keep outreach state in memory files, handoff docs, or conversation. If a fact about a thread matters next session, it goes into an Airtable field. The Outreach table is the ONLY queue of due actions; a contact's Framework Detail is background context, not a queue — if a next step appears only there, surface it and move it into an Outreach record.

**No dead ends.** A contact is *in play* when it has at least one Outreach record and its Engagement Status is not Cold. Every in-play contact must have at least one open Outreach record (Planned / Draft / Approved) carrying a Due Date, a Send Gate condition, or both. The only exit is Engagement Status Cold. A log operation that leaves a contact without one is incomplete.

**Never invent decisions.** Dates, cadence, company-stage moves, and cooling are Hisham's calls. Propose them with the reasoning; write them only after he confirms. Never fabricate a sent date, a reply, or a message text — record gaps honestly ("exact date not recorded").

**Hisham sends; the skill records.** Nothing is ever sent from here. Message Body of a Sent record must hold the exact text Hisham sent.

**Copy rules are non-negotiable.** Every draft follows `references/dm-playbook.md`: English only, personal claims traceable to a scrape, no em dashes, surgical edits on revision.

</essential_principles>

<fixed_locations>

**Airtable base:** `appXFk4T8KyNf4odQ` · Persona (Hisham): `recgRznilW4dlbyl0`

**Outreach** `tblQ9Gi0e5d7OlSfP`
| Field | ID |
|---|---|
| Label (primary) | `fld07cI9TYWV9obKI` |
| Status | `fldU0SrLvnS33S9rf` — Planned `selYgXFbSic7O0Qln` · Draft `selRAXsax0Nui3jrw` · Approved `selYijAcUa2afMLtI` · Sent `selX5EdaQuzFlpAVF` · Replied `selwo93tJof2ptYIW` · Dropped `selyZ5YVY3kKK5j2f` |
| Due Date | `fldwA2NnX2J9MXYlX` |
| Send Gate | `fldNewOfcvDfFEDeD` |
| Sequence Step | `fldBEdKgUb7DcIK7D` |
| Channel | `fld3r0iMNKAwUEgQW` — LinkedIn DM · LinkedIn InMail · WhatsApp · Email · Connection Note · Comment |
| Message Body | `fldc0Q8mf9f1yoCzI` |
| Language | `fld0Zu009ft1stlK1` |
| Sent Date | `fld4j61tPIEE6Cusp` |
| Notes | `fldVMJJvtBxCzjUHG` |
| ICP Account (link) | `fld0BtwAAaerHKVIp` |
| Persona (link) | `fldgZ5mH4EcTaWgiI` |

**Engagement Log** `tblyaWrUUMsyveMhn` (append-only timeline)
Date `fldMYcZeb4lQ3Iu8t` · Notes `fldMqlsK9PuyNtm34` · ICP Account `fldmTCtHwKiHS7M2k` · Activity Type `fld0cV5HDpYvB2TfR` (Comment, Connection Request, DM, Reaction, Lead Magnet Delivery, Meeting/Call, Follow — WhatsApp/InMail/email messages log as DM)

**ICP Accounts** `tblOY0n0NKqp9iDsJ` (people)
Account Name `fldaixpV78VeByf4B` · Company (text) `fldux9S6rYBKItllT` · Job Title `fldB585YwEvkryf2P` · LinkedIn URL `fldb4Un5lqk7dwsBO` · Account Type `fldWjxqeaadB3pEq9` · Engagement Role `fldDEj7z3WCTclrNQ` · Engagement Status `fld2aZsRmziCwNyqM` (New `selGgZPIHK7rlCoeP`, Warming `sel0Q9HMk4caUYMho`, Active `selPBAXHLYEGJZjLT`, Cold `selImnQfzJsb4opEz`) · Company Link `fldFcopgChy3xvErw` · Framework Detail `fldJzAHOMA60kPjb3` · Outreach (inverse) `fldOQPc0GhH2wTdQB` · Engagement Log (inverse) `fldF6wgh3mEyxehMn`

**Companies** `tblJL67KxgQQhoLvD`
Company Name `fldiIz7XunMr3pGRb` · Industry `fldw4y1bH3RYsKeDC` · Account Tier `fldtq3CFkMsbJO4H3` (Tier A / Tier B) · Warm Path `fldoORk6qbtDlre6Z` · Progression `fldgrAAIX0UArtnZI` (Unaware / Engaging / Conversation / Proposal) · Notes `fldVmzrGxa2Nu727v` · Contacts (inverse) `fld8ZKvnbeB3TjNVN`

**ICP bench files:** every `*.md` in `/home/hisham/ai-agency/content-engine/docs/marketing/isemantics/icp-bench/` (one per cluster; read them all, never a hard-coded list). Tier A and Tier B tables carry a final **Status** column: Proposed / Approved / Rejected / Onboarded.

**LinkedIn scrapes:** captures in `/home/hisham/ai-agency/content-engine/experiments/linkedin-profile-scraper-spike/captures/`; scrape commands and fallback rules live in the `onboard-icp-account` skill.

</fixed_locations>

<intake>
If the request already names an event or a draft, route directly. Otherwise default to Status — do not ask.
</intake>

<routing>
| Request | Workflow |
|---|---|
| "outreach", "where are we", "who's due", "what's pending", session resume | `workflows/status.md` |
| sent / replied / accepted / no reply / meeting happened / drop this thread | `workflows/log-event.md` |
| draft / rewrite / follow-up copy / edit a message | `workflows/draft-message.md` |

**After reading the workflow, follow it exactly.**
</routing>

<reference_index>
- `references/dm-playbook.md` — how to write outreach copy (cluster-neutral rules + per-cluster pitch)
- `references/sequence-rules.md` — exact Airtable writes for each outreach event
- `templates/status-report.md` — output shape for Status
</reference_index>

<related_skills>
- `build-icp-list` produces the bench files and tiers accounts.
- `onboard-icp-account` creates contacts and companies; after onboarding a Buyer/Convert contact, come here to draft the opener.
</related_skills>

<success_criteria>
- Every touched contact satisfies the no-dead-ends rule, verified by re-querying Airtable after writes
- Every Sent record has Sent Date and the exact Message Body (or an explicit "not recorded" note)
- No date, stage move, or cooling decision was written without Hisham's confirmation
- A fresh session running Status would reproduce the same picture from Airtable + bench files alone
</success_criteria>
