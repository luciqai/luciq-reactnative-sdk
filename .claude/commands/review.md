---
description: Code review checklist for React Native SDK best practices
---

# Code Review

Review the current changes against React Native SDK best practices.

## Review Categories

### 1. Native Bridge Safety
- [ ] NativeModule interfaces are consistent between TypeScript and native implementations
- [ ] NativeModule calls handle errors gracefully (no host app crashes)
- [ ] No breaking changes to native module APIs without version bump
- [ ] NativeEventEmitter subscriptions are properly cleaned up

### 2. Public API Compatibility
- [ ] No breaking changes to exports in `src/index.ts`
- [ ] New public APIs follow existing module pattern (exported functions in `src/modules/`)
- [ ] Deprecations use `@deprecated` JSDoc annotation with migration guidance
- [ ] API naming is consistent with existing conventions

### 3. Testing
- [ ] New code has corresponding tests in `test/`
- [ ] Native module mocks are updated in `test/mocks/` if needed
- [ ] Tests cover edge cases and error paths
- [ ] No flaky or timing-dependent tests

### 4. Error Handling
- [ ] Native module calls are wrapped with proper error handling
- [ ] No unhandled promises or missing `await`
- [ ] Errors don't crash the host app
- [ ] TypeScript strict mode is satisfied (no `any` escapes)

### 5. Performance
- [ ] No expensive operations on the JS thread
- [ ] Network interception doesn't block requests
- [ ] No unnecessary re-renders or event listener leaks
- [ ] Screen tracking doesn't interfere with navigation

### 6. Code Quality
- [ ] Passes `yarn lint` and `yarn format`
- [ ] TypeScript strict mode: no unused locals/params, no implicit any
- [ ] No unnecessary imports or dead code
- [ ] `import type` used for type-only imports

### 7. Cross-Platform
- [ ] Changes work on both iOS and Android
- [ ] Platform-specific code uses proper conditional logic
- [ ] Source map upload scripts still work for both platforms

### 8. Security
- [ ] No hardcoded secrets or API keys
- [ ] Sensitive data is handled appropriately
- [ ] User data handling respects privacy settings
- [ ] No logging of sensitive information in release mode

## How to Use

Run the current diff through each category. For each issue found, report:
- **File:line** - exact location
- **Severity** - critical / warning / suggestion
- **Issue** - what's wrong
- **Fix** - how to fix it
