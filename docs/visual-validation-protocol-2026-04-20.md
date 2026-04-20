# Visual Validation Protocol 2026-04-20

This document records the project-specific protocol for screenshot-based UI review in `spin-clash`.

It exists because an attached-browser screenshot chain was proven unreliable during shell review on 2026-04-20.

The failure mode was not subtle:
- screenshots captured only part of the visible page
- alignment and anchoring did not match the player's real window
- diagnostic overlays showed coordinate mismatch

That means the chain was useful for finding some runtime problems, but not trustworthy enough for layout or aesthetic approval.

## 1. The Core Rule

No visual approval may be based on screenshots unless the capture method is trusted.

If the screenshot method is not trusted, the review is not complete.

## 2. Evidence Hierarchy

Use evidence in this order:

1. user-supplied screenshots from the real visible browser window
2. screenshots from a trusted Codex browser proxy chain that has been explicitly validated
3. automated attached-browser screenshots used only for structural debugging

Only levels `1` and `2` are valid for final design judgement.

Level `3` may help find:
- missing overlays
- broken route transitions
- obvious element absence
- shell stacking bugs

Level `3` may not be used to approve:
- composition
- hierarchy
- spacing
- polish
- viewport balance
- mobile/desktop visual quality

## 3. Invalid Evidence Triggers

Any screenshot chain becomes invalid for design review if one or more of these happens:

- only a corner or partial slice of the page is captured
- the screenshot center does not match the visible window center
- diagnostic corner markers appear in the wrong positions
- browser chrome, scale, or viewport mapping are inconsistent
- attached-page screenshots differ materially from what the user visibly sees

Once invalidated, that chain stays invalid until revalidated.

## 4. Direct CDP Warning

For this project, direct CDP attachment to a live user Chrome session must be treated as high risk.

Reasons:
- viewport mapping may drift
- user-window state may not equal page screenshot coordinates
- existing session tabs, DPI, zoom, or window state can distort capture results

So:
- direct attached Chrome CDP screenshots are not trusted by default
- they require explicit revalidation before they can be used for design approval
- in practice, visual approval should use either real visible-window screenshots or a revalidated Codex browser proxy chain; other automated capture routes are not accepted

## 5. Revalidation Standard

A browser screenshot chain may be treated as trusted only if all of these are true:

- the screenshot covers the full intended viewport
- a diagnostic overlay lands in the correct corners and center
- the captured page matches what the user visibly sees
- no unexplained crop, offset, or anchoring drift remains

If any one of these fails, revert to real user-window screenshots.

## 5A. Tooling Rule

`scripts/local-browser-qa.js` may be used for structural debugging, route checks, and evidence gathering.

It may not be used as a final visual-approval tool.

If a workflow enters `visual approval` mode:
- only a revalidated Codex browser proxy chain is accepted for automated screenshots
- otherwise use real user-window screenshots

## 6. Agent Workflow Rule

When doing UI work on `spin-clash`:

1. use automated screenshots for fast structural debugging if helpful
2. do not treat them as final evidence unless the capture chain is trusted
3. if the chain is questionable, ask for real window screenshots
4. only then give design judgement or request a human playtest

## 7. Practical Meaning

This protocol is meant to avoid two recurring failures:

- wasting user time on reviews based on wrong screenshots
- approving shell changes that only look correct inside a broken capture pipeline

For `spin-clash`, screenshot trust is part of QA correctness, not a nice-to-have.

## 8. Desktop + Mobile Replay Requirement

For major shell, HUD, battle, and settlement UI changes, visual validation is not complete after a desktop-only replay.

The project standard is:

1. run a trusted proxy-chain replay for `desktop`
2. run a trusted proxy-chain replay for `mobile`
3. review both before asking for human visual acceptance

This rule exists because `spin-clash` is expected to be primarily played on phones, so mobile layout, tapability, HUD readability, and result-screen clarity are first-class acceptance criteria rather than secondary spot checks.
