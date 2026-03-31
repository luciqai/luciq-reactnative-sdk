---
description: Comprehensive PR code review with parallel analysis agents
---

# PR Code Review

Perform a thorough code review of the current branch's changes.

## Steps

### 1. Gather Changes

```bash
# Get the base branch
git log --oneline -1 origin/master

# Get all changed files
git diff origin/master...HEAD --name-only

# Get the full diff
git diff origin/master...HEAD

# Get commit history
git log origin/master...HEAD --oneline
```

### 2. Context Gathering

For each changed file, read surrounding context:
- Other methods in the same module
- Related test files
- Native bridge interfaces if native module code changed
- Public exports if API surface changed

### 3. Review Categories

Analyze changes across these dimensions in parallel:

**a. Logical Errors**
- Off-by-one errors, null handling, missing edge cases
- Incorrect native module data mapping
- Missing await on Promises

**b. TypeScript/React Native Standards**
- TypeScript strict mode compliance
- Proper use of `import type` for type-only imports
- Correct use of NativeModules and NativeEventEmitter
- Proper async/await patterns

**c. Native Bridge Safety**
- NativeModule interfaces are consistent with native implementations
- Error handling around native calls
- Data serialization correctness between JS and native

**d. Test Coverage**
- New code has tests
- Tests cover error paths
- Mocks are properly set up in `test/mocks/`

**e. Performance**
- No blocking operations on JS thread
- No unnecessary event listener subscriptions
- Efficient data structures

**f. SDK Best Practices**
- No host app crashes
- Backward compatible
- Follows existing module patterns

### 4. Report

For each issue found:
- **File:line** - exact location
- **Severity** - critical / warning / suggestion
- **Issue** - what's wrong
- **Before/After** - code showing the fix
- **Explanation** - why it matters
