# Workflow: Status

<required_reading>
1. `templates/status-report.md`
</required_reading>

<process>

**Step 1: Open outreach queue**

Get today's date with `date +%F` (machine local time); use the machine's IANA zone for date filters.

`list_records_for_table` on Outreach with filter Status isAnyOf [Planned, Draft, Approved] (choice IDs from SKILL.md). Fields: Label, Status, Due Date, Send Gate, Channel, ICP Account, Notes. Paginate until exhausted. Resolve names and companies with one ICP Accounts query on the linked record IDs (Account Name, Company).

Bucket each record — blocking gates before dates:
1. **Waiting on a condition** — Send Gate names a *blocking* condition not yet met: acceptance, a reply (for reply pivots), HOLD, demo readiness, someone else's response. Show any Due Date as "check date". A no-reply gate ("if still no reply") is NOT blocking: it is confirmed at send time by checking the thread, so those records are bucketed by their Due Date below.
2. **Overdue** — Due Date before today
3. **Due this week** — Due Date from today through today + 7 days inclusive
4. **Later** — Due Date after that
5. **Ready to send** — no Due Date, gate met or "now". If Status is Planned/Draft, say it needs drafting/approval first.
6. **Needs a decision** — neither Due Date nor Send Gate (breaks the no-dead-ends rule)

**Step 2: Recent activity**

Engagement Log entries with Date in the past 14 days (`isWithin pastNumberOfDays 14`). Resolve contact names. Lead with replies, acceptances, and meetings — these may unblock "waiting" records (e.g. an acceptance satisfies an "on acceptance" gate) — then sends, briefly.

**Step 3: Dead-end check**

List ICP Accounts where Outreach (inverse) is not empty and Engagement Status is not Cold. For each, check whether any linked Outreach record is open (Planned/Draft/Approved). Contacts with none are **dead ends** — list them with their last Sent record.

Also scan the Framework Detail of in-play contacts for next steps stated only there (a date or "next:" line with no matching open Outreach record). List them as **next steps outside the queue**.

**Step 4: Pending bench decisions**

Read every `*.md` in the bench folder. For each cluster, list:
- Tier A rows with Status **Proposed** → decisions waiting on Hisham (Tier B rows stay Proposed by design: `build-icp-list` asks approval only for Tier A; list Tier B only if Hisham asks)
- Rows with Status **Approved** → approved but not yet onboarded (work to do)

If a bench file has no Status column, say so plainly — do not infer decisions.

**Step 5: Report**

Fill `templates/status-report.md`. Names spelled out, no record IDs or codes in the chat output. Omit empty sections. End with the single most useful next action, and offer to repair dead ends (repair goes through `workflows/log-event.md` and needs Hisham's decisions).

</process>

<success_criteria>
- Every open Outreach record appears in exactly one bucket
- Dead ends and next-steps-outside-the-queue are listed, not silently fixed
- Pending bench decisions come from the Status column, not inference
- Nothing was written to Airtable
</success_criteria>
