# Workflow: Draft outreach copy

<required_reading>
1. `references/dm-playbook.md` — the cluster-neutral rules AND the section for this contact's cluster
2. The voice records in Airtable are for posts; outreach copy follows the playbook, not the post voice profile
</required_reading>

<process>

**Step 1: Load the thread**

- Contact record: name, job title, company, Framework Detail.
- Company record: Industry (selects the playbook cluster section), Tier, Warm Path, Notes.
- All linked Outreach records, oldest first: read every Message Body. Prior sent text is the ground truth for what this person has already heard — never repeat a claim or question they already got, never contradict it.
- Relationship type: cold, accepted connection, warm acquaintance, existing client, partner. Register follows the playbook.
- Examples: the Sent records of other contacts in the same cluster (Outreach, Status Sent) — the latest ones reflect the current wording; older ones may predate playbook changes.

**Step 2: Load the evidence**

Find the contact's scrape capture in the captures folder (match by LinkedIn slug or name). If none exists, scrape via the `onboard-icp-account` commands (one profile ≈ $0.003; confirm with Hisham before more than 10). Every personal line ("you run…", "you've spent…") must trace to a field in the capture. Research-table notes and bench notes are NOT evidence for personal claims.

**Step 3: Draft**

Follow the playbook structure for the step type (opener / nudge / reply pivot / partner check-in). English only. If the cluster section is empty (a cluster not yet campaigned), stop and ask Hisham for the pitch line and the scoped claim — do not borrow another cluster's.

Run the playbook's pre-send checklist on the draft and fix failures before presenting.

**Step 4: Present**

Show the draft plus one line per personal claim naming its evidence (scrape field). Note the channel and, for InMail, the subject line.

**Step 5: Save**

Update the Planned record for this step, or create one with every field in `references/sequence-rules.md` `<new_outreach_record>` (the ICP Account link is required). Write Message Body, Status Draft, Language English, Channel, Sequence Step, Notes (what the draft is built on). If the record has neither Due Date nor Send Gate, propose one with the draft. On Hisham's approval set Status Approved.

**Revisions:** apply only the change Hisham asked for. Diff the new version against the previous one before presenting and confirm nothing else moved.

</process>

<success_criteria>
- Every personal claim cites a scrape field
- Pre-send checklist passes
- Draft saved to Airtable as Draft (or Approved after approval) with channel and gate/due date
- Revisions changed only what was requested
</success_criteria>
