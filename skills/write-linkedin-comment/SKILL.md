---
name: write-linkedin-comment
description: "Use when writing LinkedIn comments on posts, replying to commenters, or drafting conversation-driving comments on own posts. Triggers: linkedin comment, comment on post, reply to post, write a comment, respond to this post, comment for this."
---

<objective>
Write short, punchy, human-sounding LinkedIn comments that position the author as an AI expert and add genuine value. Every comment must pass through the humanizer skill as a final step before delivery.
</objective>

<quick_start>
Provide a LinkedIn post (paste or screenshot). Specify if it's your own post or someone else's. For Arabic posts, say so. The skill drafts a 1-3 sentence comment, self-checks against banned patterns, then runs the humanizer skill before presenting the final version.
</quick_start>

<essential_principles>

1. **1-3 sentences max.** Shorter is almost always better. If it feels long, cut it.

2. **Add genuine expert value.** Say something the post didn't already say. A specific insight, a concrete experience, a useful reframe. Never regurgitate the post back at the author.

3. **Sound like a real human typing a quick thought.** Casual and conversational. No thesis statements, no polished essay structure.

3a. **Capitalize and punctuate normally.** Start sentences with a capital letter and use commas, periods and apostrophes the way a literate person does. All-lowercase comments are their own AI tell: they read as someone straining to look casual. "Imperfect punctuation" means the occasional missing period, a comma splice, a sentence fragment. It does not mean abandoning capitalization.

3b. **Write the way you talk, not the way you write.** Say it out loud first. If you would never say the sentence to someone standing next to you, it is wrong. Use plain everyday words and ordinary sentence shapes. Kill compressed noun phrases ("Skills carrying across both tabs matters more than the pick"), stacked abstractions, and clever inverted constructions. A comment that is grammatically clean but sounds assembled is worse than one that rambles slightly.

   Rejected: "Skills carrying across both tabs matters more than the pick, since either way you still have to write one that knows how you actually work."

   Accepted: "Honestly the tab matters less than the Skill. Either way you have to sit down and teach it how you actually work, and that part takes a week."

   What changed: a real spoken opener ("Honestly"), short plain subject-verb sentences, concrete verbs ("sit down and teach it") instead of an abstract gerund subject.

3c. **Keep it short in total length, not in sentence count.** A couple of lines on screen. Cut explanatory tails, setup clauses, and any half that restates the point already made. Sentence arithmetic is not the test, bulk on screen is.

4. **Never fabricate.** No invented stats, client industries, team sizes, or experiences. If you don't have a real example, add value through perspective instead.

5. **Never position the author as a novice.** No "I learned", "I realized", "I was doing X wrong." The author is an expert.

6. **The author is CEO of an AI agency with a team.** Never frame as a solopreneur. Can reference client work but don't lead every comment with "we built/we do/we hire." Add value from perspective, not resume.

7. **Always acknowledge the author first, then add value.** For others' posts, ALWAYS start with a brief acknowledgment before sharing any experience or insight. Jumping straight to "we do X" or "we found Y" without acknowledging the author sounds like self-promotion. Keep acknowledgment to a few words, never sycophantic ("Great post!", "Spot on!", "This is amazing!"). **Vary the acknowledgment every time** — don't repeat "good framework" / "solid breakdown" / "good list" across comments. Use varied forms: reference a specific point they made, use "well put", "fair point", "this resonates", etc.

8. **Vary sentence openers.** Never start every comment with the same word. Never habitually start with "the." Never default to "good/solid/interesting + noun" as a crutch.

9. **For Arabic posts:** Use Egyptian Arabic dialect, casual tone.

10. **Final step is always the humanizer skill.** Every comment gets run through the humanizer before delivery. No exceptions.

</essential_principles>

<comment_types>

**Others' posts (default):**
Value-add expert insight. Acknowledge briefly if natural, then add something the post didn't cover. A specific experience, a practical tip, a reframe, a question that drives conversation.

**Own posts:**
Conversation-driving comments. Invite discussion, share an additional angle, ask a question that pulls readers in. Don't summarize your own post.

**Reply threads:**
Match the thread tone. Keep it contextual to what was said. Short and conversational.

**Arabic posts:**
Egyptian Arabic. Same rules apply. Casual, short, value-add.

Always confirm which type if unclear. Default to "someone else's post."

</comment_types>

<banned_patterns>

These patterns have been flagged repeatedly as AI tells. Using any of them will get the comment rejected.

**Structural patterns (highest priority):**
- "The X is the Y/where/what/one" in any form
- "X is the Y" as a general thesis statement
- "X is where Y" as a highlighting device
- Any "[noun] is [adjective/descriptor]" thesis statement
- Starting sentences with "The" as a habitual opener
- Substituting "that" for "the" to dodge the above rules
- Tailing negations ("no guessing", "no wasted motion")
- "Not only X but Y" / "It's not just X, it's Y" / "It's not X, it's Y"
- Starting with the article "the" every time

**Banned words and phrases:**
- unlock / unlocked / leverage
- is wild / is brutal / hits hard / spot on
- underrated / slept on / game changer / says it all
- this hits hard
- most teams / most people (as generic openers, overused)
- we've seen this firsthand / we see this on repeat / we've seen
- every CEO I've talked to
- nobody's talking about / nobody is talking about
- X is the right call
- X is exactly where/what/how Y
- X changed/changes everything / X changed how we Y (all variations)
- X is everything / X is perfect
- The X is what separates / The X is how we decide
- crucial / pivotal / landscape / delve / foster / showcase
- firsthand

**Written-not-spoken constructions (the say-it-out-loud bans):**
These pass every other check and still sound like nobody on earth. Each one has been rejected in real use.
- Commentary-verb pointers: "trips people up", "does the heavy lifting", "bites hardest", "compounds quietly", "is what gets people", "costs the most quietly"
- Any pointer phrase that grades an item in the post instead of reacting to it ("Point 4 trips people up the most")
- Gapped/elliptical second halves: "Building it got easy, spotting the errors did not", "X changed, Y didn't"
- Compressed noun phrases as subjects: "Skills carrying across both tabs matters more than the pick"
- Pseudo-clefts: "What sits under it is a rebuild", "What tends to go missing is X"

Rejected → accepted, real examples:
- "Point 4 trips people up the most. Building the thing got easy, spotting when it quietly hands you a wrong answer did not." → "Everyone gets stuck on 4. Building the thing got easy, but you still can't tell when it's quietly wrong."
- "Skills carrying across both tabs matters more than the pick, since either way you still have to write one that knows how you actually work." → "Honestly the tab matters less than the Skill. Either way you have to sit down and teach it how you actually work."

**Tone bans:**
- Em dashes
- Essay-grade polish (perfectly balanced clauses, semicolons, formal transitions)
- All-lowercase text, or dropping capital letters to seem casual
- Robotic structure or thesis statements
- Sycophantic openers ("Great question!", "Spot on!", "This is amazing!")
- Generic positive conclusions
- Rule of three lists
- "The X is a Y" (copula avoidance or significance inflation)

</banned_patterns>

<process>

**Step 1: Determine comment type.**
Own post, others' post, reply thread, Arabic? Default to others' post.

**Step 2: Read the post carefully.**
Identify one specific point where you can add genuine expert insight the post doesn't already cover. Don't just agree with it louder.

**Step 3: Draft the comment.**
- 1-3 sentences, casual, normal capitalization
- Brief acknowledgment first, then the value-add
- Don't regurgitate what the post says
- Don't contradict the author
- Don't invent fictional scenarios or client stories
- Vary sentence openers

**Step 4: Self-check against banned patterns.**
Scan every word against the banned patterns list above. Rewrite any violations. Check especially for:
- Any "X is the Y" construction
- Starting with "the"
- Em dashes
- "most teams/people"
- Thesis statement structure
- "we've seen" / "we built" / "we do" as openers

**Step 4b: The say-it-out-loud gate. MANDATORY. It produces visible output or it did not happen.**

This gate has failed in real use every single time it was run "in my head." An internal check is
unfalsifiable, so it gets asserted instead of executed. The fix is that Step 4b must be **written
out in the response**, one row per sentence, before the final comment appears. No table in the
response means the gate was skipped and the comment is invalid.

Do not ask yourself the soft question "would I say this out loud." Any grammatical sentence passes
that. Run these five detectors against each sentence instead. They trip on structure, not on feel.

| # | Detector | Trips when |
|---|----------|-----------|
| D1 | Copula thesis | Any clause of the shape "X is the Y" or "X is [descriptor]" used to make a point. Includes "that X is", which is the same crime wearing a different article. |
| D2 | Comparison or summary tail | The sentence ends by grading the thing it just said: "probably matters more than X", "counts for more than Y", "which is the real win". Cut the tail, keep the clause. |
| D3 | Clause count | More than two clauses stacked with commas or "and ... so ...". Speech breaks into separate sentences. Writing stacks. |
| D4 | Subject shape | The subject is a gerund phrase or an abstraction ("skipping that component", "state parked in a sandbox") rather than a person, a team, or a named thing doing a plain verb. |
| D5 | Gapped or elliptical half | A second half that drops its verb or mirrors the first half for balance: "cheap on day one, impossible after", "building it got easy, spotting it did not". |

Write the gate like this, verbatim shape:

```
S1 "Respect for publishing the losing table."  D1 no  D2 no  D3 no  D4 no  D5 no  PASS
S2 "Worth adding that a batch retrain needs a drift detector to fire, and tuning one is a
    project on its own, so not needing one probably matters more than the hit rate gap."
    D2 TRIP (ends on a comparison tail)  D3 TRIP (three stacked clauses)  REWRITE
```

Every TRIP gets rewritten and re-run through all five detectors. You are not allowed to reach
Step 5 with a TRIP outstanding.

**Also report what you killed.** Under the table, list the drafts the gate rejected and which
detector caught them. A gate that never rejects anything is a gate that never ran. Real rejections
from live use, for calibration:

- "The pause is the part I'd watch" → D1
- "The waiting is the real feature" → D1, plus it handed the author his own words back
- "Skipping that component is the real win" → D1, D2
- "Cheap to put in on day one, impossible to put in after" → D5
- "Compute breaks in the quietest way" → D4
- "Point 4 trips people up the most" → D4 (pointer construction; a real person says "Everyone gets stuck on 4")

**Rewrite recipe when a detector trips:** give the sentence a human subject doing a plain verb,
use the words you would use in speech, break the stacked clauses into separate sentences, and
delete the grading tail entirely rather than trying to rephrase it.

**Watch the target you are optimizing for.** Balanced, tight and quotable is the wrong goal and it
is the direct cause of nearly every trip above. Aim for plain and slightly loose instead.

**Step 5: Invoke the humanizer skill.**
Run the final comment through the humanizer skill. Apply its output as the delivered version. This is not optional.

</process>

<anti_patterns>

- Leading every comment with "we built/we do/we hire for" instead of adding value from perspective
- Making the comment about us instead of contributing to the conversation
- Inventing client industries, team sizes, or statistics
- Copying the post's own phrasing back at the author
- Writing more than 3 sentences
- Using any word or construction from the banned list
- Skipping the humanizer pass
- Running Step 4b silently and claiming it passed. If the detector table is not printed, the gate did not run
- Delivering a comment when the gate rejected nothing, which almost always means it was not executed
- Being sycophantic without adding substance
- Using fictional "we had a client who..." stories
- Starting every comment the same way

</anti_patterns>

<success_criteria>

- [ ] 1-3 sentences
- [ ] Adds value the post didn't already cover
- [ ] Step 4b detector table printed in the response, one row per sentence, zero TRIPs outstanding
- [ ] Rejected drafts listed under the table with the detector that caught each
- [ ] No banned patterns survived
- [ ] Sounds like a human typed it quickly
- [ ] Normal capitalization, not all-lowercase
- [ ] No fabricated claims
- [ ] Passed through humanizer skill
- [ ] Appropriate language (Egyptian Arabic for Arabic posts)
- [ ] Varies from previous comments in the session (no repetitive openers)

</success_criteria>
