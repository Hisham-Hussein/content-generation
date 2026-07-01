---
name: ingest-knowledge-item
description: Use when ingesting a PDF, document, or resource into the Airtable Knowledge Items table. Triggers on "ingest", "create knowledge item", "add to knowledge items", "extract knowledge from", or when the user provides a PDF path and wants it stored as a knowledge item for content creation.
---

<objective>
Reads a PDF or document, applies the content engine's knowledge extraction framework (the same logic as `knowledge-summarization.prompt.ts`), and creates an Airtable Knowledge Item record with properly extracted `extractedSummary` and `keyInsights` fields. This replaces the manual multi-step process of reading, extracting, composing, and calling Airtable MCP tools with correct field IDs.
</objective>

<quick_start>
Given a PDF path, read it, extract knowledge, and create the Airtable record:

1. Read the PDF (all pages, in batches of 20)
2. Apply the extraction categories to produce summary + key insights
3. Ask the user to confirm pillar alignment and priority
4. Create the Airtable record via MCP

**Invocation:** `/content-generation:ingest-knowledge-item [path to PDF]`
</quick_start>

<essential_principles>

**Extraction quality is everything.** The summary and key insights are the ONLY things downstream post generation sees. If you can write a coherent LinkedIn post from just the summary + key insights without reading the original source, the extraction is good. If you can't, it's incomplete.

**Extract FROM the content, don't summarize ABOUT it.** Prefer specific over general. If the source says "3.29% revenue increase," capture that exact figure. Do not write "revenue increased."

**The summary orients, the insights extract.** No overlap between the two fields. The summary is 2-4 paragraphs telling a scanner what this source contains. The insights are the rich, categorized raw material for post creation.

</essential_principles>

<process>

**Step 1: Resolve the file path**

If the user provides a Windows path (e.g., `C:\Users\...`), convert to WSL path (`/mnt/c/Users/...`).

If the path contains special characters (apostrophes, parentheses), use `find` to locate the file:
```bash
find "/mnt/c/Users/..." -name "*partial-name*" -type f
```
Then copy to `/tmp/` with a simple filename to avoid shell escaping issues.

**Step 2: Read the PDF**

Read in batches of 20 pages:
```
Read file_path pages="1-20"
Read file_path pages="21-40"  # if needed
```
Continue until you've read all content pages. Stop when you hit Resources/References/back cover pages.

**Step 3: Read the Airtable mappings**

Read `references/airtable-mappings.md` for field IDs, persona IDs, and pillar IDs.

**Step 4: Compose the Extracted Summary**

Write 2-4 paragraphs covering:
- What is this source, who created it, what is the core thesis
- Key structural elements (chapters, sections, case studies)
- Why this source matters for content creation

Do NOT extract detailed insights here.

**Step 5: Compose the Key Insights**

Extract into these category headers (include only categories with substantive content):

```markdown
### Data Points and Statistics
Exact numbers, percentages, metrics, benchmarks with source attribution.

### Named People, Companies, and Authorities
Who is cited. What they said, did, or published. Titles and affiliations.

### Frameworks, Methodologies, and Processes
Structured approaches WITH their steps — not just names.

### Contrarian Claims and Myth-Busting
Both the myth/conventional belief AND the correction with evidence.

### Before/After Contrasts
Old way vs. new way. Both sides of the contrast.

### Actionable Tactics with Specific Parameters
Concrete advice with numbers, timeframes, or thresholds.

### Anti-Patterns and Common Mistakes
Specific behavior and why it fails.

### Case Studies and Real Examples
Stories, results, or scenarios with names and numbers.

### Quotable Formulations
Distinctive phrases sharp enough to anchor a post. Verbatim.
```

**Step 6: Confirm metadata with user**

Ask the user to confirm:
1. **Pillar Alignment** — which pillars does this map to? (show the pillar list)
2. **Priority** — High, Normal, or Low
3. **Type** — usually "External Knowledge" for PDFs, but confirm
4. **Persona** — usually Hisham, but confirm

If the user's intent is clear from context (e.g., they've been ingesting similar resources), proceed with sensible defaults and state what you chose.

**Step 7: Create the Airtable record**

Use `mcp__airtable__create_records_for_table` with the field IDs from the mappings reference. Set these fields:

- **Title** (required) — descriptive name of the source
- **Type** — from Step 6 (usually "External Knowledge")
- **Persona** — from Step 6, as array of linked record IDs
- **Extracted Summary** — from Step 4
- **Key Insights** — from Step 5
- **Pillar Alignment** — from Step 6, as array of linked record IDs
- **Priority** — from Step 6
- **Origin** — always "Manual" for human-ingested items

Pass `fieldIds` array to include Title, Type, Priority, and Origin in the response for verification.

**Step 8: Report**

Confirm the record was created. Include:
- Record ID
- Title
- Pillar alignment chosen
- Reminder that PDF attachment must be dragged manually in Airtable (API limitation — requires public URL, cannot accept local files)

</process>

<anti_patterns>

**Do NOT produce category labels without substance.** "Personalization in outreach is important" is useless. Capture the specific techniques described.

**Do NOT include information not present in the source.** Extract only what's there.

**Do NOT repeat content between summary and insights.** The summary orients, the insights extract.

**Do NOT include promotional content, CTAs, or sales pitches from the source.**

**Do NOT truncate insights to save space.** Richness is the point. A post writer working from thin insights produces thin posts.

</anti_patterns>

<success_criteria>
- PDF fully read (all content pages)
- Extracted summary is 2-4 paragraphs, orients a scanner
- Key insights cover all applicable categories with specific details
- Airtable record created with correct field mappings
- User informed of the record ID and the attachment limitation
- A post writer reading ONLY the summary + key insights (not the original PDF) could write a substantive LinkedIn post
</success_criteria>
