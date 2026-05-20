# Phase 1: Foundation & Content - Context

**Gathered:** 2026-05-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver a deployed Astro site on GitHub Pages with a validated question data schema and sample questions proving the content pipeline works end-to-end. This phase establishes the project scaffold, question data model, build-time validation, and deployment pipeline that all subsequent phases depend on.

</domain>

<decisions>
## Implementation Decisions

### Question Data Schema
- 5 sample questions per SIE section (20 total) — enough to validate schema across all 4 sections
- 4 separate JSON files (one per SIE section) — enables lazy loading, keeps files manageable
- Include difficulty metadata (easy/medium/hard) in schema from day one to avoid migration later
- Use FINRA's exact content outline headings for sub-topic taxonomy — authoritative and recognizable

### Content Strategy
- Write original questions based on FINRA content outline — no copyright risk, full control over content
- Explanation style: 2-3 sentences per correct answer + 1 sentence per wrong answer explaining why it's wrong
- Include specific regulatory references (e.g., "per SEC Rule 15c3-1") in explanations for credibility

### Deployment & Hosting
- Two-repo strategy: private source repo + public deploy repo (free GitHub Pages, no Pro plan needed)
- GitHub Actions workflow auto-deploys on push to main using `withastro/action`
- Default github.io URL for now (`username.github.io/finra-sie-exam`)

### Claude's Discretion
- Astro project structure and configuration details
- Zod schema field naming conventions
- GitHub Actions workflow specifics
- CSS/styling approach for the initial landing page

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project, empty repo

### Established Patterns
- Stack decided in research: Astro 6 + Preact + nanostores + Tailwind CSS 4
- Content collections with Zod validation for question data
- Semantic question IDs (e.g., `q-pr-042`)

### Integration Points
- GitHub Actions for deployment
- Astro content collections for question data ingestion

</code_context>

<specifics>
## Specific Ideas

- Question schema must support: question text, 4 answer choices, correct answer index, per-choice explanation, topic/sub-topic tags, difficulty, source attribution, stable semantic ID, lastVerified date, regulatoryBasis
- FINRA SIE sections: (1) Knowledge of Capital Markets 16%, (2) Understanding Products and Their Risks 44%, (3) Understanding Trading, Customer Accounts and Prohibited Activities 31%, (4) Overview of the Regulatory Framework 9%
- Research recommends Astro content collections with Zod for build-time validation

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>
