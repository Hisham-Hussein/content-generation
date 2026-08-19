---
name: ingest-marketing-master
description: "Use when Hisham shares a talk, podcast, video, or article from a top marketer or CMO-level strategist to be captured into the marketing-masters lessons library. Triggers on 'ingest this marketing video', 'glean the lessons from this talk', 'add this to marketing masters', 'extract the strategic lessons from this podcast', 'store the lessons under marketing-masters', or any YouTube/article link from a marketing strategist shared with intent to capture strategy lessons for iSemantics."
---

<objective>
Turn a marketing master's source (YouTube video, podcast, article) into a lessons file in the
iSemantics marketing-masters library: fetch the complete transcript, glean every strategic
lesson with timestamps, audit each lesson against the current strategy corpus, and finish at a
mandatory discussion gate where Hisham's verdicts are recorded into the document. One file per
master, capture-only with respect to the strategy docs.
</objective>

<quick_start>
1. Fetch the FULL transcript (yt-dlp for YouTube; full page text for articles) and cache it raw.
2. Identify the speaker and credentials from metadata/transcript — verified, never guessed.
3. Check the library README: new master → new file; known master → reinforce their existing file.
4. Read the whole transcript, glean every strategic lesson (timestamps, 1–2 examples each).
5. Read the strategy corpus, write the adoption-audit appendix, add the README index row.
6. Editor pass, then STOP at the discussion gate: present gleanings, wait for Hisham's verdicts,
   record them with attribution and date.

**Invocation:** `/content-generation:ingest-marketing-master <url>`
</quick_start>

<essential_principles>

**Full source or nothing.** Lessons are gleaned only from the complete transcript or full
article text — never from a summary, video description, comments, or a partially fetched page.
Cache the raw transcript to the scratchpad before any processing, and verify its coverage spans
the full runtime (last timestamp ≈ video duration).

**One file per master, not per source.** Grace Andrews has one file covering two videos. A new
source for an already-indexed master reinforces their existing file; it never creates a second
file. See Step 3 for reinforce mode.

**Capture-only.** This skill writes only inside `marketing-masters/`. The strategy docs
(strategy.md, plan.md, content-strategy.md, …) are never edited from this skill — with one
exception: Hisham explicitly orders a correction during the discussion gate (precedent: the §4
positioning-line fix, 2026-08-18). Folding adopted lessons into the strategy is a separate,
later task.

**Hisham's verdicts are law and are recorded.** Decisions carry "DECIDED" with attribution and
date; rejections carry his reasoning; his own insights are credited by name. Standing rejections
in existing lesson files (e.g. audience-granularity/Lakajev) are precedents to apply to new
material, never to re-litigate.

**Practice-vs-preach check.** For every prescriptive lesson, ask whether the master's own
observable behavior follows it. Gurus routinely preach niching while growing broad
(field-verified across Lakajev, Donnelly, Grace Andrews, Nate Herk). A contradiction between
their advice and their practice is itself a lesson — record it.

**Positioning guardrail.** Any "relevance to iSemantics" note that frames Hisham follows the
positioning framing in strategy.md §4 and the `hisham-face-of-company-framing` memory — never a
talker-pole, builder-pole, or solopreneur framing.

**Never fabricate.** Every quote, number, and timestamp comes from the cached transcript. If
the transcript doesn't support a claim, the claim doesn't go in the file.

</essential_principles>

<process>

**Step 1: Fetch the full source and cache it**

<read_before>
- `references/corpus-and-conventions.md` — library path, corpus list, file template, README row format
</read_before>

For a YouTube URL (this flow is embedded deliberately — do NOT chain the
`claude-forge:youtube-transcript` skill: cross-plugin dependencies are fragile and its
conversion strips the timestamps this format requires):

```bash
cd <scratchpad>
yt-dlp --no-update --print "%(title)s | %(channel)s | %(upload_date)s | %(duration_string)s" "<URL>"
yt-dlp --no-update --write-auto-sub --sub-langs "en.*" --skip-download -o "master-source" "<URL>"
```

Convert VTT → deduplicated, timestamped text:

```bash
python3 -c "
import re
seen_tail = ''
out = []
cur_ts = None
with open('master-source.en.vtt') as f:
    for line in f:
        line = line.strip()
        m = re.match(r'^(\d\d):(\d\d):(\d\d)\.\d+ -->', line)
        if m:
            cur_ts = f'{int(m.group(1))*60+int(m.group(2)):d}:{m.group(3)}'
            continue
        if not line or line.startswith(('WEBVTT','Kind:','Language:')) or '-->' in line:
            continue
        clean = re.sub('<[^>]*>', '', line)
        clean = clean.replace('&amp;','&').replace('&gt;','>').replace('&lt;','<').strip()
        if not clean or clean == seen_tail:
            continue
        seen_tail = clean
        out.append((cur_ts, clean))
with open('transcript-full.txt','w') as f:
    for ts, text in out:
        f.write(f'[{ts}] {text}\n')
print(len(out), 'lines')
"
tail -3 transcript-full.txt   # last timestamp must ≈ the video duration printed above
```

Fallbacks, in order: (1) manual subs (`--write-sub`); (2) the Apify YouTube transcript actor
(`APIFY_API_KEY` in `/home/hisham/ai-agency/content-engine/.env`); (3) no captions exist at
all → Whisper (download audio, transcribe) — **ask Hisham before downloading audio**.

For a written source: fetch the complete article text, confirm it is not truncated or
paywall-clipped, cache it to the scratchpad.

**Step 2: Identify the master**

Speaker, credentials (role, track record with numbers), outlet, publish date — from the video
metadata and the transcript itself. Verify; never guess. If credentials are unclear, a quick web
search to confirm is fine; unverifiable claims are stated as unverified.

**Step 3: Route — new file or reinforce**

Check the README index in the marketing-masters folder (path in references).

- **New master** → new file named `<speaker>-<topic-slug>.md`, per the template in references.
- **Known master** → reinforce mode: additions go into their existing file marked `(v2, timestamps)`
  (v3, v4, … for later sources); the header gains a source line per source; existing lessons are
  NEVER renumbered — new lessons insert as `Nb`/`Nc` next to their closest sibling so the
  appendix's lesson references keep resolving.

**Step 4: Glean — exhaustively, from the full read**

Read the entire transcript end to end. Extract every strategic lesson: the claim, the speaker's
reasoning, hard numbers, and at most 1–2 examples per point at a couple of sentences each — one
sharp example beats three retold ones. Timestamp every lesson. Skip filler conversation; never
compress or merge actual lessons. Apply the practice-vs-preach check (essential principles).
Group lessons into thematic sections; write "Relevance to iSemantics" notes where a lesson maps
onto or challenges our strategy.

**Step 5: Audit against the strategy corpus**

Read every document in the corpus (list + rule in references). Classify each lesson into the
appendix's four categories — Already employed (with doc-section pointers) / Partially employed
(the gap named) / Not employed (an adoption sketch) / Rejected (reasoning + precedent). Apply
standing rejections from the existing lesson files as precedents.

**Step 6: Write the file and the README row**

Per the template and row format in references. New file gets a README index row; reinforced file
gets its row's topics/date updated.

**Step 7: Editor pass**

Re-read the saved file end to end, then edit like a strategic editor:

- Every sentence earns its keep — cut redundancy, restatement, and process residue (correction
  notes, "earlier draft" remarks, verification narration).
- **Normal readable prose.** Cryptic or telegraphic compression is banned — cutting redundancy
  never means fragment-chains or arrow-speak in body text.
- Do not over-cut: all strategic substance, numbers, quotes that do work, decisions, and the full
  appendix survive. Calibration precedent: the Grace file was right at ~190 lines; a ~100-line
  skeleton was rejected as amputation, a ~250-line version as bloat.
- Re-read after editing before claiming done.

**Step 8: The discussion gate (mandatory — the run does not self-finalize)**

Present to Hisham: what was gleaned (the genuinely new insights first), anything that corrects
or contradicts our standing strategy, adoption candidates, and any practice-vs-preach findings.
Then STOP and wait.

Record his verdicts into the file as they land: DECIDED items with attribution + date, rejections
with his reasoning, priority flags, his own contributed insights credited to him. Only edit a
strategy doc if he explicitly orders that specific correction.

</process>

<anti_patterns>
- Working from a summary, the video description, or a partial transcript. Fetch it all or stop.
- Creating a second file for a master who already has one, or renumbering their existing lessons.
- Compressing the file into cryptic fragment-language during the editor pass, or amputating it
  to a skeleton. Both were explicitly rejected; the target register is the final Grace file.
- Editing strategy.md / plan.md / content-strategy.md as part of the capture. Capture-only.
- Finalizing without the discussion gate, or "summarizing" Hisham's verdicts instead of recording
  them verbatim in meaning, attributed and dated.
- Re-opening a standing rejection because the new master repeats the same advice.
- Chaining `claude-forge:youtube-transcript` for the fetch (strips timestamps; cross-plugin).
- Inventing frameworks, quotes, or timestamps the transcript does not contain.
</anti_patterns>

<success_criteria>
- Raw transcript cached before processing; coverage verified against the full runtime.
- Speaker + credentials verified and stated in the file header.
- Correct routing: one file per master; reinforce mode used for known masters with no renumbering.
- Every strategic lesson captured with timestamps; 1–2 examples per point; practice-vs-preach
  noted where found.
- Adoption-audit appendix present with all four categories and doc pointers into the corpus.
- README index row added or updated.
- Editor pass done: no redundancy, no process residue, normal readable prose throughout.
- The run stopped at the discussion gate; Hisham's verdicts are recorded with attribution and
  date; no strategy doc was touched without his explicit order.
</success_criteria>
