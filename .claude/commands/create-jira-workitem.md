---
description: Create a Jira work item using Atlassian CLI
---

Create a Jira work item using Atlassian CLI.

Example:

```
acli jira workitem create \
    --summary "Task Title" \
    --description "Task description in Atlassian Document Format" \
    --project "MOB" \
    --type "Task" \
    --assignee @me \
    --label "React-Native"
```

Follow the following rules unless specified otherwise:

- Prefix task summary with `[React Native]`
- Make the description concise
- Use MOB (Mobile) project
- Default to assign-self (@me)
- Create a Task if suitable

Use `acli jira workitem create -h` for command usage when you need to.
