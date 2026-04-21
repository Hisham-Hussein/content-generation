---
name: normalize-brand
description: Use when a user wants to turn a messy tenant brand folder into a stable normalized brand profile and validation report for downstream content-generation work.
---

# Normalize Brand

This skill is the tenant-brand normalization workflow for the multi-tenant content-generation plugin.

Use it when the user provides a tenant folder and wants Codex to inspect brand materials, validate readiness, and produce the canonical tenant-local brand files used by downstream content-generation skills.

## Required Inputs

- an explicit tenant folder path provided by the user

If the user does not provide a tenant folder path, stop and ask for it. Do not guess repo-local defaults or hidden plugin-owned storage.

## Read Before Normalizing

1. `references/normalized-brand-profile-contract.md`
2. `references/brand-validation-rules.md`

## Workflow

1. Resolve the user-provided tenant folder and treat it as the persistent tenant workspace for the run.
2. Inspect the raw tenant materials in whatever form exists.
3. Determine whether the tenant folder is usable, blocked, or ambiguous.
4. Draft or update `normalized-brand-profile.md` in the tenant folder using the contract in `references/normalized-brand-profile-contract.md`.
5. Write `brand-validation-report.md` in the tenant folder describing:
   - what was found
   - what was missing
   - what was inferred
   - what was defaulted
   - whether any blocking issue remains
6. If the tenant contains multiple brands, sub-brands, or personas:
   - resolve one active publishing brand only if the materials make that choice clear
   - otherwise stop and ask the user to choose
7. Leave the normalized brand profile in `draft` status until the user explicitly approves it.

## Required Output Behavior

- The canonical tenant file is `normalized-brand-profile.md`.
- The canonical audit file is `brand-validation-report.md`.
- Tenant state stays in the tenant folder, not in the plugin.
- Incomplete but usable brand kits should continue with clearly recorded inferences and defaults.
- Over-complete brand kits should be narrowed to the relevant signal without error.
- Truly blocking gaps should stop the workflow clearly.

## Do Not

- create a new tenant folder in an inferred location
- auto-approve a draft normalized brand profile
- maintain multiple active normalized profiles in version one
- refresh an existing approved profile automatically unless the user explicitly asks

