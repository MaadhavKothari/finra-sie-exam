# Feature Landscape

**Domain:** FINRA SIE Exam Practice / Static Study Site
**Researched:** 2026-05-17
**Overall confidence:** HIGH (based on analysis of 7+ commercial platforms, free alternatives, FINRA official resources, and learning science literature)

## Competitive Landscape Context

The SIE exam prep market ranges from free (FINRA practice test, Career Employer, PassMasters) to premium ($885 Knopman Diamond). The project's unique position: **a free, static, open-source aggregator** -- no commercial SIE prep site is free AND comprehensive. Most free resources have limited question banks (50-150 questions) or lack detailed explanations. The paid leaders (Achievable, Kaplan, STC) offer 1,500-2,500+ questions with adaptive learning. This project can carve a niche by being the most complete free option with evidence-based study methods.

### Competitor Feature Matrix (for reference)

| Feature | FINRA Official | Free Sites | Kaplan ($99-229) | STC ($129-293) | Achievable ($99) | Knopman ($260-885) | ExamFX ($129-249) |
|---------|---------------|------------|------------------|----------------|-------------------|---------------------|-------------------|
| Question count | 75 | 50-775 | 2,500+ | 1,500+ | 2,000+ | 1,800+ | 1,000+ |
| Full practice exams | 1 | 1-5 | 1-3 | 2-4 | 35+ | Preset only | 3-5 |
| Detailed explanations | No | Partial | Yes | Yes | Yes | Yes | Yes |
| Wrong-answer rationales | No | Rare | Yes | Partial | Yes | Yes | Partial |
| Flashcards | No | No | No (add-on) | Add-on ($76) | No | Quizlet partnership | Upper tiers |
| Adaptive learning | No | No | Premium only | Greenlight only | Core feature | Yes | No |
| Progress tracking | No | No | Yes | Limited | Yes (visual) | Yes | Yes |
| Video content | No | YouTube | On-demand | Add-on ($171) | 32+ videos | Video Vault | On-demand |
| Study plan | No | No | Daily tasks | Static calendar | Dynamic AI | Strategy calls | Personalized |
| Mobile app | No | No | No | No | iOS/Android | App | No |
| Pass guarantee | N/A | N/A | No | Yes | Yes | No | No |
| Offline access | No | No | No | No | No | No | No |

---

## Table Stakes

Features users expect from any SIE exam study site. Missing any of these and users will immediately leave for a competitor, even a paid one.

| # | Feature | Why Expected | Complexity | Notes |
|---|---------|--------------|------------|-------|
| 1 | **Multiple-choice question bank organized by SIE topic** | The SIE is entirely multiple-choice across 4 sections. Every single competitor organizes by FINRA content outline sections. Users navigate by topic to focus weak areas. | Low | Must mirror FINRA's 4 sections with sub-topics. JSON data structure with section/topic tags per question. |
| 2 | **Detailed answer explanations (correct AND incorrect)** | Learning science is unambiguous: elaborative feedback (explaining why wrong answers are wrong) produces significantly better retention than simple right/wrong feedback. Every paid competitor includes this. | Medium | Biggest content effort. Each question needs 4-5 sentences explaining the correct answer plus brief rationale for each distractor. This is the content moat. |
| 3 | **Timed practice exam mode (75 questions, 105 minutes)** | Simulates real SIE conditions. FINRA itself offers a practice exam. Every competitor offers at least one full-length timed exam. Test anxiety reduction requires practice under realistic conditions. | Medium | Timer with pause capability, question navigation (jump to any question), flag/bookmark for review, auto-submit at time expiry. Must weight questions by FINRA section percentages (16/44/31/9). |
| 4 | **Topic-based drill/quiz mode** | Users need targeted practice on weak areas. Every competitor offers topic filtering. The SIE weighs "Products and Risks" at 44% -- users need to drill this heavily. | Low | Filter questions by section and sub-topic. Configurable quiz length (10/25/50 questions). No timer pressure. |
| 5 | **Score tracking and results display** | After each quiz/exam, users need to see: score, time spent, per-section breakdown, which questions they got wrong. Basic accountability. | Low | End-of-quiz summary screen. Show percentage by section. Highlight missed questions with explanations. |
| 6 | **Mobile-responsive design** | SIE candidates study on commutes, breaks, waiting rooms. Multiple Reddit users specifically mention studying on phones. Non-responsive = unusable for a large chunk of study time. | Low | Standard responsive CSS. Touch-friendly tap targets. Readable text without zooming. |
| 7 | **Progress persistence (localStorage)** | Users study across multiple sessions over weeks. Losing progress is a dealbreaker. Even free sites track basic completion. | Low | localStorage for: questions answered, scores per session, bookmarked questions, current quiz state. No backend needed. |
| 8 | **Question review mode (review wrong answers)** | After completing a quiz, users must be able to review only the questions they got wrong with full explanations. Every competitor offers this. Core to the learning feedback loop. | Low | Filter completed quiz results to show only incorrect answers. Show user's selected answer vs correct answer with explanation. |
| 9 | **Source attribution** | Legal necessity (copyright respect) and credibility signal. Users want to know where questions come from. PROJECT.md explicitly requires attributing sources. | Low | Tag each question with source. Display source on question detail. Link to original where available. |

---

## Differentiators

Features that set this project apart from both free alternatives and paid competitors. Not expected, but valued -- and feasible for a static site.

| # | Feature | Value Proposition | Complexity | Notes |
|---|---------|-------------------|------------|-------|
| 1 | **Spaced repetition engine (SM-2 algorithm)** | No free SIE prep site implements spaced repetition. Even most paid competitors use simpler adaptive systems. SM-2 is well-understood, has JavaScript implementations (ts-fsrs, dolphinsr, spaced-repetition.js on npm), and runs entirely client-side. Schedules review of questions at optimal intervals before forgetting occurs. | Medium | Use a lightweight SM-2 implementation. Store per-question ease factor, interval, and next-review date in localStorage. "Daily Review" mode surfaces due cards. This is the single biggest differentiator for a free static site. |
| 2 | **Interleaved practice mode** | Research shows interleaving (mixing topics within a practice session) improves test performance by up to 43% vs blocked practice (Rohrer & Taylor, 2007). No free SIE site offers this. Most paid sites default to blocked practice. | Low | Simple: when generating a quiz, randomly shuffle questions across all 4 sections weighted by FINRA percentages instead of grouping by topic. Toggle between "Topic Focus" and "Interleaved" modes. |
| 3 | **Confidence-based self-assessment per question** | Before revealing the answer, ask "How confident are you?" (High/Medium/Low/Guess). This metacognitive exercise helps users calibrate what they actually know vs think they know. Feeds into spaced repetition scheduling. Medical exam prep (AMBOSS) uses this effectively. | Low | 4-button confidence selector shown after answer selection but before reveal. Store confidence + correctness to identify "confidently wrong" (dangerous) vs "unconfidently right" (needs reinforcement) patterns. |
| 4 | **Readiness score / exam prediction** | Kaplan has "ReadySCORE" and Achievable has visual mastery tracking. A simple version: aggregate recent performance across sections weighted by FINRA percentages to predict "You'd score approximately X% today." Tells users when they're ready to schedule the exam. | Medium | Calculate weighted average of recent performance (last 100 questions) across sections. Show as a simple gauge: <70% = "Keep studying", 70-80% = "Getting close", >80% = "You're likely ready." Update after every quiz. |
| 5 | **Flashcard mode with active recall** | Brainscape specifically offers SIE flashcards. Having flashcards for key terms, formulas, and concepts as a separate study mode (not just questions) supports active recall. Flip-to-reveal interaction. | Low | Separate data set: term/concept cards (not full exam questions). Tap to flip. Can integrate with spaced repetition engine. Mark as "Know it" / "Still learning." |
| 6 | **Per-section strength heatmap** | Visual dashboard showing mastery level per sub-topic across all 4 FINRA sections. Color-coded (red/yellow/green). At a glance, users see exactly where to focus. Achievable does this with progress blocks. Kaplan has Performance Tracker. | Medium | Aggregate question performance data per sub-topic. Render as a color-coded grid or treemap. Sub-topic size proportional to FINRA weight. Updates as user studies. |
| 7 | **Study streak / session tracking** | Duolingo proved streaks drive consistency. For exam prep, a simple "X days in a row" counter with a calendar heatmap (like GitHub contributions) motivates daily practice. Low effort, high engagement. | Low | Store study dates in localStorage. Show current streak, longest streak, and a contribution-style calendar. No gamification overkill -- just the streak. |
| 8 | **Offline-capable PWA** | No SIE prep site works offline. As a static site, this is uniquely achievable with a service worker. Users can study on planes, subways, anywhere without connectivity. Perfect for the "study on commute" use case. | Medium | Service worker to cache all static assets + question data. Manifest.json for installability. All data is already client-side JSON, so offline is natural. |
| 9 | **Dark mode** | Quality-of-life feature for late-night studying. AMBOSS, Quizlet, and most modern study apps offer this. Shows polish and care for UX. | Low | CSS custom properties with a toggle. Respect prefers-color-scheme. Persist preference in localStorage. |
| 10 | **Question bookmarking / "Study Later" list** | Let users flag specific questions to revisit. Useful for questions they find confusing or want to discuss with a tutor. BenchPrep and AMBOSS both offer this. | Low | Heart/bookmark icon per question. Separate "Bookmarked" filter in drill mode. Stored in localStorage. |
| 11 | **Export/share study progress** | Let users export their stats (JSON download or shareable summary). Useful for accountability partners or tutors tracking a student's readiness. No free site offers this. | Low | "Export Progress" button that downloads localStorage data as JSON. Optional: generate a shareable text summary of readiness scores. |
| 12 | **Keyboard shortcuts for power users** | 1/2/3/4 to select answer, Enter to submit, N for next, P for previous, F to flag. Speed up practice sessions significantly for desktop users. | Low | Simple keydown event listeners. Show shortcut hints in UI. |

---

## Anti-Features

Features to deliberately NOT build. Each represents a trap that would add complexity without proportional value, violate the static-site constraint, or drift from the core value proposition.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **User accounts / authentication** | Requires a backend. Adds friction to starting. Privacy concerns. The project is explicitly out-of-scope for auth per PROJECT.md. | localStorage handles all personalization. Optional JSON export for backup/portability. |
| **AI-generated questions** | Quality control is impossible at scale. SIE questions require precise regulatory knowledge. Hallucinated wrong answers could teach incorrect information. PROJECT.md explicitly scopes this out for v1. | Curate questions from verified public sources. Quality over quantity. |
| **Leaderboards / social features** | Requires a backend for shared state. Exam prep is personal, not competitive. Reddit SIE communities show zero demand for competitive features. PROJECT.md scopes this out. | Study streaks provide self-motivation without social comparison. |
| **Video lectures / content creation** | Massive content production effort. YouTube already has excellent free SIE content (Kaplan, Dean Tinney, Capital Advantage Tutoring). Building video is not the project's value prop. | Link out to best free YouTube content per topic. Curate, don't create. |
| **Payment / premium tiers** | This is a free resource. Adding paywalls defeats the entire value proposition of being the comprehensive free alternative. | Stay free. Accept GitHub stars as currency. |
| **Native mobile app** | App store approval, two codebases, no added value over PWA. PROJECT.md explicitly excludes this. | PWA with service worker gives installability + offline without app store overhead. |
| **Real-time chat / forums** | Backend requirement. Reddit r/Series7 and Wall Street Oasis already serve this need. | Link to existing communities. |
| **Overly complex gamification (badges, XP, levels, avatars)** | Feature bloat that distracts from studying. The target user is an adult professional preparing for a career exam, not a child learning vocabulary. | Study streaks + readiness score provide motivation without infantilizing the user. |
| **Adaptive difficulty (question selection AI)** | True adaptive learning (like Achievable's engine) requires sophisticated ML models and large datasets. A static site can't run this meaningfully. Half-baked adaptive is worse than honest random. | Spaced repetition (SM-2) provides genuine personalization without pretending to be AI. Confidence rating + wrong-answer tracking achieve 80% of adaptive's value. |
| **Exam scheduling integration / FINRA account linking** | Way out of scope. Security liability. No API exists for this. | Simple "You're ready" readiness indicator. Link to FINRA's scheduling page. |
| **Print-friendly study guides / PDF export** | Content licensing concerns. Better served by existing free resources (STC free study guide, FINRA content outline). Not the site's value prop. | Link to STC's free PDF study guide and FINRA's content outline. |

---

## Feature Dependencies

```
Question Data (JSON) ──────────────────────────────> ALL features depend on this
    |
    ├── Multiple Choice Engine ──────────────────── Quiz Mode, Exam Mode, Drill Mode
    |       |
    |       ├── Answer Explanations ──────────────── Review Mode
    |       |
    |       ├── Score Calculation ────────────────── Results Display
    |       |       |
    |       |       └── Per-Section Aggregation ──── Readiness Score, Strength Heatmap
    |       |
    |       ├── Timer Component ──────────────────── Exam Mode (only)
    |       |
    |       └── Confidence Rating ────────────────── Spaced Repetition (quality signal)
    |
    ├── localStorage Persistence Layer ──────────── Progress Tracking, Streaks, Bookmarks
    |       |
    |       ├── Spaced Repetition Engine ─────────── Daily Review Mode
    |       |
    |       └── Export/Import ────────────────────── Progress Portability
    |
    ├── Flashcard Data (separate from questions) ── Flashcard Mode
    |       |
    |       └── Spaced Repetition Engine ─────────── Flashcard Scheduling
    |
    └── Service Worker + Manifest ────────────────── PWA / Offline Mode
```

**Critical path:** Question Data JSON --> Multiple Choice Engine --> Score Calculation --> localStorage --> Everything else.

The spaced repetition engine depends on both the persistence layer AND either confidence rating or simple correct/incorrect signals. It should be built after the basic quiz flow works.

---

## MVP Recommendation

**Phase 1 -- Core Quiz Engine (ship fast, validate value):**

1. Question data in structured JSON (with section/topic tags, source attribution, explanations)
2. Topic-based drill mode (filter by section, configurable length)
3. Timed exam mode (75 questions, 105 minutes, FINRA-weighted distribution)
4. Detailed explanations for correct AND incorrect answers
5. Score display with per-section breakdown
6. Mobile-responsive layout
7. localStorage progress persistence
8. Wrong-answer review mode

**Phase 2 -- Learning Science Features (the differentiator):**

1. Spaced repetition engine (SM-2) with daily review mode
2. Confidence-based self-assessment per question
3. Interleaved practice mode toggle
4. Flashcard mode for key terms/concepts
5. Question bookmarking

**Phase 3 -- Polish and Engagement:**

1. Readiness score / exam prediction gauge
2. Per-section strength heatmap
3. Study streak tracker with calendar heatmap
4. Dark mode
5. Keyboard shortcuts
6. PWA with offline support
7. Export/import progress

**Defer indefinitely:** Video content, social features, adaptive AI, payment, native apps.

### Rationale

Phase 1 delivers a complete, usable study tool that already beats every free alternative (which lack organized topic drilling, comprehensive explanations, or timed exam simulation). Phase 2 adds the learning science features that no free site has -- this is where the project becomes genuinely differentiated. Phase 3 is polish that increases retention and satisfaction but isn't required for the core study experience.

The question data JSON is the foundational asset. Its quality (especially explanation depth) determines whether the site is useful or just another question dump. Building the quiz engine first validates the data quality before investing in advanced features.

---

## Sources

- [FINRA SIE Exam Official Page](https://www.finra.org/registration-exams-ce/qualification-exams/securities-industry-essentials-exam) - Exam format, content outline, official practice test
- [FINRA SIE Content Outline 2025 (PDF)](https://www.finra.org/sites/default/files/2025-10/SIE_Content_Outline.pdf) - Section weights and sub-topics
- [OpenExamPrep SIE Course Rankings 2026](https://open-exam-prep.com/blog/best-sie-exam-prep-courses-2026) - Competitor feature comparison
- [Achievable SIE Best Courses Comparison](https://achievable.me/exams/finra-sie/best-courses/) - Detailed provider comparison matrix
- [Achievable SIE Prep](https://achievable.me/exams/finra-sie/prepare/) - Adaptive learning engine details
- [The Achievable Method](https://app.achievable.me/study/achievable/learn/the-achievable-method) - Spaced repetition implementation details
- [Kaplan SIE Study Materials](https://www.kaplanfinancial.com/securities/securities-industry-essentials-sie/study-materials) - QBank, Performance Tracker features
- [Knopman Marks SIE Prep](https://knopman.com/sie-securities-industry-essentials-exam-prep) - Study tool tiers, Video Vault
- [PassPerfect SIE](https://www.passperfect.com/sie) - Practice question volume, audio tutorials
- [STC SIE Study Guide](https://www.stcusa.com/resource-center/sie-exam/best-sie-exam-prep-courses/) - Greenlight exam, modular pricing
- [ExamFX vs Kaplan Comparison](https://testprepinsight.com/comparisons/examfx-vs-kaplan/) - Feature and pricing comparison
- [Brainscape SIE Flashcards](https://www.brainscape.com/learn/sie-exam) - Confidence-based repetition for SIE
- [SM-2 Algorithm (Anki FAQ)](https://faqs.ankiweb.net/what-spaced-repetition-algorithm) - Spaced repetition algorithm details
- [spaced-repetition.js (GitHub)](https://github.com/sunyata2022/spaced-repetition.js) - JavaScript SM-2 implementation
- [DolphinSR (GitHub)](https://github.com/yodaiken/dolphinsr) - Anki-style SM-2 in JavaScript
- [Rohrer & Taylor 2007 on Interleaving](https://www.spacedrevision.com/) - 43% improvement from interleaved practice
- [Achievable Reddit SIE Tips](https://achievable.me/exams/finra-sie/resources/sie-study-guide/) - Community study strategies
- [AMBOSS Study Mode Features](https://support.amboss.com/hc/en-us/articles/360036038991-Using-Study-Mode-Exam-Mode) - Confidence rating, dark mode, annotations
- [BenchPrep Bookmarking](https://support.benchprep.com/kb/article/1548-can-i-bookmark-or-pin-an-exam-question/) - Question bookmarking UX patterns
- [Confidence-Based Testing (InteDashboard)](https://www.blog.intedashboard.com/blogs/tbl-learning/confidence-based-testing) - Metacognitive assessment research
