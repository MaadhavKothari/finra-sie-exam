# FINRA SIE Exam Practice

## Project

Static FINRA SIE exam practice site with comprehensive question bank, timed exams, and learning science features. Deployed on GitHub Pages.

## Stack

- **Astro 6** — Static site generator with islands architecture
- **Preact** — Lightweight UI for interactive islands (3KB vs React's 40KB)
- **Nanostores** — Cross-island state management
- **Tailwind CSS 4** — Utility-first responsive styling
- **TypeScript** — Type safety with Zod schema validation
- **Vitest** — Unit testing

## Architecture

- `src/pages/` — Astro static pages (file-based routing)
- `src/components/` — Preact islands (ExamEngine, DrillEngine, FlashcardDeck, ProgressDashboard)
- `src/stores/` — Nanostores (examStore, progressStore, settingsStore)
- `src/lib/` — Pure logic (scoring, spacedRepetition, examGenerator, timer, storage)
- `src/content/questions/` — Question JSON data with Zod schema validation

## Commands

```bash
npm run dev      # Development server
npm run build    # Build (validates question schema)
npm run preview  # Preview production build
```

## Planning

See `.planning/` for roadmap, requirements, and research artifacts.
