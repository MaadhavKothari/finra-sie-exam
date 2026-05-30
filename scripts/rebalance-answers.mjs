#!/usr/bin/env node
// Deterministic answer-key rebalancer.
//
// FINRA-style questions should distribute the correct answer roughly evenly
// across A/B/C/D so users don't pattern-match instead of learning. This script
// rotates each question's choices so the correct letter is reassigned to one
// of {A,B,C,D} based on a stable hash of the question id, producing a balanced
// final distribution without touching content.
//
// Idempotency: not strictly idempotent under repeated runs (each run reshuffles
// from the new starting point), so run once and commit. Run again only if the
// distribution drifts.

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const QUESTIONS_DIR = join(__dirname, '..', 'src', 'content', 'questions');
const LETTERS = ['A', 'B', 'C', 'D'];

function djb2(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return h >>> 0;
}

function countByLetter(qs) {
  const c = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of qs) c[q.correctAnswer]++;
  return c;
}

function rebalanceFile(filePath) {
  const raw = readFileSync(filePath, 'utf-8');
  const data = JSON.parse(raw);
  const questions = Array.isArray(data) ? data : data.questions;
  const before = countByLetter(questions);

  // Greedy assignment: walk through questions in id order; for each,
  // pick the under-served target letter using id hash as a tiebreaker.
  // Use a target-quota algorithm so we end up perfectly balanced.
  const n = questions.length;
  const quota = {
    A: Math.floor(n / 4) + (n % 4 > 0 ? 1 : 0),
    B: Math.floor(n / 4) + (n % 4 > 1 ? 1 : 0),
    C: Math.floor(n / 4) + (n % 4 > 2 ? 1 : 0),
    D: Math.floor(n / 4),
  };
  const remaining = { ...quota };

  // Order: shuffle by id hash so we don't favor questions appearing first.
  const ordered = [...questions].sort((a, b) => djb2(a.id) - djb2(b.id));

  for (const q of ordered) {
    // Pick the letter with the largest remaining quota; if tied, hash-tiebreak.
    let pick = 'A';
    let bestCount = -1;
    let bestTie = -Infinity;
    for (const L of LETTERS) {
      if (remaining[L] > bestCount || (remaining[L] === bestCount && djb2(q.id + L) > bestTie)) {
        if (remaining[L] > 0 && (remaining[L] > bestCount || (remaining[L] === bestCount && djb2(q.id + L) > bestTie))) {
          pick = L;
          bestCount = remaining[L];
          bestTie = djb2(q.id + L);
        }
      }
    }
    remaining[pick]--;

    if (q.correctAnswer === pick) continue; // already in the right slot

    // Swap the correct choice with the pick choice. Update labels on both.
    const correctIdx = q.choices.findIndex((c) => c.label === q.correctAnswer);
    const targetIdx = q.choices.findIndex((c) => c.label === pick);
    if (correctIdx < 0 || targetIdx < 0) continue;

    // Swap labels: the choice currently at the correct slot moves to target,
    // and the choice currently at target moves to the old correct slot.
    const a = q.choices[correctIdx];
    const b = q.choices[targetIdx];
    a.label = pick;
    b.label = q.correctAnswer;
    q.correctAnswer = pick;

    // Re-sort choices by label so the array stays in A,B,C,D order.
    q.choices.sort((x, y) => LETTERS.indexOf(x.label) - LETTERS.indexOf(y.label));
  }

  const after = countByLetter(questions);

  const out = Array.isArray(data) ? questions : { ...data, questions };
  writeFileSync(filePath, JSON.stringify(out, null, 2) + '\n', 'utf-8');
  return { before, after, n };
}

const files = readdirSync(QUESTIONS_DIR).filter((f) => f.endsWith('.json'));

console.log('Question-bank answer rebalancing\n');
console.log('File'.padEnd(40), 'Before'.padEnd(28), 'After');
console.log('-'.repeat(96));

for (const f of files) {
  const r = rebalanceFile(join(QUESTIONS_DIR, f));
  const bef = `A=${r.before.A} B=${r.before.B} C=${r.before.C} D=${r.before.D}`;
  const aft = `A=${r.after.A} B=${r.after.B} C=${r.after.C} D=${r.after.D}`;
  console.log(f.padEnd(40), bef.padEnd(28), aft, `(n=${r.n})`);
}
