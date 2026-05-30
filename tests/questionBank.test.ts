import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const QUESTIONS_DIR = join(__dirname, '..', 'src', 'content', 'questions');

interface Choice { label: 'A' | 'B' | 'C' | 'D'; text: string; explanation: string }
interface Question {
  id: string;
  stem: string;
  choices: Choice[];
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  topic?: string;
  section?: string;
  subtopic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  source: string;
}

const files = readdirSync(QUESTIONS_DIR).filter((f) => f.endsWith('.json'));
const allQuestions: Question[] = [];
const perFile: Record<string, Question[]> = {};

for (const f of files) {
  const raw = JSON.parse(readFileSync(join(QUESTIONS_DIR, f), 'utf-8'));
  const questions = Array.isArray(raw) ? raw : raw.questions;
  perFile[f] = questions;
  allQuestions.push(...questions);
}

describe('question bank — structural integrity', () => {
  it('discovers at least one question file', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it('every question has exactly 4 choices labeled A B C D', () => {
    for (const q of allQuestions) {
      expect(q.choices.length).toBe(4);
      const labels = q.choices.map((c) => c.label).sort();
      expect(labels).toEqual(['A', 'B', 'C', 'D']);
    }
  });

  it('correctAnswer references an actual choice', () => {
    for (const q of allQuestions) {
      expect(['A', 'B', 'C', 'D']).toContain(q.correctAnswer);
    }
  });

  it('every choice has non-empty text and explanation', () => {
    for (const q of allQuestions) {
      for (const c of q.choices) {
        expect(c.text.trim().length).toBeGreaterThan(0);
        expect(c.explanation.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('every question has a non-empty stem and rationale', () => {
    for (const q of allQuestions) {
      expect(q.stem.trim().length).toBeGreaterThan(10);
      expect(q.explanation.trim().length).toBeGreaterThan(0);
    }
  });

  it('difficulty is one of easy/medium/hard', () => {
    for (const q of allQuestions) {
      expect(['easy', 'medium', 'hard']).toContain(q.difficulty);
    }
  });

  it('question ids are unique across the entire bank', () => {
    const ids = allQuestions.map((q) => q.id);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(dupes).toEqual([]);
  });
});

describe('question bank — answer distribution', () => {
  // FINRA-style exams should have answers spread fairly evenly across A/B/C/D
  // to avoid pattern-matching. We allow a generous ±60% deviation per letter.
  for (const file of files) {
    it(`${file} — distribution within tolerance`, () => {
      const qs = perFile[file];
      if (qs.length < 12) return; // tiny banks aren't worth checking
      const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
      for (const q of qs) counts[q.correctAnswer]++;
      const expected = qs.length / 4;
      for (const letter of ['A', 'B', 'C', 'D']) {
        const c = counts[letter];
        expect(c, `${file}: letter ${letter} count=${c} expected≈${expected.toFixed(1)}`)
          .toBeGreaterThanOrEqual(Math.floor(expected * 0.4));
        expect(c, `${file}: letter ${letter} count=${c} expected≈${expected.toFixed(1)}`)
          .toBeLessThanOrEqual(Math.ceil(expected * 1.6));
      }
    });
  }
});

describe('question bank — content sanity', () => {
  it('every question carries either topic or section', () => {
    for (const q of allQuestions) {
      expect(q.topic || q.section, `question ${q.id} has neither topic nor section`).toBeTruthy();
    }
  });

  it('subtopic is present', () => {
    for (const q of allQuestions) {
      expect(q.subtopic, `question ${q.id} missing subtopic`).toBeTruthy();
    }
  });
});
