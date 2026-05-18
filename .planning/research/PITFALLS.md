# Domain Pitfalls

**Domain:** FINRA SIE Exam Static Study Site (Question Aggregation + GitHub Pages)
**Researched:** 2026-05-17

---

## Critical Pitfalls

Mistakes that cause legal exposure, project failure, or painful rewrites.

---

### Pitfall 1: Copyright Infringement from Scraping Proprietary Question Banks

**What goes wrong:** Scraping questions from Kaplan, STC, Knopman Marks, ExamFX, Pass Perfect, or other paid test prep providers constitutes copyright infringement. These companies invest heavily in creating original question content and vigorously protect it. Barkley & Associates sued Quizlet in July 2024 for hosting their proprietary test prep content, seeking $1M+ in statutory damages. Quizlet faced accusations that their platform's unauthorized copies outranked the original provider in search results. Statutory damages for willful copyright infringement can reach $150,000 per individual work.

**Why it happens:** The project description mentions aggregating from "Kaplan, STC, Knopman, ExamFX, Pass Perfect, etc." These are commercial products. Even if individual questions are freely visible on demo pages or sample exams, the specific expression of exam questions (wording, answer choices, explanations) is copyrightable. "Publicly available" does not mean "free to reproduce." A question visible on a website is still protected by copyright.

**Consequences:**
- DMCA takedown notices to GitHub, which could take down the entire repository
- GitHub may suspend or terminate accounts for repeat DMCA violations
- Legal liability: $750-$150,000 per infringed work in statutory damages
- Reputational damage if the project is ever made public

**Prevention:**
- Only use genuinely public domain or openly licensed content
- FINRA's own practice test (75 questions) is the only safe official source -- FINRA publishes this as a free public resource
- Write original questions inspired by the SIE content outline topics, rather than copying existing questions verbatim
- Use Claude or other AI to generate original practice questions based on the FINRA content outline (the outline topics themselves are factual and not copyrightable; specific question wording is)
- If using any third-party content, get explicit written permission
- Add clear attribution and source tracking to every question in your data model so you know exactly where each question originated
- Never store scraped commercial content in a git repo, even a private one

**Detection (warning signs):**
- Any question that reads identically to a commercial provider's question
- Scraping scripts targeting login-gated or paywalled content
- Absence of a `source` field in the question data model

**Phase relevance:** Must be addressed in Phase 1 (content strategy) before any content is created. This is a go/no-go decision that shapes the entire project.

**Confidence:** HIGH -- based on Barkley v. Quizlet (2024), DMCA law, copyright precedent.

---

### Pitfall 2: GitHub Pages Deployment Blocked for Private Repos on Free Plan

**What goes wrong:** GitHub Pages is only available for public repositories on the free personal plan. The project specifies "private repo initially" with GitHub Pages deployment. This combination does not work without a paid plan (GitHub Pro at $4/month, or GitHub Team).

**Why it happens:** GitHub restricts Pages to public repos on the free tier. Many developers assume GitHub Pages works universally.

**Consequences:**
- Deploy step fails immediately
- Forces either making the repo public (exposing all code and question data) or paying for GitHub Pro
- If question data contains any scraped proprietary content, making the repo public amplifies the copyright risk from Pitfall 1

**Prevention:**
- Option A: Use GitHub Pro ($4/month) -- enables Pages from private repos
- Option B: Use a two-repo strategy -- private repo for source code, public repo (e.g., `username.github.io`) for built output only, deployed via GitHub Actions
- Option C: Start with a public repo from day one (acceptable if all content is original/properly licensed)
- Option D: Use Cloudflare Pages or Netlify (both offer free static hosting from private repos)

**Detection:**
- First deploy attempt to Pages from a private repo on free plan will fail
- Check GitHub plan status before beginning infrastructure setup

**Phase relevance:** Must be decided in Phase 1 (infrastructure setup). Affects CI/CD design and repo structure.

**Confidence:** HIGH -- verified via GitHub official documentation.

---

### Pitfall 3: Stale Content After FINRA Rule Changes

**What goes wrong:** FINRA periodically updates its exam content outline, regulatory rules, and the securities regulatory landscape evolves (new SEC rules, crypto asset guidance, Reg BI enforcement). Practice questions become outdated and teach incorrect information. A student studying with outdated questions could learn wrong answers and fail the real exam.

**Why it happens:** Static sites have no automatic content update mechanism. Once deployed, content stays frozen. FINRA's regulatory environment changes continuously:
- October 2025: FINRA reduced unscored questions from 10 to 5 (structural, not content)
- FINRA's 2026 Regulatory Oversight Report added focus on crypto/digital asset custody, AI/cybersecurity, and Reg BI compliance
- SEC and FINRA regularly issue new rules, regulatory notices, and interpretive guidance
- The SIE content outline itself is updated periodically (the 2024 and 2025 outlines differ in pretest structure)
- Specific evolving areas: cryptocurrency/digital asset regulation, Regulation Best Interest enforcement details, cybersecurity requirements, ESG disclosure rules

**Consequences:**
- Students learn outdated rules and fail the real exam
- Credibility of the study tool is destroyed
- Questions about regulatory percentages, specific rules, or compliance requirements become wrong over time

**Prevention:**
- Add a `lastVerified` date field to every question in the data model
- Add a `regulatoryBasis` field linking questions to specific FINRA rules/regulatory notices
- Build a "content freshness" dashboard showing questions by last-verified date
- Subscribe to FINRA's email alerts and RSS for regulatory notices
- Schedule quarterly content reviews (mark on calendar)
- Display a visible "Content last updated: [date]" banner on the site
- Tag questions by FINRA content outline section so updates can be targeted
- Prioritize evergreen conceptual questions over questions about specific numerical thresholds or rule details that change

**Detection:**
- No `lastVerified` field in question schema
- Questions referencing specific regulatory notice numbers without version tracking
- User reports of wrong answers (need a feedback mechanism)

**Phase relevance:** Data model design (Phase 1), content creation (Phase 2), ongoing maintenance (post-launch).

**Confidence:** HIGH -- FINRA publishes content outline updates; the 2026 Regulatory Oversight Report confirms active regulatory evolution in crypto, AI, and Reg BI.

---

### Pitfall 4: Data Model That Makes Content Updates Painful

**What goes wrong:** Questions are stored in a flat, unstructured format (e.g., a single massive JSON array) without proper indexing, tagging, or versioning. Adding new questions, updating existing ones, correcting errors, or reorganizing by topic becomes a manual, error-prone process that discourages maintenance.

**Why it happens:** Developers build the simplest possible data structure to ship quickly, then never revisit it. A flat `questions.json` file with sequential IDs works for 50 questions but becomes unmanageable at 500+.

**Consequences:**
- Content updates require editing monolithic files, leading to merge conflicts
- No way to track which questions have been reviewed, updated, or deprecated
- Cannot easily filter by topic, difficulty, source, or status
- Reordering or reorganizing requires touching every question
- No way to A/B test question quality or retire bad questions

**Prevention:**
Design the question schema with these fields from day one:

```json
{
  "id": "uuid-v4",
  "question": "...",
  "choices": [
    { "id": "a", "text": "...", "isCorrect": false },
    { "id": "b", "text": "...", "isCorrect": true }
  ],
  "explanation": {
    "correct": "Why B is right...",
    "distractors": {
      "a": "Why A is wrong...",
      "c": "Why C is wrong...",
      "d": "Why D is wrong..."
    }
  },
  "metadata": {
    "section": 2,
    "sectionName": "Understanding Products and Their Risks",
    "topics": ["municipal-bonds", "taxation"],
    "difficulty": "medium",
    "source": "original",
    "sourceDetail": "Based on FINRA Content Outline Section 2.1.3",
    "regulatoryBasis": "MSRB Rule G-37",
    "created": "2026-05-17",
    "lastVerified": "2026-05-17",
    "status": "active",
    "version": 1
  }
}
```

Key principles:
- Use UUIDs, not sequential IDs (avoids conflicts when adding questions)
- Organize questions into separate files per topic/section (not one giant file)
- Include full metadata from the start -- adding fields later requires migrating all existing content
- Include a build step that assembles individual question files into the deployed bundle
- Track question status: `draft`, `active`, `deprecated`, `needs-review`

**Detection:**
- Questions lack unique stable IDs
- No topic/section tagging
- All questions in a single file
- No `source` or `lastVerified` fields

**Phase relevance:** Must be locked in during Phase 1 (data model design). Retrofitting metadata onto hundreds of questions is extremely painful.

**Confidence:** HIGH -- standard software engineering; confirmed by Moodle quiz database structure documentation and JSON quiz specification patterns.

---

## Moderate Pitfalls

---

### Pitfall 5: localStorage Data Loss and Quota Limits

**What goes wrong:** User progress tracking stored in localStorage is lost when users clear browser data, switch browsers, switch devices, or use private/incognito browsing. localStorage in private browsing mode is treated like sessionStorage -- all data is wiped when the private window closes. The 5MB localStorage limit per origin can also be hit if storing detailed per-question history, timestamps, and spaced repetition intervals for hundreds of questions.

**Why it happens:** localStorage is the easiest client-side storage to implement but has fundamental limitations that developers underestimate. Users studying on mobile frequently clear browser data, use private browsing, or switch between phone and laptop.

**Consequences:**
- Student loses weeks of progress tracking with no recovery option
- Spaced repetition intervals reset, making the algorithm useless
- Frustration drives users to abandon the tool
- On mobile Safari, the OS can evict localStorage data under storage pressure

**Prevention:**
- Use localStorage for simple state (current quiz position, UI preferences) but IndexedDB for progress data (supports structured data, async API, much larger quota -- typically hundreds of MB to GB)
- Implement an export/import feature: let users download their progress as a JSON file and re-import it. This costs nothing to build and solves cross-device and data loss scenarios
- Show a clear warning on first visit: "Your progress is stored locally in this browser. Use Export to back up."
- Wrap all localStorage/IndexedDB writes in try-catch to handle QuotaExceededError gracefully
- Test in private browsing mode as part of QA
- Consider a simple "progress code" system: encode progress state into a shareable string (like a save code in old video games) that users can copy/paste between devices

**Detection:**
- No error handling around storage writes
- No export/import functionality
- No user-facing indication of where data lives
- Testing only in regular browsing mode

**Phase relevance:** Phase 2 (progress tracking feature) and Phase 3 (spaced repetition). Design the storage abstraction layer in Phase 2.

**Confidence:** HIGH -- MDN documentation confirms 5MB localStorage limit and private browsing behavior. IndexedDB support is universal in modern browsers.

---

### Pitfall 6: Poor Mobile Quiz UX

**What goes wrong:** Radio buttons and answer choices are too small to tap reliably on mobile. Timer is not visible while scrolling through longer questions. Answer choice text wraps poorly on narrow screens. The exam simulation mode (75 questions, 105 minutes) becomes unusable on mobile because navigation between questions is clunky.

**Why it happens:** Developers build and test on desktop, then add `@media` queries as an afterthought. Quiz UX has specific mobile challenges that generic responsive design does not address.

**Consequences:**
- Users accidentally select wrong answers due to small touch targets
- Timer anxiety increases when the timer scrolls out of view
- Students avoid mobile studying, defeating a core value proposition ("studying on the go")
- Long exam simulation sessions on mobile are abandoned

**Prevention:**
- Design mobile-first: minimum 44x44px touch targets (Apple HIG) / 48x48dp (Material Design) for all interactive elements
- Make answer choices full-width tappable cards, not small radio buttons with labels
- Use a sticky/fixed timer bar during timed exam mode
- Implement swipe navigation between questions in exam mode
- Test on actual mobile devices (not just browser dev tools responsive mode)
- Use large, readable fonts (minimum 16px body text to prevent iOS zoom)
- Ensure question text and answer choices are readable without horizontal scrolling
- Add clear visual feedback (color change, animation) on answer selection

**Detection:**
- Touch targets smaller than 44px
- Timer not visible while scrolling
- No mobile-specific interaction patterns (swipe, sticky elements)
- Only tested with browser devtools "responsive" mode

**Phase relevance:** Phase 2 (UI/UX design). Must be part of the initial design system, not retrofitted.

**Confidence:** MEDIUM -- based on quiz app UX best practices, Apple/Google accessibility guidelines, and common patterns in existing exam prep sites.

---

### Pitfall 7: Accessibility Failures in Quiz Interface

**What goes wrong:** Screen reader users cannot navigate questions, hear answer choices, or understand which answer is selected. Keyboard-only users cannot tab through answers or submit responses. Color-coded feedback (green=correct, red=wrong) is invisible to colorblind users. Timer countdown has no screen reader announcement.

**Why it happens:** Accessibility is treated as an afterthought or "nice to have" for a personal study tool. Quiz interfaces have unique accessibility challenges (radio groups, live timers, dynamic feedback) that standard HTML alone does not handle.

**Consequences:**
- Excludes users with disabilities
- If the site is ever made public, inaccessible educational content may face legal scrutiny (ADA, Section 508)
- Poor semantic HTML also hurts SEO and general usability

**Prevention:**
- Use semantic HTML: `<fieldset>` and `<legend>` for question groups, proper `<label>` elements for radio buttons
- Use `role="radiogroup"` and `aria-labelledby` for answer choice groups
- Announce timer updates to screen readers with `aria-live="polite"` (not every second -- every 5 minutes, then every minute in last 5 minutes)
- Use both color AND icons/text for correct/incorrect feedback (checkmark + green, X + red)
- Ensure all interactive elements are keyboard accessible (Tab, Enter, Space, Arrow keys)
- Test with VoiceOver (macOS/iOS) during development
- Add skip-navigation links for exam mode

**Detection:**
- No `aria-*` attributes in quiz markup
- Answer feedback uses color only
- Cannot complete a full quiz using only keyboard
- Timer has no screen reader announcements

**Phase relevance:** Phase 2 (UI development). Build accessible patterns from the start; retrofitting ARIA into an existing quiz interface is significantly harder.

**Confidence:** MEDIUM -- based on WCAG 2.1 AA guidelines and W3C WAI quiz accessibility patterns.

---

### Pitfall 8: Bundle Size Bloat from Inlined Question Data

**What goes wrong:** All question data (potentially 500-1000+ questions with full explanations) is bundled into the initial JavaScript payload. This creates a multi-megabyte initial load that is slow on mobile connections and wastes bandwidth for users who only want to study one topic.

**Why it happens:** The simplest approach is to import all questions into a single JS bundle. For a "static site," developers often think "no API = everything in one file."

**Consequences:**
- 500 questions with full explanations could easily reach 2-5MB of JSON data
- Initial page load becomes slow, especially on mobile networks
- GitHub Pages has a soft 100GB/month bandwidth limit; large bundles accelerate hitting this
- Users who only want to drill one topic still download all questions

**Prevention:**
- Split question data by section/topic into separate JSON files
- Use dynamic `import()` or `fetch()` to load question data on demand (code splitting)
- Only load questions for the section/mode the user selects
- Use a build step that generates per-topic JSON bundles from source question files
- Compress JSON data: remove whitespace, consider abbreviating repeated field names
- Consider pre-gzip/brotli compression in the build step (GitHub Pages serves with compression if the CDN supports it)
- Monitor bundle sizes in CI with a size budget

**Detection:**
- Single JavaScript file > 500KB
- All questions loaded on initial page visit
- No code splitting or lazy loading of question data
- No build-time size monitoring

**Phase relevance:** Phase 1 (build system and data architecture). The split must be designed into the data loading architecture, not bolted on later.

**Confidence:** HIGH -- GitHub Pages limits documented; JSON payload size math is straightforward.

---

## Minor Pitfalls

---

### Pitfall 9: Incorrect Spaced Repetition Implementation

**What goes wrong:** Implementing SM-2 (the classic Anki algorithm) without understanding its known failure modes: "ease hell" (cards get stuck at low intervals after repeated failures), aggressive overdue card scheduling (overshoots by 12-25% for overdue cards), and interval rounding that can freeze card progression.

**Why it happens:** Developers copy the SM-2 algorithm from a blog post without understanding the refinements that Anki itself applies (minimum interval floors, fuzzing, ease factor floors, modified handling of lapses).

**Consequences:**
- Students see the same "hard" cards every day without meaningful spacing
- Students who take a break from studying return to find all cards rescheduled too aggressively
- Algorithm feels punishing rather than helpful, driving abandonment

**Prevention:**
- For a v1, use a simpler "Leitner box" system (5 boxes with fixed intervals: 1 day, 3 days, 7 days, 14 days, 30 days) rather than full SM-2
- If implementing SM-2, include Anki's refinements: ease factor floor of 1.3, interval fuzzing (random +/- 5-10%), minimum 1-day interval increase, and separate handling for learning vs. review cards
- Add a "reset card" option so users can manually fix stuck cards
- Log algorithm state to make debugging possible (store ease factor, interval, review count per card)

**Detection:**
- Cards stuck at 1-day intervals despite correct answers
- No randomness in scheduling (all reviews bunch on same days)
- No configurable parameters for the algorithm

**Phase relevance:** Phase 3 (spaced repetition feature). Keep Phase 2 progress tracking simple (completed/not-completed per question) and add spaced repetition as a separate concern.

**Confidence:** MEDIUM -- based on Anki documentation and SM-2 algorithm analysis blog posts.

---

### Pitfall 10: No Content Validation or Quality Assurance Pipeline

**What goes wrong:** Questions ship with factual errors, ambiguous wording, multiple correct answers, or no correct answer. Explanations contradict the marked correct answer. Topic tags are wrong.

**Why it happens:** When questions are authored quickly (especially if AI-generated), there is no review step. A single author working alone has no one to catch errors.

**Consequences:**
- Students learn incorrect information
- Trust in the tool is destroyed -- one clearly wrong answer makes users question all answers
- Debugging which questions are wrong requires reviewing every single question

**Prevention:**
- Build a validation script that runs at build time:
  - Every question has exactly one correct answer
  - Every question has exactly 4 choices
  - Every question has an explanation
  - Every question has required metadata fields (section, topics, difficulty, source)
  - No duplicate question IDs
  - No empty/null fields
- If using AI to generate questions, implement a two-pass review: generate, then have a separate AI pass (or manual review) verify accuracy
- Add a "Report an error" link on every question that creates a GitHub Issue
- Track error reports per question and auto-flag questions with multiple reports

**Detection:**
- No build-time validation of question data
- No way for users to report errors
- Questions authored in bulk without review

**Phase relevance:** Phase 1 (build pipeline) for validation scripts. Phase 2 (UI) for error reporting. Ongoing for content review.

**Confidence:** HIGH -- straightforward engineering practice.

---

### Pitfall 11: Flashcard Mode Lacks Active Recall Design

**What goes wrong:** Flashcard mode shows question on front, answer on back, and the user flips. No self-assessment step. No way to mark "I got this right" vs. "I got this wrong." Just passive reading disguised as active learning.

**Why it happens:** Flashcard UI seems simple: show front, click to flip, show back. But without a self-assessment mechanism, it becomes passive review rather than active recall -- the opposite of what learning science recommends.

**Consequences:**
- Users feel like they are studying but retain less than with the quiz modes
- No data on which concepts the user struggles with
- Defeats the project's stated goal of "evidence-based study methods"

**Prevention:**
- After flipping the card, require the user to self-assess: "Got it" / "Didn't get it" (minimum) or a 1-4 confidence scale
- Track self-assessment responses to drive spaced repetition scheduling
- Consider showing the question and having the user mentally answer BEFORE flipping -- add a "Reveal Answer" button rather than auto-flipping
- Integrate flashcard performance with the same progress tracking as quiz mode

**Detection:**
- Flashcard mode has no self-assessment buttons
- Flashcard progress is not tracked
- Flashcards auto-flip or have no deliberate "commit to an answer" step

**Phase relevance:** Phase 2 (flashcard mode design). Design the interaction pattern before building the UI.

**Confidence:** MEDIUM -- based on spaced repetition and active recall learning science literature.

---

### Pitfall 12: GitHub Pages Repo Size Creep

**What goes wrong:** The published GitHub Pages site exceeds the 1GB recommended limit over time as question data grows, images/diagrams are added, or build artifacts accumulate.

**Why it happens:** Question data with full explanations grows linearly. If diagrams, charts, or regulatory document excerpts are added, the repo grows faster. Git history also accumulates.

**Consequences:**
- GitHub may throttle or disable the Pages site
- Clone/push times become slow
- Build times increase

**Prevention:**
- Monitor repo size in CI (add a check that warns above 500MB)
- Never commit build output to the source branch (use a separate `gh-pages` branch or GitHub Actions deployment)
- Optimize images (WebP, compress, lazy load)
- Keep question data as text (JSON), not as images of questions
- Use `.gitignore` to exclude build artifacts from source branch
- For the published site: use the `gh-pages` branch approach where only built output is deployed, keeping source history separate

**Detection:**
- Repo size growing faster than expected
- Build artifacts committed to main branch
- Images stored uncompressed in the repo

**Phase relevance:** Phase 1 (repo structure and CI/CD). Set up the deployment pipeline correctly from the start.

**Confidence:** HIGH -- GitHub Pages documentation states 1GB limit for published sites.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Content Strategy (Phase 1) | Copyright infringement from scraping commercial sources | Only use original content, FINRA's free practice test, and AI-generated questions based on the content outline |
| Data Model Design (Phase 1) | Flat schema without metadata | Design the full schema with all fields (source, lastVerified, topics, difficulty, status) from day one |
| Infrastructure Setup (Phase 1) | GitHub Pages private repo restriction | Decide repo visibility strategy upfront; consider two-repo pattern or GitHub Pro |
| Build Pipeline (Phase 1) | No content validation | Add build-time JSON validation for question structure and completeness |
| UI Development (Phase 2) | Poor mobile UX, accessibility gaps | Design mobile-first with 44px+ touch targets and semantic HTML/ARIA from the start |
| Progress Tracking (Phase 2) | localStorage data loss | Use IndexedDB for progress data; implement export/import from v1 |
| Exam Simulation (Phase 2) | Timer not visible on mobile, bundle size bloat | Sticky timer bar; code-split questions by topic/section |
| Spaced Repetition (Phase 3) | SM-2 "ease hell," incorrect overdue scheduling | Use Leitner boxes for v1; add SM-2 refinements only if needed |
| Content Maintenance (Ongoing) | Stale questions after FINRA rule changes | Quarterly content reviews; subscribe to FINRA regulatory notices; track `lastVerified` dates |

---

## FINRA Content Changes to Watch

These are active regulatory areas where FINRA exam content may evolve:

| Area | Status | Why It Matters |
|------|--------|---------------|
| Cryptocurrency/Digital Assets | Active regulatory focus. FINRA's 2026 Oversight Report highlights crypto custody, stablecoins (GENIUS Act), and SEC policy shifts | SIE Section 2 (Products) may add or expand digital asset coverage |
| Regulation Best Interest (Reg BI) | Ongoing enforcement focus. FINRA emphasizes firm training and compliance documentation | SIE Section 3 (Customer Accounts) questions about suitability vs. best interest may evolve |
| AI and Cybersecurity | New focus area in FINRA's 2026 Oversight Report | SIE Section 4 (Regulatory Framework) may add technology risk topics |
| ESG/Sustainable Investing | Evolving SEC disclosure rules | Not yet prominent in SIE content but may emerge |
| Exam Structure | October 2025: Unscored questions reduced from 10 to 5 (80 total items, 75 scored) | Exam simulation mode should reflect current format (75 scored + 5 unscored = 80 total, 105 minutes) |
| Content Outline Versioning | FINRA publishes annual content outlines; 2024 and 2025 outlines differ structurally | Monitor for new outline publication each fall; compare sections against current question bank |

**Monitoring strategy:** Subscribe to FINRA's "Regulatory Notices" email list and check the SIE Content Outline PDF URL quarterly for updates: `https://www.finra.org/sites/default/files/SIE_Content_Outline.pdf` (the 2025 version is at a dated URL: `2025-10/SIE_Content_Outline.pdf`).

---

## Sources

- [GitHub Pages Limits -- GitHub Docs](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits) -- HIGH confidence
- [GitHub Pages Private Repo Discussion](https://github.com/orgs/community/discussions/167331) -- HIGH confidence
- [MDN: Storage Quotas and Eviction Criteria](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) -- HIGH confidence
- [MDN: Window.localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) -- HIGH confidence
- [Quizlet Sued by Test Prep Company -- Plagiarism Today](https://www.plagiarismtoday.com/2024/07/24/quizlet-sued-by-test-prep-company/) -- HIGH confidence
- [FINRA SIE Exam Page](https://www.finra.org/registration-exams-ce/qualification-exams/securities-industry-essentials-exam) -- HIGH confidence
- [2025 FINRA SIE Content Outline (PDF)](https://www.finra.org/sites/default/files/2025-10/SIE_Content_Outline.pdf) -- HIGH confidence
- [2026 FINRA Exam Changes -- Acadio](https://acadio.com/blogs/articles/update-important-changes-to-finra-sie-series-7-series-79-exams) -- MEDIUM confidence
- [Upcoming SIE Changes -- Achievable](https://blog.achievable.me/finra/securities-industry-essentials-sie-exam/upcoming-changes-to-the-sie-series-7-79-exams/) -- MEDIUM confidence
- [ExamFX: FINRA Unscored Question Reduction](https://www.examfx.com/resources/finra-regulatory-changes-unscored-question-reduction-sie-and-series-7) -- MEDIUM confidence
- [FINRA 2026 Annual Regulatory Oversight Report](https://www.finra.org/sites/default/files/2025-12/2026-annual-regulatory-oversight-report.pdf) -- HIGH confidence
- [SM-2 Algorithm Too Aggressive on Overdue Cards](https://controlaltbackspace.org/overdue-handling/) -- MEDIUM confidence
- [Anki SM-2 Spaced Repetition Algorithm](https://help.remnote.com/en/articles/6026144-the-anki-sm-2-spaced-repetition-algorithm) -- MEDIUM confidence
- [Web Scraping Legal Guide 2025](https://mccarthylg.com/is-web-scraping-legal-a-2025-breakdown-of-what-you-need-to-know/) -- MEDIUM confidence
- [Radio Button UX Design -- Eleken](https://www.eleken.co/blog-posts/radio-button-ui) -- LOW confidence
