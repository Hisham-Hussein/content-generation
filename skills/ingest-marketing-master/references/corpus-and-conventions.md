# Corpus and Conventions — ingest-marketing-master

Volatile paths, lists, and formats kept out of the SKILL body. Update this file when the
marketing docs move or the corpus grows.

## Library location

- Folder: `/home/hisham/ai-agency/content-engine/docs/marketing/isemantics/marketing-masters/`
- Index: `README.md` in that folder — check it first for routing (new master vs reinforce).
- File naming: `<speaker>-<topic-slug>.md` (e.g. `grace-andrews-content-strategy.md`). Model
  surveys of organizations follow the same pattern (e.g. `mckinsey-quantumblack-publishing-model.md`).

## Strategy corpus (audit targets)

Audit against **everything present** in `/home/hisham/ai-agency/content-engine/docs/marketing/isemantics/`
(list the folder — new docs join the corpus automatically). As of 2026-08-19:

- `strategy.md` — positioning, entry offers, ABM, objectives, pricing model, ICP, channels,
  competitors, messaging pillars, collaborators
- `plan.md` — execution actions and decision log
- `content-strategy.md` — searchable/shareable split, pillar clusters, keyword map, first-wave topics
- `identity-drivers.md` — Wiebe's five methods applied
- `5-percent-audit.md` — Door A offer spec
- `marketing-masters/*.md` — prior lesson files; their Rejected sections are standing precedents

## Lessons-file template

```markdown
# <Speaker> — <Topic Title>

**Source(s):** "<title>" — <outlet>, <link>, <duration>, published <date>; transcript pulled <date>.
  (One line per source; multi-source files explain the (v2) marker convention here.)
**Speaker:** <name> — <credentials with numbers, verified>.

---

## I. <Thematic section>

### 1. <Lesson title> (<timestamps>)

<The lesson: claim, the speaker's reasoning, hard numbers, 1–2 examples in a couple of
sentences each. Normal readable prose.>

**Relevance to iSemantics:** <only where the lesson maps onto or challenges our strategy;
decisions recorded here carry attribution + date.>

<!-- ...numbered lessons in thematic sections; reinforce-mode insertions use Nb/Nc... -->

---

## Appendix: Adoption Audit against the iSemantics strategy corpus

Audited <date> against <list every doc actually audited — everything found in the folder, not
just the five named above>.

### Already employed
| Lesson | Where it lives in our strategy |   <!-- doc + section pointers -->

### Partially employed — gap noted
| Lesson | What we have | What's missing |

### Not employed — candidates to incorporate
| Lesson | Why it matters | Sketch of adoption |

### Rejected for iSemantics
<!-- bullet per rejection: verdict, attribution + date, reasoning, precedent cited -->
```

## README index row format

```markdown
| [<file>.md](<file>.md) | <Speaker> (<credentials shorthand>); <sources note> | <Topic list, comma-separated> | <date added/updated> |
```

Convention line in the README: **one file per marketing master** — a new source for an indexed
master reinforces their file with `(v2, timestamps)` markers; it never creates a second file.
