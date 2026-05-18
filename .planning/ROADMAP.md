# Roadmap: FINRA SIE Exam Practice

## Overview

This roadmap delivers a free, static FINRA SIE exam practice site from content foundation through learning science features. Phase 1 establishes the question data schema, build pipeline, and GitHub Pages deployment -- the content foundation everything else depends on. Phase 2 delivers the core drill quiz engine with immediate feedback, progress persistence, and wrong-answer review -- validating the full interactive stack. Phase 3 adds timed exam simulation with FINRA-weighted question distribution. Phase 4 introduces the learning science differentiators (spaced repetition, flashcards, confidence rating) that no free SIE site offers. Phase 5 polishes with analytics dashboards, dark mode, keyboard shortcuts, PWA offline support, and progress export/import.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation & Content** - Astro project scaffold, question schema with Zod validation, sample content, GitHub Pages deploy
- [ ] **Phase 2: Drill Engine** - Topic-based drill mode with immediate feedback, progress tracking, wrong-answer review, mobile layout
- [ ] **Phase 3: Exam Simulation** - Timed 75-question exam with FINRA-weighted distribution, navigation, flagging, results
- [ ] **Phase 4: Learning Science** - Spaced repetition engine, flashcard mode, confidence rating, daily review, bookmarking
- [ ] **Phase 5: Polish & Analytics** - Readiness score, strength heatmap, streaks, dark mode, keyboard shortcuts, PWA, export/import

## Phase Details

### Phase 1: Foundation & Content
**Goal**: A deployed Astro site on GitHub Pages with a validated question data schema and sample questions proving the content pipeline works end-to-end
**Depends on**: Nothing (first phase)
**Requirements**: CONT-01, CONT-02, CONT-03, CONT-04, CONT-05, CONT-06, UX-05
**Success Criteria** (what must be TRUE):
  1. Running `npm run build` validates all question data against the Zod schema and fails on malformed questions
  2. Sample questions exist for all 4 SIE sections, each with correct/incorrect explanations, source attribution, sub-topic tags, and stable semantic IDs
  3. The site is live on GitHub Pages and loads in a browser
  4. Question data is organized by FINRA's 4 sections with correct weighting metadata (16/44/31/9%)
**Plans**: TBD

Plans:
- [ ] 01-01: TBD
- [ ] 01-02: TBD
- [ ] 01-03: TBD

### Phase 2: Drill Engine
**Goal**: Users can practice SIE questions by topic with immediate answer feedback, see their progress persist across sessions, and review missed questions
**Depends on**: Phase 1
**Requirements**: DRIL-01, DRIL-02, DRIL-03, DRIL-04, REVW-01, REVW-02, PROG-01, PROG-02, UX-01
**Success Criteria** (what must be TRUE):
  1. User can select a SIE section or sub-topic, choose quiz length (10/25/50), and take a drill quiz with immediate per-question feedback and explanations
  2. User can toggle between topic-focused and interleaved (mixed-topic) practice mode
  3. After completing a drill, user can review only their wrong answers with the correct answer highlighted and full explanations shown
  4. User's quiz history and scores persist after closing and reopening the browser (localStorage)
  5. All interactive elements have 44px+ touch targets and the layout is usable on a phone screen
**Plans**: TBD
**UI hint**: yes

Plans:
- [ ] 02-01: TBD
- [ ] 02-02: TBD
- [ ] 02-03: TBD

### Phase 3: Exam Simulation
**Goal**: Users can take a realistic timed practice exam that mirrors actual FINRA SIE conditions and see detailed results
**Depends on**: Phase 2
**Requirements**: EXAM-01, EXAM-02, EXAM-03, EXAM-04, EXAM-05, EXAM-06
**Success Criteria** (what must be TRUE):
  1. User can start a 75-question timed exam with a visible 105-minute countdown timer
  2. Exam questions are distributed across sections matching FINRA percentages (12 Capital Markets, 33 Products & Risks, 23 Trading/Accounts, 7 Regulatory)
  3. User can navigate to any question by number, flag questions for review, and return to flagged questions before submitting
  4. Exam auto-submits when timer expires, showing results with pass/fail (70%), total score, and per-section breakdown
**Plans**: TBD
**UI hint**: yes

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD

### Phase 4: Learning Science
**Goal**: Users have evidence-based study tools -- spaced repetition scheduling, active recall flashcards, and confidence-based self-assessment -- that no free SIE site offers
**Depends on**: Phase 2
**Requirements**: FLSH-01, FLSH-02, FLSH-03, SR-01, SR-02, SR-03, SR-04, PROG-06
**Success Criteria** (what must be TRUE):
  1. User can study flashcards by tapping to reveal the answer, then self-rating each card (Know It / Still Learning)
  2. Spaced repetition engine schedules questions and flashcards for review at increasing intervals based on user performance, with per-item data persisted in localStorage
  3. User can open a "Daily Review" mode that surfaces only questions/flashcards due for review today
  4. User can rate confidence (High/Medium/Low/Guess) on each question before seeing the answer, and this rating feeds into the scheduling algorithm
  5. User can bookmark any question to a "Study Later" list accessible from the navigation
**Plans**: TBD
**UI hint**: yes

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD
- [ ] 04-03: TBD

### Phase 5: Polish & Analytics
**Goal**: Users have a complete, polished study experience with predictive analytics, visual progress tracking, accessibility features, and offline capability
**Depends on**: Phase 3, Phase 4
**Requirements**: PROG-03, PROG-04, PROG-05, PROG-07, UX-02, UX-03, UX-04
**Success Criteria** (what must be TRUE):
  1. User sees a readiness score predicting their approximate exam performance based on quiz history
  2. User sees a per-section strength heatmap showing mastery level by sub-topic
  3. User can toggle dark mode (persisted, respects system preference), use keyboard shortcuts (1-4 for answers, Enter to submit, N for next, F to flag), and study streak is displayed with a calendar heatmap
  4. User can export all progress data as JSON and import it on another device to restore their history
  5. Site works offline as an installable PWA via service worker
**Plans**: TBD
**UI hint**: yes

Plans:
- [ ] 05-01: TBD
- [ ] 05-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5
Note: Phase 3 and Phase 4 both depend on Phase 2 and could run in parallel.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Content | 0/3 | Not started | - |
| 2. Drill Engine | 0/3 | Not started | - |
| 3. Exam Simulation | 0/2 | Not started | - |
| 4. Learning Science | 0/3 | Not started | - |
| 5. Polish & Analytics | 0/2 | Not started | - |
