# Token Policy Builder

## Project
A guided assessment tool for IAM practitioners. Browser-only. No backend, no login, no data leaves the browser. Deploys to Cloudflare Pages.

## Stack
- React + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- Framer Motion (step transitions only)
- Vitest (rules engine tests only)

## Dependencies — locked
Do not add any package not listed above without explicit user approval. If a strong case exists, ask first. This includes devDependencies.

## Architecture
- All app state lives in the top-level App component. No state management library.
- Rules engine is a pure TypeScript module at `src/engine/`. No React imports. No side effects. Inputs in, policy out.
- Design tokens are copied into this project from the shared design-system. Do not reference the external repo.
- shadcn components are installed on demand via CLI only.

## Build phases — gate each one
Work is divided into phases. Do not start the next phase until the user has reviewed and signed off on the current one. Phases are tracked as GitHub issues.

## Testing
Vitest for the rules engine (`src/engine/`) only. No UI tests.

## Voice and copy
All UI copy follows `src/design/VOICE.md`. Practitioner-to-practitioner tone. No filler, no marketing language.

## Accuracy over features
This tool's primary requirement is correctness. Every numeric recommendation must trace to a specific standards clause or be explicitly labeled as community practice. When in doubt, flag for review rather than silently include.
