# CrazyGames Submission Asset Plan 2026-04-23

This document turns the CrazyGames submission requirement set into a concrete asset-production plan for `Spin Clash`.

It is intentionally practical:
- what the platform requires
- what this repo already has
- what is still missing
- which assets should use screenshots
- which assets should use AI-assisted key art

## 1. Platform Constraints Re-Checked

CrazyGames currently requires:
- 3 cover images:
  - landscape `1920x1080`
  - portrait `800x1200`
  - square `800x800`
- a preview video:
  - `15-20` seconds max
  - `50MB` max
  - `1080p` landscape mandatory
  - portrait video optional

CrazyGames also explicitly recommends:
- do not just upload a raw gameplay screenshot
- keep the cover simple and readable
- put the game title on the cover
- do not add other marketing copy such as:
  - `Play now`
  - `New`
  - `Updated`
- do not add store icons or unrelated logos

Official references:
- `https://docs.crazygames.com/requirements/game-covers/`
- `https://docs.crazygames.com/requirements/intro`
- `https://docs.crazygames.com/requirements/technical/`
- `https://docs.crazygames.com/requirements/gameplay/`

## 2. Current Build Readiness

Current local release package:
- file count:
  - `63`
- total package size:
  - `13.22 MB`

Practical meaning:
- current total package size is already well below the CrazyGames Basic Launch size limits
- package/file count is not the current blocker
- the missing work is presentation and distribution-specific polish, not raw package size

## 3. Current Asset Inventory

### Best current screenshot candidates

These are the strongest current repo-local visual sources for marketing work.

#### Hero / title-shell source
- `output/home-preview-unlocked.png`
  - current size:
    - `1002x1821`
  - best use:
    - portrait cover base
    - square cover base
  - strengths:
    - strongest subject presentation of the top itself
    - already looks more like a product surface than a debug screenshot
  - weaknesses:
    - contains a lot of UI text
    - current captured locale is not the cleanest marketing language state

#### Gameplay action source
- `output/tmp-verify/battle-impact.png`
  - current size:
    - `390x844`
  - best use:
    - motion reference only
    - not final export
  - strengths:
    - strongest visible battle energy
    - ring and impact effects read well
  - weaknesses:
    - too small
    - portrait only
    - heavy UI chrome

#### Wide battle/result source
- `output/proxy-visual-flow-video-2026-04-20T15-10-59/12-match-result.png`
  - current size:
    - `3840x1823`
  - best use:
    - wide composition reference
    - trailer/source framing
  - strengths:
    - high resolution
    - already desktop-wide
  - weaknesses:
    - result overlay dominates
    - not ideal as a direct storefront cover

#### Wide shell / quick-battle source
- `output/real-player-window-2026-04-20-pass2/quick.png`
  - current size:
    - `1920x911`
  - best use:
    - environment/background reference
  - strengths:
    - wide aspect ratio
    - useful for cover composition blocking
  - weaknesses:
    - current framing is not yet a strong storefront image

### Core conclusion

Current screenshots are good enough to:
- build references
- build preview-video shots
- support AI-assisted paintover / composite work

Current screenshots are **not** good enough to:
- serve as final CrazyGames cover uploads without cleanup

The biggest reason is not resolution.
It is:
- too much UI
- inconsistent locale/state
- screenshots optimized for QA rather than storefront conversion

## 4. Recommended Asset Strategy

Use a mixed pipeline:

### Route A. Screenshot-first for preview video
- use real gameplay captures
- keep the footage authentic
- trim away dead time and menu hesitation

### Route B. AI-assisted key art for the 3 covers
- use existing screenshots as visual references
- do not let the generator invent a different game identity
- keep the final image anchored to:
  - dark neon arena
  - teal / cyan / gold palette
  - spinning top subject
  - `SPIN CLASH` as the only text

Why this split is correct:
- CrazyGames explicitly discourages raw screenshots as final covers
- gameplay preview video should look real
- your current repo already has enough strong in-engine visual language to anchor AI-assisted covers without drifting into generic slop

## 5. Art Direction Lock

### Visual spine
- dark arena background
- cyan / teal energy as primary accent
- gold as secondary reward/combat accent
- one hero top or two-top clash as the core subject
- title:
  - `SPIN CLASH`
  - only title text on cover

### What the covers should communicate
- not "menu-heavy browser UI"
- not "retro toy catalog"
- not "mobile idle game"

They should communicate:
- fast arena combat
- clean neon sci-fi toy-sport energy
- controlled intensity instead of noisy chaos

### What to remove from marketing covers
- small UI labels
- health bars
- reward buttons
- localization toggles
- SCRAP counters
- debug or result copy
- any non-title text

## 6. Concrete Deliverables

### A. Landscape cover `1920x1080`

Best concept:
- two tops in active clash inside the arena
- visible motion arcs
- title centered or upper-third
- minimal background UI, mostly removed

Recommended source blend:
- action base from:
  - `output/tmp-verify/battle-impact.png`
- arena/background reference from:
  - `output/real-player-window-2026-04-20-pass2/quick.png`

### B. Portrait cover `800x1200`

Best concept:
- one hero top as dominant subject
- arena glow below
- title above the subject
- compact composition for small-screen browsing

Recommended source blend:
- hero subject from:
  - `output/home-preview-unlocked.png`
- effects language from:
  - `output/tmp-verify/battle-impact.png`

### C. Square cover `800x800`

Best concept:
- close-up hero top
- thicker glow ring
- tight title lockup
- clean negative space

Recommended source blend:
- crop and repaint from:
  - `output/home-preview-unlocked.png`

### D. Preview video `15-20s`

Best first cut:
1. `0-3s`
   - title/home hero shot
2. `3-7s`
   - match preparation / launch framing
3. `7-13s`
   - strongest clash / spin / burst action
4. `13-17s`
   - ring-out or decisive finish
5. `17-20s`
   - match result / fast recovery back to battle shell

Hard rules:
- no opening logo slate
- no black intro frames
- no mouse cursor
- no sound
- no fake fast-forward

## 7. Missing Captures Still Worth Producing

Before final asset production, capture these dedicated marketing shots:

### Capture 1. Clean English home hero
- target:
  - desktop
- state:
  - English locale
  - no debug
  - strongest-looking unlocked top selected
- goal:
  - source for portrait and square cover

### Capture 2. Clean battle-action close shot
- target:
  - desktop and mobile
- state:
  - during a strong impact or ring-out moment
- goal:
  - high-energy action base for the landscape cover

### Capture 3. Clean wide arena battle shot
- target:
  - desktop 16:9
- state:
  - active combat
  - both tops visible
  - no result overlay
- goal:
  - preview-video opener and landscape compositing base

### Capture 4. Finish-state victory shot
- target:
  - desktop 16:9
- state:
  - readable result moment
- goal:
  - preview-video ending beat

## 8. AI Image Prompts

Use these only as controlled marketing-art prompts.
They should stay close to your actual in-game visual language.

### Landscape prompt

```text
Create polished storefront key art for a browser arena battler called SPIN CLASH. Two futuristic spinning tops collide inside a dark neon arena with teal and cyan energy trails, subtle gold sparks, and a clean sci-fi sports look. Keep the composition simple and readable like a premium game cover, with SPIN CLASH as the only text. No UI, no extra copy, no logos, no characters, no clutter, no store badges.
```

### Portrait prompt

```text
Create portrait game cover art for SPIN CLASH. A single hero spinning top hovers above a glowing circular arena pedestal in a dark minimalist neon environment. Use teal, cyan, and restrained gold accents. Make it clean, premium, readable at small size, and include only the title SPIN CLASH. No UI, no extra text, no background characters.
```

### Square prompt

```text
Create square thumbnail cover art for SPIN CLASH. Show one futuristic spinning top in close-up with a glowing teal arena ring and crisp contrast on a dark background. The image should feel sleek, high-speed, and readable even as a small storefront tile. Include only the title SPIN CLASH. No UI, no extra text, no badges.
```

## 9. Submission Readiness Decision

### Ready now
- package size / file count
- basic screenshot references
- title and visual identity direction

### Not ready yet
- final CrazyGames covers
- final preview video
- a dedicated CrazyGames-targeted build pass

## 10. Immediate Next Step

The fastest correct sequence is:
1. capture 4 clean marketing screenshots in English
2. use those shots as references for cover generation / compositing
3. produce the 3 required covers
4. cut the `15-20s` preview video from real gameplay footage
5. then open the dedicated CrazyGames submission track

## 11. Current Generated Capture Set

The first dedicated marketing-source run has already been generated locally.

- script:
  - `npm run capture:marketing`
- latest successful output at the time of writing:
  - `output/marketing-captures-2026-04-23T08-19-44`
- generated files:
  - `01-home-hero-wide-en.png`
  - `02-home-hero-panel-en.png`
  - `03-home-top-stage-en.png`
  - `04-quick-shell-en.png`
  - `05-battle-action-ui-01.png`
  - `06-battle-action-ui-02.png`
  - `07-battle-action-clean.png`
  - `08-battle-round-result-en.png`
  - `09-battle-finish-en.png`
  - `manifest.json`
  - `report.md`
  - `cover-board.html`
  - `cover-board-preview.png`

Practical meaning:
- the project no longer depends on ad-hoc manual screenshots for the first CrazyGames asset pass
- the current best immediate source images are:
  - `01-home-hero-wide-en.png`
  - `03-home-top-stage-en.png`
  - `07-battle-action-clean.png`
- a first storefront-crop preview board now also exists:
  - `cover-board.html`
  - `cover-board-preview.png`
