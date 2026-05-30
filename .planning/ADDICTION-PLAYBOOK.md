# ADDICTION PLAYBOOK — FINRA SIE Exam Practice

> Operator brief for a Claude agent implementing engagement mechanics on top of an existing Astro 6 + Preact + Nanostores codebase.
> **Audience**: adult finance professionals studying for FINRA licenses. They are serious. They are also primates with dopamine receptors.
> **Hard constraints**: 100% offline, client-side, no backend, no telemetry, single device. iOS-first via Capacitor WKWebView.
> **Budget**: ~1 week of focused implementation.
> **Tone rule**: every mechanic must pass the "Goldman Sachs analyst on the 6 train" test. If it looks like a children's app, kill it or restyle it.

---

## 0. Operating Principles (read first)

1. **The toilet test.** Every interaction must reach a satisfying micro-resolution in under 90 seconds. The user is on a phone, mid-something, with one hand.
2. **Variable schedule of reinforcement beats fixed.** Surprise rewards (3.7x XP bursts, mystery cards) outperform "every 10 questions you get 100 XP." Source: Skinner; refined in Hooked (Eyal) as the *Variable Reward* phase.
3. **Loss aversion > gain seeking.** Kahneman: people feel a loss ~2.25x more than a gain. The streak you might LOSE pulls harder than the streak you might gain.
4. **Identity > points.** "I am a person who studies daily" is a stickier story than "I have 4,200 XP." Lean into title/badge naming that signals professional identity (Series 7 nomenclature, Wall Street roles), not children's mascots.
5. **Ship juice with logic.** Animation, haptics, sound, micro-copy are not polish — they ARE the product. A correct answer with no feedback is a wasted dopamine hit. Source: Jonasson & Purho, "Juice it or lose it."
6. **Restraint.** Resist the Duolingo trap of stacking 14 currencies. Pick few mechanics, polish them obsessively. The competitive moat for an adult app is *taste*.
7. **Tasteful intrusion only.** No screaming owl. The notification voice is a Bloomberg terminal alert, not a cartoon character.

---

## 1. Mechanic Inventory (the 7 we're shipping)

The seven below were chosen from a long list (leagues, lives/hearts, energy systems, friend graphs, gachas, etc.) for fit with the constraints. **Each section is a self-contained spec.**

---

## M1. The Opening Bell — Daily Market Open Ritual

### What
A 9:30 AM (user local) daily ritual: a single 5-question "Opening Bell" set that only exists during a fresh 24-hour window. Miss it, it's gone. Today's Bell is replaced tomorrow.

### Why it works (psychological lever)
- **Scarcity + FOMO** (Wordle's master mechanic): one shot per day creates urgency without being abusive. The set literally cannot be redone.
- **Trigger via ritual time** (Hooked Model — *External Trigger*): pegs studying to a meaningful daily moment finance people already pay attention to (market open).
- **Endowed progress**: the first question of the day shows "Opening Bell 1 of 5 — Day 47 of your run" before they even start, priming completion.
- **Loss aversion**: a missed Bell shows a faded gravestone in their history.

### Concrete UX spec
- New route `/bell` (and home screen card).
- At local 09:30 ET conversion (or simply 9:30 local — pick local; offline-friendly), today's Bell unlocks. Seeded RNG from `YYYY-MM-DD` picks 5 questions deterministically across the user's enrolled exams, weighted toward weak topics (from existing accuracy data per-topic).
- Home card states change throughout the day:
  - Before 9:30: "Opening Bell rings in 3h 12m" with a soft pulse.
  - 9:30 to attempt: "🔔 The bell has rung. 5 questions. One chance." (CTA: Take the Bell)
  - During: full-screen modal with a stylized NYSE-style bell graphic at top, 5-question carousel.
  - Completed: "Bell rung. 4/5. +60 XP. Tomorrow at 9:30."
  - Missed (after midnight rollover, not done): grayed bell with date tombstone in history view.
- A **Bell History strip** (last 14 days) on the home screen: filled bells (with score), empty bells (missed), and a "current run" counter ("12-day Bell run").
- One-time confirmation modal: "Start the Bell? You only get one attempt." (prevent accidental tap-and-fail).
- Share string (M4) generated on completion.

### FINRA-fit angle
The Opening Bell is the most ritualized moment in finance. Tying study to it is *thematically* native — adult finance learners think in market hours. This is the opposite of a cutesy "daily quest." It's a market open ceremony.

### Implementation complexity
**M** (half-day). Daily seed logic, new route, time gating, history tracking.

### Files to touch / create
- New: `src/pages/bell.astro`
- New: `src/components/OpeningBell.tsx` (Preact island)
- New: `src/lib/dailySeed.ts` (deterministic question selection from date)
- New: `src/components/BellHistory.tsx` (home strip)
- Modify: `src/stores/progress.ts` — add `bellHistory: string` (JSON-encoded array of `{date, score, completed}`), `bellRunCurrent`, `bellRunBest`.
- Modify: `src/pages/index.astro` to surface Bell card prominently.

### Quirky bonus angle
After completing the Bell, render a **fake Bloomberg-style ticker** at the top of the result screen with the user's "stats": `MSTR ↑3.7%  YOU ↑12XP  STREAK +1  ACC 87.4% ▲`. Auto-scrolls left like a real ticker for 8 seconds, then fades. Sounds dumb on paper. Looks incredibly cool on a phone.

---

## M2. The Streak Vault (Streak + Freeze + Anxiety Architecture)

### What
A studied, *adult-flavored* streak system with one earnable freeze per week, a visible "vault" of past streak milestones, and a re-entry mechanic if you break.

### Why it works
- **Loss aversion** (Kahneman/Tversky prospect theory): once a streak passes ~7 days, it becomes a sunk cost the user is irrationally averse to losing. Duolingo's 4,000-day streakers are evidence.
- **Endowment effect**: a freeze you EARNED feels more valuable than one given. Duolingo gives freezes too freely. We make them rare.
- **Goal gradient effect**: as users approach milestone breakpoints (7, 30, 100, 365), motivation accelerates.
- **Recovery framing**: the worst part of a broken streak is the "why bother" spiral. A *re-entry* ritual (see below) defuses it.

### Concrete UX spec
- Existing `$streak` continues to count consecutive days with ≥1 question answered. Tighten the daily floor: must answer **at least 3** correct questions to count the day.
- Streak Freeze: earned 1 per 7-day clean streak, max 2 stockpiled. Auto-spent if user misses a day. Display in the header: 🛡 ×1.
- Streak Vault page (`/vault`): every milestone (7, 14, 30, 60, 100, 180, 365 days) earns an engraved "vault token" — a small SVG card styled like a stock certificate with date + the user's chosen "trader handle" (see M5).
- Visual streak weight:
  - Days 1–6: thin orange flame.
  - Days 7–29: thicker flame.
  - Days 30+: blue flame ("cold streak" — finance pun on "cold streak" reversal).
  - Days 100+: flame becomes a small gold bar icon.
- **Re-entry ritual** (the killer feature): when a streak breaks, the next session opens with a non-judgmental modal: "Markets reopen. Yesterday's run closed at 23 days. Start a new position?" Tapping it begins a *Recovery Sprint* — 10 questions, lower goal, and if they finish, they earn back 50% of their broken streak as a "Comeback Streak" badge. This prevents the catastrophic "I broke my streak so I'm done forever" exit pattern.

### FINRA-fit angle
The vault tokens look like vintage stock certificates. Streak language uses position/run/cover terminology, not childish flames-and-fire only. The "Markets reopen" framing turns a setback into a market metaphor adult finance people respect.

### Implementation complexity
**M** (half-day for freeze + vault, S for re-entry modal).

### Files to touch / create
- Modify: `src/stores/progress.ts` — add `freezes: string`, `vaultTokens: string` (JSON array), `lastBrokenStreak`, `comebackEligible`.
- Modify: streak increment logic to require 3 correct/day floor (currently any answer counts).
- New: `src/pages/vault.astro` + `src/components/StreakVault.tsx`
- New: `src/components/RecoveryModal.tsx`
- New: `src/lib/streakMath.ts` (milestone detection)

### Quirky bonus angle
Vault tokens are styled as **bearer bonds** — vintage engraving, scrolly borders, a faux registration number derived hashed from the user's handle + date. Long-press a token = it flips around showing the "fine print" with a hidden flavor-text disclaimer ("This certificate confers no actual securities entitlement. Past performance is not indicative of future results.").

---

## M3. Spaced Repetition — The Hot Sheet

### What
An SRS (spaced repetition system) layer applied to questions the user has gotten wrong, named the **Hot Sheet** (a finance term for a daily focus list). Reviews surface on a forgetting-curve schedule. Maxes at 15 cards per day.

### Why it works
- **Mastery loop** (Bjork's desirable difficulty; Ebbinghaus forgetting curve): the single highest-EV educational mechanic in existence for fact-heavy material. Anki, SuperMemo, Quizlet Learn all use it.
- **Sunk-cost reinforcement**: questions you got wrong feel personal — closing them is emotionally satisfying. "Closing the loop."
- **Apple Activity Rings analog**: the Hot Sheet has 3 rings (Today's New, Today's Review, Today's Mastery) that close as you work. Closing the ring compulsion is documented (Apple, 2014; Heath, "Habits of a Happy Brain").
- **Avoid Anki's worst sin**: never let the queue balloon past 15 cards. Past 15, archive the rest as "Cold Storage" — a calmer label that prevents queue dread.

### Concrete UX spec
- Existing wrong answers automatically enrolled in the Hot Sheet.
- Schedule (SM-2 simplified): on first wrong → review in 1d, 3d, 7d, 16d, 30d. A pass at any interval advances; another miss resets to 1d.
- Three-ring dashboard on `/hot-sheet`:
  - **NEW** (red ring): freshly missed yesterday.
  - **REVIEW** (yellow ring): due today.
  - **CLOSE** (green ring): cards that haven't been seen in 30d — final mastery quiz.
- Cap visible at 15. Excess → Cold Storage (`/cold-storage` route, optional browse).
- Each card shows: question, then your previous wrong answer slashed out, then correct answer, then a 1-line "why" if available from the story system.
- Closing all 3 rings in a day = unlocks a "Hot Sheet Cleared" toast + 50 XP + a small vault token candidate.

### FINRA-fit angle
The Hot Sheet is a real Wall Street artifact (a research desk's daily focus list). Branding it this way makes the learning-science feature feel like a professional tool. Adult learners respect SRS — Anki is a known quantity to anyone who's studied for the CFA or USMLE.

### Implementation complexity
**L** (full day). SRS scheduling logic + persistence + UI + Cold Storage browse.

### Files to touch / create
- New: `src/lib/srs.ts` (SM-2 lite scheduler)
- New: `src/stores/hotSheet.ts` — persistent map of `{questionId: {nextDue, intervalDays, lapses, lastResult}}`
- New: `src/pages/hot-sheet.astro` + `src/components/HotSheet.tsx`
- New: `src/pages/cold-storage.astro` (lightweight browse view)
- Modify: `QuizEngine.tsx` and `DrillEngine.tsx` to call `srs.enqueue(questionId, 'wrong')` on incorrect answers.
- New: `src/components/ThreeRingDashboard.tsx`

### Quirky bonus angle
When a card is finally "closed" (passed at 30d), play a sound clip and animation of a **stamp coming down**: "PAID IN FULL" or "CLOSED" in red ink, briefly overlaying the card. A satisfying *thunk* haptic on iOS. Tiny detail, enormous catharsis.

---

## M4. Wordle-Style Share String (Single-Device Virality)

### What
After every Opening Bell (M1) and after every full timed exam (existing feature), generate a copy-to-clipboard text artifact in the Wordle mold, designed to be pasted into iMessage with a study buddy, posted to LinkedIn, or screenshotted.

### Why it works
- **Social proof without social network** (the Wordle / NYT Games miracle): viral growth and identity expression with zero backend. The text emoji string IS the entire mechanism.
- **Identity signaling**: posting your SIE score is a way of declaring "I am studying for this" publicly. That declaration further commits the user (Cialdini, *Influence*: commitment & consistency).
- **Asymmetric onboarding funnel**: every share is a marketing impression for free.

### Concrete UX spec
- After Bell complete:
  ```
  Opening Bell — May 21
  Score: 4/5  •  Run: 47 days  🔔
  🟩🟩🟥🟩🟩
  finra-sie.app
  ```
- After exam complete:
  ```
  SIE Mock #12 — May 21
  85% (64/75)  •  74 min ⏱
  Equity 🟩🟩🟩🟩  Debt 🟩🟩🟩🟥
  Options 🟩🟥🟥🟩  Reg 🟩🟩🟩🟩
  ```
- Tap-to-copy button with haptic confirmation. Optional native iOS share sheet via `Capacitor Share` plugin (already available).
- Privacy: the share string never includes the actual questions. Topics only.
- A "compare with a friend" mode: paste a friend's string back in, parse it, render a side-by-side comparison view. (Tasteful competitive layer, fully offline.)

### FINRA-fit angle
Studying for FINRA exams is a known professional grind. People talk about it. Sharing scores in a Bloomberg-ticker-meets-Wordle aesthetic is BOTH humblebrag-able AND visually distinctive. Far more shareable than a screenshot of a Duolingo lesson.

### Implementation complexity
**S** (≤2 hr per share artifact; M total for both + parse).

### Files to touch / create
- New: `src/lib/shareString.ts` (generate + parse)
- New: `src/components/ShareCard.tsx`
- Modify: Bell result screen and exam result screen to render ShareCard.
- New (optional): `src/pages/compare.astro` for paste-back comparison.

### Quirky bonus angle
Include a tiny **rotating "Wall Street headline"** at the bottom of the share string, generated from topic performance. Examples:
- "📰 Trader Crushes Debt Section, Family Cautiously Optimistic"
- "📰 Options Greeks Strike Again — Sources Say Theta Decay 'Bewildering'"
- "📰 Regulator Approves: 100% on Reg Section"

Generated from a small template bank `src/lib/headlines.ts`. Each share gets a slightly different headline — adds a collectible "did you get the rare one?" flavor.

---

## M5. The Trader ID — Identity & Title System

### What
A persistent identity layer: a chosen "handle," an evolving title that updates with achievements, and a single visible "rank" derived from cumulative behavior. **No avatars.** No dress-up. Adult professionalism.

### Why it works
- **Identity formation** (Atomic Habits, James Clear: "every action is a vote for the type of person you wish to become"): the most durable engagement comes from the user internalizing "I am the kind of person who…"
- **Status hierarchy without social graph**: even in single-player, ranking up feels good. Pokémon Go badges, Strava local legend, Brilliant.org levels all rely on this.
- **Endowment + customization investment**: once a user has named themselves "ApexCarry" or "DeltaHedger," they're locked in.

### Concrete UX spec
- First-launch onboarding (or settings page) prompts for a handle (default suggestions: "Junior Associate", "Floor Trader", "Quant Intern"). User can pick from a list or type their own (no profanity filter needed — single device).
- **Titles** are auto-awarded based on milestones and visible under the handle:
  - 0–500 XP: *Intern*
  - 500–2k: *Junior Associate*
  - 2k–5k: *Associate*
  - 5k–10k: *VP*
  - 10k–25k: *Managing Director*
  - 25k+: *Partner*
  - + behavior-flavored sub-titles ("the Skeptical" for high accuracy, "the Relentless" for long streaks, "the Bond Whisperer" for 95%+ in debt securities). Picked from a registry based on stats. User can override which one displays.
- Visible everywhere: in share strings, on the home screen header, on vault tokens.
- A `/identity` page lets user view all earned titles and pick which is active.

### FINRA-fit angle
This is the load-bearing tasteful mechanic. Instead of cartoon avatars or pets, the user is leveling up through the *actual hierarchy of an investment bank*. That ladder is real and culturally legible to the target user. Earning "Managing Director" by studying hits different than earning "Level 12 Wizard."

### Implementation complexity
**M** (half-day). Handle prompt + title registry + display injection.

### Files to touch / create
- Modify: `src/stores/progress.ts` — add `handle: string`, `activeTitle: string`, `earnedTitles: string` (JSON array).
- New: `src/lib/titles.ts` — registry + selection logic.
- New: `src/components/IdentityHeader.tsx`
- New: `src/pages/identity.astro` + `src/components/IdentityPanel.tsx`
- Modify: home page header, share string, vault tokens to render `{handle} • {activeTitle}`.

### Quirky bonus angle
A small set of **secret titles** that can only be earned via Easter egg behaviors:
- *The Diamond Hands* — answer 10 hard questions consecutively without skipping.
- *The Insider* (visual: ankle bracelet 🦶) — get an insider trading question wrong twice in a row. The title is awarded with a deadpan toast: "You've been flagged."
- *The Whistleblower* — report a typo via the existing feedback path (if any) or via a Konami-style tap pattern.
- *Mr. Market* — finish a session at exactly :30 past the hour.
- *The Quant* — complete 100 calculation-tagged questions.

These are not advertised. Discovery is the reward.

---

## M6. The Greed Index — Variable Reward Multipliers

### What
A daily "market state" that gives a session-level XP multiplier and a flavor of difficulty modifier. State is randomized each morning. Visible at top of home screen as a Fear & Greed-style dial.

### Why it works
- **Variable ratio reinforcement** (Skinner; slot machine theory): an unpredictable multiplier creates anticipation that a flat 1x rate cannot. The user wants to "check in" daily just to see today's modifier.
- **Loss aversion in reverse — opportunity FOMO**: a 2x XP day you don't show up for is a "loss." Pulls users in even when motivation is low.
- **Anchoring with theme**: tying the multiplier to a Fear/Greed Index is *culturally on-brand* for the audience. CNN's Fear & Greed Index is a real, recognized artifact.

### Concrete UX spec
- 5 states, daily roll (seeded from date so all instances agree, not user-specific):
  - **EXTREME FEAR** (10%): 0.75x XP, but +50% Hot Sheet review value. "The market is rattled. Focus on what you know."
  - **FEAR** (20%): 1x XP, +1 freeze charge progress. "Cautious tape."
  - **NEUTRAL** (40%): 1x XP, no modifier.
  - **GREED** (20%): 1.5x XP. "Risk-on. Bonuses everywhere."
  - **EXTREME GREED** (10%): 2x XP, but missed questions cost double from your daily goal. "FOMO bid."
- Top-of-home dial widget shows the state with a stylized Fear/Greed gauge SVG.
- One-line flavor copy below the dial changes daily.
- Sessions show the active multiplier inline ("+15 XP × 1.5 GREED = +23 XP") so the user feels the variable reward in real time.

### FINRA-fit angle
Fear/Greed is a serious analyst tool, not a kid's mechanic. Adult finance users will *grin* at this — it's their world reflected back. It also doubles as passive education about market sentiment terminology.

### Implementation complexity
**S–M** (2–4 hrs). State rolling, multiplier plumbing through `recordAnswer`, dial component.

### Files to touch / create
- New: `src/lib/greedIndex.ts` — daily seeded state + multiplier.
- Modify: `src/stores/progress.ts` `xpForAnswer` to accept a multiplier, OR wrap caller.
- New: `src/components/GreedDial.tsx` (SVG gauge).
- Modify: home page, exam result, quiz reveal to display multiplier.

### Quirky bonus angle
Once every ~60 days (seeded), trigger a **BLACK SWAN** day: 3x XP, all questions show a faint "🦢" watermark, and the home screen background subtly tints. No announcement, no notification. The user just has to notice. Becomes a "did you catch the black swan day?" memory — extremely rare events that the rare appreciator notices.

---

## M7. Near-Miss Boss Battles — Exam Sim with Stakes

### What
A new full-length timed exam mode with **calibrated difficulty curve** designed around the near-miss principle from slots/Candy Crush, and a visible win/loss outcome that affects a stats history.

### Why it works
- **Near-miss effect** (Reid 1986; Clark et al. 2009): outcomes just below winning (e.g. 69% vs 70% passing) trigger stronger return-play behavior than clear losses. Slot machines exploit this; we deploy it ethically (because retaking the test is good for you).
- **Sunk cost + identity**: a 90-minute exam attempt creates psychological investment. The result becomes part of the user's history they want to improve.
- **Boss battle framing**: makes a slog (75-question exam) feel like a heroic test rather than homework.

### Concrete UX spec
- Existing exam flow gets a "Boss Mode" framing:
  - Pre-exam screen: stylized "PROCTOR HAS ENTERED THE ROOM" intro card with countdown. Quiet, no childish animation.
  - Question pool weighted: 60% medium, 25% hard, 15% easy. We are designing for ~68–74% scores — right at the near-miss zone for SIE's 70% pass line.
  - During exam: a small "passing pace" indicator shows whether they're on track for the pass line.
  - Result screen for **near-miss** (65–69%):
    - Dramatic copy: "**67%. Two points short.** Run it back?"
    - One-tap "Retake (different questions)" CTA.
    - Topic breakdown highlighting the 2–3 questions that "would have flipped it" (highest-leverage misses).
  - Result for clean pass (≥70%): "PASSED. Mocked." + a "First Pass" / "5th Pass" / "100th Pass" badge if applicable.
  - Result for clear fail (<60%): supportive copy + auto-build a 25-question remediation drill from missed topics.
- Exam History view shows pass/fail streaks like a stock chart line.

### FINRA-fit angle
The real FINRA SIE is pass/fail at 70%. We're using the **actual test's psychology** — the near-miss is intrinsic to the user's situation. The product isn't manufacturing the tension; it's surfacing it visually. This is the most direct serve-the-user mechanic.

### Implementation complexity
**M** (half-day; exam engine already exists per CLAUDE.md).

### Files to touch / create
- Modify: existing exam engine component to wire the new result branches.
- New: `src/lib/nearMiss.ts` — identifies "flipping" questions.
- New: `src/components/ProctorIntro.tsx` and `src/components/ExamResultCinematic.tsx`
- Modify: `src/stores/progress.ts` to track `examHistory` (JSON: array of `{date, exam, score, pass, durationSec}`).
- New: `src/pages/exam-history.astro` + `src/components/ExamHistoryChart.tsx` (sparkline-style).

### Quirky bonus angle
On the proctor intro, render a **fake exam center clock** at the top — the classic ugly white IBM clock found in every real testing center. Adds a Pavlovian "oh god, I'm in the room" feeling. Bonus: the clock face displays the user's real local time. Total micro-detail that makes the experience feel cinematic.

---

## 2. Mechanics Considered & Rejected (with reasoning)

Recording these so the implementer doesn't accidentally re-introduce them.

- **Lives / Hearts system (Duolingo)**: Punishes errors that ARE the learning event. For an exam app, getting questions wrong is desirable difficulty (Bjork). Rejected.
- **Leagues / Leaderboards**: Requires multi-user backend; we are offline-only. Could be revisited only with the M4 share-string parsing trick, but full leagues are out of scope.
- **Animated mascot / owl character**: Fails the Goldman-analyst test. Adults rage-quit this.
- **Dust on uncompleted lessons (Duolingo Path)**: Visual decay is anxiety-inducing for adult learners who *already* feel guilty about studying. Inverts our re-entry ritual goal.
- **Energy/timer-gated study sessions**: We want them to study MORE, not less. Inverts user incentive.
- **Gacha / loot boxes**: Regulatory grey area in finance app + cringe for audience.
- **Avatars/dress-up**: Doesn't fit adult professional positioning. Replaced by Trader ID titles (M5).
- **Push notifications with cartoon character voice**: Replaced with terse Bloomberg-alert-styled local notifications (see Section 4 — notifications addendum).

---

## 3. Cross-Cutting Polish (the "juice" layer)

These apply across mechanics. Add as a final polish pass.

### 3a. Haptics
- Correct answer: `Capacitor.Haptics.impact({ style: 'Light' })`
- Streak milestone hit: `Heavy`
- Hot Sheet card closed: `Selection`
- Vault token earned: `Heavy` + 100ms delay + `Heavy` again (double thump)

### 3b. Sound (optional / muted by default)
- Correct: subtle "tick" (NYSE bell tick clone, 50ms).
- Streak break: ominous low piano note (one only — don't traumatize).
- Black Swan day appearance: a single distant gong on first home load that day.
- Setting toggle in `/settings`. Default OFF for App Store review reasons (iOS users hate surprise sound).

### 3c. Micro-copy voice
Wall Street deadpan. Examples:
- "Markets reopen."
- "Position closed. New run begins."
- "The bell has rung. One attempt."
- "Proctor has entered the room."
- "Hot Sheet cleared. Tomorrow's docket pending."

Avoid: emoji-laden cheerleading ("Way to go!!! 🎉🎊🥳"), exclamation marks more than 1 per screen, mascot speech.

### 3d. Dark mode
Tailwind CSS 4 supports `dark:` variants. Implement once; the financial-terminal aesthetic *demands* dark mode by default for the iOS app. This is also a major adult-app signal — kid apps are usually light-only.

### 3e. Animations (Framer-Motion-Lite or Tailwind transitions)
- Confetti = no. Replace with a single subtle gold particle burst for milestones.
- Number tickers should *count up* (CountUp.js or hand-rolled `requestAnimationFrame`), never just appear.
- Cards animate in with a translateY+opacity, not a bounce.

---

## 4. Notifications (Capacitor LocalNotifications, fully offline)

Schedule these locally — no backend, no remote push needed.

- **9:25 AM daily**: "Bell in 5 minutes. 47-day run on the line." (Only fires if streak ≥ 3 to avoid bothering brand-new users.)
- **8:30 PM daily**: "Hot Sheet has 7 cards due." (Only fires if cards due AND user hasn't opened app today.)
- **11:45 PM**: streak risk alert. "23-day run closes in 15 minutes. 3 questions to save it." (Only if dailyAnswered < 3 floor.)
- **Black Swan day**: silent badge update only. Discovery is the joy. Do NOT notify.

Voice rule: terse, factual, with a number. Never cute, never urgent-screaming, never apologetic.

---

## 5. Telemetry Note (none, but track-able locally)

We can't ship analytics (offline + no backend), but we can track *for the user* in a `/stats` page:
- Day-of-week study patterns (weak day → notification timing suggestion)
- Hour-of-day patterns
- Topic accuracy heatmap
- Best/worst sessions

This doubles as a private engagement loop (vanity metrics) AND a study tool. Adults love a personal dashboard.

---

## 6. Execution Order (the ship sequence)

Numbered. Each line ends with a **ship test** — the single observable behavior that confirms it works.

1. **M5 — Trader ID + Identity Header (half-day).** Foundation everything else hangs identity off of.
   - Ship test: open app, see "Intern" under handle in header; hit 500 XP, header updates to "Junior Associate" without reload.
2. **M2 — Streak Vault + Freeze + Re-entry (half-day).**
   - Ship test: complete 7 days, earn 1 freeze visible in header; skip a day, freeze auto-consumed; skip 2 days, see "Markets reopen" modal next launch.
3. **M1 — Opening Bell (half-day).**
   - Ship test: between 9:30 AM and midnight, home shows "Bell rung today" or pending state; complete it once and second attempt is blocked.
4. **M6 — Greed Index (2–4 hrs).**
   - Ship test: dial visible on home; XP earned reflects multiplier; same dial state shown on two devices on same date (deterministic seed verification).
5. **M3 — Hot Sheet / SRS (full day).**
   - Ship test: get 3 questions wrong, see 3 cards in Hot Sheet "NEW" ring; close them, see ring fill; next day they reappear under "REVIEW."
6. **M4 — Share String (half-day).**
   - Ship test: after Bell or exam completion, tap Share → clipboard contains correctly formatted string with topic emoji grid.
7. **M7 — Near-Miss Boss Battle Exam (half-day).**
   - Ship test: complete a mock exam scoring 65–69%; see "Two points short" near-miss screen with specific flip-questions highlighted.

### Then polish layer (M5–M6 of week):
8. **Dark mode + haptics + micro-copy pass (half-day).**
   - Ship test: every screen passes a dark-mode visual check; correct answer produces an iOS haptic.
9. **Local notifications wiring (2 hrs).**
   - Ship test: install on iOS, see 9:25 AM Bell notification fire with terse copy.
10. **Easter eggs (M5 secret titles, Black Swan day, fake Bloomberg ticker on Bell results) (half-day).**
    - Ship test: trigger 10 hard-question streak → "Diamond Hands" title silently awarded and viewable in `/identity`.

### Total: 5–6 days of focused work, with buffer for polish and testing.

---

## 7. Final Notes for the Implementer Agent

- Do not touch question content. Mechanics layer over data.
- Reuse existing `recordAnswer` flow — wrap it for multipliers, don't fork it.
- Keep `nanostores` as the only state primitive. Don't introduce Redux/Zustand.
- All persistent data must survive an iOS app reinstall? No — `localStorage` resets. Acceptable.
- Test on physical iPhone in WKWebView early — haptics and notifications behave differently from browser dev.
- When uncertain, **resist adding more**. Restraint is the differentiator.
- The voice is Michael Lewis, not Mr. Rogers.

---

*End of playbook.*
