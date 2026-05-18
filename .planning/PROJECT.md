# FINRA SIE Exam Practice

## What This Is

A static study site for the FINRA Securities Industry Essentials (SIE) exam that aggregates practice questions from every available source — official FINRA materials, third-party question banks (Kaplan, STC, Knopman, ExamFX, Pass Perfect, etc.), and publicly available practice exams. Built for personal study but designed to be usable by anyone preparing for the SIE. Deployed on GitHub Pages (private repo initially).

## Core Value

Comprehensive, well-organized practice questions with detailed explanations — covering every SIE topic from every available source — in one free, fast, static site.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Aggregate SIE practice questions from all available public sources
- [ ] Organize questions by SIE exam topic areas (Knowledge of Capital Markets, Products & Risks, Trading/Customer Accounts, Regulatory Framework)
- [ ] Timed practice exam mode simulating real SIE conditions (75 questions, 105 minutes)
- [ ] Topic-based drill mode for focused study
- [ ] Flashcard mode with flip-to-reveal
- [ ] Detailed explanations for every question (why correct answer is right AND why wrong answers are wrong)
- [ ] Progress tracking (local storage — no backend)
- [ ] Mobile-responsive design for studying on the go
- [ ] Deploy to GitHub Pages from private repo

### Out of Scope

- Backend/server — fully static, all client-side
- User accounts/authentication — no login needed
- Payment/premium tiers — free resource
- Native mobile app — web-only, responsive design suffices
- AI-powered question generation — curated content only for v1
- Real-time multiplayer/leaderboards

## Context

- The FINRA SIE exam has 75 multiple-choice questions, 105-minute time limit, 70% passing score
- Four content areas: (1) Knowledge of Capital Markets (16%), (2) Understanding Products and Their Risks (44%), (3) Understanding Trading, Customer Accounts and Prohibited Activities (31%), (4) Overview of the Regulatory Framework (9%)
- Third-party test banks include Kaplan, Securities Training Corporation (STC), Knopman Marks, ExamFX, Pass Perfect, and various free online resources
- Learning science best practices: spaced repetition, active recall, interleaving topics, immediate feedback with explanations
- The user wants to leverage evidence-based study methods — not just a question dump
- Claude can be used as a live tutor for discussing specific questions

## Constraints

- **Hosting**: GitHub Pages (static files only, no server-side processing)
- **Data**: All question data must be embeddable in static files (JSON/JS)
- **Cost**: Free — no paid APIs or services
- **Privacy**: Private repo initially, can be made public later
- **Legal**: Must respect copyright — scrape only freely available/public domain content, attribute sources

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Static site on GitHub Pages | Free hosting, no backend complexity, fast | — Pending |
| Client-side only (no backend) | Simplicity, zero ops cost | — Pending |
| All explanations included | Learning science shows feedback is critical for retention | — Pending |
| Private repo first | Personal use initially, open later if desired | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-17 after initialization*
