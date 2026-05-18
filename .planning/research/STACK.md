# Technology Stack

**Project:** FINRA SIE Exam Practice Site
**Researched:** 2026-05-17
**Overall confidence:** HIGH

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Astro | ^6.3 | Static site generator + framework | Ships zero JS by default; islands architecture hydrates only interactive components (quiz engine, timer, flashcards). Content collections with Zod validation handle the question bank natively. First-class GitHub Pages deployment via `withastro/action@v6`. 40% faster load times and 90% less JS than Next.js for content-focused sites. Cloudflare-backed (acquired Jan 2026), active ecosystem. | HIGH |
| TypeScript | ^6.0 | Type safety | Catches question schema errors at build time. Astro has first-class TS support. Question bank benefits enormously from typed schemas -- wrong answer format caught before deploy. | HIGH |

### UI Rendering (Islands Only)

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Preact | ^10.29 | Interactive island components | 3KB gzipped vs React's 40KB. Identical API to React (hooks, JSX) but ~13x smaller. For a static study site with a few interactive islands (quiz engine, timer, flashcards), Preact is the right call -- fast hydration, tiny footprint. | HIGH |
| @astrojs/preact | ^5.1 | Astro-Preact integration | Official integration. Enables `client:load`, `client:visible`, `client:idle` hydration directives on Preact components. | HIGH |

### State Management

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| nanostores | ^1.3 | Cross-island state sharing | Astro's officially recommended state manager. 265-814 bytes. Framework-agnostic, works across islands. Stores quiz progress, current question index, timer state, selected answers. | HIGH |
| @nanostores/preact | ^1.1 | Preact bindings for nanostores | Provides `useStore()` hook for Preact components to subscribe to shared stores. | HIGH |
| localStorage (Web API) | N/A | Persistent progress tracking | Built into every browser. No library needed. nanostores wraps reads/writes; localStorage persists across sessions (scores, completed questions, study streaks). JSON.stringify/parse for serialization. | HIGH |

### Styling

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Tailwind CSS | ^4.3 | Utility-first CSS | v4 Oxide engine is significantly faster than v3. CSS-first configuration (no `tailwind.config.js` needed in v4). Scans HTML/Astro files, outputs only used classes -- tiny CSS bundles. Mobile-responsive utilities built in (`sm:`, `md:`, `lg:`). De facto standard for utility CSS in 2026. | HIGH |
| @tailwindcss/typography | ^0.5 | Prose styling for explanations | Question explanations need readable, formatted text. Typography plugin provides `prose` class for beautiful default text styling without manual CSS. | HIGH |

### Question Data Layer

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Astro Content Collections | (built-in) | Question bank data management | Define question schema with Zod, store questions as JSON files in `src/content/questions/`. Build-time validation catches malformed questions. `getCollection()` API for querying by topic, difficulty, source. Type-safe throughout. | HIGH |
| Zod | (bundled with Astro) | Schema validation | Validates every question at build time: correct answer exists, all 4 options present, explanation not empty, topic is valid enum. Errors surface during `astro build`, not at runtime. | HIGH |

### Build & Dev Tools

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Vite | (bundled, ^8.0) | Dev server + bundler | Bundled with Astro 6. Sub-second HMR, native ESM, optimized production builds. No separate config needed. | HIGH |
| Node.js | ^22 LTS | Runtime for build | Current LTS. Required by Astro. | HIGH |

### Testing

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Vitest | ^4.1 | Unit + integration tests | Shares Vite config (zero extra setup with Astro). 5-10x faster than Jest. Test quiz logic: scoring, timer calculations, question randomization, progress persistence. | HIGH |
| Playwright | ^1.60 | End-to-end tests | Test critical flows: complete a timed exam, flip flashcards, verify progress saves across page reloads. Chromium + Firefox + WebKit. Only need 10-15 E2E tests for this project's scope. | MEDIUM |

### Deployment

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| GitHub Actions | N/A | CI/CD pipeline | Official `withastro/action@v6` handles build + deploy. Push to main = auto-deploy. Free for private repos (2,000 min/month). | HIGH |
| GitHub Pages | N/A | Static hosting | Free. Supports custom domains. Built-in CDN. Perfect for a static study site with no backend requirements. | HIGH |

## Architecture Decision: Why Astro Over Alternatives

### Why NOT Next.js
- **Overkill for static-only.** Next.js is a full-stack framework (SSR, API routes, middleware). This project has zero server-side needs.
- **Heavier output.** Even with `output: 'export'`, Next.js ships a React runtime (~40KB min) on every page. Astro ships zero JS for static pages.
- **GitHub Pages deployment** is a second-class citizen in Next.js (requires manual config) vs first-class in Astro.

### Why NOT Hugo
- **No interactive components.** Hugo generates HTML but has no island hydration story. Quiz interactivity would require bolting on a separate JS framework.
- **Go templating** is harder to work with than JSX/TSX for interactive UI logic.

### Why NOT Vanilla HTML/JS
- **No build-time validation.** Question bank errors only surface at runtime.
- **No component model.** Repeated UI patterns (question cards, answer buttons, timer display) would be copy-pasted HTML.
- **No content collections.** Manual JSON loading, no schema enforcement.
- **Could work** for a simple project, but the question bank's size (hundreds of questions) and structured data needs push toward a framework with content management.

### Why NOT Eleventy (11ty)
- **Weaker interactivity story.** Like Hugo, 11ty is primarily a template engine. No built-in island architecture.
- **Smaller ecosystem** for interactive components compared to Astro.

### Why Preact Over React
- **13x smaller** (3KB vs 40KB gzipped). For islands that are hydrated on a mostly-static page, bundle size matters.
- **Same API.** Hooks, JSX, context -- all identical. No learning curve if you know React.
- **Recommended by Astro docs** as the lightweight React alternative for islands.

### Why nanostores Over Zustand/Jotai
- **Astro's official recommendation.** Documented in Astro's "Share state between islands" recipe.
- **Framework-agnostic.** Works with Preact, React, Vue, Svelte, or vanilla JS. If you later swap island framework, stores still work.
- **Tiny.** 265-814 bytes. Zustand is ~1KB, Jotai ~2KB -- fine sizes, but nanostores is purpose-built for the islands pattern.

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Framework | Astro 6 | Next.js 15 | Overkill; ships unnecessary React runtime; SSR/API routes unused |
| Framework | Astro 6 | Hugo | No interactive component story; Go templating awkward for UI |
| Framework | Astro 6 | Eleventy | Weaker interactivity; no islands architecture |
| Framework | Astro 6 | Vanilla HTML/JS | No build-time validation, no content collections, no component model |
| UI Library | Preact | React | 13x larger; no benefit for simple interactive islands |
| UI Library | Preact | Solid.js | Smaller community; Preact's React-compatible API is more portable |
| State | nanostores | Zustand | Not framework-agnostic; heavier; not Astro's recommendation |
| State | nanostores | Signals (Preact) | Only works within Preact; nanostores works across any island framework |
| CSS | Tailwind 4 | Bootstrap 5 | Heavier; opinionated component styles fight custom design; utility-first is better for custom UI |
| CSS | Tailwind 4 | Vanilla CSS | Slower development; responsive utilities would be hand-rolled |
| CSS | Tailwind 4 | DaisyUI (Tailwind plugin) | Adds opinionated component layer; overkill for a study site with simple UI patterns |
| Testing | Vitest | Jest | Slower; requires separate config; doesn't share Vite pipeline |
| Testing | Playwright | Cypress | Playwright supports all 3 engines; faster; better CI story |

## Timer Implementation Strategy

For the 105-minute exam timer:

**Approach:** `setInterval` at 1-second granularity, with `Date.now()` drift correction.

**Why not `requestAnimationFrame`:** rAF fires at 60fps -- 60x more often than a 1-second countdown needs. Wasteful for a simple clock display. rAF is for smooth visual animations, not timers.

**Why drift correction:** `setInterval` can drift. Store the exam start time as `Date.now()`, then on each tick calculate `elapsed = Date.now() - startTime`. This is resilient to tab backgrounding (browsers throttle `setInterval` in background tabs but `Date.now()` stays accurate).

**Persistence:** Store `startTime` and `timeLimit` in localStorage via nanostores. If the user refreshes mid-exam, recalculate remaining time from `Date.now() - startTime`.

## Question Data Schema (Zod)

```typescript
// src/content.config.ts
import { defineCollection, z } from 'astro:content';

const questions = defineCollection({
  loader: file(),
  schema: z.object({
    id: z.string(),
    question: z.string().min(10),
    options: z.array(z.object({
      label: z.enum(['A', 'B', 'C', 'D']),
      text: z.string(),
    })).length(4),
    correctAnswer: z.enum(['A', 'B', 'C', 'D']),
    explanation: z.string().min(20),
    wrongAnswerExplanations: z.record(z.enum(['A', 'B', 'C', 'D']), z.string()).optional(),
    topic: z.enum([
      'capital-markets',
      'products-risks',
      'trading-accounts-prohibited',
      'regulatory-framework',
    ]),
    subtopic: z.string().optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
    source: z.string(),
    tags: z.array(z.string()).optional(),
  }),
});

export const collections = { questions };
```

## Installation

```bash
# Initialize Astro project
npm create astro@latest finra-sie-exam -- --template minimal

# Core framework
npm install astro@^6.3

# UI framework (islands)
npm install preact@^10.29 @astrojs/preact@^5.1

# State management
npm install nanostores@^1.3 @nanostores/preact@^1.1

# Styling
npm install tailwindcss@^4.3 @tailwindcss/typography@^0.5

# Dev dependencies
npm install -D typescript@^6.0 @astrojs/check@^0.9

# Testing (add when ready)
npm install -D vitest@^4.1 @testing-library/preact
npm install -D playwright@^1.60 @playwright/test
```

## Project Structure

```
finra-sie-exam/
  src/
    content/
      questions/          # JSON question files by topic
        capital-markets.json
        products-risks.json
        trading-accounts.json
        regulatory-framework.json
      content.config.ts   # Zod schemas
    components/           # Astro (static) components
      QuestionCard.astro
      TopicNav.astro
      ProgressBar.astro
    islands/              # Preact (interactive) components
      QuizEngine.tsx      # client:load -- core quiz logic
      ExamTimer.tsx       # client:load -- countdown timer
      FlashcardDeck.tsx   # client:load -- flip-to-reveal
      ProgressTracker.tsx # client:idle -- syncs to localStorage
    layouts/
      BaseLayout.astro
    pages/
      index.astro         # Landing page
      exam.astro          # Timed exam mode
      drill/
        [topic].astro     # Topic-based drill
      flashcards.astro    # Flashcard mode
      progress.astro      # Progress dashboard
    stores/
      quiz.ts             # nanostores: current quiz state
      progress.ts         # nanostores: persistent progress
      timer.ts            # nanostores: exam timer state
    styles/
      global.css          # Tailwind imports + custom vars
  public/
    favicon.svg
  astro.config.mjs
  tailwind.config.ts      # (minimal -- v4 is CSS-first)
  tsconfig.json
  vitest.config.ts
  playwright.config.ts
```

## Sources

- Astro official docs: https://docs.astro.build/
- Astro GitHub Pages deployment: https://docs.astro.build/en/guides/deploy/github/
- Astro content collections: https://docs.astro.build/en/guides/content-collections/
- Astro islands architecture: https://docs.astro.build/en/concepts/islands/
- Astro state sharing with nanostores: https://docs.astro.build/en/recipes/sharing-state-islands/
- Tailwind CSS v4: https://tailwindcss.com/
- Preact: https://preactjs.com/
- nanostores: https://github.com/nanostores/nanostores
- Vitest: https://vitest.dev/
- Playwright: https://playwright.dev/
- npm registry (all version numbers verified 2026-05-17)
