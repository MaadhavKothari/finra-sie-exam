# Architecture Patterns

**Domain:** Static exam practice site (FINRA SIE)
**Researched:** 2026-05-17

## Recommended Architecture

**Astro + Preact islands on GitHub Pages.** Astro generates static HTML for all content pages (topic overviews, question browsing). Preact islands handle the interactive components (exam engine, flashcards, progress dashboard). Nanostores manages shared state across islands. localStorage persists all user progress. Question data lives in JSON files, split by topic, imported at build time.

This is not a SPA. It is a multi-page static site where each page loads fast (zero JS by default) and interactive sections hydrate independently.

### Why Astro + Preact (not plain HTML, not React, not Next.js)

| Option | Verdict | Reason |
|--------|---------|--------|
| Plain HTML/JS | Rejected | No component model, no build-time data processing, no code splitting -- unmaintainable past 50 questions |
| React SPA | Rejected | Entire framework loads on every page. SIE study site is content-heavy; most pages need zero interactivity |
| Next.js | Rejected | Requires Node server or Vercel for SSR features. Static export works but brings 80KB+ React runtime to every page |
| Astro + React | Possible but heavier | React islands ship ~40KB runtime per island |
| **Astro + Preact** | **Recommended** | Preact is 3KB. Islands hydrate only where needed. Build-time JSON processing. Native GitHub Pages deploy via official Action. TypeScript support. Nanostores for cross-island state (<1KB) |
| Astro + vanilla JS | Possible | Works for simple interactivity but no component model for complex exam engine UI; reinventing the wheel |

**Confidence: HIGH** -- Astro has a first-class GitHub Pages deployment action (`withastro/action@v6`). Preact is the officially recommended lightweight alternative to React in Astro's docs. Nanostores is Astro's recommended cross-island state solution.

---

## Component Boundaries

```
+------------------------------------------------------------------+
|                        ASTRO (Build Time)                        |
|                                                                  |
|  src/                                                            |
|  +-- content/                                                    |
|  |   +-- questions/          <-- JSON question bank files        |
|  |       +-- topic-1-capital-markets.json                        |
|  |       +-- topic-2-products-risks.json                         |
|  |       +-- topic-3-trading-accounts.json                       |
|  |       +-- topic-4-regulatory-framework.json                   |
|  |                                                               |
|  +-- pages/                  <-- Astro pages (static HTML)       |
|  |   +-- index.astro         <-- Landing / dashboard             |
|  |   +-- exam.astro          <-- Full practice exam host         |
|  |   +-- drill/                                                  |
|  |   |   +-- [topic].astro   <-- Topic drill host                |
|  |   +-- flashcards/                                             |
|  |   |   +-- [topic].astro   <-- Flashcard mode host             |
|  |   +-- review.astro        <-- Review past attempts            |
|  |   +-- progress.astro      <-- Progress dashboard host         |
|  |                                                               |
|  +-- components/             <-- Preact interactive islands      |
|  |   +-- exam/                                                   |
|  |   |   +-- ExamEngine.tsx       <-- Core exam logic            |
|  |   |   +-- QuestionCard.tsx     <-- Single question display    |
|  |   |   +-- AnswerChoices.tsx    <-- A/B/C/D selection          |
|  |   |   +-- ExamTimer.tsx        <-- Countdown timer            |
|  |   |   +-- ExamResults.tsx      <-- Score summary + review     |
|  |   |   +-- QuestionNav.tsx      <-- Question navigator/flagging|
|  |   +-- drill/                                                  |
|  |   |   +-- DrillEngine.tsx      <-- Topic drill mode           |
|  |   |   +-- Explanation.tsx      <-- Detailed explanation view  |
|  |   +-- flashcard/                                              |
|  |   |   +-- FlashcardDeck.tsx    <-- Flip card interface        |
|  |   |   +-- FlashcardCard.tsx    <-- Single flashcard           |
|  |   +-- progress/                                               |
|  |   |   +-- ProgressDashboard.tsx <-- Overall stats             |
|  |   |   +-- TopicBreakdown.tsx    <-- Per-topic performance     |
|  |   |   +-- StudyStreak.tsx       <-- Streak / calendar view    |
|  |   +-- shared/                                                 |
|  |       +-- DifficultyBadge.tsx   <-- Difficulty indicator      |
|  |       +-- TopicTag.tsx          <-- Topic label               |
|  |       +-- ConfidenceRating.tsx  <-- Self-assessment widget    |
|  |                                                               |
|  +-- stores/                 <-- Nanostores (cross-island state) |
|  |   +-- examStore.ts        <-- Current exam session state      |
|  |   +-- progressStore.ts    <-- User progress (syncs localStorage)|
|  |   +-- settingsStore.ts    <-- User preferences                |
|  |                                                               |
|  +-- lib/                    <-- Pure logic (no UI)              |
|  |   +-- questionBank.ts     <-- Load, filter, shuffle questions |
|  |   +-- scoring.ts          <-- Score calculation               |
|  |   +-- spacedRepetition.ts <-- SM-2 algorithm wrapper          |
|  |   +-- timer.ts            <-- Timer logic (pause/resume)      |
|  |   +-- storage.ts          <-- localStorage abstraction        |
|  |   +-- examGenerator.ts    <-- Generate exam from bank         |
|  |                                                               |
|  +-- data/                   <-- Build-time data processing      |
|      +-- schema.ts           <-- Zod schema for question validation|
|      +-- topics.ts           <-- Topic taxonomy / weights        |
+------------------------------------------------------------------+
```

### Component Responsibilities

| Component | Responsibility | Communicates With | Hydration |
|-----------|---------------|-------------------|-----------|
| **Astro Pages** | Static HTML shell, SEO, routing | Passes props to Preact islands | None (static) |
| **ExamEngine** | Orchestrates full exam: question ordering, answer recording, time tracking, submission | examStore, QuestionCard, ExamTimer, QuestionNav | `client:load` |
| **DrillEngine** | Topic-focused practice: immediate feedback, explanations after each question | examStore, progressStore | `client:load` |
| **FlashcardDeck** | Spaced repetition flashcard flow: flip, rate confidence, schedule next review | progressStore (SM-2 data) | `client:load` |
| **ExamTimer** | Countdown from 105 min, pause/resume, time-up auto-submit | examStore | `client:load` (child of ExamEngine) |
| **QuestionCard** | Renders question text + choices, handles selection | Parent engine via props | Part of parent island |
| **Explanation** | Shows why correct answer is right and why each wrong answer is wrong | Props only | Part of parent island |
| **ProgressDashboard** | Aggregate stats: overall score, per-topic performance, weak areas, study calendar | progressStore, localStorage | `client:load` |
| **Nanostores** | Reactive cross-island state; syncs to localStorage via `@nanostores/persistent` | All interactive components | N/A (library) |
| **lib/** | Pure functions: scoring, SM-2, shuffling, filtering, timer logic | Called by components | N/A (imported) |

---

## Question Bank Data Model

### Schema (TypeScript / Zod)

```typescript
// src/data/schema.ts
import { z } from 'zod';

// ---------- Enums ----------

export const TopicId = z.enum([
  'capital-markets',        // Section 1: 16%
  'products-risks',         // Section 2: 44%
  'trading-accounts',       // Section 3: 31%
  'regulatory-framework',   // Section 4: 9%
]);

export const SubtopicId = z.string(); // e.g., "equity-securities", "options-basics"

export const Difficulty = z.enum(['easy', 'medium', 'hard']);

export const Source = z.enum([
  'finra-official',
  'kaplan',
  'stc',
  'knopman',
  'examfx',
  'pass-perfect',
  'custom',       // Hand-written questions
  'public',       // Freely available online
]);

// ---------- Core Question ----------

export const Choice = z.object({
  id: z.enum(['A', 'B', 'C', 'D']),
  text: z.string(),
  explanation: z.string(),  // Why this choice is right OR wrong
});

export const Question = z.object({
  id: z.string(),                    // Unique ID: "q-cm-001" format
  topic: TopicId,                    // Primary SIE topic area
  subtopic: SubtopicId,             // Specific subtopic within area
  tags: z.array(z.string()),         // Additional tags for cross-referencing
  difficulty: Difficulty,
  source: Source,
  sourceRef: z.string().optional(),  // E.g., "Kaplan Chapter 3, Q12"

  stem: z.string(),                  // Question text (the "stem")
  choices: z.tuple([Choice, Choice, Choice, Choice]),  // Always exactly 4
  correctAnswer: z.enum(['A', 'B', 'C', 'D']),
  explanation: z.string(),           // Overall explanation tying it together

  // Flashcard mode
  flashcardFront: z.string().optional(),  // Short form for flashcard front
  flashcardBack: z.string().optional(),   // Concise answer for flashcard back

  // Metadata
  examWeight: z.number().optional(), // How often this concept appears on real exam
  lastUpdated: z.string().optional(), // ISO date
});

export type Question = z.infer<typeof Question>;
export type TopicId = z.infer<typeof TopicId>;
export type Difficulty = z.infer<typeof Difficulty>;
```

### Example Question JSON

```json
{
  "id": "q-pr-042",
  "topic": "products-risks",
  "subtopic": "equity-securities",
  "tags": ["common-stock", "voting-rights", "shareholder-rights"],
  "difficulty": "medium",
  "source": "kaplan",
  "sourceRef": "Kaplan SIE Ch.4, Practice Q12",
  "stem": "Which of the following is NOT a right typically granted to common stockholders?",
  "choices": [
    {
      "id": "A",
      "text": "The right to vote on corporate matters",
      "explanation": "Incorrect. Common stockholders DO have the right to vote on matters such as the election of the board of directors and major corporate actions."
    },
    {
      "id": "B",
      "text": "The right to receive a fixed dividend",
      "explanation": "Correct. Common stock dividends are NOT fixed -- they are declared at the discretion of the board of directors and can be reduced or eliminated entirely. Fixed dividends are a feature of preferred stock."
    },
    {
      "id": "C",
      "text": "The right to inspect corporate books and records",
      "explanation": "Incorrect. Common stockholders DO have the right to inspect the corporation's books and records, subject to proper purpose and reasonable notice."
    },
    {
      "id": "D",
      "text": "The right to transfer ownership of shares",
      "explanation": "Incorrect. Common stockholders DO have the right to freely transfer their shares, which is one of the fundamental advantages of equity ownership."
    }
  ],
  "correctAnswer": "B",
  "explanation": "Common stockholders have voting rights, inspection rights, and transfer rights. However, they do NOT have the right to a fixed dividend. Dividends on common stock are discretionary. Preferred stockholders, by contrast, typically receive a stated (fixed) dividend rate.",
  "flashcardFront": "Do common stockholders have the right to a fixed dividend?",
  "flashcardBack": "No. Common stock dividends are discretionary, declared by the board. Fixed dividends are a feature of preferred stock.",
  "examWeight": 0.7,
  "lastUpdated": "2026-05-17"
}
```

### Why This Schema

| Decision | Rationale |
|----------|-----------|
| Per-choice explanations | Learning science: understanding why wrong answers are wrong is as important as knowing the right answer. Every choice gets its own explanation. |
| `stem` not `question` | Industry standard terminology for exam questions. Avoids ambiguity with the Question object. |
| Exactly 4 choices (tuple) | SIE exam is always 4-choice MCQ. Enforcing this at the schema level prevents data errors. |
| `subtopic` as freeform string | SIE has dozens of subtopics that may evolve. Strict enum would be brittle; string with conventions is flexible. |
| `flashcardFront/Back` optional | Not every question maps cleanly to a flashcard. Allows curation. |
| `examWeight` optional | Approximation of how frequently this concept appears. Drives weighted random selection for realistic practice exams. |
| Zod validation | Validates question JSON at build time. Catches errors before deploy, not at runtime. |

### Data File Organization

```
src/content/questions/
  topic-1-capital-markets.json        # ~50-100 questions
  topic-2-products-risks.json         # ~150-300 questions (44% of exam)
  topic-3-trading-accounts.json       # ~100-200 questions (31% of exam)
  topic-4-regulatory-framework.json   # ~30-60 questions (9% of exam)
```

Each file is a JSON array of Question objects. The build step validates every question against the Zod schema.

**Scaling strategy:** If any topic file exceeds ~500 questions, split into subtopic files (e.g., `topic-2-equity-securities.json`, `topic-2-debt-securities.json`). Astro's `import.meta.glob` handles this transparently.

---

## Data Flow

### Build Time

```
JSON question files
       |
       v
Astro build (import.meta.glob)
       |
       v
Zod validation (reject invalid questions)
       |
       v
Static HTML pages generated
  - Landing page: topic overview with question counts
  - Exam page: all questions bundled as JS module (lazy loaded)
  - Drill pages: per-topic question subsets
  - Flashcard pages: per-topic flashcard subsets
       |
       v
Deploy to GitHub Pages (withastro/action@v6)
```

### Runtime (Client-Side)

```
User visits site
       |
       v
Static HTML loads instantly (0 JS for content pages)
       |
       v
User starts exam/drill/flashcard
       |
       v
Preact island hydrates (client:load)
       |
       v
ExamEngine or DrillEngine initializes
  - Reads question data (passed as props from Astro page or lazy-imported)
  - Reads user progress from localStorage via progressStore
  - Generates question set (shuffle, weight by topic percentages, filter seen)
       |
       v
User answers questions
  - Each answer recorded in examStore (nanostores atom)
  - Timer ticks in ExamTimer component
       |
       v
Exam submitted (or timer expires)
       |
       v
scoring.ts calculates results
  - Overall score, per-topic breakdown, pass/fail
       |
       v
Results displayed in ExamResults
       |
       v
progressStore persists to localStorage:
  - Attempt history (date, score, per-question results)
  - SM-2 data per question (interval, repetition, efactor)
  - Topic mastery percentages
  - Study streak data
```

### State Flow Between Islands

```
+------------------+     nanostores      +------------------+
|   ExamEngine     | <--- examStore ---> |   ExamTimer      |
|   (island)       |                     |   (island)       |
+------------------+                     +------------------+
         |
         | writes results
         v
+------------------+     nanostores      +------------------+
| ProgressDashboard| <--- progressStore->|   DrillEngine    |
|   (island)       |         |           |   (island)       |
+------------------+         |           +------------------+
                             |
                    @nanostores/persistent
                             |
                             v
                      localStorage
                      (browser)
```

**Key architectural insight:** ExamEngine and ExamTimer could be separate islands sharing state via nanostores, OR (more practically) ExamTimer can be a child component within the ExamEngine island. The latter is simpler and recommended -- a single island per page section, not micro-islands for every widget. Reserve nanostores cross-island communication for genuinely separate page sections (e.g., a header progress indicator that reacts to exam completion).

---

## localStorage Data Model

### Storage Keys

```typescript
// src/lib/storage.ts

interface StorageSchema {
  // Exam attempt history
  'sie-attempts': ExamAttempt[];

  // Per-question SM-2 spaced repetition data
  'sie-sr-data': Record<string, SpacedRepetitionItem>;

  // User preferences
  'sie-settings': UserSettings;

  // Study streak
  'sie-streak': StreakData;
}

interface ExamAttempt {
  id: string;                    // UUID
  date: string;                  // ISO date
  mode: 'exam' | 'drill';
  topic?: string;                // null for full exam
  totalQuestions: number;
  correctAnswers: number;
  score: number;                 // percentage
  passed: boolean;               // >= 70%
  timeUsedSeconds: number;
  questionResults: QuestionResult[];
}

interface QuestionResult {
  questionId: string;
  selectedAnswer: 'A' | 'B' | 'C' | 'D' | null; // null = skipped
  correct: boolean;
  timeSpentSeconds: number;      // Per-question timing
  flagged: boolean;              // User flagged for review
}

interface SpacedRepetitionItem {
  questionId: string;
  interval: number;              // Days until next review
  repetition: number;            // Consecutive correct count
  efactor: number;               // Easiness factor (starts at 2.5)
  nextReviewDate: string;        // ISO date
  lastReviewDate: string;        // ISO date
}

interface UserSettings {
  examTimeMinutes: number;       // Default: 105
  questionsPerExam: number;      // Default: 75
  showTimerDuringExam: boolean;  // Default: true
  immediateFeeback: boolean;     // For drill mode. Default: true
  shuffleChoices: boolean;       // Default: true
  darkMode: boolean;             // Default: false (respect prefers-color-scheme)
}

interface StreakData {
  currentStreak: number;         // Consecutive days studied
  longestStreak: number;
  lastStudyDate: string;         // ISO date
  studyDates: string[];          // Array of ISO dates (for calendar view)
}
```

### Storage Size Estimation

| Data | Size per unit | Estimated total | Notes |
|------|--------------|-----------------|-------|
| Exam attempt | ~2KB | ~200KB for 100 attempts | QuestionResults array is the bulk |
| SR data per question | ~100 bytes | ~100KB for 1000 questions | One entry per unique question |
| Settings | ~200 bytes | ~200 bytes | Tiny |
| Streak data | ~50 bytes + dates | ~20KB for 1 year | One date string per study day |

**Total estimated: ~320KB for heavy use.** localStorage limit is typically 5-10MB. No risk of overflow.

### Storage Abstraction

```typescript
// src/lib/storage.ts
const STORAGE_PREFIX = 'sie-';

export function loadState<K extends keyof StorageSchema>(
  key: K,
  defaultValue: StorageSchema[K]
): StorageSchema[K] {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function saveState<K extends keyof StorageSchema>(
  key: K,
  value: StorageSchema[K]
): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
  } catch (e) {
    console.warn('Failed to save to localStorage:', e);
  }
}

export function exportAllData(): string {
  // Export for backup / migration
  const data: Partial<StorageSchema> = {};
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith(STORAGE_PREFIX)) {
      data[key.replace(STORAGE_PREFIX, '')] = JSON.parse(
        localStorage.getItem(key)!
      );
    }
  }
  return JSON.stringify(data, null, 2);
}

export function importData(json: string): void {
  const data = JSON.parse(json);
  for (const [key, value] of Object.entries(data)) {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
  }
}
```

**Export/import is critical.** localStorage is per-browser. Users studying across devices (phone + laptop) need a manual way to move their data. A simple "Export as JSON file" / "Import JSON file" in settings solves this without a backend.

---

## Exam Generation Algorithm

```typescript
// src/lib/examGenerator.ts

interface ExamConfig {
  totalQuestions: number;       // 75 for real SIE simulation
  topicWeights: Record<TopicId, number>;
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
  excludeQuestionIds?: string[];  // Already seen recently
  prioritizeWeak?: boolean;       // Weight toward topics with low scores
}

const SIE_WEIGHTS: Record<TopicId, number> = {
  'capital-markets': 0.16,
  'products-risks': 0.44,
  'trading-accounts': 0.31,
  'regulatory-framework': 0.09,
};

function generateExam(
  allQuestions: Question[],
  config: ExamConfig
): Question[] {
  // 1. Calculate questions per topic based on weights
  //    capital-markets: 12, products-risks: 33, trading-accounts: 23, regulatory: 7 = 75
  
  // 2. For each topic, select questions:
  //    a. Filter by topic
  //    b. Optionally weight by difficulty distribution
  //    c. Optionally prioritize unseen / weak-area questions
  //    d. Shuffle and take N
  
  // 3. Combine all topics, shuffle final order
  
  // 4. Return ordered question array
}
```

The real SIE has 75 scored questions + 5 unscored (pretest). For practice, generate 75 and skip the pretest simulation -- it adds confusion without learning value.

---

## Spaced Repetition Integration

### SM-2 Adapted for Exam Practice

The SuperMemo SM-2 algorithm uses grades 0-5. For an exam practice context, map user actions to SM-2 grades:

```typescript
// src/lib/spacedRepetition.ts
import { supermemo, SuperMemoItem, SuperMemoGrade } from 'supermemo';

// Map exam/drill performance to SM-2 grades
function gradeFromPerformance(
  correct: boolean,
  timeSpentSeconds: number,
  flagged: boolean
): SuperMemoGrade {
  if (!correct) {
    return flagged ? 0 : 1;  // 0 = blackout (flagged=unsure), 1 = wrong but recognized
  }
  // Correct answers graded by speed
  if (timeSpentSeconds < 30) return 5;   // Quick and correct = perfect
  if (timeSpentSeconds < 60) return 4;   // Correct with some thought
  return 3;                               // Correct but took a long time
}

// For flashcard mode, user self-rates directly
type FlashcardRating = 'again' | 'hard' | 'good' | 'easy';

function gradeFromFlashcard(rating: FlashcardRating): SuperMemoGrade {
  const map: Record<FlashcardRating, SuperMemoGrade> = {
    'again': 0,
    'hard': 2,
    'good': 4,
    'easy': 5,
  };
  return map[rating];
}
```

### When Spaced Repetition Fires

- **After every drill question:** Update that question's SR data immediately
- **After exam completion:** Batch update SR data for all questions in the exam
- **Flashcard sessions:** Update on each card rating
- **Determining "due" questions:** At session start, filter questions where `nextReviewDate <= today`

---

## Timer Architecture

```typescript
// src/lib/timer.ts

interface TimerState {
  totalSeconds: number;        // Total exam time (e.g., 6300 = 105 min)
  remainingSeconds: number;    // Current remaining
  isRunning: boolean;
  startedAt: number | null;    // Date.now() when last started/resumed
}

// Use requestAnimationFrame or setInterval(1000) for display updates
// Store startedAt timestamp, not a decrementing counter, to avoid drift
// On pause: calculate elapsed, update remainingSeconds
// On resume: set new startedAt
// On tab-hidden (visibilitychange): recalculate on return to handle browser throttling
```

**Critical detail:** Browsers throttle `setInterval` in background tabs. The timer MUST use `document.addEventListener('visibilitychange', ...)` to recalculate remaining time when the user returns to the tab. Store the `startedAt` timestamp and compute elapsed time on each tick, rather than decrementing a counter.

---

## Patterns to Follow

### Pattern 1: Build-Time Data Validation
**What:** Validate all question JSON against the Zod schema during `astro build`. Fail the build if any question is invalid.
**When:** Every build, every CI run.
**Why:** Catches typos, missing fields, malformed data before it reaches users. A single bad question should not ship.
**Example:**
```typescript
// src/data/validateQuestions.ts (called in astro.config.mjs integration)
import { Question } from './schema';
import questions from '../content/questions/*.json';

for (const [file, data] of Object.entries(questions)) {
  for (const q of data) {
    const result = Question.safeParse(q);
    if (!result.success) {
      throw new Error(`Invalid question in ${file}: ${result.error.message}`);
    }
  }
}
```

### Pattern 2: Single Island Per Page Section
**What:** One Preact island per major interactive section. Avoid micro-islands.
**When:** Always, for this project's scale.
**Why:** Inter-island communication adds complexity. The exam engine is one cohesive interactive experience -- it should be one island with internal component composition, not 5 separate islands trying to coordinate.

### Pattern 3: Pure Logic in lib/, UI in components/
**What:** All business logic (scoring, SM-2, exam generation, timer) lives in `src/lib/` as pure TypeScript functions with no UI framework dependency. Components import and call these functions.
**When:** Always.
**Why:** Testable without rendering. Reusable across exam/drill/flashcard modes. Replaceable if the UI framework changes.

### Pattern 4: Progressive Enhancement of Study Features
**What:** The site works without localStorage (exam mode just works without saving). Progress features degrade gracefully.
**When:** localStorage is unavailable or full.
**Why:** Some browsers (private mode, corporate) restrict localStorage. The core value (practice questions with explanations) must work regardless.

### Pattern 5: Prefixed localStorage Keys
**What:** All localStorage keys use `sie-` prefix.
**When:** Always.
**Why:** Avoids collision with other sites on the same origin (rare for GitHub Pages but good practice). Makes export/import/clear trivial.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Storing Questions in localStorage
**What:** Copying the question bank into localStorage for "offline support."
**Why bad:** Question data is static and already in the built JS bundle. Duplicating it in localStorage wastes space, creates sync issues, and makes updates impossible without clearing user data.
**Instead:** Questions come from the static build. Only user-generated data (progress, settings, SR data) goes in localStorage.

### Anti-Pattern 2: SPA Router for a Content Site
**What:** Using React Router or similar to make the whole site a single-page app.
**Why bad:** Every page load downloads the entire app bundle including all question data. Destroys the fast initial load that makes static sites compelling. Breaks browser back/forward expectations.
**Instead:** Use Astro's file-based routing. Each page is a separate HTML file. Navigation is traditional (full page loads). Interactive sections hydrate independently.

### Anti-Pattern 3: Over-Granular Islands
**What:** Making every button, timer, and question a separate Astro island.
**Why bad:** Each island has hydration overhead. Cross-island state management becomes the dominant complexity. Debugging is harder when state flows through nanostores between 10 tiny islands.
**Instead:** One island per page section (exam engine = one island, progress dashboard = one island). Internal component composition handles the rest.

### Anti-Pattern 4: Mutable Question IDs
**What:** Using array indices or auto-incrementing numbers as question IDs.
**Why bad:** Adding/removing/reordering questions changes IDs, which breaks all localStorage references (progress, SR data, attempt history). User loses their entire study history.
**Instead:** Use stable, semantic IDs like `q-pr-042` (topic prefix + sequential number that never changes once assigned). New questions get the next available number.

### Anti-Pattern 5: Monolithic Question File
**What:** All 500+ questions in a single `questions.json` file.
**Why bad:** Hard to maintain, impossible to review diffs, slow to edit, no logical organization.
**Instead:** Split by topic (4 files). If a topic exceeds ~500 questions, split by subtopic.

---

## Scalability Considerations

| Concern | At 100 questions | At 500 questions | At 2000+ questions |
|---------|-----------------|-----------------|-------------------|
| **Build time** | Instant | Fast (<5s) | Still fast -- JSON import is trivial |
| **Page load (exam)** | Tiny bundle (~20KB data) | Moderate (~100KB data) | Consider lazy-loading topic files on demand (~400KB) |
| **localStorage** | Negligible | ~50KB SR data | ~200KB SR data, still well within limits |
| **Maintainability** | Single file per topic fine | Single file per topic fine | Split into subtopic files |
| **Search/filter** | In-memory array filter | In-memory array filter | In-memory still fine (2000 objects is tiny for JS) |

**The site will not need server-side anything at 2000+ questions.** JSON is compact, browsers handle thousands of objects trivially, and Astro's build-time processing means no runtime parsing cost for static content.

---

## Suggested Build Order (Dependencies)

### Phase 1: Foundation (no dependencies)
1. **Astro project scaffolding** -- `npm create astro`, add Preact integration, configure for GitHub Pages
2. **Question data schema** -- Zod schema definition, 5-10 sample questions per topic
3. **Build-time validation** -- Fail build on invalid questions

### Phase 2: Core Engine (depends on Phase 1)
4. **QuestionCard + AnswerChoices** -- Render a single question, handle selection
5. **DrillEngine** -- Simple "answer and see explanation" loop (simplest mode)
6. **localStorage abstraction** -- storage.ts with load/save/export

### Phase 3: Full Exam Mode (depends on Phase 2)
7. **ExamEngine** -- Full 75-question exam flow with question navigation
8. **ExamTimer** -- 105-minute countdown with pause/resume and visibility API
9. **Scoring + ExamResults** -- Calculate and display results with per-topic breakdown
10. **examGenerator** -- Weighted random selection matching SIE topic percentages

### Phase 4: Study Features (depends on Phase 2)
11. **Spaced repetition (SM-2)** -- Track per-question SR data, surface "due" questions
12. **FlashcardDeck** -- Flip interface with confidence rating
13. **ProgressDashboard** -- Stats, topic breakdown, weak area identification

### Phase 5: Polish (depends on Phases 3-4)
14. **Study streak** -- Calendar view, consecutive day tracking
15. **Settings** -- Timer toggle, question count, dark mode
16. **Export/Import** -- JSON backup/restore for cross-device use
17. **Question bank expansion** -- Scale from sample questions to full bank

### Dependency Graph

```
Phase 1: Schema + Scaffolding + Validation
    |
    v
Phase 2: QuestionCard + DrillEngine + Storage
    |          |
    v          v
Phase 3:    Phase 4:
Exam Mode   Study Features (SR, Flashcards, Progress)
    |          |
    +----+-----+
         |
         v
Phase 5: Polish + Content Expansion
```

**Critical path:** Schema must be finalized before any question data entry. The DrillEngine is the simplest interactive mode and validates the entire component → store → localStorage pipeline. Build it first, then extend to exam mode (adds timer + navigation) and flashcards (adds SR).

---

## Sources

- [Astro Islands Architecture](https://docs.astro.build/en/concepts/islands/) -- Official Astro docs on islands, client directives, hydration strategies
- [Astro GitHub Pages Deployment](https://docs.astro.build/en/guides/deploy/github/) -- Official deployment guide with `withastro/action@v6`
- [Astro Share State Between Islands](https://docs.astro.build/en/recipes/sharing-state-islands/) -- Nanostores pattern for cross-island state
- [Nanostores](https://github.com/nanostores/nanostores) -- Framework-agnostic state management (<1KB)
- [SuperMemo npm package](https://github.com/VienDinhCom/supermemo) -- SM-2 algorithm TypeScript implementation
- [JSON Quiz Specification](https://json-quiz.github.io/json-quiz/spec/quiz.html) -- Open standard for quiz data format
- [GETMARKED Question Schema](https://digitaliser.getmarked.ai/docs/api/question_schema/) -- Reference for question type taxonomy
- [FINRA SIE Content Outline](https://www.finra.org/sites/default/files/2025-10/SIE_Content_Outline.pdf) -- Official exam topic weights and structure
- [Astro Preact Integration](https://docs.astro.build/en/guides/integrations-guide/preact/) -- Official Preact integration docs
