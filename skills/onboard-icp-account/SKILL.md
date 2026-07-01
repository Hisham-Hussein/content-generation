---
name: onboard-icp-account
description: Use when onboarding a new ICP account, adding a LinkedIn lead, creating an ICP contact, or enriching a prospect profile. Triggers on "onboard ICP", "add ICP account", "new ICP lead", "add this person to ICP", "enrich this LinkedIn profile", or when the user identifies someone on LinkedIn they want to track and engage with.
---

<objective>
Onboard a new ICP (Ideal Customer Profile) account into the iSemantics Content Engine Airtable base. Scrapes their LinkedIn profile via Apify, creates linked records across ICP Accounts, ICP Posts, and Engagement Log tables, and sets up a warming playbook with next actions.
</objective>

<quick_start>
User provides a LinkedIn profile URL. You scrape it, review the data together, then create ICP Account + optional ICP Post + Engagement Log records in Airtable. Takes about 2 minutes.
</quick_start>

<essential_principles>

**Airtable IDs (iSemantics Content Engine):**
- Base: `appXFk4T8KyNf4odQ`
- ICP Accounts table: `tblOY0n0NKqp9iDsJ`
- ICP Posts table: `tblt9rQd8xnahLB99`
- Engagement Log table: `tblyaWrUUMsyveMhn`
- Personas table: `tblQ4ggCKuBmkSZ6B`

**Never fabricate values.** LinkedIn profile slugs, record IDs, and URLs must come from real data — scraper output, Airtable responses, or the user. Never guess a LinkedIn slug from a display name.

**LinkedIn Posts URL pattern.** Always construct the activity feed URL from the scraped `publicIdentifier`: `https://www.linkedin.com/in/{publicIdentifier}/recent-activity/all/` — this lets the user browse their posts without triggering a profile view notification.

**Scraper location:** `/home/hisham/ai-agency/content-engine/experiments/linkedin-profile-scraper-spike/`
- Primary command: `pnpm scrape:dev-fusion "{linkedin-profile-url}"` (dev_fusion actor — richer schema: `about`, structured `experiences`, firmographics, contact fields, recommendations)
- Fallback command: `pnpm scrape:supreme-coder "{linkedin-profile-url}"` (use if dev-fusion returns 0 results or fails; also the only actor that returns `mutualConnections`)
- Requires: `source /home/hisham/ai-agency/content-engine/.env` for `APIFY_API_KEY`
- Cost: ~$0.003 per profile
- Output: JSON capture saved to `captures/` directory
- Note: the two actors use different field names for the same data (e.g. dev-fusion `experiences`/`about`/`followers` vs supreme-coder `positions`/`summary`/`followerCount`). The Step 4 field mapping below targets the dev-fusion schema.

</essential_principles>

<process>

**Step 1: Get the LinkedIn profile URL**

Ask the user for the exact LinkedIn profile URL if not already provided. Do NOT guess URLs from display names — LinkedIn slugs are not predictable.

If the user provides context about how they found this person (a post, a comment exchange, a DM), capture that context — it feeds into the Engagement Log and Framework Detail later.

**Step 2: Scrape the profile**

```bash
cd /home/hisham/ai-agency/content-engine/experiments/linkedin-profile-scraper-spike && \
set -a && source /home/hisham/ai-agency/content-engine/.env && set +a && \
pnpm scrape:dev-fusion "{url}"
```

Read the captured JSON file. Verify the scraped person matches who the user intended by checking `headline` and `firstName`/`lastName`. If it's the wrong person, stop and ask for the correct URL.

If the run returns 0 results or fails, retry once, then fall back to `pnpm scrape:supreme-coder "{url}"` (and read its capture instead). When a run fails with exit code 137, that is an out-of-memory kill — the actor needs more memory than its 128 MB default; the runner now requests 512 MB by default, so a fresh retry usually clears it.

**Step 3: Present the profile summary and get user decisions**

Show the user a summary of the scraped data:
- Name, headline, location
- Current company and job title
- Career history (focus on relevant roles)
- Follower/connection counts
- Any mutual connections (only available from the supreme-coder fallback actor; dev-fusion does not return this)

Then ask for these decisions:

1. **Account Type** — Buyer or Strategic Partner (WHO they are to us)
   - Buyer: potential customer for our services/products
   - Strategic Partner: peer worth building a relationship with for referrals, co-marketing, audience overlap

2. **Engagement Role** — Convert, Amplify, or Refer (WHY we engage — orthogonal to Account Type; one account can be a Buyer AND an Amplify target)
   - **Convert**: engage to move them toward buying. Default for buyers.
   - **Amplify**: engage to reach THEIR audience, not to convert them. Use for any expert with a large following whose audience overlaps our buyers — legal-tech experts (implementers, consultants, trainers, educators, researchers, founders) first, and general-AI experts second (iSemantics is legal-AI-focused but still a general-purpose AI partner). The qualifying test is **audience composition, not their profession**. Success = buyers discovered from their audience (Buyers Sourced), NOT their reciprocation.
   - **Refer**: engage to build a cross-referral relationship (e.g. a peer in an adjacent vertical who sends work your way).

3. **Account Tier** — High, Medium, or Low
   - High: decision-maker at target company, strong ICP fit. For Amplify accounts: legal-tech amplifier with a genuinely ICP-dense audience.
   - Medium: ICP match but not yet a clear decision-maker. For Amplify: general-AI amplifier, or legal amplifier with a mixed audience.
   - Low: tangential relevance, worth monitoring

4. **Suggested Framework** — Ask, Share, Build On, Challenge, or Support
   - Ask: pose a question to learn about their workflow
   - Share: offer relevant content or insights
   - Build On: extend something they already said
   - Challenge: respectfully push back on a take
   - Support: validate and amplify their point

5. **Which Persona** to link to — look up available personas from the Personas table

**Account Source** is not a decision here — this skill always sets it to **Outbound** (you found them by exploring LinkedIn). Inbound accounts are created by the `capture-post-engagers` skill instead.

**Step 4: Create the ICP Account record**

Create the record in the ICP Accounts table (`tblOY0n0NKqp9iDsJ`) with these fields:

| Field ID | Field | Source |
|----------|-------|--------|
| `fldaixpV78VeByf4B` | Account Name | `firstName` + `lastName` from scrape |
| `fldWjxqeaadB3pEq9` | Account Type | User's choice from Step 3 (Buyer or Strategic Partner) |
| `fldDEj7z3WCTclrNQ` | Engagement Role | User's choice from Step 3 (Convert, Amplify, or Refer) |
| `fldQAe6kuhwufdYQv` | Account Source | Always `Outbound` for this skill |
| `fldqQfgZPVOSvtN9h` | Discovery Source | Optional. Record ID of the Amplify account whose comment section surfaced this buyer (see amplifier note below). Leave empty otherwise. |
| `fldb4Un5lqk7dwsBO` | LinkedIn URL | The profile URL used for scraping |
| `fldRJc1rHebU92Q0T` | LinkedIn Posts URL | Constructed from `publicIdentifier` |
| `fldux9S6rYBKItllT` | Company | `companyName` from scrape |
| `fldB585YwEvkryf2P` | Job Title | `jobTitle` from scrape |
| `fld7BZDeJGfQ8ecj1` | Account Tier | User's choice from Step 3 |
| `fld2aZsRmziCwNyqM` | Engagement Status | "New" (always starts here) |
| `fldtGWkJGZeEgiGc2` | Suggested Framework | User's choice from Step 3 |
| `fldRKzrVALn5et9Aw` | Recent Post Summary | From engagement context if available |
| `fldw6LdfaGag7XceF` | Recent Posts | From engagement context if available |
| `fldHoztF9ak9M5flp` | Last Post Date | Today's date if they posted today |
| `fldJzAHOMA60kPjb3` | Framework Detail | Write a specific playbook based on context |
| `fldswXZjClsRUYAoR` | Persona | Record ID of chosen persona |

Save the returned record ID — it's needed for linking ICP Post and Engagement Log.

**If Engagement Role = Amplify, write an amplifier playbook into Framework Detail** (not a warming-to-a-deal playbook):
- The goal is visibility with the buyer subset of THEIR audience. Comment early and substantively on their posts so their followers see you; do not pitch the amplifier.
- Before investing effort, tell the user to **audit the amplifier's comment section for buyer density** — if the commenters are real ICP buyers, lean in; if they're mostly peers/students/vendors, keep effort Low. An amplifier's value is buyer density, not follower count.
- State plainly that the amplifier may never reciprocate, and that's fine — success is measured by **Buyers Sourced** (buyers you later harvest from their audience), not their replies. Engagement Status will track YOUR commenting cadence on their posts (each logged Comment advances New → Warming → Active), which is the correct signal.
- To systematically harvest buyers from an amplifier's comment section, use the `capture-post-engagers` skill in amplifier mode on one of their posts.

**Discovery Source (attribution):** if the person you're onboarding is a *buyer you found inside an amplifier's comment section*, set `Discovery Source` (`fldqQfgZPVOSvtN9h`) to that amplifier's ICP Account record ID, and keep Account Source = Outbound. This feeds the amplifier's Buyers Sourced count — the metric that proves which amplifiers actually produce pipeline.

**Step 5: Create ICP Post record (if applicable)**

If the user found this person through a specific LinkedIn post, create a record in the ICP Posts table (`tblt9rQd8xnahLB99`):

| Field ID | Field | Source |
|----------|-------|--------|
| `fld2kKBCOoFHio790` | Post Summary | Brief description of the post |
| `fldGpxi9koxcpfssG` | LinkedIn URL | Direct URL to the post |
| `fldRcysWoX77samPN` | Posted Date | Date the post was published |
| `fld7qjdtYBgeVUzh5` | Topic/Theme | What the post was about |
| `fldrjIdCIfylw3Opr` | Comment Framework Suggestion | Specific commenting approach for this post |
| `fldWZ6x255j9YS1s7` | ICP Account | Link to the account record from Step 4 |

If there's no specific post context, skip this step.

**Step 6: Create Engagement Log entry (if applicable)**

If the user has already interacted with this person (commented, DM'd, reacted), create a record in the Engagement Log table (`tblyaWrUUMsyveMhn`):

| Field ID | Field | Source |
|----------|-------|--------|
| `fldMYcZeb4lQ3Iu8t` | Date | Date of the interaction |
| `fldMqlsK9PuyNtm34` | Notes | What happened — what was said, their response |
| `fldmTCtHwKiHS7M2k` | ICP Account | Link to the account record from Step 4 |
| `fld0cV5HDpYvB2TfR` | Activity Type | Comment, Connection Request, DM, Reaction, or Lead Magnet Delivery |

Create one record per distinct interaction. If the user had 2 comment exchanges, that's 2 records.

After creating engagement records, check if Engagement Status should advance:
- 1+ interactions → "Warming"
- 3+ interactions → "Active"
Update the ICP Account record if needed.

For **Amplify** accounts, the interactions driving this are YOUR own comments on their posts (Activity Type = Comment), so Status reflects your presence cadence in their comment section — reaching "Active" means you're showing up consistently, not that the amplifier reciprocated. That is the intended behavior.

**Step 7: Summary**

Show the user a clean summary of everything created:
- ICP Account record with key fields
- ICP Post record (if created)
- Engagement Log entries (if created)
- Current Engagement Status
- The Framework Detail with next actions
- The LinkedIn Posts URL they can use to monitor posts without profile views

</process>

<success_criteria>
Onboarding is complete when:
- ICP Account record exists with all available fields populated
- LinkedIn Posts URL is constructed and saved
- ICP Post record exists (if there was a specific post)
- Engagement Log entries exist (if there were interactions)
- Engagement Status reflects the actual interaction count
- Framework Detail contains specific next actions
- User has confirmed the record looks correct
</success_criteria>
