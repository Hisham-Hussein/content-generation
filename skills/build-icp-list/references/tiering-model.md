# Tiering model — full rules and tie-break worksheet

Decided with Hisham 2026-09-06, grounded in
`/home/hisham/ai-agency/content-engine/artifacts/research/lead-scoring-best-practices-for-founder-led-abm.md`
(key findings: separate company/contact scoring is standard, additive point models are an
anti-pattern at founder scale, warm intros convert 10–20x cold, triggers lift replies 3–5x
and decay fast, tiers-with-actions beat scores).

## Why tiers, not points

A founder ranking ~50 accounts needs a sort order and a next action, not two-digit arithmetic.
Additive scores let dead accounts rank well (high fit + no live signal = a wish list). Signals
gate and move tiers; points exist only to order accounts already inside the same tier.

## The flow

```
ALL CANDIDATES → GATE (anti-ICP, pass/fail) → TIER A / B / C → (points = tie-break within tier)
```

## Gate (from strategy §11 — no signal compensates for failing it)

Only what web research can actually observe belongs in the sourcing gate. Two of §11's four anti-ICP
tests are conversation-stage facts and are deliberately NOT applied here.

**Sourcing gate (applied by this skill, research-observable):**
- Tender-only cold pursuit: the only path to a deal is a formal RFP chased cold. Four unlocks, any one
  of which passes a government/RFP account: warm path · partner carrying us in · adjacent shipped
  proof · a live public demo of the solution class (the iSemantics AI book/learning companion demo,
  once live — a public buyer can experience the product before any procurement step). IsDB via IFAAS
  passes on partner + adjacent proof.
- Pre-revenue startup seeking a technical cofounder in vendor's clothing (visible from stage/funding).
- Dormant: no operating activity since 2024 (no product updates, posts, or news).
- Core-competency conflict: AI is the company's core product AND it has an established in-house AI/ML
  engineering team (observable: product description + AI/ML roles or a CTO-led AI product in production).
  Such companies build, not buy, the thing we sell. Both halves must hold — an AI-native startup with
  funding but no team yet buys speed (§16.5 enablement motion) and passes; technical founders at seed
  stage are a first-call build-vs-buy qualifier, not a gate.

**Conversation-stage disqualifiers (applied by Hisham after first contact — never inferred from search):**
- Price-shopper for commodity automations
- No nameable pain, or no real intent to pay
These feed the drop rule (movement rule 4), not the sourcing gate. Legal form (nonprofit,
foundation) and absence of public procurement records are NOT gate criteria at either stage.

## Tiers and their attached actions

| Tier | Requirement | Action |
|---|---|---|
| **A** | Gate + ANY of: genuine warm path · fresh live trigger (<30d) · validated demand AND peers responding to the live campaign | Founder 1:1 attention this week: committee mapped, entry contact chosen, outreach sequence drafted |
| **B** | Gate + validated demand (a paying client exists in this cluster, any channel) but no live signal | Light touch: cluster-aimed posts, occasional comment; watch for triggers |
| **C** | Gate passed, but the cluster has NO validated demand yet (no paying client in this cluster — e.g. Banking at the time of writing). Empty by definition for any cluster with a paid project (EdTech, Legal, Influencer Marketing) | Monitored bench; the whole tier converts to B the day the cluster's first paid project lands |

## Signal definitions

- **Validated demand:** a delivered, PAID project in the cluster — any channel (Aroob validates
  all edtech; IFAAS + Saudi labor law validate legal; Boom validates influencer marketing).
  Channel does not matter for demand validation: a paying customer proves the cluster pays.
- **Campaign feedback:** cold peers in this cluster responding to the live campaign. This is a
  DIFFERENT signal from demand — it proves our pitch manufactures awareness in the unaware
  (an inbound client only proves demand among the already-aware, who self-selected).
- **Live trigger:** AI hiring, funding, public AI initiative, acquisition of AI capability,
  regulatory pressure. Must be evidenced with a URL and a date. Buying a non-AI company is NOT a
  trigger. An acquisition never gates the acquired company: it is an ordinary candidate with its own
  budget and buying decisions.
- **Warm path:** existing 1st-degree connection, a referral/introducer, a partner carrying us in,
  or meaningful engagement with our content. Must name the actual path.

## Movement rules

1. **Warm-path override:** any genuine warm path promotes a full tier, regardless of everything
   else. (Warm intros convert 10–20x cold — the strongest single multiplier in the data.)
2. **Trigger decay:** full weight <30 days old, half weight to 90 days, expired after. Job-change
   and new-hire triggers are hottest in the first days — act immediately, not in rotation.
3. **Cluster promotion (campaign feedback):** when 2+ cold peers in a cluster reply positively,
   promote the cluster's remaining accounts one tier. When a campaign-sourced peer CONVERTS,
   the cluster's validated demand is maxed and this also feeds strategy §8's Stage-2 unlock
   (a proven segment message).
4. **Cooling:** a Tier A account with no engagement after a full sequence + follow-up drops to B;
   its bench slot goes to the next candidate.

## Contact two-track model (within a pursued company)

Never blend into one score — two different questions:

- **Entry point (who gets the first DM):** accessibility (posts actively, accepts connections,
  open profile), remit relevance (their job changes if the solution ships), recent job change
  (top predictive signal; 2–3x reply lift when fresh). Evidence: C-level cold reply ~7%,
  operators/product ~10% — enter low-friction.
- **Destination (who must say yes):** role power — the economic buyer. Reached by multithreading
  from the entry point, or directly when a warm path exists (Ibrahim was already connected).
- Small companies (≤50 staff): entry and destination are often the same person.

## Tie-break worksheet (ONLY for ordering within a tier)

Company (/100): validated demand 25 · campaign feedback 10 · live trigger 25 (decayed) ·
warm path 25 · structural fit 15.
Contact entry-point (/100): accessibility 40 · remit relevance 35 · recent job change 25.

Do not present these numbers as the decision — the tier and its evidence are the decision;
the worksheet just sorts the queue.

## Calibration knowns (edtech example)

- Iqraaly → must come out Tier A (warm path: Hanan, personal)
- Almentor → Tier A only after the Ibrahim connection surfaced; before that, B (validated demand
  via Aroob, no live signal) — the model must reproduce both states
- King Fahad National Library → Tier A (live conversation via Nabeel)
- A procurement-only ministry → must fail the gate


## Institutional plug-in targets (channel 5 detail)

Organizations that already run infrastructure the solution can sit on top of, across the whole
target geography for the cluster at once (e.g. GCC + Egypt together, not country by country):

- **EdTech:** universities (private ones pass the gate directly; public ones need an unlock),
  corporate L&D departments, and digital libraries already running an LMS, curriculum platform,
  or digital collection — the companion plugs into the existing system. Trigger types: a new
  AI-in-teaching or digital-transformation initiative, a new e-learning deanship or CDO-type hire,
  LMS migration, NELC/accreditation-linked digital-program approval.
- **Legal:** law firms and corporate legal departments with an existing document-management or
  matter-management system.
- **Retail:** chains with an existing e-commerce or CRM platform.
- **Influencer Marketing:** agencies with an existing campaign-management tool.

A consultant or advisor already contracted to pitch an institution is both a Tier A account in
their own right and a repeatable broker channel — ask who else they advise. Template case:
Almaarefa University (Tier A, Proposal stage) via Dr. Saja Aldera, an existing iSemantics client
now consulting there, who contracted an LMS provider and is negotiating the AI-companion layer
for six diploma modules.
