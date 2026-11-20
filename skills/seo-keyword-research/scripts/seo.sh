#!/usr/bin/env bash
# Runs the content-engine SEO keyword research CLI with content-engine's .env loaded.
# Usage: seo.sh <command> --product <absolute product dir> [options]
# CONTENT_ENGINE_DIR overrides the repo location; SEO_CLI_MAIN overrides the CLI entry (tests).
set -euo pipefail

CE="${CONTENT_ENGINE_DIR:-$HOME/ai-agency/content-engine}"
MAIN="${SEO_CLI_MAIN:-$CE/packages/keyword-research/dist/seo/cli/main.js}"

if [[ ! -f "$CE/.env" ]]; then
  echo "seo.sh: no .env in $CE (set CONTENT_ENGINE_DIR)" >&2
  exit 2
fi
if [[ -z "${SEO_CLI_MAIN:-}" ]]; then
  # Always build: turbo's cache makes it quick, and a stale build would miss CLI changes pulled since.
  (cd "$CE" && npx turbo run build --filter=@repo/keyword-research --output-logs=errors-only >&2)
fi

set -a
# shellcheck disable=SC1091
. "$CE/.env"
set +a
exec node "$MAIN" "$@"
