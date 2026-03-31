---
description: Fetch unresolved PR review comments for the current branch and apply them one by one
---

You are tasked with applying PR review comments systematically. Follow these steps:

## 0. Prerequisites Check

**IMPORTANT**: This command requires GitHub CLI (`gh`). Check if it's installed and authenticated:

```bash
gh --version 2>/dev/null || echo "GH_CLI_NOT_INSTALLED"
```

If GitHub CLI is not installed or the command fails, **STOP HERE** and provide these setup instructions to the user:

```
GitHub CLI Required
========================

This command requires GitHub CLI to fetch PR review comments.

Setup Instructions:

1. Install GitHub CLI:
   brew install gh

2. Authenticate with GitHub:
   gh auth login

3. Follow the prompts to complete authentication

4. Run the command again: /apply-pr-reviews

For more info: https://cli.github.com/
```

If `gh` is installed, verify authentication:
```bash
gh auth status
```

If not authenticated, provide the authentication instructions above.

**Only proceed to step 1 if GitHub CLI is properly installed and authenticated.**

## 1. Get Current Branch and PR Information

First, determine the current git branch:
```bash
git branch --show-current
```

Then fetch the PR associated with this branch using GitHub CLI:
```bash
gh pr list --head <branch-name> --json number,title,url,state --limit 1
```

## 2. Fetch Unresolved PR Review Comments

Use GitHub CLI to fetch inline review comments (file-specific comments):
```bash
gh api repos/{owner}/{repo}/pulls/{pr_number}/comments --jq '.[] | select(.in_reply_to_id == null) | {id: .id, path: .path, line: .line, body: .body, user: .user.login, created_at: .created_at}'
```

This fetches:
- Comment ID (for marking as resolved)
- File path (where the comment is located)
- Line number (specific line in the file)
- Comment body (the reviewer's feedback)
- Author (who left the comment)
- Timestamp (when it was created)

**Note**: We filter for `in_reply_to_id == null` to get only top-level comments, not replies.

## 3. Iterate Through Comments

For each unresolved comment, perform the following workflow:

### Step 3.1: Display Comment Context
Show the reviewer's comment clearly:
- **File**: `path/to/file.ts`
- **Line**: 42
- **Reviewer**: @username
- **Comment**: "This function should handle the error case"
- **Code Context**: Show 5 lines before and after the commented line

### Step 3.2: Analyze Comment Validity
Evaluate if the comment should be applied:
- **Is it actionable?** (vs just a question or discussion)
- **Is it still relevant?** (code might have changed)
- **Is it technically sound?** (does it follow project standards)
- **Priority level**: Critical, Important, Nice-to-have
- **Check for similar issues**: Search the entire file for other occurrences of the same pattern/issue

### Step 3.2.1: Check for Similar Issues in File
**IMPORTANT**: Before applying any fix, search the entire file for similar occurrences of the same issue:

1. **Pattern matching**: If the comment is about a specific pattern, search the entire file for all instances
2. **Consistency check**: Look for similar code structures that might need the same fix
3. **Cross-module check**: Check if similar code exists in other modules under `src/modules/`
4. **Report findings**: If multiple occurrences are found, ask the user if they want to fix all instances or just the commented line

### Step 3.3: Present Analysis
Display your analysis:
```
VALID - This comment is actionable and relevant
  Priority: Important
  Reason: Missing error handling is a bug risk
  Suggested fix: Add try-catch with proper error handling
```

or

```
SKIP - Not applicable
  Reason: Code was refactored in commit abc123 and already handles this case
```

### Step 3.4: Apply Valid Comments
If the comment is valid and should be applied:
1. Read the file at the specified path
2. **Check for similar issues** (Step 3.2.1) - Search for other occurrences of the same pattern
3. If multiple occurrences found, ask user for preference:
   ```
   Found 3 additional occurrences of the same issue in this file:
   - Line 15: missing await
   - Line 42: missing await
   - Line 67: missing await

   How would you like to proceed?
   [a] Apply fix to ALL occurrences (recommended for consistency)
   [o] Apply fix to ONLY the commented line
   [s] Show me all occurrences first, then decide
   [c] Cancel this fix
   ```
4. Locate the exact code section(s)
5. Implement the requested change(s)
6. Ensure the fix follows project coding standards
7. Show the diff of changes made

### Step 3.5: Confirm with User
After analyzing each comment, ask:
```
Should I apply this fix?
[y] Yes, apply it
[n] No, skip this comment
[m] Mark as resolved without changes (not applicable)
[a] Auto-apply all remaining valid comments
[q] Quit
```

### Step 3.6: Reply to Comment
After the user decides to apply/skip, ask if they want to reply to the comment:
```
Do you want to reply to this comment?
[y] Yes, use the auto-generated reply
[c] Yes, but I'll provide a custom reply
[n] No, don't reply
```

**Auto-generated replies based on action:**
- If applied: "Applied (changes not yet committed)"
- If skipped: "Skipped: [reason]"
- If marked as not applicable: "Not applicable: [reason]"

**IMPORTANT**: Do NOT include commit hashes in auto-generated replies because the changes haven't been committed yet.

### Step 3.7: Post Reply to GitHub
Once user confirms the reply, post it as a **threaded reply** under the original comment:

```bash
gh api --method POST repos/{owner}/{repo}/pulls/{pr_number}/comments \
  -f body='<reply message>' \
  -f commit_id="$(git rev-parse HEAD)" \
  -f path='<file_path>' \
  -f side='RIGHT' \
  -F line=<line_number> \
  -F in_reply_to=<comment_id>
```

## 4. Summary Report

After processing all comments, provide:
```
PR Review Comments - Summary
============================
Total comments: 15
Applied: 8
Skipped: 5
Already resolved: 2

Changes made in:
  - src/modules/APM.ts (3 changes)
  - src/utils/XhrNetworkInterceptor.ts (2 changes)
  - test/modules/APM.spec.ts (3 changes)

Next steps:
  - Run tests: yarn test
  - Run lint: yarn lint
  - Review changes: git diff
  - Commit changes: git add . && git commit -m "fix: apply PR review feedback"
```

## 5. Error Handling

If any step fails:
- **GitHub CLI not found**: Stop immediately and show setup instructions
- **Not authenticated**: Stop and show `gh auth login` instructions
- **PR not found**: Verify branch name and check if PR exists
- **API errors**: Show clear error message with API response
- **File not found**: Skip that comment and mark it as outdated
- **Line number mismatch**: Show context and ask user to verify
- Continue with remaining comments after non-fatal errors
- Report all errors in the summary

## Optional Arguments

User can provide in `$ARGUMENTS`:
- PR number (e.g., `123`) - Process specific PR instead of auto-detecting from branch
- `--auto` - Auto-apply all valid comments without confirmation
- `--dry-run` - Show what would be done without making changes
- `--priority=critical` - Only apply critical priority comments

Examples:
- `/apply-pr-reviews` - Auto-detect PR from current branch
- `/apply-pr-reviews 123` - Process PR #123
- `/apply-pr-reviews --auto` - Auto-apply all valid comments
- `/apply-pr-reviews --dry-run` - Preview changes only
