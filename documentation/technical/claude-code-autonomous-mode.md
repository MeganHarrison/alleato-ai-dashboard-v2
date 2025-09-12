# Claude Code Autonomous Mode Configuration

## Overview

This document describes the setup and configuration for Claude Code autonomous mode, which enables safe automated PR handling with protected path validation.

## Architecture

The autonomous mode implements a **two-lane workflow**:
- **Autonomous lane**: Safe areas allow auto-merge for trusted users
- **Human review lane**: Protected areas require human code owner review

## Configuration Components

### 1. Protected Paths (CODEOWNERS)

Protected paths require human review:
- `/infra/` - Infrastructure configuration
- `/workers/production/` - Production worker code
- `/database/migrations/` - Database schema changes
- `/.github/workflows/` - CI/CD workflows

### 2. Safe Automation Setup

#### Required Variables
Create repository variable `CLAUDE_ALLOWED_LOGINS` with comma-separated usernames:
```
claude-bot,anthropic-automation,megankharrison
```

#### Required Labels
- `autonomous` - Enables auto-merge for safe paths
- `human-review-required` - Forces human review (added by Path Guard)

#### Branch Protection Requirements
Required status checks:
- `CI / build-and-test`
- `E2E / e2e` 
- `Semantic PR Title / semantic`
- `Size Limit / size` (optional)

### 3. Path Filtering

The system uses `.github/path-filters.yml` to categorize changes:
- **Protected paths**: Remove `autonomous` label, add `human-review-required`
- **Safe paths**: Maintain `autonomous` label for auto-merge

## Workflow Process

1. **PR Creation**: Claude Code opens PR in safe areas
2. **Label Application**: `autonomous` label added (manual or automated)
3. **Path Validation**: System checks if only safe paths changed
4. **Status Checks**: All required CI/CD checks must pass
5. **Auto-merge**: PR automatically merged if all conditions met
6. **Protection Override**: Any protected path change forces human review

## Security Features

- **Code Owner Protection**: CODEOWNERS ensures human review on sensitive areas
- **Path Validation**: Automatic detection of protected vs safe changes
- **Status Requirements**: Full CI/CD validation before auto-merge
- **Audit Trail**: All autonomous actions logged and traceable

## Testing Validation

### Safe Path Test
1. Create PR changing only documentation or safe code
2. Apply `autonomous` label
3. Verify auto-merge occurs after checks pass

### Protected Path Test
1. Create PR changing infrastructure or workflows
2. Apply `autonomous` label
3. Verify label removed and `human-review-required` added
4. Confirm human code owner review required

### Mixed Path Test
1. Create PR changing both safe and protected paths
2. Verify protected path rules take precedence
3. Confirm human review required

## Monitoring and Maintenance

- **Regular Review**: Audit autonomous merges monthly
- **Path Updates**: Update path filters as codebase evolves
- **Permission Review**: Validate allowed user list quarterly
- **Security Audit**: Monitor for abuse or bypasses

## Troubleshooting

### Common Issues

**Auto-merge not triggering:**
- Check user in `CLAUDE_ALLOWED_LOGINS` variable
- Verify all required status checks passing
- Confirm `autonomous` label present
- Check no `human-review-required` label

**Protected path not blocked:**
- Verify `.github/path-filters.yml` contains path pattern
- Check Path Guard workflow is active
- Confirm CODEOWNERS contains path with human owner

**Status checks failing:**
- Review CI/CD workflow logs
- Check test coverage meets requirements
- Verify semantic PR title format
- Confirm size limits not exceeded

## Best Practices

1. **Conservative Path Classification**: When in doubt, mark as protected
2. **Comprehensive Testing**: Validate all code paths before autonomous merge
3. **Regular Audits**: Review autonomous activity for quality and security
4. **Documentation**: Keep path filters and procedures up to date
5. **Gradual Rollout**: Start with limited safe paths, expand carefully

## Integration Points

- **GitHub Actions**: Path Guard and Auto-merge workflows
- **Branch Protection**: Required status checks and owner review
- **CODEOWNERS**: Human review requirements for protected areas
- **Labels**: Autonomous behavior control and human override

This configuration enables safe automation while maintaining human oversight on critical system changes.