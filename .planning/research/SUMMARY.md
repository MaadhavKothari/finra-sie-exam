# Project Research Summary

**Project:** FINRA SIE Exam Practice Site
**Domain:** Static exam preparation / educational web application
**Researched:** 2026-05-17
**Confidence:** HIGH

## Executive Summary

This project is a free, static FINRA SIE exam practice site deployed on GitHub Pages. The expert-recommended approach for content-heavy sites with pockets of interactivity is Astro's islands architecture: static HTML by default, with Preact islands hydrating only the interactive components (quiz engine, timer, flashcards, progress dashboard). Nanostores handles cross-island state, localStorage persists user progress, and Astro content collections with Zod validation enforce question data integrity at build time. This stack ships near-zero JavaScript for content pages and roughly 3KB per interactive island -- an order of magnitude lighter than React/Next.js alternatives that would ship 40KB+ on every page regardless of interactivity.

The competitive landscape reveals a clear niche: no free SIE prep site is both comprehensive and well-designed. Free alternatives have limited question banks (50-150 questions) and sparse explanations. The project's differentiators are evidence-based study methods (spaced repetition, interleaved practice, confidence-based assessment) that even most paid competitors lack. The critical path is: question data schema and validation first, then a drill mode that validates the entire component-to-storage pipeline, then exam simulation, then learning science features. The question data JSON -- especially explanation quality -- is the foundational asset that determines whether the site is useful or disposable.

The dominant risk is copyright infringement. The project description mentions aggregating from Kaplan, STC, Knopman, and other commercial providers whose question content is copyrighted and actively enforced (Barkley v. Quizlet, 2024, seeking $1M+ in damages). The content strategy must shift entirely to original questions inspired by FINRA's content outline, AI-generated questions reviewed for accuracy, and the 75-question FINRA official practice test. A secondary infrastructure risk is that GitHub Pages requires a paid plan (GitHub Pro, $4/month) for private repos -- this must be resolved before any deployment work begins.

## Key Findings

### Recommended Stack

Astro 6 with Preact islands is the clear winner for a static study site with interactive sections. Astro ships zero JS by default and has first-class GitHub Pages deployment via `withastro/action@v6`. Preact provides React-compatible hooks and JSX at 3KB (vs React's 40KB). Nanostores is Astro's officially recommended cross-island state manager at under 1KB. Tailwind CSS v4 with the typography plugin handles responsive styling and readable question explanations. Content collections with Zod enforce question schema at build time. Vitest shares the Vite pipeline for fast unit tests; Playwright covers E2E flows.

**Core technologies:**
- **Astro 6**: Static site generator with islands architecture -- zero JS by default, build-time content validation, native GitHub Pages deployment
- **Preact 10**: Lightweight UI for interactive islands -- 3KB gzipped, React-compatible API, officially recommended by Astro docs
- **Nanostores**: Cross-island state management -- 265-814 bytes, framework-agnostic, Astro's official recommendation
- **Tailwind CSS 4**: Utility-first styling -- CSS-first config, responsive utilities, typography plugin for explanations
- **Astro Content Collections + Zod**: Question data management -- build-time schema validation catches malformed questions before deploy
- **Vitest + Playwright**: Testing -- Vitest shares Vite config (zero extra setup), Playwright for critical user flows

### Expected Features

**Must have (table stakes):**
- Multiple-choice question bank organized by FINRA's 4 SIE sections with sub-topics
- Detailed answer explanations for both correct AND incorrect choices (the content moat)
- Timed practice exam mode (75 questions, 105 minutes, FINRA-weighted distribution: 16/44/31/9%)
- Topic-based drill/quiz mode with configurable length
- Score tracking with per-section breakdown
- Mobile-responsive design (study-on-commute is a primary use case)
- localStorage progress persistence across sessions
- Wrong-answer review mode with full explanations
- Source attribution on every question (legal necessity)

**Should have (differentiators -- no free SIE site offers these):**
- Spaced repetition engine (SM-2 or Leitner boxes) with daily review mode
- Confidence-based self-assessment per question (metacognitive calibration)
- Interleaved practice mode (mixing topics improves retention by up to 43%)
- Flashcard mode with active recall (flip + self-rate, not passive reading)
- Question bookmarking / "Study Later" list
- Readiness score predicting exam performance

**Defer (v2+):**
- PWA with offline support (medium complexity, high value but not launch-critical)
- Per-section strength heatmap (depends on sufficient data accumulation)
- Study streak tracker (engagement feature, not learning feature)
- Dark mode, keyboard shortcuts, export/import (polish)
- Video content, social features, leaderboards, AI-generated questions, native apps (anti-features)

### Architecture Approach

Multi-page static site (not SPA) with Astro file-based routing. Each page is a separate HTML file that loads instantly with zero JS. Interactive sections (exam engine, drill mode, flashcards, progress dashboard) hydrate as single Preact islands per page section. One island per major interactive area -- not micro-islands for every widget. Pure business logic (scoring, SM-2, exam generation, timer) lives in `src/lib/` with no UI dependency, making it testable and reusable. Question data is split into 4 JSON files by FINRA topic, validated by Zod at build time, and lazy-loaded per topic at runtime to avoid bundle bloat.

**Major components:**
1. **Astro pages** (`src/pages/`) -- Static HTML shells providing routing, SEO, and island mounting
2. **Preact islands** (`src/components/`) -- ExamEngine, DrillEngine, FlashcardDeck, ProgressDashboard (one island per page section, `client:load`)
3. **Nanostores** (`src/stores/`) -- examStore (current session), progressStore (syncs to localStorage), settingsStore (preferences)
4. **Pure logic library** (`src/lib/`) -- scoring.ts, spacedRepetition.ts, examGenerator.ts, timer.ts, storage.ts (no UI dependencies)
5. **Content layer** (`src/content/questions/`) -- 4 topic JSON files + Zod schema, validated at build time

### Critical Pitfalls

1. **Copyright infringement from commercial question banks** -- Do NOT scrape or reproduce questions from Kaplan, STC, Knopman, ExamFX, or Pass Perfect. Barkley v. Quizlet (2024) demonstrates active enforcement with $150K/work statutory damages. Use only: FINRA's official practice test, original questions based on the content outline, and AI-generated questions with human review. Track source provenance on every question.

2. **GitHub Pages private repo restriction** -- Pages requires GitHub Pro ($4/month) for private repos. Decide upfront: (A) pay for Pro, (B) two-repo strategy (private source, public deploy), (C) public repo (safe only if all content is original), or (D) use Cloudflare Pages / Netlify instead (free from private repos).

3. **Stale content after FINRA rule changes** -- FINRA updates exam content outlines annually and the regulatory landscape evolves (crypto/digital assets, Reg BI, AI/cybersecurity are active areas in 2026). Include `lastVerified` and `regulatoryBasis` fields in the question schema from day one. Plan quarterly content reviews. Display "last updated" date prominently.

4. **Bundle size bloat from inlined question data** -- 500+ questions with full explanations can reach 2-5MB. Split question data by topic, lazy-load per section with dynamic `import()`. Design the data-loading architecture for code splitting from the start; bolting it on later requires rearchitecting.

5. **Flat data model that resists maintenance** -- Design the full question schema with all metadata fields (source, lastVerified, topics, difficulty, status, version) on day one. Retrofitting metadata onto hundreds of questions is extremely painful. Use stable semantic IDs (e.g., `q-pr-042`), not sequential numbers that break when questions are reordered.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation and Content Strategy
**Rationale:** The copyright question is existential and must be resolved before any content is created. The data model shapes everything downstream. Infrastructure (GitHub Pages deployment) must work before building UI.
**Delivers:** Astro project scaffold deployed to GitHub Pages; Zod question schema; build-time validation pipeline; 5-10 sample questions per topic to validate schema; content strategy decision (original + AI-generated + FINRA official only)
**Addresses:** Source attribution (table stake), question bank structure
**Avoids:** Copyright infringement (Pitfall 1), GitHub Pages private repo block (Pitfall 2), flat data model (Pitfall 4)

### Phase 2: Core Quiz Engine
**Rationale:** DrillEngine is the simplest interactive mode and validates the entire pipeline: Preact island rendering, nanostores state management, localStorage persistence, question rendering, answer evaluation, and explanation display. Must be mobile-first from the start.
**Delivers:** Topic-based drill mode with immediate feedback and explanations; QuestionCard + AnswerChoices components; localStorage progress persistence; mobile-responsive layout with 44px+ touch targets; wrong-answer review mode; score display with per-section breakdown
**Addresses:** 7 of 9 table stakes features (drill mode, explanations, scores, mobile, persistence, review, source display)
**Avoids:** Poor mobile UX (Pitfall 6), accessibility gaps (Pitfall 7), questions stored in localStorage anti-pattern

### Phase 3: Exam Simulation
**Rationale:** Depends on Phase 2's quiz components. Adds timer, question navigation, weighted exam generation, and auto-submit -- the most complex interactive mode.
**Delivers:** Full 75-question timed exam (105 minutes); FINRA-weighted topic distribution; question flagging and navigation; pause/resume with visibility API drift correction; exam results with pass/fail and per-section breakdown
**Addresses:** Timed practice exam (table stake), exam generation algorithm
**Avoids:** Timer drift from setInterval in background tabs, bundle bloat from loading all questions (Pitfall 8)

### Phase 4: Learning Science Features
**Rationale:** Depends on Phase 2's persistence layer. These are the differentiators that separate the project from every free alternative. Spaced repetition and active recall flashcards are the highest-value features.
**Delivers:** Spaced repetition engine (start with Leitner boxes, not full SM-2) with daily review mode; flashcard mode with active recall (self-rating, not passive flip); confidence-based self-assessment per question; interleaved practice mode toggle; question bookmarking
**Addresses:** All 5 top differentiator features
**Avoids:** SM-2 "ease hell" (Pitfall 9) by starting with simpler Leitner boxes; passive flashcard anti-pattern (Pitfall 11)

### Phase 5: Polish and Content Expansion
**Rationale:** Engagement and quality-of-life features that increase retention. Also the phase for scaling the question bank from sample size to comprehensive coverage.
**Delivers:** Readiness score / exam prediction gauge; per-section strength heatmap; study streak tracker; dark mode; keyboard shortcuts; export/import progress; expanded question bank (target: 300-500+ questions)
**Addresses:** All Phase 3 features from FEATURES.md
**Avoids:** Repo size creep (Pitfall 12) by monitoring bundle sizes in CI

### Phase Ordering Rationale

- **Content strategy before content creation:** The copyright risk (Pitfall 1) is the single biggest threat to the project. It must be resolved as a Phase 1 decision, not discovered after creating 500 questions from scraped sources.
- **DrillEngine before ExamEngine:** Drill mode is simpler (no timer, no navigation, immediate feedback) and validates the full stack. Exam mode extends drill with additional complexity.
- **Persistence layer before study features:** Spaced repetition, flashcards, and progress tracking all depend on the localStorage/storage abstraction working correctly.
- **Learning science features after core quiz:** These are differentiators, not table stakes. The site is useful with just drill + exam mode. SR and flashcards make it genuinely valuable.
- **Polish last:** Dark mode, streaks, and keyboard shortcuts are engagement features that matter only after the core learning experience works.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1 (Content Strategy):** Needs legal review of what constitutes "original" vs. derivative question content. FINRA content outline topics are factual (not copyrightable), but the line between "inspired by" and "derived from" commercial questions needs careful thought.
- **Phase 4 (Spaced Repetition):** SM-2 has known failure modes (ease hell, overdue card scheduling). Research whether Leitner boxes or FSRS (Free Spaced Repetition Scheduler) are better fits. The `supermemo` npm package and `ts-fsrs` are both options.

Phases with standard patterns (skip research-phase):
- **Phase 2 (Core Quiz Engine):** Well-documented Astro + Preact island patterns. Astro's official docs cover everything needed.
- **Phase 3 (Exam Simulation):** Timer with visibility API, weighted random selection, question navigation -- all standard patterns with clear implementations.
- **Phase 5 (Polish):** Dark mode, keyboard shortcuts, streaks -- all commodity features with abundant examples.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Astro, Preact, nanostores, Tailwind all verified against official docs. Version numbers confirmed on npm 2026-05-17. Astro's GitHub Pages action is first-class. |
| Features | HIGH | Competitive analysis covered 7+ commercial platforms plus free alternatives. Feature prioritization grounded in learning science literature (SM-2, interleaving, active recall). |
| Architecture | HIGH | Islands architecture is Astro's core paradigm, well-documented. Component boundaries, data flow, and localStorage model are standard patterns. Schema design informed by JSON Quiz Specification and exam platform conventions. |
| Pitfalls | HIGH | Copyright risk backed by Barkley v. Quizlet (2024) case law. GitHub Pages limits verified in official docs. localStorage limitations documented by MDN. FINRA content evolution tracked via 2026 Regulatory Oversight Report. |

**Overall confidence:** HIGH

### Gaps to Address

- **Content licensing specifics:** Research confirmed the risk of scraping commercial content, but the exact boundary of "original question inspired by FINRA content outline" vs. "derivative of a commercial question" needs careful judgment during content creation. Recommendation: err heavily on the side of original.
- **Actual SIE pass rate correlation:** The "readiness score" feature (Phase 5) would benefit from real data correlating practice performance to SIE pass rates. No public data exists; the 70% threshold is an educated guess based on the SIE's reported ~74% first-time pass rate.
- **IndexedDB vs. localStorage:** PITFALLS.md recommends IndexedDB for progress data (larger quota, async API), while STACK.md and ARCHITECTURE.md use localStorage throughout. Recommendation: start with localStorage wrapped in a storage abstraction (as ARCHITECTURE.md specifies), and migrate to IndexedDB only if storage limits become a real issue. The estimated 320KB for heavy use is well within localStorage's 5MB limit.
- **Exam question count ambiguity:** FINRA changed to 75 scored + 5 unscored = 80 total in October 2025. ARCHITECTURE.md recommends simulating 75 only (skip unscored). This is the right call -- unscored questions add confusion without learning value.

## Cross-Cutting Concerns

Two tensions emerged across research dimensions:

1. **localStorage simplicity vs. data durability:** ARCHITECTURE.md designs extensively around localStorage, while PITFALLS.md warns about data loss in private browsing, cross-device limitations, and Safari eviction. Resolution: the storage abstraction layer in ARCHITECTURE.md (`src/lib/storage.ts`) plus export/import (Phase 5) is the right approach. Do not over-engineer with IndexedDB until localStorage proves insufficient.

2. **Question ID format:** ARCHITECTURE.md recommends semantic IDs (`q-pr-042`) while PITFALLS.md recommends UUIDs. Recommendation: use semantic IDs. They are human-readable in question files, grep-friendly for debugging, and stable as long as the convention (topic prefix + never-reused sequential number) is followed. UUIDs solve a multi-author collision problem this project does not have.

## Sources

### Primary (HIGH confidence)
- Astro official docs (islands, content collections, GitHub Pages deployment, nanostores state sharing)
- FINRA SIE exam page and 2025 Content Outline PDF
- FINRA 2026 Annual Regulatory Oversight Report
- GitHub Pages limits documentation
- MDN Web Docs (localStorage, IndexedDB, Storage API)
- Barkley v. Quizlet (2024) copyright case

### Secondary (MEDIUM confidence)
- Achievable, Kaplan, STC, Knopman Marks product pages (competitor feature analysis)
- SM-2 algorithm documentation (Anki FAQ, supermemo npm package)
- Learning science literature on interleaving (Rohrer & Taylor 2007), active recall, spaced repetition
- Acadio and Achievable blog posts on 2026 FINRA exam changes

### Tertiary (LOW confidence)
- Radio button UX guidelines (Eleken) -- general UX, not exam-specific
- SM-2 overdue card handling analysis (controlaltbackspace.org) -- single-source analysis

---
*Research completed: 2026-05-17*
*Ready for roadmap: yes*
