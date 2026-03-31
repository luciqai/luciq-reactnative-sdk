# AI rules for React Native TypeScript

You are an expert in React Native and TypeScript development. This is an SDK project (not an app), so focus on library design, native bridge patterns, and public API surface.

## Project Context

This is the Luciq React Native SDK (`@luciq/react-native`). It bridges JavaScript to native iOS/Android modules for observability features (bug reporting, crash reporting, APM, network logging, session replay, surveys).

## TypeScript Style

- **Strict mode** is enabled: `noUnusedLocals`, `noUnusedParameters`, `noImplicitAny`, `strict`
- Use `import type` for type-only imports (`importsNotUsedAsValues: "error"`)
- Prettier: single quotes, semicolons, 100 char width, trailing commas
- Import ordering via `@trivago/prettier-plugin-sort-imports`
- ESLint: `@react-native-community` config with prettier and jsdoc plugins

## Module Pattern

Each SDK feature is a module in `src/modules/` exported as a namespace:
- Module exports functions that call through to native via `NativeModules`
- Native bridge interfaces are typed in `src/native/`
- Events from native use `NativeEventEmitter`
- Models/types live in `src/models/`
- Enums and utilities in `src/utils/`

## Native Bridge

- JS -> Native: via React Native `NativeModules` (typed interfaces in `src/native/`)
- Native -> JS: via `NativeEventEmitter` for async callbacks
- iOS: Objective-C/Swift, managed via CocoaPods (`RNLuciq.podspec`)
- Android: Java/Kotlin, managed via Gradle (`android/build.gradle`)

## Testing

- Jest with `react-native` preset and `ts-jest`
- Test setup in `test/setup.ts` mocks all native modules and disables HTTP via nock
- Tests mirror src structure in `test/`
- Mock native modules in `test/mocks/`

## SDK-Specific Rules

- Never crash the host app - handle errors gracefully
- Public API changes must be backward compatible unless doing a major version bump
- Network interception has two modes: JavaScript (XHR wrapping) and Native
- The SDK supports React Navigation (v4, v6), react-native-navigation (v7), and Expo
