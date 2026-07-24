# Sweep A — Word-level economy (Strunk Rules 13, 11, 10)

Run this sweep line by line over the whole caption (hook excluded). It is mechanical:
each rule gives a pattern to spot and a fix. Apply through the fat-vs-substance lens —
word-level trims apply directly; anything that would drop a fact or beat gets proposed,
not imposed.

---

## Rule 13 — Omit needless words (the headline rule)

Strunk: "Vigorous writing is concise. A sentence should contain no unnecessary words,
a paragraph no unnecessary sentences, for the same reason that a drawing should have no
unnecessary lines and a machine no unnecessary parts. This requires not that the writer
make all his sentences short, or that he avoid all detail and treat his subjects only in
outline, but that **every word tell**."

Note both halves: cut ruthlessly, AND keep the detail that tells. Short is a byproduct,
not the goal.

### 13a. Formula phrases → single words

Strunk's originals:

| Needless | Fix |
|---|---|
| the question as to whether | whether |
| there is no doubt but that | no doubt / doubtless |
| used for fuel purposes | used for fuel |
| he is a man who | he |
| in a hasty manner | hastily |
| this is a subject which | this subject |
| His story is a strange one. | His story is strange. |
| owing to the fact that | because |
| in spite of the fact that | though |
| call your attention to the fact that | remind you |
| I was unaware of the fact that | I did not know |
| the fact that he had not succeeded | his failure |
| the fact that I had arrived | my arrival |

**"The fact that" should be revised out of every sentence in which it occurs.** No
exceptions. (The extended modern list, including LinkedIn-native filler, lives in
`words-and-expressions.md` — run both lists in this sweep.)

Caption-register pairs:

> "The problem lies in the fact that founders approve everything themselves."
> → "Founders approve everything themselves. That is the problem."

> "AI is a technology which rewards teams that move in a fast manner."
> → "AI rewards teams that move fast."

### 13b. Superfluous "who is / which was"

> His brother, who is a member of the same firm → His brother, a member of the same firm
> Trafalgar, which was Nelson's last battle → Trafalgar, Nelson's last battle

Caption version:

> "Claude Code, which is a tool we use daily, changed our delivery speed."
> → "Claude Code, a tool we use daily, changed our delivery speed."

### 13c. One idea dribbled across several sentences → combine

Strunk's Macbeth example went 51 words → 26 by folding a step-by-step retelling into one
sentence. In captions the same disease looks like three line-blocks doing one block's job:

> "Most founders think delegation is the answer.
> So they hire more people.
> But the bottleneck stays exactly where it was."
> → "Most founders hire their way out of the bottleneck. It stays exactly where it was."

Careful: this is the one Rule 13 move that can collide with the voice profile's staccato
rhythm. Combine only when the lines are *restating*, not when each line lands its own beat.

---

## Rule 11 — Put statements in positive form

Strunk: "Make definite assertions. Avoid tame, colorless, hesitating, non-committal
language. Use _not_ as a means of denial or in antithesis, never as a means of evasion.
The reader is dissatisfied with being told only what is not; he wishes to be told what is."

| Negative evasion | Positive form |
|---|---|
| He was not very often on time. | He usually came late. |
| not honest | dishonest |
| not important | trifling |
| did not remember | forgot |
| did not pay any attention to | ignored |
| did not have much confidence in | distrusted |

Caption pairs:

> "Most founders don't really have a clear picture of where their time goes."
> → "Most founders are blind to where their time goes."

> "The rollout didn't go the way they expected."
> → "The rollout surprised them." (or name what actually happened — stronger still)

**The trap:** do NOT "fix" a negative by flipping it into "It's not X, it's Y" — that
negative parallelism is a banned AI tell (humanizer + drill). The Strunk fix is to say
what the thing IS, in one positive clause, and delete the "not X" half entirely.

**The carve-out:** deliberate antithesis is strong and stays: "Not charity, but simple
justice." A caption that sets up a genuine contrast ("Point AI at a task and you get a
faster task. Point it at the business and you get a different business.") is Rule 11
done right — leave it.

---

## Rule 10 — Use the active voice

Strunk: "The active voice is usually more direct and vigorous than the passive." His
core example: "I shall always remember my first visit to Boston" beats "My first visit
to Boston will always be remembered by me" — and dropping "by me" makes it worse:
indefinite, nobody owns the remembering.

### 10a. Passive → active

> "The pilot was rolled out by the ops team in three weeks."
> → "The ops team rolled out the pilot in three weeks."

Legitimate passive: when the receiver IS the topic. "The dramatists of the Restoration
are little esteemed to-day" is right in a paragraph about the dramatists. In a caption
block about the founder, "The founder gets bypassed on every decision" can stand —
the founder is the topic. Don't flip passives mechanically; flip the ones that hide
the actor or deaden the verb.

### 10b. Noun-of-action subjects (the buried verb)

Strunk: a noun expressing the whole action leaves the verb nothing to do.

| Buried | Active |
|---|---|
| A survey of this region was made in 1900. | This region was surveyed in 1900. |
| Mobilization of the army was rapidly effected. | The army was rapidly mobilized. |
| Confirmation of these reports cannot be obtained. | These reports cannot be confirmed. |

Caption version:

> "Adoption of the new workflow was achieved across the whole team in a month."
> → "The whole team adopted the workflow in a month."

### 10c. Perfunctory "there is / there are / could be heard"

> There were a great number of dead leaves lying on the ground. → Dead leaves covered the ground.
> The reason that he left college was that his health became impaired. → Failing health compelled him to leave college.

Caption pairs:

> "There are three things that separate the firms that scale from the ones that stall."
> → "Three things separate the firms that scale from the ones that stall."

> "There's a moment where every founder realizes this."
> → "Every founder hits this moment."

The voice profile's imperatives and fragments ("Audit one week of decisions.") are
already maximally active — this rule never fires on them.

---

## Order of operations within Sweep A

1. Rule 13 formula phrases + `words-and-expressions.md` lookups (mechanical deletes).
2. Rule 10 passives / buried verbs / "there is" (rewrites within a line).
3. Rule 11 negatives → positive form (rewrites that may shorten further).
4. Re-count chars. Log every substance-adjacent cut for the diff summary.

## Source

Distills elements-of-style.txt: Rule 13 L979–1082, Rule 11 L833–892, Rule 10 L744–831,
including Strunk's own example pairs verbatim. Caption-register examples are additions,
marked by their register.
