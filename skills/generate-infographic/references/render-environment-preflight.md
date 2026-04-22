# Render Environment Preflight

Use this before any Playwright render attempt.

## Goal

Prefer an already-available machine-level Playwright and Chromium runtime before downloading or installing anything.

## Required Checks

Check in this order:

1. Existing Playwright runtime
   - look for a usable Playwright CLI or module already available in the environment
   - prefer an already-known-good explicit module path when one is available
2. Existing Chromium runtime
   - check for a usable browser binary on PATH
   - if none is present on PATH, check Playwright-managed browser caches
   - prefer an existing machine-level or cached browser binary over a fresh install
3. Fallback install
   - only install a browser runtime if the prior checks fail

## Practical Rules

- “Not installed in the repo” does not mean “not installed on the machine.”
- Reuse the machine runtime when it is already available and compatible with the chosen Playwright path.
- Prefer explicit existing paths over a fresh `npx playwright install ...` path when they are already known to work.
- If Playwright is resolved through a different runtime path, verify whether that path already has a matching cached browser before installing.

## Render Path Preference

Prefer this order:

1. existing explicit Playwright module plus existing explicit Chromium binary
2. existing Playwright CLI or module plus existing Playwright browser cache
3. fallback install only when neither path is available

## Manifest Trace

Record enough information to explain the render choice:

- whether existing Playwright was reused
- whether existing Chromium was reused
- whether a browser install was required
- the chosen render runtime source
