# Kana Quiz — Roadmap, Architecture Notes & iOS Strategy

**INTERNAL — not linked publicly**

---

## Current Version: v10

### Feature Summary

**Core quiz loop**
- Random kana card drawn from weighted deck (see Weighting below)
- Auto-starts microphone after first user gesture; fully hands-free thereafter
- STT: browser Web Speech API (`ja-JP`) or Whisper WASM (local, ~75MB, cached)
- Correct: arpeggio sound, green flash, alt-font variants shown, romaji displayed, 1200ms then next card
- Wrong: descending tone, progressive hints (1st: show romaji; 2nd: blink green; 3rd+: speak aloud via TTS)
- Mic restarts ~280ms after wrong sound ends; 1400ms after TTS speaks
- `no-speech` browser STT error → auto-restart (continuous listening)

**Romanization engine (`toRomaji`)**
- Language-config object (`LANG_JA`) with pair map, char map, small-tsu doubling, elongation strip
- All STT output converted to romaji before matching — handles hiragana/katakana/kanji/numbers/latin
- Syllable-boundary match: "いや" scores correct for や, "ika" scores correct for か
- Phonetic alts table for English-speaker pronunciations (car→ka, knee→ni, etc.)
- `getPossibleReadings()` stub ready for kanji dictionary expansion

**Matching improvements by kana**
- ひ (hi): accepts "he" — correct Japanese pronunciation, STT returns either
- ぬ (nu): accepts noo/new/nunu — nu is hard for STT
- る (ru): accepts roo/loo/rue/roux — STT rarely returns "ru" for English speakers
- を (wo): accepts oh/whoa/woe — STT artifact
- と (to): accepts doh/dough/toe — STT artifact
- え (e): accepts eh/ae/hey — very hard for STT to isolate
- ん (n): accepts na/en/m — genuinely ambiguous
- つ (tsu): accepts 中 kanji — STT artifact

**User profile (localStorage)**
- Per-kana stats: `seen`, `correct`, `incorrect`, `symStreak`, `flagged`, `fonts`
- `symStreak`: consecutive correct (cross-session, other symbols may intervene)
- Streak reward at 5: `incorrect = floor(sqrt(incorrect))`, special case 1→0
- `flagged`: user-set difficulty flag, 5% auto-clear chance on correct answer

**Deck weighting**
- Unseen: weight 1.0
- Mastery < 33%: weight 2.5 (struggling)
- Mastery 33–67%: weight 1.6 (needs work)
- Mastery ≥ 67%: weight 0.5 (mastered)
- Flagged: +10–20% on top

**Mastery score**: `hits / (sqrt(misses) + hits)`, clamped 0–1

**Difficulty flagging**
- Click the kana character → speaks it AND sets flagged=true
- Say phrases like "hard", "fuck", "forgot", "give up", "what is it", etc. → flags symbol, restarts mic (no wrong count)
- Flagged symbols appear ~10–20% more often via weight multiplier

**Display**
- 5 fonts (Shippori Mincho, Noto Serif JP, Noto Sans JP, M PLUS 1p, Kaisei Decol) — random per card
- Correct: 2 alt-font variants fade in below main char + romaji label beneath them
- Hiragana label: teal; Katakana label: purple
- Per-symbol stats: hit/miss counts + mastery bar shown under each new card
- On correct: large green romaji answer shown
- On wrong: heard text + romaji conversion shown
- Global stats row: symbols seen, avg mastery %, needs-work count, mastered count
- Session scores: correct, streak, total, % correct

**Sound effects (Web Audio API, no files)**
- Correct: ascending C major arpeggio (C5→E5→G5→C6)
- Wrong: descending sine 300→220Hz, 280ms
- (Sounds.ready() stub kept for possible future use)

---

## Planned Features (Later)

### Learning / Progression
- Proficiency-based unlocking: start with small subset (vowels + か row), unlock new chars when hitting threshold (e.g. 80% mastery over 10 attempts). Configurable group size + threshold.
- Spaced repetition weight: factor in time-since-last-seen alongside mastery
- Configurable pacing settings UI

### Gamification
- Laser explosion animation: characters fly toward viewer; lasers shoot from bottom corners on correct
- Multiple choice mode: hear the syllable, tap the correct kana
- Points system: harder/struggling symbols worth more points
- Game wrapper: kana knowledge as a game mechanic (e.g. powerups for correct answers in a side-scrolling or match game)
- Leaderboard (multi-user)

### Content
- Dakuten (が、ざ、だ、ば、ぱ rows) as optional mode
- Combination kana (きゃ、しゅ、ちょ etc.) mode
- Words / vocabulary mode (requires kanji dictionary layer in toRomaji)
- Kanji mode

### Multi-user
- Profile switcher UI (add/remove users)
- Per-user stats screen with full breakdown, sortable by mastery

### STT
- Local Whisper model: v10 uses Xenova/whisper-tiny via Transformers.js WASM
- Option 3 (future): native iOS `SFSpeechRecognizer` with `requiresOnDeviceRecognition=true`
- Investigate: whisper-small.en with Japanese, or distil-whisper for lower latency
- Investigate: Web Speech API tuning (`speechRecognitionTimeout`, aggressive stop on first phoneme)

---

## iOS Strategy Discussion

### Option A: WebView (WKWebView) embedding current web app
Wrap the HTML/JS app in a native WKWebView shell. Most existing code runs unchanged.

**Pros:**
- Ship fast — the whole working app is already there
- Cross-platform: same codebase serves web + iOS + (eventually) Android
- Whisper WASM runs in WKWebView on iOS 16.4+ (WebAssembly supported)
- JavaScript bridge (`WKScriptMessageHandler`) lets you call native Swift from JS and vice versa — can hook into Core ML, haptics, ARKit etc.
- Easier Android port: same HTML or a React Native / Flutter wrapper around it
- Vision Pro: WKWebView runs in visionOS, can be placed in a `RealityKit` scene
- App Store: WKWebView apps are allowed and common (many top apps do this)

**Cons:**
- Web Speech API NOT available in WKWebView — must use native STT and bridge it in
- WKWebView JS bridge adds ~1-3ms overhead per call (negligible for this use case)
- Can't match pure-native feel on iOS (scroll physics, transitions, fonts)
- Harder to pass App Store review if the app is "just a website" — needs clear native value-add
- In-app purchases require native StoreKit — needs bridge

**Verdict:** Very viable path. The key bridge needed is STT:
```swift
// Swift side: start SFSpeechRecognizer, post results to JS
webView.evaluateJavaScript("handleNativeSTT('\(result)')")
// JS side: window.webkit.messageHandlers.stt.postMessage({action:'start'})
```

### Option B: React Native / Flutter wrapper
Rewrite the app logic in React Native (TypeScript) or Flutter (Dart).

**Pros:**
- Better native feel, access to all native APIs directly
- Strong cross-platform story (iOS + Android + web via RN Web or Flutter Web)
- Larger ecosystem for audio, animations

**Cons:**
- Full rewrite — weeks of work
- Whisper on-device needs custom native module
- The current JS codebase becomes reference-only, not reused

### Option C: Native SwiftUI
Build a proper native app from scratch.

**Pros:**
- Best iOS performance, Vision Pro support, full SwiftUI/SwiftData/Core ML access
- `SFSpeechRecognizer` on-device = zero latency, excellent Japanese, no internet needed
- Core ML: could run a custom trained model for kana phoneme recognition
- Full StoreKit, HealthKit, notifications, widgets etc.

**Cons:**
- Full rewrite
- No Android path without separate codebase

### Recommendation

**Phase 1 (now):** WebView shell with native STT bridge.
- Build a minimal SwiftUI app with WKWebView loading the HTML
- Bridge `SFSpeechRecognizer` → JS (`handleNativeSTT`)
- Add haptic feedback (UIImpactFeedbackGenerator) on correct/wrong
- Submit to App Store as "early access"

**Phase 2:** Add native value-adds: Core ML pronunciation scoring, ARKit effects (laser explosions), StoreKit for premium features (more fonts, game modes).

**Phase 3 (optional):** Full SwiftUI rewrite once the feature set stabilizes and you understand what the game should be. Use v10 web version as a permanent spec/reference.

**On the "mess I don't understand" concern:**
The JS codebase is legitimately complex now — ~1500 lines with a lot of state. The most important modules to understand for a Swift rewrite are:
1. `toRomaji()` + `LANG_JA` — the romanization engine (~200 lines, well documented)
2. `accepted()` + `syllableMatch()` — the matching logic (~30 lines)
3. `masteryScore()` + `weightedPick()` — the learning algorithm (~30 lines)
4. `recordAttempt()` — the stats tracking (~25 lines)

These four components are the core intellectual property. Everything else is UI wiring. A Swift version would implement the same four functions and the rest would be native SwiftUI.

---

## Monetization Ideas
- Free tier: hiragana only, basic mode, no stats
- Premium ($3.99 one-time or $1.99/yr): katakana, combined mode, full stats, all fonts, game modes
- Vision Pro version: premium pricing ($9.99), 3D kana flying toward you
- "Kana Plus" word/kanji expansion: separate IAP
- The gamification wrapper (shooting game etc.) could be its own free app with kana as the mechanic, monetized via ads or premium game features

---

## File History
- kana-quiz/ — v7, original working version with basic STT
- kana-quiz_8/ — Whisper WASM added
- kana-quiz_9/ — syllable matching, mic restart fixes
- kana-quiz_10/ — weighted deck, mastery, symbol stats, difficulty flagging, global stats, type labels
