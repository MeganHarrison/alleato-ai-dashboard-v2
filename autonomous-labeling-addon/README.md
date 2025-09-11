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
