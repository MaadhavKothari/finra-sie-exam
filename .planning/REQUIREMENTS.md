# Requirements: FINRA SIE Exam Practice

**Defined:** 2026-05-18
**Core Value:** Comprehensive, well-organized practice questions with detailed explanations — covering every SIE topic from every available source — in one free, fast, static site.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Content

- [ ] **CONT-01**: Question bank contains practice questions organized by FINRA's 4 SIE sections (Capital Markets 16%, Products & Risks 44%, Trading/Accounts 31%, Regulatory Framework 9%)
- [ ] **CONT-02**: Each question has detailed explanations for the correct answer AND rationale for why each incorrect answer is wrong
- [ ] **CONT-03**: Every question displays source attribution (origin of question)
- [ ] **CONT-04**: Questions are tagged with sub-topics within each section for granular filtering
- [ ] **CONT-05**: Question data is validated at build time via Zod schema (catches malformed data before deploy)
- [ ] **CONT-06**: Questions use stable semantic IDs (e.g., `q-pr-042`) that don't break when questions are added/reordered

### Exam Mode

- [ ] **EXAM-01**: User can take a timed practice exam with 75 questions and 105-minute countdown
- [ ] **EXAM-02**: Exam questions are weighted by FINRA section percentages (16/44/31/9%)
- [ ] **EXAM-03**: User can navigate between questions (jump to any question number)
- [ ] **EXAM-04**: User can flag/bookmark questions for review within the exam
- [ ] **EXAM-05**: Exam auto-submits when timer expires
- [ ] **EXAM-06**: User sees exam results with pass/fail (70% threshold), total score, and per-section breakdown

### Drill Mode

- [ ] **DRIL-01**: User can practice questions filtered by any SIE section or sub-topic
- [ ] **DRIL-02**: User can configure drill quiz length (10/25/50 questions)
- [ ] **DRIL-03**: User sees immediate feedback after each answer with full explanation
- [ ] **DRIL-04**: User can toggle between topic-focused and interleaved practice mode

### Review

- [ ] **REVW-01**: User can review only wrong answers from any completed quiz/exam with full explanations
- [ ] **REVW-02**: User can see their selected answer vs the correct answer for each missed question

### Flashcards

- [ ] **FLSH-01**: User can study key terms and concepts in flashcard mode (tap to flip/reveal)
- [ ] **FLSH-02**: User can self-rate each flashcard (Know It / Still Learning)
- [ ] **FLSH-03**: Flashcard scheduling integrates with spaced repetition engine

### Spaced Repetition

- [ ] **SR-01**: Spaced repetition engine schedules question review at optimal intervals based on performance
- [ ] **SR-02**: User can access a "Daily Review" mode that surfaces due questions/flashcards
- [ ] **SR-03**: User rates confidence per question (High/Medium/Low/Guess) before answer reveal
- [ ] **SR-04**: Per-question ease factor, interval, and next review date persist in localStorage

### Progress & Analytics

- [ ] **PROG-01**: User's progress (questions answered, scores, quiz history) persists across browser sessions via localStorage
- [ ] **PROG-02**: User sees score tracking with per-section breakdown after each quiz
- [ ] **PROG-03**: User sees a readiness score predicting approximate exam performance
- [ ] **PROG-04**: User sees a per-section strength heatmap showing mastery by sub-topic
- [ ] **PROG-05**: User sees study streak (consecutive days studied) with calendar heatmap
- [ ] **PROG-06**: User can bookmark/save specific questions to a "Study Later" list
- [ ] **PROG-07**: User can export progress data as JSON and import it on another device

### UX & Platform

- [ ] **UX-01**: Site is mobile-responsive with touch-friendly targets (44px+ tap areas)
- [ ] **UX-02**: Dark mode toggle that respects system preference and persists choice
- [ ] **UX-03**: Keyboard shortcuts for answer selection (1-4), submit (Enter), next (N), flag (F)
- [ ] **UX-04**: Site works offline as an installable PWA via service worker
- [ ] **UX-05**: Site deploys to GitHub Pages from private repo

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Content Expansion

- **CONT-V2-01**: Scale question bank to 500+ questions across all topics
- **CONT-V2-02**: AI-assisted question generation with human review
- **CONT-V2-03**: Community-contributed questions with moderation

### Analytics

- **ANAL-V2-01**: Detailed time-per-question analytics
- **ANAL-V2-02**: Performance trend charts over time
- **ANAL-V2-03**: Personalized study plan recommendations

## Out of Scope

| Feature | Reason |
|---------|--------|
| User accounts / authentication | Static site, no backend — localStorage handles personalization |
| Leaderboards / social features | Exam prep is personal, not competitive; requires backend |
| Video lectures / content creation | YouTube already has excellent free SIE content — link out instead |
| Payment / premium tiers | Core value is being the free alternative |
| Native mobile app | PWA provides installability + offline without app store overhead |
| Real-time chat / forums | Reddit r/Series7 and Wall Street Oasis serve this need |
| Adaptive difficulty AI | Requires ML models; spaced repetition achieves 80% of the value |
| FINRA account linking | No API exists; security liability |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CONT-01 | Phase 1 | Pending |
| CONT-02 | Phase 1 | Pending |
| CONT-03 | Phase 1 | Pending |
| CONT-04 | Phase 1 | Pending |
| CONT-05 | Phase 1 | Pending |
| CONT-06 | Phase 1 | Pending |
| EXAM-01 | Phase 3 | Pending |
| EXAM-02 | Phase 3 | Pending |
| EXAM-03 | Phase 3 | Pending |
| EXAM-04 | Phase 3 | Pending |
| EXAM-05 | Phase 3 | Pending |
| EXAM-06 | Phase 3 | Pending |
| DRIL-01 | Phase 2 | Pending |
| DRIL-02 | Phase 2 | Pending |
| DRIL-03 | Phase 2 | Pending |
| DRIL-04 | Phase 2 | Pending |
| REVW-01 | Phase 2 | Pending |
| REVW-02 | Phase 2 | Pending |
| FLSH-01 | Phase 4 | Pending |
| FLSH-02 | Phase 4 | Pending |
| FLSH-03 | Phase 4 | Pending |
| SR-01 | Phase 4 | Pending |
| SR-02 | Phase 4 | Pending |
| SR-03 | Phase 4 | Pending |
| SR-04 | Phase 4 | Pending |
| PROG-01 | Phase 2 | Pending |
| PROG-02 | Phase 2 | Pending |
| PROG-03 | Phase 5 | Pending |
| PROG-04 | Phase 5 | Pending |
| PROG-05 | Phase 5 | Pending |
| PROG-06 | Phase 4 | Pending |
| PROG-07 | Phase 5 | Pending |
| UX-01 | Phase 2 | Pending |
| UX-02 | Phase 5 | Pending |
| UX-03 | Phase 5 | Pending |
| UX-04 | Phase 5 | Pending |
| UX-05 | Phase 1 | Pending |

**Coverage:**
- v1 requirements: 37 total
- Mapped to phases: 37
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-18*
*Last updated: 2026-05-18 after initial definition*
