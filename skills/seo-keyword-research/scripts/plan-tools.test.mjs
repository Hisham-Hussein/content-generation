import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT = fileURLToPath(new URL('./plan-tools.mjs', import.meta.url));

/** Runs plan-tools.mjs with the given arguments; returns exit code, stdout and stderr. */
function run(...args) {
  const result = spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8' });
  return { code: result.status, stdout: result.stdout, stderr: result.stderr };
}

async function tempDir() {
  return mkdtemp(join(tmpdir(), 'plan-tools-'));
}

async function writeJson(dir, name, value) {
  const path = join(dir, name);
  await writeFile(path, JSON.stringify(value), 'utf8');
  return path;
}

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

const A = { mergeKey: 'a', market: 'X/Y', relevance: 3 };
const B = { mergeKey: 'b', market: 'X/Y', relevance: 1 };

test('scores merges chunk files in order', async () => {
  const dir = await tempDir();
  const first = await writeJson(dir, 'scores-01.json', [A]);
  const second = await writeJson(dir, 'scores-02.json', [B]);
  const out = join(dir, 'scores.json');

  const result = run('scores', out, first, second);

  assert.equal(result.code, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), { keywords: 2, duplicates: [] });
  assert.deepEqual(await readJson(out), [A, B]);
});

test('scores reports duplicates', async () => {
  // A keyword scored by two helper agents must surface, or save would see it twice.
  const dir = await tempDir();
  const first = await writeJson(dir, 'scores-01.json', [A]);
  const second = await writeJson(dir, 'scores-02.json', [{ ...A, relevance: 2 }]);
  const out = join(dir, 'scores.json');

  const result = run('scores', out, first, second);

  assert.equal(result.code, 1);
  assert.deepEqual(JSON.parse(result.stdout).duplicates, ['a|X/Y']);
  assert.equal((await readJson(out)).length, 2, 'the out file is still written');
});

test('scores rejects a non-array file', async () => {
  const dir = await tempDir();
  const bad = await writeJson(dir, 'scores-01.json', {});

  const result = run('scores', join(dir, 'scores.json'), bad);

  assert.equal(result.code, 2);
  assert.match(result.stderr, /must contain a JSON array/);
});

test('scores rejects a malformed chunk and names it', async () => {
  // A helper agent can leave a half-written file; exit 2 must say which chunk to dispatch again.
  const dir = await tempDir();
  const good = await writeJson(dir, 'scores-01.json', [A]);
  const bad = join(dir, 'scores-02.json');
  await writeFile(bad, '[{"mergeKey": "b", "market": "X/Y", "relevance": 1', 'utf8');

  const result = run('scores', join(dir, 'scores.json'), good, bad);

  assert.equal(result.code, 2);
  assert.match(result.stderr, /scores-02\.json is not valid JSON/);
  await assert.rejects(readFile(join(dir, 'scores.json')), { code: 'ENOENT' }, 'no out file from a malformed chunk');
});

test('scores needs chunk files', async () => {
  const dir = await tempDir();

  const out = join(dir, 'scores.json');

  const result = run('scores', out);

  assert.equal(result.code, 2);
  assert.match(result.stderr, /scores needs at least one scores file/);
  await assert.rejects(readFile(out), { code: 'ENOENT' }, 'no out file without chunk files');
});

test('scores reports a duplicate inside one file, Arabic keys', async () => {
  const dir = await tempDir();
  const entry = { mergeKey: 'منصه مشاهير', market: 'Saudi Arabia/Arabic', relevance: 3, intent: 'commercial' };
  const file = await writeJson(dir, 'scores-01.json', [entry, entry]);

  const result = run('scores', join(dir, 'scores.json'), file);

  assert.equal(result.code, 1);
  assert.deepEqual(JSON.parse(result.stdout).duplicates, ['منصه مشاهير|Saudi Arabia/Arabic']);
});

test('assemble takes scores.json', async () => {
  const dir = await tempDir();
  const judgment = await writeJson(dir, 'judgment.json', { runId: 'r', pillars: [], pages: [] });
  const scores = await writeJson(dir, 'scores.json', [A, B]);
  const out = join(dir, 'plan.json');

  const result = run('assemble', judgment, out, scores);

  assert.equal(result.code, 0, result.stderr);
  assert.deepEqual((await readJson(out)).keywords, [A, B]);
});
