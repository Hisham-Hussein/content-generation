#!/usr/bin/env node
// Helpers for large runs. Neither command judges anything; they only move rows and JSON.
//
//   split <summary.txt> <out dir> [rows per chunk = 300]
//     Writes the "# keywords" section of summary.txt as keywords-01.tsv, keywords-02.tsv, ...
//     (each with the header line), and prints {"chunks": n, "keywords": total}.
//
//   assemble <judgment.json> <out plan.json> <scores-*.json ...>
//     judgment.json = {runId, notes?, pillars, pages}; each scores file = an array of
//     {mergeKey, market, relevance, intent?}. Writes the plan the CLI's save reads and prints
//     {"keywords": n, "duplicates": [...]}; exits 1 when a keyword is scored twice.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const [command, ...args] = process.argv.slice(2);

async function split(summaryPath, outDir, size = '300') {
  const perChunk = Number.parseInt(size, 10);
  if (!Number.isInteger(perChunk) || perChunk < 1) throw new Error('rows per chunk must be a positive integer');
  const lines = (await readFile(summaryPath, 'utf8')).split('\n');
  const start = lines.indexOf('# keywords');
  if (start === -1) throw new Error('summary has no "# keywords" section');
  const header = lines[start + 1];
  const rows = [];
  for (let i = start + 2; i < lines.length && lines[i] !== '' && !lines[i].startsWith('# '); i++) {
    if (lines[i] !== '(none)') rows.push(lines[i]);
  }
  await mkdir(outDir, { recursive: true });
  let chunks = 0;
  for (let i = 0; i < rows.length; i += perChunk) {
    chunks += 1;
    const name = `keywords-${String(chunks).padStart(2, '0')}.tsv`;
    await writeFile(join(outDir, name), `${[header, ...rows.slice(i, i + perChunk)].join('\n')}\n`, 'utf8');
  }
  console.log(JSON.stringify({ chunks, keywords: rows.length }));
}

async function assemble(judgmentPath, outPath, scorePaths) {
  if (scorePaths.length === 0) throw new Error('assemble needs at least one scores file');
  const judgment = JSON.parse(await readFile(judgmentPath, 'utf8'));
  const keywords = [];
  const seen = new Map();
  for (const path of scorePaths) {
    const entries = JSON.parse(await readFile(path, 'utf8'));
    if (!Array.isArray(entries)) throw new Error(`${path} must contain a JSON array`);
    for (const entry of entries) {
      const key = `${entry.mergeKey}|${entry.market}`;
      seen.set(key, (seen.get(key) ?? 0) + 1);
      keywords.push(entry);
    }
  }
  const duplicates = [...seen].filter(([, count]) => count > 1).map(([key]) => key);
  const plan = {
    runId: judgment.runId,
    ...(judgment.notes === undefined ? {} : { notes: judgment.notes }),
    pillars: judgment.pillars ?? [],
    keywords,
    pages: judgment.pages ?? [],
  };
  await writeFile(outPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({ keywords: keywords.length, duplicates }));
  if (duplicates.length > 0) process.exitCode = 1;
}

try {
  if (command === 'split') await split(args[0], args[1], args[2]);
  else if (command === 'assemble') await assemble(args[0], args[1], args.slice(2));
  else throw new Error('usage: plan-tools.mjs split <summary.txt> <out dir> [size] | assemble <judgment.json> <plan.json> <scores...>');
} catch (error) {
  console.error(`plan-tools: ${error.message}`);
  process.exitCode = 2;
}
