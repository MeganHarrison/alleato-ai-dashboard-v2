# PR Automation Setup — Activation Guide

## 1) Drop the bundle into your repo
Copy the contents of this folder into the root of your GitHub repo.
- `.github/pull_request_template.md`
- `.github/CODEOWNERS`
- `.github/labeler.yml`
- `.github/workflows/ci.yml`
- `.github/workflows/e2e.yml`
- `.github/workflows/labeler.yml`
- `.github/workflows/semantic-pr.yml`
- `vitest.config.ts` (or keep your existing test config)
- `jest.config.js` (optional alternative)
- `playwright.config.ts`
- `tests/e2e/smoke.spec.ts`
- `tests/workers/example.spec.ts`
- `tests/integration/supabase.spec.ts`
- `PACKAGE_SCRIPTS.md`

Commit and push to your default branch (usually `main`). GitHub Actions will be enabled automatically.

## 2) Update package.json
Merge the scripts from `PACKAGE_SCRIPTS.md` into your `package.json`. Install deps:
```bash
npm install --save-dev @playwright/test vitest typescript eslint jest miniflare @cloudflare/workers-types
npx playwright install --with-deps
```

## 3) Required GitHub settings
- **Branch protection** (Settings → Branches → Add rule for `main`):
  - Require pull request reviews before merging (2 recommended)
  - Require status checks to pass before merging:
    - `CI / build-and-test`
    - `E2E / e2e` (after first PR runs)
    - `Semantic PR Title / semantic`
  - Require conversation resolution
  - Require linear history (optional)
- **Secrets** (Settings → Secrets and variables → Actions → New repository secret):
  - Add any needed environment variables (e.g., `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `NEXT_PUBLIC_*`)
  - If using Vercel previews that need a token, add `VERCEL_TOKEN` (optional)

## 4) Vercel Preview Deployments (optional but recommended)
If using Vercel, enable “Preview Deployments” for PRs in the Vercel project. Ensure env vars are set for the “Preview” environment.

## 5) Customize CODEOWNERS & labeler
Edit `.github/CODEOWNERS` to list the exact users/teams who must review changes.
Adjust `.github/labeler.yml` to reflect your folder structure & labels.

## 6) Semantic PR Titles
PR titles must follow Conventional Commits, e.g., `feat: add FM global form validation`. If a PR fails the check, fix the title and re-run checks.

## 7) Supabase & Workers tests
- For Supabase integration tests, set `SUPABASE_URL` and `SUPABASE_ANON_KEY` as GitHub Actions secrets. Expand tests as needed.
- For Cloudflare Workers, keep Worker code under `workers/`. Tests run with `vitest` + `miniflare` (see `tests/workers`).

## 8) Local verification
```bash
npm ci
npm run lint || true
npm run typecheck || true
npm run build || true
npm test -- --coverage || npm test
npm run test:e2e
```

## 9) Auto-merge (optional)
In your repo settings, enable “Allow auto-merge” and choose “squash”. You can then enable auto-merge on PRs once all checks pass.

---
That’s it. Open a PR with a small change; the workflows will run automatically.
