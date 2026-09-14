# Workflow: Log an outreach event

<required_reading>
1. `references/sequence-rules.md`
</required_reading>

<process>

**Step 1: Identify the event and the records**

Classify what Hisham reported: Sent · Connection request sent · Accepted · Replied · Meeting/call happened · No reply after nudge · Drop thread · Hold.

Find the contact in ICP Accounts (search by name) and its linked Outreach records. If the name is ambiguous or no record matches, ask — never guess the record.

**Step 2: Collect missing facts**

- For a send: the exact text sent. If Hisham sent the Approved draft unchanged, that draft IS the text; if he changed anything, get his version. Date = the date he reports, else today only if he says "just now/today".
- For a reply: what they said (a summary, or the text he pastes).
- If a fact is unknowable, record it as not recorded — never fill it in.

**Step 3: Plan the writes**

Apply the matching row of `references/sequence-rules.md`. Produce the exact list of writes (table, record, field → value). Split them into:
- **Mechanical writes** (status flips, dates, message body, Engagement Log entry) — proceed.
- **Decisions** (nudge date, company stage move, cooling, dropping open records other than a nudge made moot by a reply, Framework Detail updates) — present each with a proposed value and reasoning, and wait for Hisham.

**Step 4: Write**

Mechanical writes first, then confirmed decisions. Use choice names as plain strings for singleSelect fields. Link records by ID.

**Step 5: Verify**

Re-read the contact's Outreach records and Engagement Log from Airtable:
- The event's record shows the new state.
- The contact is not a dead end: it has an open record with a Due Date or Send Gate, or it is Cold. If neither holds, the log is incomplete — go back to Step 3 and get the missing decision.
- Engagement Status matches the interaction-count rule.

Report what changed in two or three lines, and state the contact's next open step.

</process>

<success_criteria>
- Every write traces to a row of sequence-rules.md or an explicit Hisham decision
- Post-write re-read confirms the state and the no-dead-ends rule
- No invented dates, texts, or replies
</success_criteria>
