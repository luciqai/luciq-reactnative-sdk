---
description: Generate comprehensive PR descriptions following the repository template
---

# Generate PR Description

Generate a PR description using the repository's `.github/pull_request_template.md`.

## Steps

1. **Read the PR template:**
   - Read `.github/pull_request_template.md`
   - If not found, inform the user and wait for instructions

2. **Identify the PR:**
   - Check if the current branch has an associated PR: `gh pr view --json url,number,title,state 2>/dev/null`
   - If no PR exists, create one with `gh pr create --fill`

3. **Gather PR information:**
   - Get the full diff: `gh pr diff {number}`
   - Get commit history: `gh pr view {number} --json commits`
   - Get base branch: `gh pr view {number} --json baseRefName`
   - Get metadata: `gh pr view {number} --json url,title,number,state`

4. **Analyze changes thoroughly:**
   - Read the entire diff
   - Read referenced files not shown in the diff for context
   - Identify user-facing vs internal changes
   - Look for breaking changes

5. **Generate the description:**
   - Fill each template section based on analysis
   - Be specific about problems solved and changes made
   - Check appropriate type-of-change boxes
   - Address all checklist items

6. **Update the PR:**
   - Show the user the generated description
   - Update the PR: `gh pr edit {number} --body "<description>"`
   - Confirm the update was successful
