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

## Git and GitHub conventions

**Branches**
- One branch per phase: `phase/1-scaffold`, `phase/2-design-tokens`, etc.
- Never commit directly to `main` — branch protection enforces this.
- Open a PR to merge each phase. The PR is the gate — user reviews diff before merging.
- Reference the GitHub issue in the PR description.

**Commit messages — conventional commits**
- `feat:` new functionality
- `fix:` bug fix
- `chore:` config, deps, tooling
- `refactor:` restructuring with no behavior change
- Keep the subject line short and specific. Example: `feat: add stepper with M2M skip logic`

## Code conventions

**File naming**
- Component files: PascalCase — `StepperBar.tsx`
- Everything else: camelCase — `computePolicy.ts`, `useStepFlow.ts`
- One component per file.

**Folder structure**
```
src/
  components/     # UI components
  components/ui/  # shadcn-generated — do not edit manually
  engine/         # rules engine — pure TS, no React
  design/         # copied tokens and VOICE.md
  hooks/          # custom React hooks
  types/          # shared TypeScript types
```

**Styling**
- Tailwind utility classes only. No custom CSS files except `tokens.css`.
- No inline `style=` props unless there is no Tailwind alternative.
