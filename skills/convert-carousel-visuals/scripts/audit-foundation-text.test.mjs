import test from 'node:test';
import assert from 'node:assert/strict';
import { auditWithTesseract, suspiciousText } from './audit-foundation-text.mjs';

test('normalizes OCR output into suspicious text lines', () => {
  assert.deepEqual(suspiciousText('\n $400 \n . \n API limit \n'), ['$400', 'API limit']);
});

test('passes when OCR finds no readable text', () => {
  const run = (command, args) => {
    if (args[0] === '--version') return { status: 0, stdout: 'tesseract 5' };
    return { status: 0, stdout: '\n.\n' };
  };
  const result = auditWithTesseract([import.meta.filename], run);
  assert.equal(result.status, 'pass');
});

test('fails when OCR finds possible generated text', () => {
  const run = (command, args) => {
    if (args[0] === '--version') return { status: 0, stdout: 'tesseract 5' };
    return { status: 0, stdout: 'Unexpected label\n42\n' };
  };
  const result = auditWithTesseract([import.meta.filename], run);
  assert.equal(result.status, 'fail');
  assert.match(result.failures.join('\n'), /Unexpected label/);
});

test('requires manual inspection when OCR is unavailable', () => {
  const result = auditWithTesseract(['unused.png'], () => ({ status: 127 }));
  assert.equal(result.status, 'manual_required');
});
