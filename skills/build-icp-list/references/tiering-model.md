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

- Tender-only cold pursuits: only path to a deal is a formal RFP chased cold (no warm path,
  no partner, no adjacent shipped proof). An RFP WITH warm path/partner passes (IsDB via IFAAS).
- Pre-revenue startups seeking a technical cofounder in vendor's clothing
- Price-shoppers for commodity automations
- No nameable pain or no real intent to pay

## Tiers and their attached actions

| Tier | Requirement | Action |
|---|---|---|
| **A** | Gate + ANY of: genuine warm path · fresh live trigger (<30d) · validated demand AND peers responding to the live campaign | Founder 1:1 attention this week: committee mapped, entry contact chosen, outreach sequence drafted |
| **B** | Gate + validated demand (a paying client exists in this cluster, any channel) but no live signal | Light touch: cluster-aimed posts, occasional comment; watch for triggers |
| **C** | Gate only | Monitored bench; promoted when a signal appears |

## Signal definitions

- **Validated demand:** a delivered, PAID project in the cluster — any channel (Aroob validates
  all edtech; IFAAS + Saudi labor law validate legal; Boom validates influencer marketing).
  Channel does not matter for demand validation: a paying customer proves the cluster pays.
- **Campaign feedback:** cold peers in this cluster responding to the live campaign. This is a
  DIFFERENT signal from demand — it proves our pitch manufactures awareness in the unaware
  (an inbound client only proves demand among the already-aware, who self-selected).
- **Live trigger:** AI hiring, funding, public AI initiative, acquisition of AI capability,
  regulatory pressure. Must be evidenced with a URL and a date.
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
