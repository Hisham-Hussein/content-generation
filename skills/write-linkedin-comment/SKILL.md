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

**Step 4b: The say-it-out-loud gate. MANDATORY, and it is a written check, not a feeling.**
Take each sentence of the draft one at a time and answer, in your head, this exact question:
"Would I say this sentence out loud, in these words, to someone standing next to me?"

Any sentence that gets a "no" is rewritten before you continue. You are not allowed to reach
Step 5 with a "no" still in the comment. Watch specifically for the first sentence, which is
where the pointer constructions hide ("Point 4 trips people up", "Number 5 bites hardest") —
a real person just names the item and says what happens ("Everyone gets stuck on 4").

Rewrite recipe when a sentence fails: give it a human subject doing a plain verb, use the
words you would use in speech, and break the gapped second half into its own plain clause.

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
- Being sycophantic without adding substance
- Using fictional "we had a client who..." stories
- Starting every comment the same way

</anti_patterns>

<success_criteria>

- [ ] 1-3 sentences
- [ ] Adds value the post didn't already cover
- [ ] No banned patterns survived
- [ ] Sounds like a human typed it quickly
- [ ] Normal capitalization, not all-lowercase
- [ ] No fabricated claims
- [ ] Passed through humanizer skill
- [ ] Appropriate language (Egyptian Arabic for Arabic posts)
- [ ] Varies from previous comments in the session (no repetitive openers)

</success_criteria>
