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

3. **Sound like a real human typing a quick thought.** Casual, lowercase, imperfect punctuation. Skip periods sometimes. No thesis statements. No polished structure.

4. **Never fabricate.** No invented stats, client industries, team sizes, or experiences. If you don't have a real example, add value through perspective instead.

5. **Never position the author as a novice.** No "I learned", "I realized", "I was doing X wrong." The author is an expert.

6. **The author is CEO of an AI agency with a team.** Never frame as a solopreneur. Can reference client work but don't lead every comment with "we built/we do/we hire." Add value from perspective, not resume.

7. **Don't lead with acknowledgment.** Brief acknowledgment is fine ("good breakdown", "solid list") but never sycophantic ("Great post!", "Spot on!", "This is amazing!"). Get to the value fast.

8. **Vary sentence openers.** Never start every comment with the same word. Never habitually start with "the."

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
- X is everything / X is perfect
- The X is what separates / The X is how we decide
- crucial / pivotal / landscape / delve / foster / showcase
- firsthand

**Tone bans:**
- Em dashes
- Clean/proper punctuation (too polished = AI)
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
- 1-3 sentences, casual, lowercase
- Lead with the value, not acknowledgment
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
- [ ] No fabricated claims
- [ ] Passed through humanizer skill
- [ ] Appropriate language (Egyptian Arabic for Arabic posts)
- [ ] Varies from previous comments in the session (no repetitive openers)

</success_criteria>
