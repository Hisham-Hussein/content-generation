---
name: capture-post-engagers
description: Use to reverse-onboard the people who engaged with a LinkedIn post into ICP Accounts. Two modes — (a) YOUR published post, capturing inbound leads who reacted/commented; (b) an amplifier's post, harvesting ICP buyers from their audience. Triggers on "capture engagers", "who engaged with my post", "scrape my post's commenters", "harvest this amplifier's audience", "reverse onboard", "pull reactors from this post", or when the user wants to turn post engagement into tracked ICP accounts.
---

<objective>
Turn the people who engaged with a LinkedIn post (reactors + commenters) into tracked ICP Account records in the iSemantics Content Engine. Scrapes engagers via no-cookie Apify actors, filters and classifies them against the persona's strategy, dedups against existing accounts, and creates ICP Accounts + Engagement Log entries with a warming playbook. This is the inbound-capture / audience-harvesting counterpart to `onboard-icp-account` (which onboards one person you found manually).
</objective>

<quick_start>
User gives a post URL. You pick the mode, scrape the engagers, filter to ICP-fit people together, then create ICP Account + Engagement Log records with correct Source/Role attribution. Two modes:
- **my-post**: the post is one of Hisham's → engagers are `Inbound` leads.
- **amplifier-post**: the post is by an existing `Amplify` account → ICP-fit engagers are `Outbound` buyers harvested from that amplifier's audience.
</quick_start>

<essential_principles>

**Airtable IDs (iSemantics Content Engine):**
- Base: `appXFk4T8KyNf4odQ`
- ICP Accounts: `tblOY0n0NKqp9iDsJ`
- Engagement Log: `tblyaWrUUMsyveMhn`
- Posts (our published content): `tblSqtKPIEod2c1bW`
- Strategy (ICP definition per persona): `tblBvVhf42xIhxosN`
- Personas: `tblQ4ggCKuBmkSZ6B`

**ICP Accounts field IDs (for record creation):**
| Field | ID |
|-------|----|
| Account Name | `fldaixpV78VeByf4B` |
| LinkedIn URL | `fldb4Un5lqk7dwsBO` |
| LinkedIn Posts URL | `fldRJc1rHebU92Q0T` |
| Company | `fldux9S6rYBKItllT` |
| Job Title | `fldB585YwEvkryf2P` |
| Account Type | `fldWjxqeaadB3pEq9` |
| Engagement Role | `fldDEj7z3WCTclrNQ` (Convert / Amplify / Refer) |
| Account Source | `fldQAe6kuhwufdYQv` (Outbound / Inbound) |
| Discovery Source | `fldqQfgZPVOSvtN9h` (self-link → the amplifier account) |
| Account Tier | `fld7BZDeJGfQ8ecj1` |
| Engagement Status | `fld2aZsRmziCwNyqM` |
| Suggested Framework | `fldtGWkJGZeEgiGc2` |
| Framework Detail | `fldJzAHOMA60kPjb3` |
| Persona | `fldswXZjClsRUYAoR` |

**Engagement Log field IDs:**
| Field | ID |
|-------|----|
| Date | `fldMYcZeb4lQ3Iu8t` |
| Notes | `fldMqlsK9PuyNtm34` |
| Activity Type | `fld0cV5HDpYvB2TfR` (use `Comment` or `Reaction`) |
| ICP Account | `fldmTCtHwKiHS7M2k` |
| Linked Post | `fldfiQ9afwBoHmpAy` (→ our Posts table) |

**Posts field IDs:** Published URL `fldpPkTJgmaUyRYgs` · Persona `fld2NPiDinrswa8gs` · Title/Topic `fld5DTvmYmPDMqiGZ`
**Strategy field IDs:** Target Job Titles `fld0sBcM7jpIE3KAi` · Target Industries `fldTrSRD8MUN7BP7p` · Persona `fldZNIq1SJl6NGr9T`

**Never fabricate values.** Profile slugs, URNs, record IDs, and URLs must come from scraper output, Airtable responses, or the user.

**Cache before you parse.** The scraper saves raw JSON to `captures/` before any inspection.

**Engager scraper:** `/home/hisham/ai-agency/content-engine/experiments/linkedin-post-engagement-scraper-spike/`
- Command: `pnpm scrape:post-engagers "{post-url}"`
- Requires: `set -a && source /home/hisham/ai-agency/content-engine/.env && set +a` for `APIFY_API_KEY`
- Two no-cookie actors run: `apimaestro~linkedin-post-reactions` (reactors) + `apimaestro~linkedin-post-comments-...-no-cookies` (commenters). No account-ban risk.
- Cost: ~$5 / 1,000 engagers (a busy post ≈ $1). **Confirm with the user before running** (Operating Principle #2).
- Output per engager: `name`, `headline`, `profile_url`. See the URN note below.

**Reactor URN vs commenter slug (dedup rule — see FINDINGS.md in the spike):**
- **Commenters** return a clean public slug (`linkedin.com/in/dishant0406`) → dedup directly against existing ICP Accounts by LinkedIn URL.
- **Reactors** return an obfuscated member URN (`linkedin.com/in/ACoAA…`) — a LinkedIn limitation. Use the URN only as a dedup key *among reactors*. The clean slug is obtained for free when you enrich a keeper (Step 4) via the profile scraper. Never store the `ACoAA…` URL as the account's LinkedIn URL — store the clean slug from enrichment.

</essential_principles>

<process>

**Step 1: Pick the mode and gather inputs**

Ask which post this is (or infer from the URL):

- **my-post mode** — a post Hisham published:
  1. Find the Post record: search Posts (`tblSqtKPIEod2c1bW`) for `Published URL` (`fldpPkTJgmaUyRYgs`) matching the URL. Save the Post record ID (for `Linked Post`).
  2. Derive the **Persona** from that Post's Persona link (`fld2NPiDinrswa8gs`) — do not guess it.
  3. Engagers → `Account Source = Inbound`. `Linked Post` = the Post record.

- **amplifier-post mode** — a post by an existing `Amplify` account:
  1. Find that amplifier's ICP Account (by name/LinkedIn URL). Confirm its `Engagement Role = Amplify`.
  2. Persona = the amplifier's Persona. Engagers → `Account Source = Outbound`, `Discovery Source` = the amplifier's record.

If the scraper is unavailable, accept a **manually-pasted list of engager profile URLs** as an alternate input and proceed from Step 3.

**Step 2: Scrape the engagers**

Confirm the cost with the user, then run:
```bash
cd /home/hisham/ai-agency/content-engine/experiments/linkedin-post-engagement-scraper-spike && \
set -a && source /home/hisham/ai-agency/content-engine/.env && set +a && \
pnpm scrape:post-engagers "{post-url}"
```
Read both capture files. **Prioritize commenters** (clean slugs, warmer signal) over reactors. Skip any record with no author (the comments actor emits a trailing empty `{}`).

**Step 3: Filter + classify (human-in-the-loop, no silent auto-add)**

For each engager, read their `headline` (rich enough to judge ICP fit without enriching). Score against the persona's Strategy — Target Job Titles (`fld0sBcM7jpIE3KAi`) and Target Industries (`fldTrSRD8MUN7BP7p`) — and bucket into:
- **Convert** — a real ICP buyer (partner, legal-ops, GC, decision-maker, or a general-AI buyer).
- **Amplify** — a large-following expert worth farming later. This is how *new amplifiers get discovered from engagement*. Rank legal-tech amplifiers above general-AI ones (Account Tier High/Medium vs Medium/Low).
- **skip** — competitor, job-seeker, vendor, noise.

Present the three buckets to the user. **They confirm/reject before anything is created.**

**Step 4: Dedup + merge, then create (per confirmed engager)**

Dedup against existing ICP Accounts by LinkedIn slug (commenters) or URN (reactors):
- **New person** → enrich via the profile scraper (`onboard-icp-account`'s scraper, `pnpm scrape:dev-fusion "{profile-url}"`) to get clean slug, company, title. Create the ICP Account:
  - `Account Name`, `Company`, `Job Title`, `LinkedIn URL` (clean slug), `LinkedIn Posts URL`, `Persona` (from Step 1).
  - `Account Source` = the mode's value (Inbound or Outbound). `Discovery Source` = the amplifier (amplifier-mode only).
  - `Engagement Role` = the Step-3 bucket (Convert or Amplify). `Account Type` = Buyer (or Strategic Partner for an Amplify peer). `Engagement Status` = New. `Account Tier` = your Step-3 judgment.
- **Already an ICP Account** → do **NOT** recreate and do **NOT** overwrite `Account Source` (an existing Outbound target who now engages inbound is a strong cold→warm signal — preserve origin). Just log the new activity (Step 5).
- **Engagement-Log idempotency** → before creating a log entry, check for an existing Engagement Log row with the same (ICP Account + Linked Post + Activity Type). Re-running on the same post must add only genuinely new engagers, never duplicate a write-once entry.

**Step 5: Create the Engagement Log entry**

For each captured engager, create a record in Engagement Log (`tblyaWrUUMsyveMhn`):
- `Activity Type` (`fld0cV5HDpYvB2TfR`) = `Comment` or `Reaction` (whichever the scrape found — direction is carried by Account Source + Linked Post, not a separate value).
- `Date` = today (or the engagement date if known). `Notes` = what they engaged with and any signal from their comment.
- `ICP Account` = the record from Step 4.
- `Linked Post` (`fldfiQ9afwBoHmpAy`) = the Post record (my-post mode only; leave empty in amplifier mode — it's their post, not ours).

One logged interaction advances Engagement Status New → Warming (threshold 1), correctly reflecting a warm lead.

**Step 6: Write the Framework Detail playbook**

- **Convert + Inbound** (my-post engager) → a **connect → DM** sequence: they already raised their hand by engaging your content; reference the specific post, connect, then a light DM.
- **Convert + Outbound** (amplifier-harvested buyer) → a comment-on-their-posts warming sequence.
- **Amplify** (engager classified as an amplifier) → route to the amplifier playbook (see `onboard-icp-account`): comment on THEIR posts to reach their audience; success = Buyers Sourced.

**Step 7: Inbound + Amplify compound state (my-post mode — the flywheel closing)**

If a my-post engager classifies as **Amplify**, they get BOTH `Account Source = Inbound` (they came to you) AND `Engagement Role = Amplify` (worth farming their audience). This is by design — do not overwrite Source. Then flag the record as a **seed for amplifier-mode capture**: note in Framework Detail that running this skill in amplifier-mode on *their* posts will harvest their audience into buyers with `Discovery Source` → this person. One inbound engager thus becomes a new audience channel.

**Step 8: Summary**

Show the user:
- Accounts created per bucket (Convert / Amplify), including any Inbound+Amplify compound records and their seed hand-off.
- Dedup/merge skips (already-known people, log entries deduped).
- **Coverage caveat** — how many engagers the scrape could NOT see (reactor lists cap ~1,218; only page 1 unless paginated). Never imply the capture was exhaustive.
- The source post, and each new account's next action.

</process>

<success_criteria>
Capture is complete when:
- The mode was chosen and its attribution applied correctly (Inbound + Linked Post, or Outbound + Discovery Source).
- Engagers were classified Convert / Amplify / skip and the user confirmed before creation.
- New ICP Accounts have clean-slug LinkedIn URLs (never `ACoAA…` URNs), correct Source/Role/Persona.
- Existing accounts were not duplicated and their Account Source was not overwritten.
- Engagement Log entries are idempotent (no duplicates on re-run) and linked to our Post in my-post mode.
- Framework Detail carries the right playbook (connect→DM for inbound buyers, amplifier playbook for Amplify).
- The summary states the coverage caveat and the source post.
</success_criteria>
