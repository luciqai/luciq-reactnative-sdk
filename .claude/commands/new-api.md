---
description: Add a new public API method to an existing SDK feature
---

# New API Method

Add a new public API method to an existing feature module.

## Parameters

- `module` (required): Target module (e.g., `BugReporting`, `APM`, `CrashReporting`, `Luciq`)
- `method` (required): Method name and signature description

## Steps

### 1. Define Native Interface

Add the method to the native interface in `src/native/Native<Module>.ts`:
- Define parameter types and return type
- Follow existing method patterns in the same file

### 2. Add Module Method

Add the method to the module in `src/modules/<Module>.ts`:
- Export function calling through to the native module
- Match the style of existing methods in the same module

### 3. Create Models (if needed)

Add any new models to `src/models/` or enums to `src/utils/Enums.ts`

### 4. Update Exports (if needed)

If new models were added, export them in `src/index.ts`

### 5. Write Tests

Add tests to `test/modules/<Module>.spec.ts`:
- Test the method calls through to the native module correctly
- Test parameter passing
- Test error handling
- Update mock in `test/mocks/` if new native methods were added

### 6. Verify

```bash
yarn build:lib
yarn test
yarn lint
```

## Best Practices

- Parameter naming should be consistent with existing SDK conventions
- Include `@deprecated` JSDoc tag if replacing an existing method
- Null/undefined parameters should have sensible defaults on the native side
- Callbacks should follow existing callback patterns (NativeEventEmitter)
