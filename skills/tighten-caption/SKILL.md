---
name: tighten-caption
description: "Use when a finished LinkedIn post caption is fluffy, wordy, padded, or over its character ceiling and needs a prose-tightening edit before publishing. Triggers on 'tighten this caption', 'the caption is fluffy', 'trim the fluff', 'cut this down', 'too wordy', 'get it under the char limit', 'Strunk pass', 'edit the caption down', or any time a drafted caption reads padded, repeats itself, or exceeds its length ceiling. Run it on a caption that is already written and voice-matched (drill Steps 1–6 done), not while drafting. This skill formalizes drill Steps 7 and 7b: the Elements-of-Style tightening pass plus the chained humanizer pass."
---

<objective>
Take a finished, voice-matched caption from fluffy to "every word tells": a Strunk-based
economy-and-structure edit down to the confirmed character ceiling, then the humanizer
pass for AI tells, with the mandatory re-read gate after every edit round.

Division of labor: **this skill owns prose economy and sentence structure** (needless
words, weak negatives, passives, vague language, block rhythm, parallelism, emphasis
placement). **The `humanizer` skill owns AI-writing tells** (AI vocabulary, negative
parallelisms, rule-of-three, puffery, filler tells) — it is chained at the end, never
duplicated inline. Jargon accessibility belongs to the drill's Dim-13 pass; hook
quality belongs to the hooks playbook. Neither runs here.
</objective>

<quick_start>
Give the skill a caption (a `post.txt` path, pasted text, or an Airtable Posts record)
and confirm the char ceiling for this post. It inventories the substance, runs Sweep A
(word-level cuts) and Sweep B (structure), verifies against the ceiling and the
do-not-lose checklist, presents a diff summary, then invokes `humanizer` and re-verifies.

Minimum invocation: "Tighten this caption: `<path-or-text>`."
</quick_start>

<essential_principles>

**The voice profile WINS over every editing rule.** Untouchable, even where Strunk or a
generic editor would flag them: the signature markers ✅ ↳ ♻️ 👇 (and differentiated
list markers), the "Here's the… / here's the thing" signposts, staccato fragments and
one-line paragraphs, the two-line hook, and the four-beat closing (question → save →
repost → "And follow Hisham H. Shihab"). Never "fix" a fragment into a full sentence.
Strunk's paragraph rules apply to line-blocks, not prose paragraphs.

**Cut fat, keep substance.** Fat = restatement, throat-clearing, hedges, scaffolding,
empty intensifiers. Substance = brand identity and the "we" agency voice, the ironic or
contrarian hook angle, hard numbers, named cases, the KI source URL, the framework's
every leg, the closing beats, the first-hand POV beat. The test before any cut: does the
reader lose a fact, a beat, or a feeling — or only words? Only words → cut. Anything
more → propose it in the diff summary, don't impose it. "Less text is better, but don't
make it cryptic."

**The hook is out of scope.** Its two lines pass through byte-identical. Hook editing is
a different job with its own playbook.

**Confirm the char ceiling with the user at runtime.** Past posts used ≤2,700 and
≤3,000 — always confirm per post; never assume. The ceiling covers the caption only
(comments excluded). Count Unicode codepoints excluding the trailing newline:
`python3 -c "print(len(open(f,encoding='utf-8').read().rstrip(chr(10))))"`

**Mandatory re-read gate.** After ANY edit round, a fresh, full, end-to-end read of the
SAVED file must precede any verification or "done" claim. Edits break flow in places you
did not edit — orphaned antecedents, cut bridge lines, dangling pronouns, redundant
beats — and your in-memory model is the pre-edit version. Edit again → re-read again,
no exceptions.

**Never introduce em dashes.** Periods and commas. (Parenthetic commas are the
sanctioned aside — see `references/usage-rules.md` Rule 3 — but the usual better fix is
deleting the aside.)

**Under ceiling is a result, not a problem.** If tightening lands the caption well under
the ceiling, do NOT pad it back. Shorter that still carries everything is the win.

</essential_principles>

<workflow>

**Step 1: Resolve inputs**

Require:
- The caption — a generated `post.txt` path, pasted text, or an Airtable Posts record
  (read its Body Text). If it came from a `generated/<N>-slug/` bundle, edits save back
  to that `post.txt`.
- The confirmed char ceiling for this post (ask; 2,700 vs 3,000 is a per-post decision).
- Whether a KI source URL is expected in the body (external KI, not attached-PDF case).

If the caption has clearly not been voice-matched yet (no markers, no closing beats),
say so and stop — this skill runs after drill Steps 1–6, not instead of them.

**Step 2: Baseline read + substance inventory**

<read_before>
- The caption itself (the saved file, end to end)
- `references/fat-vs-substance.md` — the governing lens and the voice-profile protections
</read_before>

Read the caption once, untouched. Record:
- The starting char count (run the count command; never estimate).
- The substance inventory — the do-not-lose list verified at Step 5: hook lines
  (byte-exact), every hard number and named case, the framework's legs, the first-hand
  POV beat, the KI source URL, the closing beats, the signature markers in use.

**Step 3: The Strunk pass — two sweeps, in order**

*Sweep A — word level (mechanical, line by line):*

<read_before>
- `references/sweep-a-economy.md` — Rules 13, 11, 10 with caption-register examples
- `references/words-and-expressions.md` — the misused-words scan list (Strunk Chapter V + LinkedIn filler)
</read_before>

Order: formula phrases and lookup-list hits (deletes) → passives, buried verbs,
"there is" (rewrites) → negatives to positive form (never via "it's not X, it's Y").

*Sweep B — sentence and block structure:*

<read_before>
- `references/sweep-b-structure.md` — Rules 12, 14–18 and the adapted 8/9 block rules
</read_before>

Order: block topology (merge restaters, split double-idea blocks) → parallel marker
lists → concretize vague claims (KI-sourced additions are proposals) → vary monotone
rhythm → slow-parsing lines and tense drift → end every block on its power word.

Save after each sweep. Log every substance-adjacent change for the Step 5 diff summary.

**Step 4: Length check against the ceiling**

Run the count command on the saved file. Over the ceiling → return to the fat, not the
substance: more Sweep A on the wordiest blocks, or propose a substance cut to the user
as an explicit option. Under the ceiling → stop cutting for length; do not pad.

**Step 5: Re-read gate + verification checklist + diff summary**

Fresh full read of the saved file (mandatory — see principles). Then verify ALL:
1. Char count ≤ the confirmed ceiling.
2. Substance inventory from Step 2 intact — every number, case, framework leg, POV
   beat, closing beat.
3. KI source URL present in the body (unless the attached-PDF exception applies).
4. Hook lines byte-identical to Step 2.
5. No em dashes introduced; no stray `#` handles; markers and signposts intact.

If a punctuation or grammar doubt surfaced during editing, consult
`references/usage-rules.md` now — it is on-demand, not a routine pass.

Present the diff summary to the user: chars before → after, the word-level changes in
one line ("cut N formula phrases, flipped N passives…"), and each substance-adjacent
cut or concretization as its own approve/reject item. Apply the user's verdicts before
moving on.

**Step 6: Chain the humanizer**

Invoke the `humanizer` skill on the tightened caption. Apply ONLY fixes the voice
profile does not override — protected regardless of what the humanizer flags: the
✅ ↳ ♻️ 👇 markers, the "Here's the…" signposts, the staccato fragments. Strip the tells
the profile does NOT sanction (em dashes, "it's not X, it's Y", tailing negations,
forced rule-of-three, synonym cycling, padded signposting, puffery, curly quotes).

**Step 7: Post-humanizer re-verify**

Humanizer edits change length. Re-run the count; if over the ceiling, re-trim (fat
first) — then the re-read gate applies again. Deliver: the final caption, the final
char count vs ceiling, and the consolidated before/after summary. Save to the source
`post.txt` if the caption came from a file.

</workflow>

<anti_patterns>

- **"Fixing" a staccato fragment into a full sentence.** Fragments that land a beat are
  the voice. (Strunk himself sanctions the emphatic fragment — Rule 6.)
- **Deleting ✅/↳ structure, signposts, or closing beats as "wordy".** Voice profile wins.
- **Trimming a hard number, a named case, or the KI link to make weight.** Numbers are
  never fat. Propose substance cuts; never impose them.
- **Editing the hook.** It passes through byte-identical.
- **Flipping a weak negative into "it's not X, it's Y".** That trades a Strunk violation
  for an AI tell. Say what the thing IS.
- **Verifying from memory.** Every verification follows a fresh read of the saved file.
- **Padding back up after landing under the ceiling.**
- **Running the humanizer's checklist inline instead of chaining the skill.**
- **Running on a raw draft.** This skill is drill Step 7, not Steps 1–6.
- **Estimating the char count.** Always run the command.

</anti_patterns>

<success_criteria>

- Every Sweep A and Sweep B rule was applied through the fat-vs-substance lens; the
  reference file for each sweep was read before that sweep ran.
- Final char count ≤ the user-confirmed ceiling (command-verified, caption only).
- Substance inventory 100% intact or every deviation explicitly user-approved.
- Hook byte-identical; markers, signposts, closing beats, KI URL present.
- No em dashes; no new AI tells; humanizer invoked as a chained skill and its fixes
  applied under voice-profile precedence.
- A fresh full re-read of the saved file preceded every verification claim.
- The user received a before/after diff summary and ruled on every substance-adjacent
  change.

</success_criteria>

<reference_index>
**Governing lens (read at Step 2):** references/fat-vs-substance.md
**Sweep A — word economy (Strunk R10/R11/R13):** references/sweep-a-economy.md
**Sweep A lookup — misused words (Strunk Ch. V + LinkedIn filler):** references/words-and-expressions.md
**Sweep B — structure (Strunk R12/R14–R18, adapted R8/9):** references/sweep-b-structure.md
**On-demand — punctuation & grammar (Strunk R1–R7):** references/usage-rules.md
**Chained skill:** humanizer (~/.claude/skills/humanizer)
**Source of truth for the drill context:** content-engine `docs/hooks/post-revision-drill.md` (Steps 7/7b, Section 3)
**Full book (re-derivation source):** content-engine `docs/reference/elements-of-style/elements-of-style.txt`
</reference_index>
