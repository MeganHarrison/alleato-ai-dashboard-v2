# Autonomous Labeling Add-on

This add-on auto-applies the `autonomous` label for trusted PR authors and lets maintainers/bots toggle it with a slash command.

## Workflows
- `.github/workflows/auto-label-autonomous.yml`  
  Automatically adds `autonomous` when a PR author is in `CLAUDE_ALLOWED_LOGINS` (repo/org Actions Variable).

- `.github/workflows/slash-autonomous.yml`  
  Enables `/autonomous`, `/autonomous on`, `/autonomous off` in PR comments to toggle the label. Only commenters in `CLAUDE_ALLOWED_LOGINS` are allowed.

## Setup
1. Repo (or org) → Settings → **Variables** → Actions:  
   - Add `CLAUDE_ALLOWED_LOGINS` with a comma-separated list of GitHub usernames (e.g., `claude-bot,anthropic-automation,megankharrison`).

2. Create the `autonomous` label under Issues → Labels (if not already present).

3. Commit these files to `main`. Done.

Pro tip: Combine with the Path Guard and Auto-merge workflows so only safe-path PRs with passing checks can auto-merge.

# Claude Code Autonomy — Safe Automation Mode

This add-on lets trusted bot/users (e.g., Claude Code) open PRs that can **auto-merge** when:

1) The PR has the `autonomous` label.
2) The author is in the allowed list (org/repo Variable `CLAUDE_ALLOWED_LOGINS`).
3) Only **safe** paths are changed (see `.github/path-filters.yml`).
4) All required checks pass (CI, E2E, Semantic PR, Size Limit, etc.).
5) No `human-review-required` label is present.

## Setup

1. **Define allowed logins** (org or repo → Settings → Variables → Actions):
   - Create a variable `CLAUDE_ALLOWED_LOGINS` with a **comma-separated** list of GitHub usernames that may auto-merge, e.g.:

     ```
     claude-bot,anthropic-automation,megankharrison
     ```

2. **Branch protection & required checks** (Settings → Branches → Rulesets or Branch protection):
   - Require status checks to pass:
     - `CI / build-and-test`
     - `E2E / e2e`
     - `Semantic PR Title / semantic`
     - (optional) `Size Limit / size`
   - Allow auto-merge (squash).
   - Optionally *do not* require code owner review on safe paths to maximize autonomy.
   - Keep code owner review on **protected** paths (via CODEOWNERS).

3. **Labels**
   - Add a label `autonomous` (no description required).
   - Add a label `human-review-required` (used by Path Guard).

4. **Protected vs Safe Paths**
   - Edit `.github/path-filters.yml` to match your repo. Anything in `protected` will force human review and remove the `autonomous` label.

5. **CODEOWNERS**
   - Merge `.github/CODEOWNERS.additions` into your `.github/CODEOWNERS` so protected areas always require a human owner.

## Usage

- Have Claude Code open a PR in the **safe** areas.
- Add the `autonomous` label (manually or via your bot).
- If the author is allowed and all checks pass, the PR will be auto-merged (squash).
- If any protected file is touched, the `autonomous` label is removed and `human-review-required` is added.

## Notes

- This keeps a **two-lane** workflow: autonomous merges in safe areas; human review in sensitive areas (infra, production workers, migrations).
- Adjust required checks and coverage thresholds in your existing workflows to tune strictness.
- Combine with your existing PR automation bundle for best results.

