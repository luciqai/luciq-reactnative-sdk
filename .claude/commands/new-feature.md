---
description: Scaffold a new SDK feature module following established patterns
---

# New Feature Module

Scaffold a new feature module in the Luciq React Native SDK following established patterns.

## Parameters

- `name` (required): Feature name (e.g., `Surveys`, `FeatureRequests`)

## Steps

### 1. Plan the Module

- Determine the public API surface
- Identify required native module methods
- List models needed

### 2. Create Native Interface

Create `src/native/Native<FeatureName>.ts`:
- Define the typed interface for the native module
- Follow existing patterns from other native interface files (e.g., `NativeAPM.ts`, `NativeBugReporting.ts`)

### 3. Create Module

Create `src/modules/<FeatureName>.ts`:
- Export functions that call through to the native module
- Follow the pattern of existing modules (e.g., `BugReporting`, `APM`)
- Add proper error handling
- Use `NativeEventEmitter` for native-to-JS callbacks if needed

### 4. Create Models

Create any needed models in `src/models/`:
- Follow existing model patterns
- Include proper TypeScript types and enums in `src/utils/Enums.ts`

### 5. Export Public API

Update `src/index.ts`:
- Export the new module namespace
- Export any new models and types

### 6. Write Tests

Create `test/modules/<FeatureName>.spec.ts`:
- Add native module mock in `test/mocks/`
- Register mock in `test/setup.ts`
- Test each public method
- Test error handling paths

### 7. Build and Test

```bash
yarn build:lib
yarn test
yarn lint
```

## Checklist

- [ ] Native interface defined in `src/native/`
- [ ] Module created with exported functions
- [ ] Models and enums created if needed
- [ ] Public exports updated in `src/index.ts`
- [ ] Tests written and passing
- [ ] Lint passes
