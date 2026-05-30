# App Store Release Playbook — FINRA Exam Prep

A copy-paste checklist to take this from "builds on device" to "live on the App Store." Steps are ordered; nothing below can be skipped without losing a review cycle.

---

## 0. Prerequisites (you, once)

- [ ] **Apple Developer Program membership** ($99/yr). Sign up at https://developer.apple.com/programs/
- [ ] **App Store Connect** access. Same account.
- [ ] **Xcode 16+** installed locally with command-line tools (`xcode-select --install`).
- [ ] **Privacy policy URL** hosted somewhere stable (GitHub Pages is fine — a single static page is enough).
- [ ] **Support URL** hosted (a GitHub issue list works, or a `mailto:`).

---

## 1. Project configuration (in repo)

- [x] `ITSAppUsesNonExemptEncryption` = `false` in `ios/App/App/Info.plist` (we don't use custom crypto). Already set.
- [x] App display name `FINRA Exam Prep` in `Info.plist > CFBundleDisplayName`.
- [x] Bundle identifier `com.maadhavkothari.finraprep` in `capacitor.config.ts`.
- [ ] Bump marketing version: in Xcode → App target → General → Version (e.g. `1.0.0`) and Build (e.g. `1`).
- [ ] Re-sync once: `npm run ios:sync`.

---

## 2. App Store Connect setup (one-time)

In https://appstoreconnect.apple.com → "+" → New App:

| Field | Value |
|---|---|
| Platform | iOS |
| Name | `FINRA Exam Prep` |
| Primary language | English (U.S.) |
| Bundle ID | `com.maadhavkothari.finraprep` (must match Xcode) |
| SKU | `finraprep-ios-001` |
| User Access | Full Access |

---

## 3. Metadata (paste these into App Store Connect)

### Subtitle (max 30 chars)
> `SIE, Series 7, 6, 63, 65, 66`

### Promotional text (max 170 chars, updateable without review)
> 100% free FINRA exam prep. Mock exams, drills, spaced-repetition Hot Sheet, daily Opening Bell. No ads, no subscriptions, no tracking. Built for the 6 train.

### Description (max 4000 chars)

```
FINRA Exam Prep is a focused, ad-free study tool for the SIE and all major FINRA securities exams: Series 6, 7, 63, 65, 66, plus extras (Series 3, 24, 79).

Built for people who study on the subway, at lunch, between meetings. Every interaction resolves in under 90 seconds.

WHAT'S INSIDE
• 600+ practice questions across 9 exams, written from the official FINRA content outlines
• Full-length timed mock exams with the real FINRA pass-line and a near-miss debrief
• Drill mode by topic, with answer rationales for every choice (not just the correct one)
• Quizlet-style Learn mode: 3-phase escalation from multiple choice → fill-in → free recall
• Flashcards with Leitner-box spaced repetition
• The Hot Sheet — a spaced repetition system for the questions you got wrong, on an Ebbinghaus forgetting-curve schedule

THE STUDY LOOP
• Opening Bell — a single 5-question set unlocking daily at 9:30 AM. One shot, then it's gone.
• Streak Vault — tracks daily study runs with weekly-earned Freezes and a "Markets reopen" recovery ritual
• Trader ID — promotion ladder from Intern → MD → Partner based on XP
• Greed Index — a daily seeded XP multiplier styled after CNN's Fear & Greed
• Progress dashboard with activity heatmap, accuracy by topic, and a streak calendar

LEARNING SCIENCE BUILT IN
• Spaced repetition based on SM-2
• Variable reward schedules to keep you engaged without manipulating you
• Loss-aversion framing for streaks (you actually keep your run)
• Bjork-style desirable difficulty — wrong answers are the learning event, not punishment

INVESTIGATIONS
Bonus: 8-chapter walkthroughs of the Enron, GameStop, 2008 Financial Crisis, and FTX scandals. Optional, but they cement regulatory concepts.

WHAT IT IS NOT
• Not affiliated with or endorsed by FINRA
• No ads, no in-app purchases, no subscriptions
• No accounts, no tracking, no telemetry, no cloud backup. Your data lives on your phone.
• No mascots, no streak shame, no surprise notifications

REQUIREMENTS
• iPhone running iOS 14+
• Internet not required after first launch
```

### Keywords (max 100 chars, comma-separated)
> `FINRA,SIE,Series 7,Series 6,Series 63,Series 65,Series 66,securities,exam prep,broker dealer`

### Support URL
> Your GitHub issues page or a personal contact form

### Marketing URL (optional)
> Project site / personal site

### Category
- **Primary:** Education
- **Secondary:** Finance

### Age Rating
- All categories: **None**
- Result: **4+**

### Copyright
> `© 2026 Maadhav Kothari`

---

## 4. Privacy

The App Store requires a privacy "label." This app collects nothing. Fill in:

- **Data collection:** No
- **Tracking:** No (we don't use ad identifiers)
- **Third-party SDKs:** Capacitor + iOS frameworks only

A privacy policy is still required even if you collect nothing. Minimal text:

```
FINRA Exam Prep does not collect, transmit, or share any personal data.
All study progress, answers, settings, and streak history are stored locally
on your device using browser localStorage. The app makes no network requests
after the initial install. There are no analytics SDKs, no advertising
identifiers, and no third-party trackers.

Local notifications (if enabled) are scheduled and fire entirely on-device
via Apple's UserNotifications framework. No server is involved.

Contact: [your email]
Last updated: [date]
```

Host this as a single HTML page (your GitHub Pages site works) and put the URL in App Store Connect.

---

## 5. Screenshots (you have to make these)

App Store requires screenshots at these sizes:

| Device | Size | Required |
|---|---|---|
| 6.9" iPhone 17 Pro Max | 1320 × 2868 | **Yes** (one set covers all) |
| 6.5" iPhone 11 Pro Max | 1242 × 2688 | Optional fallback for older OS |
| 13" iPad Pro | 2064 × 2752 | Only if you support iPad — set `LSRequiresIPhoneOS` to keep iPhone-only |

Recommended screens to capture (5–8 total):
1. **Home** with Greed Index dial visible
2. **Opening Bell** mid-question with rich choice rendering
3. **Mock exam** result screen with near-miss copy
4. **Trader ID** page showing the rank ladder
5. **Streak Vault** with bearer-bond tokens
6. **Hot Sheet** three-ring dashboard
7. **Investigations** Enron walkthrough
8. **Settings** showing dark mode + sound toggles

Capture in Xcode simulator: Hardware → Device → iPhone 17 Pro Max, then ⌘S to save to desktop. Or run on device and use the screenshot button.

---

## 6. Signing & build

In Xcode:

1. Open `ios/App/App.xcworkspace` (NOT .xcodeproj).
2. Select the `App` target → Signing & Capabilities.
3. Team: select your Apple Developer team.
4. Bundle ID: `com.maadhavkothari.finraprep` (must match App Store Connect).
5. Automatically manage signing: ✅.
6. Product → Archive (top menu). Wait 2–5 minutes.
7. Once the Organizer opens with the archive: Distribute App → App Store Connect → Upload.
8. Pick the team again, confirm, upload. The build appears in App Store Connect after Apple's automated processing (~10–30 min).

---

## 7. Submit for review

In App Store Connect once the build appears:

1. App Store tab → 1.0 Prepare for Submission.
2. Attach the build.
3. App Review Information: phone number + email + optional notes.
4. Version Release: "Automatically release this version" or "Manually release."
5. Submit for Review.

Review time: typically 24–48 hours. First submissions sometimes take longer.

---

## 8. Likely review rejections to pre-empt

- **Guideline 2.1 (Functionality)** — review on Wi-Fi and Cellular before submitting; Bell, exam, drill all need to load without server calls.
- **Guideline 4.0 (Design)** — make sure the app handles being backgrounded mid-exam without losing state. The Capacitor App plugin is wired so this should already work.
- **Guideline 5.1.1 (Data Collection and Storage)** — we don't collect anything, but make sure the privacy policy URL resolves.
- **Guideline 1.4.5 (Capital markets)** — financial apps sometimes get flagged. Our copy is explicit that we are not affiliated with FINRA and don't offer financial advice. Keep the disclaimer in the footer.

---

## 9. Post-launch

- Monitor crashes via App Store Connect → Analytics.
- Iterate copy via the "Promotional text" field — updateable without new build.
- For new question content, ship as a normal version bump; data is bundled in the binary.

---

*Built with restraint. Ship it.*
