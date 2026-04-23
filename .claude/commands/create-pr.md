---
description: Create a PR with commit suggestion, template filling, and GitHub CLI
---

# Create Pull Request

Automates the complete PR workflow: suggest commit, fill PR template, create draft PR.

## Parameters

- `baseBranch` (optional): Target branch. Defaults to `master`.
- `taskUrl` (required): Jira task URL (e.g., `https://instabug.atlassian.net/browse/MOB-20541`).

## Step 0: Prerequisites Check

```bash
gh --version 2>/dev/null || echo "GH_CLI_NOT_INSTALLED"
```

If GitHub CLI is not installed, **STOP** and show:

```
GitHub CLI Required
========================
1. Install: brew install gh
2. Authenticate: gh auth login
3. Re-run: /create-pr
```

If installed, verify authentication:

```bash
gh auth status
```

**Only proceed if `gh` is installed and authenticated.**

---

## Step 1: Suggest Commit Message

Analyze staged/unstaged changes and suggest a commit message:

```
<type>(<scope>): <subject>

<body>
```

Types: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `chore`

Scope should reference the affected area (e.g., `apm`, `bug-reporting`, `network-logger`, `session-replay`, `cli`).

Example:

```
feat(apm): add custom span duration tracking

- Implement CustomSpansManager for measuring span durations
- Add method to APM module for starting/ending spans
- Include unit tests for edge cases
```

**Present the suggested commit message and wait for user approval.**

Once approved, stage and commit. Never use `git add -A` / `git add .` since they can pull in `.env`, credentials, or other stray files.

```bash
# Show the working tree so the user can confirm what gets staged
git status

# Stage only the intended files explicitly (expand as needed)
git add <path1> <path2> ...

# Verify the staged diff before committing
git diff --cached

git commit -m "<approved-message>"
```

**Do not proceed until the user approves the staged file list and the commit succeeds.**

---

## Step 2: Generate PR Description

Read the PR template:

```bash
cat .github/pull_request_template.md
```

Fill the template based on the actual changes:

1. **Description of the change** - Summarize what changed and why
2. **Type of change** - Check the appropriate box based on the changes:
   - Bug fix, New feature, or Breaking change
3. **Related issues** - Use the `taskUrl` parameter to link the Jira ticket
4. **Checklists** - Fill based on analysis of the changes

**Present the filled template to the user and ask for modifications.**

---

## Step 3: Create Pull Request

Extract the task ID from `taskUrl` (the part after `/browse/`).

Generate PR title in format: `<type>: [TASK-ID] brief description`

Types: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `chore`

Examples:

- `feat: [MOB-20541] add network request duration tracking to APM`
- `fix: [MOB-18732] fix crash when initializing SDK on iOS 14`
- `chore: [MOB-19000] update CI Node version to 20.11.1`

**Present the title to the user for approval.**

Once approved:

```bash
# Push the branch
git push -u origin HEAD

# Save PR description to a unique temp file (avoids collisions with concurrent runs)
PR_BODY_FILE="$(mktemp -t pr-description.XXXXXX)"
trap 'rm -f "$PR_BODY_FILE"' EXIT
cat > "$PR_BODY_FILE" << 'EOF'
<filled PR template from Step 2>
EOF

# Create draft PR
gh pr create --base {baseBranch} --title "<approved-title>" --body-file "$PR_BODY_FILE" --draft --assignee @me
```

Display the PR URL when done.
