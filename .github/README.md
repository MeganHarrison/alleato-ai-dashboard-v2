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

Enables trusted users (e.g., Claude Code) to open PRs that auto-merge when:
- PR has `autonomous` label
- Author in `CLAUDE_ALLOWED_LOGINS` variable
- Only safe paths changed (not protected in CODEOWNERS)
- All required checks pass

## Quick Setup

1. **Variables**: Add `CLAUDE_ALLOWED_LOGINS` with comma-separated usernames
2. **Labels**: Create `autonomous` and `human-review-required` labels  
3. **Branch Protection**: Require status checks, allow auto-merge
4. **CODEOWNERS**: Protected paths require human review

## Documentation

📋 **Detailed Setup & Configuration**: See [documentation/technical/claude-code-autonomous-mode.md](../documentation/technical/claude-code-autonomous-mode.md)

This implements a two-lane workflow: autonomous merges for safe changes, human review for protected areas.

