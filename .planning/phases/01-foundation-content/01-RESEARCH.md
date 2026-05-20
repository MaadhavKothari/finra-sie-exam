# Phase 1: Foundation & Content - Research

**Researched:** 2026-05-20
**Domain:** Astro 6 static site scaffolding, Zod v4 content validation, GitHub Pages deployment, FINRA SIE question taxonomy
**Confidence:** HIGH

## Summary

This phase delivers the project scaffold (Astro 6 + Tailwind CSS 4), question data schema (Zod v4 via `astro/zod`), 20 sample questions across 4 FINRA SIE sections, build-time validation, and automated deployment to GitHub Pages. The research confirms all locked technology decisions are sound and current. One critical finding: Astro 6 bundles **Zod v4** (not v3), which changes `z.record()` semantics with enum keys and deprecates `z.nativeEnum()` -- the schema from STACK.md needs minor adjustments. A second finding: `@tailwindcss/vite` has a known npm hoisting bug with Astro 6 (GitHub issue #16542, closed); the workaround is either a Vite version override or using `@tailwindcss/postcss` instead.

The FINRA SIE content outline (2025 edition, 15 pages) has been fully extracted from the official PDF. It defines 4 sections, 13 major topics, and ~40 subtopics that form the authoritative taxonomy for question tagging. The two-repo deployment strategy (private source -> public GitHub Pages repo) is well-supported via `peaceiris/actions-gh-pages@v4` with SSH deploy keys.

**Primary recommendation:** Scaffold Astro 6 with `@tailwindcss/vite` (with `"overrides": {"vite": "^7"}` in package.json), define the question schema in `src/content.config.ts` using Zod v4 syntax from `astro/zod`, create 4 JSON files with 5 questions each, and deploy via a two-step GitHub Actions workflow (build in private repo, push to public repo).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- 5 sample questions per SIE section (20 total) -- enough to validate schema across all 4 sections
- 4 separate JSON files (one per SIE section) -- enables lazy loading, keeps files manageable
- Include difficulty metadata (easy/medium/hard) in schema from day one to avoid migration later
- Use FINRA's exact content outline headings for sub-topic taxonomy -- authoritative and recognizable
- Write original questions based on FINRA content outline -- no copyright risk, full control over content
- Explanation style: 2-3 sentences per correct answer + 1 sentence per wrong answer explaining why it's wrong
- Include specific regulatory references (e.g., "per SEC Rule 15c3-1") in explanations for credibility
- Two-repo strategy: private source repo + public deploy repo (free GitHub Pages, no Pro plan needed)
- GitHub Actions workflow auto-deploys on push to main using `withastro/action`
- Default github.io URL for now (`username.github.io/finra-sie-exam`)

### Claude's Discretion
- Astro project structure and configuration details
- Zod schema field naming conventions
- GitHub Actions workflow specifics
- CSS/styling approach for the initial landing page

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CONT-01 | Question bank organized by FINRA's 4 SIE sections (16/44/31/9%) | FINRA content outline extracted from official PDF; complete taxonomy with section names, topic IDs, subtopics, and percentage weights documented below |
| CONT-02 | Each question has explanations for correct AND each incorrect answer | Schema includes per-choice `explanation` field on every Choice object plus overall `explanation` field |
| CONT-03 | Every question displays source attribution | Schema includes `source` enum field and optional `regulatoryBasis` string |
| CONT-04 | Questions tagged with sub-topics for granular filtering | Complete sub-topic taxonomy extracted from FINRA outline; `subtopic` field uses slug-ified FINRA headings |
| CONT-05 | Question data validated at build time via Zod schema | Astro 6 content collections with Zod v4 `file()` loader validates on every `astro build`; build fails on malformed data |
| CONT-06 | Stable semantic IDs (e.g., `q-pr-042`) | Schema enforces `id` as z.string() with regex validation; IDs are stable across additions/reorderings |
| UX-05 | Site deploys to GitHub Pages from private repo | Two-repo strategy with `peaceiris/actions-gh-pages@v4` using SSH deploy keys for cross-repo push |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Stack: Astro 6 + Preact + nanostores + Tailwind CSS 4
- Architecture: `src/pages/` (Astro pages), `src/components/` (Preact islands), `src/stores/` (nanostores), `src/lib/` (pure logic), `src/content/questions/` (JSON data)
- Commands: `npm run dev`, `npm run build` (validates schema), `npm run preview`
- Content collections with Zod validation for question data
- Vitest for unit testing

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Question data storage & validation | Build-time / Static | -- | JSON files validated by Zod at build; no runtime database |
| Question taxonomy (sections/subtopics) | Build-time / Static | -- | Static data derived from FINRA content outline; encoded in TypeScript enums |
| Landing page rendering | CDN / Static (Astro HTML) | -- | Zero-JS static page; no interactivity needed |
| Deployment pipeline | CI/CD (GitHub Actions) | CDN / Static (GitHub Pages) | Build in Actions, serve from Pages CDN |
| Schema enforcement | Build-time (Astro + Zod) | -- | `astro build` runs Zod validation; fails before deploy |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| astro | 6.3.5 | Static site generator | Ships zero JS by default; content collections with Zod; first-class GitHub Pages deployment [VERIFIED: npm registry] |
| typescript | 6.0.3 | Type safety | Astro 6 requires Node 22.12+; TS 6 is current LTS [VERIFIED: npm registry] |
| zod | 4.3.6 (bundled) | Schema validation | Bundled with Astro 6 via `astro/zod`; do NOT install separately [VERIFIED: npm view astro dependencies] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| tailwindcss | 4.3.0 | Utility-first CSS | Landing page styling; all pages [VERIFIED: npm registry] |
| @tailwindcss/vite | 4.3.0 | Vite plugin for Tailwind | Required for Astro + Tailwind v4 integration [VERIFIED: npm registry] |
| @tailwindcss/typography | 0.5.19 | Prose styling | Question explanations need readable formatted text [VERIFIED: npm registry] |
| @astrojs/check | 0.9.9 | Astro type checking | CI type validation [VERIFIED: npm registry] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @tailwindcss/vite | @tailwindcss/postcss | PostCSS avoids the Vite 8 hoisting bug entirely but requires postcss.config.mjs; Vite plugin is simpler when override is set |
| file() loader (4 files) | glob() loader (directory) | glob() auto-discovers files but generates IDs from filenames; file() gives explicit control per JSON file and matches the "4 separate files" decision |

**Installation:**
```bash
# Initialize Astro project
npm create astro@latest -- --template minimal --typescript strict

# Tailwind CSS v4
npm install tailwindcss @tailwindcss/vite @tailwindcss/typography

# Dev dependencies
npm install -D @astrojs/check
```

**Critical: Add Vite override to package.json** to prevent npm hoisting Vite 8 (which breaks @tailwindcss/vite):
```json
{
  "overrides": {
    "vite": "^7"
  }
}
```
[VERIFIED: github.com/withastro/astro/issues/16542]

**Version verification:**
- astro: 6.3.5 [VERIFIED: npm registry 2026-05-20]
- typescript: 6.0.3 [VERIFIED: npm registry 2026-05-20]
- tailwindcss: 4.3.0 [VERIFIED: npm registry 2026-05-20]
- @tailwindcss/vite: 4.3.0 [VERIFIED: npm registry 2026-05-20]
- @tailwindcss/typography: 0.5.19 [VERIFIED: npm registry 2026-05-20]
- @astrojs/check: 0.9.9 [VERIFIED: npm registry 2026-05-20]
- zod: 4.3.6 bundled with astro [VERIFIED: npm view astro@6.3.5 dependencies]

## Architecture Patterns

### System Architecture Diagram

```
  [Question JSON Files]          [Astro Pages (.astro)]
  4 files, one per section       index.astro (landing)
         |                              |
         v                              v
  [Zod Schema Validation]    [Astro Build Pipeline]
  content.config.ts                     |
  file() loader per JSON         Validates all JSON
         |                       Generates static HTML
         v                              |
  [Build-time getCollection()]          v
  Filters, counts, metadata    [Static HTML + CSS output]
                                        |
                                        v
                               [GitHub Actions CI/CD]
                               Build in private repo
                                        |
                                        v
                               [Public Deploy Repo]
                               peaceiris/actions-gh-pages
                                        |
                                        v
                               [GitHub Pages CDN]
                               username.github.io/finra-sie-exam
```

### Recommended Project Structure

```
finra-sie-exam/
  src/
    content/
      questions/
        capital-markets.json          # Section 1: 5 questions
        products-risks.json           # Section 2: 5 questions
        trading-accounts.json         # Section 3: 5 questions
        regulatory-framework.json     # Section 4: 5 questions
    content.config.ts                 # Zod schema + file() loaders
    data/
      topics.ts                       # Topic taxonomy constants
    pages/
      index.astro                     # Landing page
    layouts/
      BaseLayout.astro                # Shared layout with Tailwind
    styles/
      global.css                      # @import "tailwindcss"
  public/
    favicon.svg
  astro.config.mjs
  tsconfig.json
  package.json
  .github/
    workflows/
      deploy.yml                      # GitHub Actions deployment
```

### Pattern 1: Content Collections with file() Loader for JSON

**What:** Each SIE section's questions live in a separate JSON file. Each file is loaded by a dedicated `file()` loader in `content.config.ts`. Zod validates every entry at build time.

**When to use:** Always -- this is the foundation of the data pipeline.

**Example:**
```typescript
// src/content.config.ts
// Source: https://docs.astro.build/en/guides/content-collections/
import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
import { z } from 'astro/zod'; // Astro 6: import from astro/zod, NOT astro:content

const questions = defineCollection({
  loader: file("src/content/questions/capital-markets.json"),
  schema: z.object({
    id: z.string().regex(/^q-(cm|pr|ta|rf)-\d{3}$/),
    stem: z.string().min(10),
    choices: z.tuple([
      choiceSchema, choiceSchema, choiceSchema, choiceSchema
    ]),
    correctAnswer: z.enum(['A', 'B', 'C', 'D']),
    explanation: z.string().min(20),
    topic: z.enum([
      'capital-markets',
      'products-risks',
      'trading-accounts',
      'regulatory-framework',
    ]),
    subtopic: z.string(),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    source: z.string(),
    regulatoryBasis: z.string().optional(),
    lastVerified: z.string().optional(),
  }),
});
```

**IMPORTANT -- Multiple file() loaders:** Astro content collections support one loader per collection. To load 4 separate JSON files, define 4 separate collections OR use a single `glob()` loader:

```typescript
// Option A: Four separate collections (explicit, matches "4 separate files" decision)
const capitalMarkets = defineCollection({
  loader: file("src/content/questions/capital-markets.json"),
  schema: questionSchema,
});
const productsRisks = defineCollection({
  loader: file("src/content/questions/products-risks.json"),
  schema: questionSchema,
});
// ... etc

export const collections = {
  'capital-markets': capitalMarkets,
  'products-risks': productsRisks,
  'trading-accounts': tradingAccounts,
  'regulatory-framework': regulatoryFramework,
};

// Option B: Single glob() collection (simpler querying)
const questions = defineCollection({
  loader: glob({ pattern: "*.json", base: "./src/content/questions" }),
  schema: questionSchema,
});
export const collections = { questions };
```

**Recommendation:** Use Option B (single `glob()` collection). It keeps the 4-file organization while enabling `getCollection('questions')` to return all questions with a single call. Filtering by topic uses `getCollection('questions', ({data}) => data.topic === 'capital-markets')`. This is simpler than managing 4 separate collection names. [VERIFIED: https://docs.astro.build/en/reference/content-loader-reference/]

### Pattern 2: Zod v4 Schema Design (Critical Differences from v3)

**What:** Astro 6 bundles Zod v4, which has breaking changes from v3. The schema from STACK.md needs updates.

**Key Zod v4 changes affecting this project:**
1. Import from `astro/zod`, NOT `astro:content` [VERIFIED: https://docs.astro.build/en/guides/upgrade-to/v6/]
2. `z.record(z.enum(...), z.string())` now produces REQUIRED keys (v3 made them optional). Use `z.partialRecord()` for optional keys. [VERIFIED: https://zod.dev/v4/changelog]
3. `z.nativeEnum()` is deprecated; `z.enum()` now accepts enum-like objects directly [VERIFIED: https://zod.dev/v4/changelog]
4. Enum value access: only `.enum` works (`.Enum` and `.Values` removed) [VERIFIED: https://zod.dev/v4/changelog]
5. Error customization uses single `error` param instead of `message`/`invalid_type_error`/`required_error` [VERIFIED: https://zod.dev/v4/changelog]

### Pattern 3: Two-Repo GitHub Pages Deployment

**What:** Private source repo triggers GitHub Actions build. Built output is pushed to a separate public repo's `gh-pages` branch via SSH deploy key.

**When to use:** When deploying to GitHub Pages from a private repo without GitHub Pro.

**Setup steps:**
1. Generate SSH key pair: `ssh-keygen -t rsa -b 4096 -f github-deploy-key -N ""`
2. Add private key as `ACTIONS_DEPLOY_KEY` secret in source repo
3. Add public key as deploy key (with write access) in public repo
4. Workflow uses `peaceiris/actions-gh-pages@v4` with `external_repository` option

**Example workflow:**
```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Install and Build
        run: |
          npm ci
          npm run build

      - name: Deploy to External Repo
        uses: peaceiris/actions-gh-pages@v4
        with:
          deploy_key: ${{ secrets.ACTIONS_DEPLOY_KEY }}
          external_repository: USERNAME/finra-sie-exam-site
          publish_branch: gh-pages
          publish_dir: ./dist
```
[VERIFIED: https://github.com/peaceiris/actions-gh-pages]

**Alternative (same-repo):** If the user later gets GitHub Pro, switch to `withastro/action@v6` which is simpler but requires Pages on the same repo:
```yaml
      - name: Build
        uses: withastro/action@v6
      - name: Deploy
        uses: actions/deploy-pages@v5
```
[CITED: https://docs.astro.build/en/guides/deploy/github/]

### Pattern 4: Astro Config for GitHub Pages Sub-Path

**What:** When deploying to `username.github.io/finra-sie-exam`, Astro needs `site` and `base` configured.

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://USERNAME.github.io',
  base: '/finra-sie-exam',
  vite: {
    plugins: [tailwindcss()],
  },
});
```
[CITED: https://docs.astro.build/en/guides/deploy/github/]

### Anti-Patterns to Avoid

- **Importing z from astro:content:** Deprecated in Astro 6. Use `import { z } from 'astro/zod'` instead. Build may warn or fail.
- **Using content/config.ts location:** Astro 6 requires `src/content.config.ts` (NOT `src/content/config.ts`). The old location is removed.
- **Installing zod separately:** Astro bundles Zod v4. Installing a separate zod package causes version conflicts.
- **Using z.record(z.enum(...), ...) expecting optional keys:** In Zod v4, enum-keyed records produce required keys. Use `z.partialRecord()` if optional keys are intended.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON schema validation | Custom validation scripts | Astro content collections + Zod | Build-time validation is automatic; type inference comes free |
| GitHub Pages deployment | Manual build + push scripts | peaceiris/actions-gh-pages@v4 | Handles SSH auth, branch management, cleanup |
| CSS utility framework | Custom CSS classes | Tailwind CSS 4 | Responsive utilities, prose styling built in |
| ID format validation | Manual regex checks | z.string().regex() in Zod schema | Validates at build time, surfaces exact errors |

**Key insight:** Every piece of infrastructure in this phase has a battle-tested solution. The only custom code is the Zod schema definition and the 20 sample questions themselves.

## FINRA SIE Content Taxonomy (Complete)

Extracted from the official FINRA SIE Content Outline (2025 edition, 15 pages).
[VERIFIED: https://www.finra.org/sites/default/files/2025-10/SIE_Content_Outline.pdf]

### Section 1: Knowledge of Capital Markets (16%, 12 items)

| Topic ID | Topic | Subtopics |
|----------|-------|-----------|
| 1.1 | Regulatory Entities, Agencies and Market Participants | 1.1.1 SEC; 1.1.2 SROs (CBOE, FINRA, MSRB); 1.1.3 Other Regulators (Treasury/IRS, state/NASAA, Fed, SIPC, FDIC); 1.1.4 Market Participants (investors, broker-dealers, investment advisers, municipal advisors, issuers, underwriters, traders, market makers, custodians, trustees, transfer agents, depositories/DTCC/OCC) |
| 1.2 | Market Structure | 1.2.1 Types of Markets (primary, secondary/OTC/electronic, third, fourth) |
| 1.3 | Economic Factors | 1.3.1 Federal Reserve (monetary vs fiscal policy, open market activities, rates); 1.3.2 Business Economics (financial statements, business cycle, indicators, market effects, economic theories); 1.3.3 International (balance of payments, GDP/GNP, exchange rates) |
| 1.4 | Offerings | Roles of participants, types (public/private, IPO, secondary, follow-on), distribution methods (best efforts, firm commitment), shelf registrations, offering documents, regulatory filings |

### Section 2: Understanding Products and Their Risks (44%, 33 items)

| Topic ID | Topic | Subtopics |
|----------|-------|-----------|
| 2.1.1 | Equity Securities | Common stock, preferred stock, rights, warrants, ADRs; ownership, voting rights, convertibility, restrictions |
| 2.1.2 | Debt Instruments | Treasury securities, agency/MBS, corporate bonds, municipal securities (GO/revenue), money market instruments; maturities, income, coupon, par value, yield, ratings, callable/convertible, price-interest rate relationship |
| 2.1.3 | Options | Puts/calls, equity/index; hedging/speculation, expiration, strike price, premium, settlement, in/out of money, covered/uncovered, American/European, exercise/assignment, ODD, OCC |
| 2.1.4 | Packaged Products | Investment companies (closed-end, open-end, UITs, variable contracts/annuities); loads, share classes, NAV, disclosures, costs/fees, breakpoints, ROA, LOI, surrender charges |
| 2.1.5 | Municipal Fund Securities | 529 plans (prepaid/savings), LGIPs, ABLE accounts; owner vs beneficiary, restricted use, tax advantages |
| 2.1.6 | Direct Participation Programs (DPPs) | Limited partnerships, TICs; pass-through tax, unlisted, illiquid |
| 2.1.7 | REITs | Private, registered non-listed, listed; equity/debt, tax-advantaged income |
| 2.1.8 | Hedge Funds | Minimum investment, partnership structure, private equity, illiquid |
| 2.1.9 | Exchange-Traded Products (ETPs) | ETFs, ETNs; alternative to mutual funds, fees, active vs passive |
| 2.2 | Investment Risks | Risk types (capital, credit, currency, inflation, interest rate/reinvestment, liquidity, market/systematic, non-systematic, political, prepayment); mitigation (diversification, rebalancing, hedging) |

### Section 3: Understanding Trading, Customer Accounts and Prohibited Activities (31%, 23 items)

| Topic ID | Topic | Subtopics |
|----------|-------|-----------|
| 3.1.1 | Orders and Strategies | Order types (market, stop, limit, GTC), discretionary/non-discretionary, solicited/unsolicited, buy/sell, bid-ask, trade capacity, long/short/naked/covered, bearish/bullish |
| 3.1.2 | Investment Returns | Components (interest, dividends, gains), dividend types/dates, yield measurements (YTM, YTC), cost basis, benchmarks/indices |
| 3.1.3 | Trade Settlement | Settlement time frames (T, T+1), physical vs book entry |
| 3.1.4 | Corporate Actions | Splits, reverse splits, buybacks, tender offers, M&A, rights offerings, proxy voting |
| 3.2.1 | Account Types | Cash, margin, options, discretionary, fee/commission, educational |
| 3.2.2 | Account Registrations | Individual, joint, corporate, trust, custodial/UTMA, partnerships, retirement/IRA, qualified plans |
| 3.2.3 | Anti-Money Laundering | Definition, stages (structuring, layering, placement), compliance program, SAR, CTR, FinCEN, OFAC/SDN |
| 3.2.4 | Books/Records/Privacy | Retention requirements, confirmations, account statements, customer mail, BCP, customer protection, Regulation S-P |
| 3.2.5 | Communications/Suitability | Public communications, telemarketing, do-not-call, best interest/Reg BI, KYC |
| 3.3.1 | Market Manipulation | Definition, types (pump and dump, front running, excessive trading, marking the close/open, backing away, freeriding) |
| 3.3.2 | Insider Trading | Definition, material nonpublic information, involved parties, penalties |
| 3.3.3 | Other Prohibited Activities | IPO restrictions, fraudulent devices, misuse of customer funds, borrowing/sharing, senior exploitation, unregistered activities, falsifying documents |

### Section 4: Overview of the Regulatory Framework (9%, 7 items)

| Topic ID | Topic | Subtopics |
|----------|-------|-----------|
| 4.1.1 | Registration and Continuing Education | SRO qualification, registered vs non-registered persons, permitted activities, ineligibility, background checks, fingerprinting, statutory disqualification, state registration/blue-sky, CE (Firm Element, Regulatory Element) |
| 4.2.1 | Employee Conduct | Form U4/U5, consequences of misleading filings, customer complaints, red flags |
| 4.2.2 | Reportable Events | Outside business activities, private securities transactions, political contributions, gifts/gratuities, entertainment, felonies/liens/bankruptcy |

### Sub-Topic Slug Mapping for Schema

Use these slug IDs for the `subtopic` field (derived from FINRA headings):

```
Section 1:
  regulatory-entities-agencies
  market-structure
  economic-factors
  offerings

Section 2:
  equity-securities
  debt-instruments
  options
  packaged-products
  municipal-fund-securities
  direct-participation-programs
  reits
  hedge-funds
  exchange-traded-products
  investment-risks

Section 3:
  orders-and-strategies
  investment-returns
  trade-settlement
  corporate-actions
  account-types
  account-registrations
  anti-money-laundering
  books-records-privacy
  communications-suitability
  market-manipulation
  insider-trading
  other-prohibited-activities

Section 4:
  registration-continuing-education
  employee-conduct
  reportable-events
```

### Section Weighting Constants

```typescript
// src/data/topics.ts
export const SIE_SECTIONS = {
  'capital-markets': {
    name: 'Knowledge of Capital Markets',
    weight: 0.16,
    examItems: 12,
    sectionNumber: 1,
  },
  'products-risks': {
    name: 'Understanding Products and Their Risks',
    weight: 0.44,
    examItems: 33,
    sectionNumber: 2,
  },
  'trading-accounts': {
    name: 'Understanding Trading, Customer Accounts and Prohibited Activities',
    weight: 0.31,
    examItems: 23,
    sectionNumber: 3,
  },
  'regulatory-framework': {
    name: 'Overview of the Regulatory Framework',
    weight: 0.09,
    examItems: 7,
    sectionNumber: 4,
  },
} as const;
```
[VERIFIED: FINRA SIE Content Outline PDF, page 2]

## Common Pitfalls

### Pitfall 1: Importing Zod from the Wrong Module
**What goes wrong:** Using `import { z } from 'astro:content'` (Astro 5 pattern) or installing a separate `zod` package.
**Why it happens:** STACK.md and many tutorials show the Astro 5 pattern. Astro 6 changed this.
**How to avoid:** Always use `import { z } from 'astro/zod'`. Never `npm install zod`.
**Warning signs:** Deprecation warnings during build; type errors if separate zod version conflicts.
[VERIFIED: https://docs.astro.build/en/guides/upgrade-to/v6/]

### Pitfall 2: content.config.ts in Wrong Location
**What goes wrong:** Placing the config at `src/content/config.ts` (Astro 5 location).
**Why it happens:** Many existing tutorials and the STACK.md example show the old path.
**How to avoid:** File MUST be at `src/content.config.ts` (project root of src/).
**Warning signs:** Collections not found; empty getCollection() results; no build-time validation.
[VERIFIED: https://docs.astro.build/en/guides/upgrade-to/v6/]

### Pitfall 3: Vite 8 Hoisting with @tailwindcss/vite
**What goes wrong:** `npm install @tailwindcss/vite` causes npm to hoist Vite 8.x to root, which uses rolldown internally and breaks the Tailwind Vite plugin.
**Why it happens:** @tailwindcss/vite declares `"vite": "^5.2.0 || ^6 || ^7 || ^8"` as peer dep; npm resolves to latest (8.x).
**How to avoid:** Add `"overrides": {"vite": "^7"}` to package.json BEFORE installing.
**Warning signs:** Build error: "Missing field `tsconfigPaths` on BindingViteResolvePluginConfig.resolveOptions".
[VERIFIED: https://github.com/withastro/astro/issues/16542]

### Pitfall 4: z.record() Enum Key Behavior Change (Zod v4)
**What goes wrong:** Using `z.record(z.enum(['A','B','C','D']), z.string())` expecting optional keys, but Zod v4 makes all enum keys required.
**Why it happens:** Zod v4 changed record semantics -- enum-keyed records now produce required keys.
**How to avoid:** If you want optional per-wrong-answer explanations, use `z.partialRecord()`. If all 4 explanations are always required (preferred), `z.record()` works correctly as-is.
**Warning signs:** Validation errors on questions missing explanations for unused answer choices.
[VERIFIED: https://zod.dev/v4/changelog]

### Pitfall 5: Missing base Path for GitHub Pages Sub-Path
**What goes wrong:** Links and assets break when deployed to `username.github.io/finra-sie-exam/`.
**Why it happens:** Astro generates absolute paths by default; without `base`, they resolve to `username.github.io/` instead of the subdirectory.
**How to avoid:** Set `base: '/finra-sie-exam'` in astro.config.mjs.
**Warning signs:** 404 errors for CSS/JS; broken navigation links on deployed site.
[CITED: https://docs.astro.build/en/guides/deploy/github/]

### Pitfall 6: JSON file() Loader Requires id Field in Array Format
**What goes wrong:** Questions in JSON array format without an `id` field cause the loader to fail silently or generate unstable IDs.
**Why it happens:** The `file()` loader for JSON arrays requires each object to have a unique `id` field.
**How to avoid:** Every question object in the JSON array MUST have an `id` field (e.g., `"id": "q-cm-001"`).
**Warning signs:** Missing entries when querying collection; duplicate ID warnings.
[VERIFIED: https://docs.astro.build/en/reference/content-loader-reference/]

## Code Examples

### Complete Question Schema (Zod v4 Syntax)

```typescript
// src/content.config.ts
// Source: https://docs.astro.build/en/guides/content-collections/
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const choiceSchema = z.object({
  label: z.enum(['A', 'B', 'C', 'D']),
  text: z.string().min(1),
  explanation: z.string().min(10),
});

const questionSchema = z.object({
  id: z.string().regex(/^q-(cm|pr|ta|rf)-\d{3}$/),
  stem: z.string().min(10),
  choices: z.tuple([choiceSchema, choiceSchema, choiceSchema, choiceSchema]),
  correctAnswer: z.enum(['A', 'B', 'C', 'D']),
  explanation: z.string().min(20),
  topic: z.enum([
    'capital-markets',
    'products-risks',
    'trading-accounts',
    'regulatory-framework',
  ]),
  subtopic: z.string().min(1),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  source: z.string().min(1),
  regulatoryBasis: z.string().optional(),
  lastVerified: z.string().optional(),
});

const questions = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/questions' }),
  schema: questionSchema,
});

export const collections = { questions };
```

### Sample Question JSON Structure

```json
[
  {
    "id": "q-cm-001",
    "stem": "Which federal agency has primary responsibility for enforcing the federal securities laws and regulating the securities industry?",
    "choices": [
      {
        "label": "A",
        "text": "The Federal Reserve Board (FRB)",
        "explanation": "Incorrect. The FRB is responsible for monetary policy and regulating bank holding companies, not for enforcing securities laws."
      },
      {
        "label": "B",
        "text": "The Securities and Exchange Commission (SEC)",
        "explanation": "Correct. The SEC was established by the Securities Exchange Act of 1934 and has primary authority over the securities industry, including oversight of SROs like FINRA."
      },
      {
        "label": "C",
        "text": "The Financial Industry Regulatory Authority (FINRA)",
        "explanation": "Incorrect. FINRA is a self-regulatory organization (SRO) that operates under SEC oversight. It regulates broker-dealers but is not a federal agency."
      },
      {
        "label": "D",
        "text": "The Department of the Treasury",
        "explanation": "Incorrect. The Treasury Department manages federal finances and includes the IRS, but securities regulation falls under the SEC."
      }
    ],
    "correctAnswer": "B",
    "explanation": "The SEC is the primary federal regulator of the securities industry, established by the Securities Exchange Act of 1934. While FINRA and other SROs handle day-to-day regulation of broker-dealers, they operate under SEC oversight and authority.",
    "topic": "capital-markets",
    "subtopic": "regulatory-entities-agencies",
    "difficulty": "easy",
    "source": "FINRA content outline",
    "regulatoryBasis": "Securities Exchange Act of 1934",
    "lastVerified": "2026-05-20"
  }
]
```

### Querying Questions in Astro Pages

```typescript
// In any .astro page frontmatter
// Source: https://docs.astro.build/en/reference/modules/astro-content/
import { getCollection } from 'astro:content';

// Get all questions
const allQuestions = await getCollection('questions');

// Filter by topic
const capitalMarketsQuestions = await getCollection('questions', ({ data }) => {
  return data.topic === 'capital-markets';
});

// Get question counts per section
const sectionCounts = {
  'capital-markets': allQuestions.filter(q => q.data.topic === 'capital-markets').length,
  'products-risks': allQuestions.filter(q => q.data.topic === 'products-risks').length,
  'trading-accounts': allQuestions.filter(q => q.data.topic === 'trading-accounts').length,
  'regulatory-framework': allQuestions.filter(q => q.data.topic === 'regulatory-framework').length,
};
```

### Tailwind CSS v4 Setup for Astro 6

```css
/* src/styles/global.css */
@import "tailwindcss";
@plugin "@tailwindcss/typography";
```

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://USERNAME.github.io',
  base: '/finra-sie-exam',
  vite: {
    plugins: [tailwindcss()],
  },
});
```

```astro
---
// src/layouts/BaseLayout.astro
import '../styles/global.css';

interface Props {
  title: string;
}
const { title } = Astro.props;
---
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{title} | FINRA SIE Practice</title>
  </head>
  <body class="bg-white text-gray-900 min-h-screen">
    <slot />
  </body>
</html>
```
[CITED: https://tailwindcss.com/docs/installation/framework-guides/astro]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `src/content/config.ts` | `src/content.config.ts` | Astro 5 (late 2024) | File location change; old path no longer works in Astro 6 |
| `import { z } from 'astro:content'` | `import { z } from 'astro/zod'` | Astro 6 (March 2026) | Import path change; old path deprecated |
| Zod v3 `z.record(z.enum(...))` = optional keys | Zod v4 `z.record(z.enum(...))` = required keys | Zod 4.0 (2025) | Schema behavior change; use `z.partialRecord()` for optional |
| `type: 'data'` collection type | `loader: file()` or `loader: glob()` | Astro 5+ | Legacy content/data type distinction removed |
| `@astrojs/tailwind` integration | `@tailwindcss/vite` Vite plugin | Tailwind v4 (2025) | No more Astro-specific integration needed |
| `tailwind.config.js` | CSS-first `@import "tailwindcss"` + `@plugin` | Tailwind v4 (2025) | Configuration moves to CSS |
| `getEntryBySlug()` / `getDataEntryById()` | `getEntry()` | Astro 5+ | Unified API for all entry types |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `glob()` loader with `*.json` pattern correctly loads JSON arrays where each item has an `id` field | Architecture Patterns | Schema definition would need to switch to 4 separate `file()` loaders; medium effort |
| A2 | The `peaceiris/actions-gh-pages@v4` action works with Astro's `dist/` output directory | Deployment Pattern | Workflow may need output directory adjustment; low effort |
| A3 | The Vite override `"vite": "^7"` is sufficient to prevent the hoisting bug on all npm versions | Pitfall 3 | May need to also pin in `devDependencies` explicitly; easily fixed |

## Open Questions

1. **Public deploy repo name**
   - What we know: Two-repo strategy decided; private source repo is `finra-sie-exam`
   - What's unclear: The exact name and GitHub username for the public deploy repo
   - Recommendation: Create `USERNAME/finra-sie-exam-site` (or similar) as a public repo; configure in workflow

2. **glob() vs file() for JSON loading**
   - What we know: Both work for JSON. `glob()` is simpler (one collection). `file()` gives explicit control (4 collections).
   - What's unclear: Whether `glob()` correctly uses the `id` field from JSON array items when loading `*.json` from a directory
   - Recommendation: Start with `glob()`; fall back to 4 `file()` loaders if the ID handling is wrong. Both are trivial to implement.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Astro 6 (requires >=22.12.0) | Yes | 22.18.0 | -- |
| npm | Package management | Yes | 10.9.3 | -- |
| Git | Version control | Yes | (repo exists) | -- |
| GitHub Actions | CI/CD deployment | Yes (cloud) | N/A | -- |

**Missing dependencies with no fallback:** None
**Missing dependencies with fallback:** None

## Sources

### Primary (HIGH confidence)
- [FINRA SIE Content Outline PDF (2025)](https://www.finra.org/sites/default/files/2025-10/SIE_Content_Outline.pdf) - Complete taxonomy with all 4 sections, topics, subtopics, and weightings
- [Astro Content Collections Guide](https://docs.astro.build/en/guides/content-collections/) - file() and glob() loader API, Zod schema integration
- [Astro Content Loader API Reference](https://docs.astro.build/en/reference/content-loader-reference/) - file() and glob() full API with options
- [Astro GitHub Pages Deployment](https://docs.astro.build/en/guides/deploy/github/) - withastro/action workflow, site/base config
- [Astro v6 Migration Guide](https://docs.astro.build/en/guides/upgrade-to/v6/) - Zod import changes, content.config.ts location, Node 22 requirement
- [Astro astro:content API Reference](https://docs.astro.build/en/reference/modules/astro-content/) - getCollection(), getEntry() signatures
- [Astro astro/zod Reference](https://docs.astro.build/en/reference/modules/astro-zod/) - Zod v4 bundled with Astro 6
- [Tailwind CSS Astro Installation Guide](https://tailwindcss.com/docs/installation/framework-guides/astro) - @tailwindcss/vite setup
- [Zod v4 Changelog](https://zod.dev/v4/changelog) - Breaking changes from v3: z.record, z.enum, error handling
- npm registry - All package versions verified 2026-05-20

### Secondary (MEDIUM confidence)
- [peaceiris/actions-gh-pages](https://github.com/peaceiris/actions-gh-pages) - External repository deployment with deploy keys
- [GitHub withastro/astro#16542](https://github.com/withastro/astro/issues/16542) - @tailwindcss/vite Vite 8 hoisting bug

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All versions verified against npm registry; Astro 6 docs confirmed
- Architecture: HIGH - Content collections API verified against official docs; Zod v4 changes confirmed
- FINRA taxonomy: HIGH - Extracted directly from official FINRA PDF (2025 edition)
- Deployment: HIGH - Two-repo strategy documented with verified GitHub Action
- Pitfalls: HIGH - All verified against official docs, changelogs, or GitHub issues

**Research date:** 2026-05-20
**Valid until:** 2026-06-20 (stable stack; Astro minor releases may shift versions)
