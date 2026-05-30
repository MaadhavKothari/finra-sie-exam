#!/usr/bin/env node
// Merge new questions from scripts/new-questions-*.json into the matching
// content file. Skips duplicate IDs. Runs the rebalancer at the end so the
// answer distribution stays even across A/B/C/D.

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));

const MAPPINGS = {
  'new-questions-pr.json':    'products-risks.json',
  'new-questions-cm.json':    'capital-markets.json',
  'new-questions-ta.json':    'trading-accounts.json',
  'new-questions-rf.json':    'regulatory-framework.json',
  'new-questions-s7.json':    'series-7.json',
  'new-questions-s6.json':    'series-6.json',
  'new-questions-s63.json':   'series-63.json',
  'new-questions-s65.json':   'series-65.json',
  'new-questions-s66.json':   'series-66.json',
};

const QUESTIONS_DIR = join(__dirname, '..', 'src', 'content', 'questions');

let totalAdded = 0;

for (const [src, tgt] of Object.entries(MAPPINGS)) {
  const srcPath = join(__dirname, src);
  if (!existsSync(srcPath)) continue;
  const tgtPath = join(QUESTIONS_DIR, tgt);
  const incoming = JSON.parse(readFileSync(srcPath, 'utf-8'));
  const existing = JSON.parse(readFileSync(tgtPath, 'utf-8'));
  const existingIds = new Set(existing.map((q) => q.id));
  const fresh = incoming.filter((q) => !existingIds.has(q.id));
  if (fresh.length === 0) {
    console.log(`${tgt}: no new questions to add`);
    continue;
  }
  const merged = [...existing, ...fresh];
  writeFileSync(tgtPath, JSON.stringify(merged, null, 2) + '\n', 'utf-8');
  console.log(`${tgt}: added ${fresh.length} (${existing.length} → ${merged.length})`);
  totalAdded += fresh.length;
}

if (totalAdded > 0) {
  console.log(`\nRebalancing all banks...`);
  execSync('node ' + join(__dirname, 'rebalance-answers.mjs'), { stdio: 'inherit' });
}
console.log(`\nTotal questions added: ${totalAdded}`);
