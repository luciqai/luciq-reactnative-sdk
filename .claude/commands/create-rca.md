---
description: Generate a Root Cause Analysis (RCA) document from PR and Jira ticket information
---

You are tasked with creating a comprehensive Root Cause Analysis (RCA) document. Follow these steps:

## Parameters

- `prUrls` (optional): One or more GitHub PR URLs related to the incident/fix, comma-separated
  - Single PR: `prUrls=https://github.com/luciqai/luciq-reactnative-sdk/pull/45`
  - Multiple PRs: `prUrls=https://github.com/luciqai/luciq-reactnative-sdk/pull/45,https://github.com/Instabug/ios/pull/6534`

- `taskUrl` (required): The Jira task/incident URL
  - Example: `taskUrl=https://instabug.atlassian.net/browse/MOB-21429`

## 0. Prerequisites Check

**IMPORTANT**: This command requires GitHub CLI (`gh`) and Jira CLI (`jira`). Check if they are installed:

```bash
gh --version 2>/dev/null || echo "GH_CLI_NOT_INSTALLED"
jira version 2>/dev/null || echo "JIRA_CLI_NOT_INSTALLED"
```

### GitHub CLI Setup

If GitHub CLI is not installed:

```
GitHub CLI Required
========================
1. Install: brew install gh
2. Authenticate: gh auth login
For more info: https://cli.github.com/
```

### Jira CLI Setup

If Jira CLI is not installed:

```
Jira CLI Required
========================
1. Install: brew install ankitpokhrel/jira-cli/jira-cli
2. Initialize: jira init
3. Server URL: https://instabug.atlassian.net
4. Auth type: API Token
5. Generate token: https://id.atlassian.com/manage-profile/security/api-tokens
For more info: https://github.com/ankitpokhrel/jira-cli
```

**Only proceed if both CLIs are installed and authenticated.**

## 1. Gather PR Information (if prUrls provided)

### Step 1.1: Parse PR URLs

Split `prUrls` by comma. For each PR URL, extract owner, repo, and PR number.

### Step 1.2: Fetch Details for Each PR

```bash
gh pr view <pr_number> --repo <owner>/<repo> --json number,title,body,author,createdAt,mergedAt,state,commits,changedFiles,additions,deletions
```

### Step 1.3: Analyze Changes for Each PR

```bash
gh pr diff <pr_number> --repo <owner>/<repo> --name-only
```

### Step 1.4: Document All PRs

For each PR, document:

- PR number and title
- Files changed
- Nature of the fix/change
- Author and reviewers
- Merge date

Consolidate to identify common files, fix sequence, and overall scope.

## 2. Gather Jira Information

### Step 2.1: Extract Task ID

From `taskUrl`, extract the task ID (e.g., `MOB-21429` from the URL).

### Step 2.2: Fetch Jira Ticket Details

```bash
jira issue view <TASK_ID> --plain
```

Extract: summary, description, status, priority, reporter, assignee, created date, labels, components, comments.

### Step 2.3: Fetch Related Issues

```bash
jira issue view <TASK_ID> --comments
```

Document key events and timeline from comments.

## 3. Generate RCA Document

### Step 3.1: Ask Clarifying Questions

```
To complete the RCA, please provide the following details:

1. **Root Cause**: What was the actual technical root cause?
2. **Data Loss**: Was there any data loss? If yes, what data?
3. **Security Impact**: Was there any security breach or exposure?
4. **Affected Products**: Which SDK products were affected? (APM, Crash Reporting, Bug Reporting, Session Replay, Surveys, Replies, Feature Requests, Network Logger)
5. **Customer Impact**: How many customers were affected? What was the user experience impact?
6. **Actions Taken**: What immediate actions were taken to resolve the issue?
7. **Engaged People**: Who was involved in investigating and fixing the issue?
8. **Future Improvements**: What preventive measures will be implemented?
```

### Step 3.2: Generate RCA from Template

```markdown
# Root Cause Analysis (RCA)

**RCA Link**: [JIRA_TASK_ID](JIRA_TASK_URL)
**Date**: [Current Date]
**Author**: [User Name or Team]
**Related PRs**:

- [PR_TITLE_1](PR_URL_1)
- [PR_TITLE_2](PR_URL_2)

---

## What Happened

[Clear description of the incident: what, when, how discovered, initial symptoms]

---

## Why This Happened

[Root cause in technical terms: what failed, why safeguards missed it, contributing factors, specific code/commits]

---

## Features Affected

[List SDK features/modules impacted with brief description of impact]

---

## Was There Any Data Loss

- [ ] Yes
- [ ] No

[If yes: what data, volume/timeframe, recoverability, recovery steps]

---

## Impact on Customers

[Number affected, severity, UX degradation, escalations, duration]

---

## Security Breach

- [ ] Yes
- [ ] No

[If yes: nature, data exposed, securing steps, disclosure requirements]

---

## Affected Products

- [ ] APM (App Performance Monitoring)
- [ ] Bug Reporting
- [ ] Crash Reporting
- [ ] Session Replay
- [ ] Surveys
- [ ] Replies
- [ ] Feature Requests
- [ ] Core SDK
- [ ] Network Logger
- [ ] Navigation/Screen Tracking
- [ ] CLI (Source Map Upload)
- [ ] Expo Plugin
- [ ] Other: [Specify]

---

## Actions Taken

| Timestamp | Action         | Owner    |
| --------- | -------------- | -------- |
| [Time 1]  | [Action taken] | [Person] |
| [Time 2]  | [Action taken] | [Person] |

---

## Engaged People

| Name     | Role   | Contribution    |
| -------- | ------ | --------------- |
| [Name 1] | [Role] | [What they did] |

---

## Future Improvements

| Improvement     | Priority          | Owner   | Target Date | JIRA Ticket |
| --------------- | ----------------- | ------- | ----------- | ----------- |
| [Improvement 1] | [High/Medium/Low] | [Owner] | [Date]      | [MOB-XXXXX] |

### Preventive Categories:

- [ ] Code Review Process Enhancement
- [ ] Testing Coverage Improvement
- [ ] Monitoring/Alerting Enhancement
- [ ] Documentation Update
- [ ] Process Change
- [ ] Tooling Improvement

---

## Lessons Learned

1. [Lesson 1]
2. [Lesson 2]
3. [Lesson 3]

---

## Appendix

### Timeline

[Detailed timeline]

### Technical Details

[Stack traces, logs, etc.]

### References

- JIRA: [JIRA_URL]
- PRs: [PR links with descriptions]
- Related Documentation: [Links]
```

### Step 3.3: Present RCA to User

Present the generated RCA and ask for corrections, additions, or updates.

## 4. Output Options

Ask the user:

```
How would you like to save this RCA?
1. Display in terminal (copy manually)
2. Save to a file (specify path)
3. Both
```

Default save location:

```bash
cat > ./RCA-<TASK_ID>-$(date +%Y%m%d).md << 'EOF'
<RCA_CONTENT>
EOF
```

## Examples

```
/create-rca taskUrl=https://instabug.atlassian.net/browse/MOB-21429
/create-rca taskUrl=https://instabug.atlassian.net/browse/MOB-21429 prUrls=https://github.com/luciqai/luciq-reactnative-sdk/pull/45
/create-rca taskUrl=https://instabug.atlassian.net/browse/MOB-21429 prUrls=https://github.com/luciqai/luciq-reactnative-sdk/pull/45,https://github.com/Instabug/ios/pull/6534
```
