<overview>
Exact Airtable writes for each outreach event, so every session logs the same event identically. "Decision" marks a value Hisham confirms before it is written. Field and choice IDs are in SKILL.md `<fixed_locations>`.
</overview>

<shared_rules>
- **Engagement Status (contact):** follows the `onboard-icp-account` count rule, counting only Hisham's own interactions (messages sent, connection requests, comments, meetings) — 1+ → Warming, 3+ → Active. Replies and acceptances are logged but do not count. Never downgrade automatically; Cold is a decision.
- **Company Progression:** measures the account's response (strategy §8), never our activity. Sends never move it. Stages move only on the account's behaviour, as a decision.
- **Sequence Step:** opener = 1, then increment per message in the thread.
- **Open-record hygiene:** a no-reply nudge made moot by a reply is set Dropped mechanically, with a Notes line saying why. Dropping any other open record is a decision.
- **Stale context:** if the event contradicts the contact's Framework Detail (e.g. it still says "draft ready" after the send), propose a one-line update as a decision.
</shared_rules>

<new_outreach_record>
Every Outreach record this skill creates carries:
- Label `fld07cI9TYWV9obKI`: "<Contact name> — <step>" (opener, no-reply nudge, reply pivot, check-in…)
- Status `fldU0SrLvnS33S9rf`: Planned (or Draft when a body is saved)
- ICP Account `fld0BtwAAaerHKVIp`: the contact's record ID (required — an unlinked record is invisible to Status)
- Persona `fldgZ5mH4EcTaWgiI`: `recgRznilW4dlbyl0`
- Channel `fld3r0iMNKAwUEgQW` and Sequence Step `fldBEdKgUb7DcIK7D` when known
- Due Date `fldwA2NnX2J9MXYlX` and/or Send Gate `fldNewOfcvDfFEDeD` — at least one; if neither is agreed yet, propose one as a decision before creating
- Notes `fldVMJJvtBxCzjUHG`: why the record exists and what it is built on
</new_outreach_record>

<events>

<event name="sent">
Outreach record for this message: Status → Sent · Sent Date → reported date · Message Body → exact sent text · Notes → append "Sent <date>" and any edits Hisham made.
Engagement Log: new entry, Activity Type DM (Comment for comments), Date, Notes = channel + one-line summary, ICP Account link.
Contact: apply the Engagement Status count rule.
Next step: if no open record covers the no-reply path → **Decision:** propose a Planned "<Name> — no-reply nudge" (`<new_outreach_record>`) with Due Date = sent date + 14 days (playbook cadence default) and Send Gate "if still no reply". Consider same-company threads: several open nudges at one company in the same week may look coordinated — propose staggering or a single nudge.
</event>

<event name="connection_request_sent">
Engagement Log: Activity Type Connection Request.
Contact: count rule.
The opener record's Send Gate → "Connection request sent <date>: send on acceptance" (plus any fallback Hisham states, e.g. InMail). If the contact has no opener record yet, create one (`<new_outreach_record>`) with that gate, or with the HOLD condition if Hisham has put the contact on hold — a sent request puts the contact in play.
</event>

<event name="accepted">
Engagement Log: Activity Type Connection Request, Notes "accepted" (does not count toward Engagement Status).
Opener record gated on acceptance: Send Gate → "Accepted <date>: ready to send"; if Approved, it now appears as Ready to send in Status.
</event>

<event name="replied">
The Sent record they answered: Status → Replied.
Engagement Log: Activity Type DM, Notes = summary or pasted text of the reply.
Open no-reply nudge for this contact → Dropped ("replied <date>").
Reply pivot: ensure an open pivot record exists — if none, create Planned "<Name> — reply pivot" (`<new_outreach_record>`) with Send Gate "Draft from reply of <date>". Offer to draft it now via `workflows/draft-message.md`.
Company → **Decision:** propose Engaging or Conversation from the reply's substance (a polite acknowledgment is not a conversation).
</event>

<event name="meeting">
Engagement Log: Activity Type Meeting/Call, Notes = outcome and agreed next steps.
Every agreed next step becomes an Outreach record (Planned) with the date or condition agreed — **Decision** where no date was agreed.
Company → **Decision:** Conversation or Proposal.
</event>

<event name="no_reply_after_nudge">
**Decision** only: another step (with date), hold (gate-only), or cool. Cooling = contact Engagement Status Cold and open records Dropped; for a Tier A company whose whole committee has gone quiet, propose Tier A → B per the tiering model's cooling rule.
</event>

<event name="hold">
Open record(s): Send Gate → "HOLD until <condition>"; clear Due Date unless a date was decided. Notes: who decided and why.
</event>

<event name="drop_thread">
Open records → Dropped with reason, AND contact Engagement Status → Cold. Dropping every open record without cooling would leave a dead end. If Hisham wants the contact kept for later, it is not a drop: use `hold`.
</event>

</events>

<unrecorded_facts>
If a date or text is unknown, write the known part and say so in Notes ("Sent around 2026-09-10/11; exact date not recorded"). Leave Sent Date empty rather than guessing.
</unrecorded_facts>
