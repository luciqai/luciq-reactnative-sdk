# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **@luciq/react-native** — a React Native SDK for Luciq's Agentic Observability Platform. It provides bug reporting, crash reporting, APM, network logging, session replay, surveys, and feature requests for mobile apps. The SDK bridges JavaScript to native iOS/Android modules.

## Common Commands

```bash
yarn test                    # Run all tests (Jest)
yarn test -- --testPathPattern=test/modules/APM  # Run a single test file
yarn lint                    # ESLint check
yarn lint:fix                # ESLint autofix
yarn format                  # Prettier check
yarn format:fix              # Prettier autofix
yarn build                   # Build library (tsc) + CLI (rollup)
yarn build:lib               # TypeScript compilation only
yarn build:cli               # Rollup CLI bundle only
yarn bootstrap               # Full setup: install deps + pods for example app
```

## Architecture

### Module System

The SDK is organized as independent feature modules, each with a JS API layer and a native bridge:

- **`src/modules/Luciq.ts`** — Core module: `init()`, screen tracking, shake detection, feature flags, app lifecycle
- **`src/modules/APM.ts`** — Performance spans (startCustomSpan, addCompletedCustomSpan)
- **`src/modules/BugReporting.ts`** — User-initiated bug reports
- **`src/modules/CrashReporting.ts`** — Unhandled exception tracking
- **`src/modules/NetworkLogger.ts`** — HTTP interception with filtering/obfuscation (JS mode wraps fetch/XHR; native mode delegates to platform)
- **`src/modules/SessionReplay.ts`** — Screen recording
- **`src/modules/Surveys.ts`**, **`Replies.ts`**, **`FeatureRequests.ts`** — User engagement

### Native Bridge

`src/native/` contains typed interfaces for each native module (NativeLuciq, NativeAPM, etc.). JS calls native via React Native's `NativeModules`. Native-to-JS events use `NativeEventEmitter`.

### Other Key Directories

- **`src/models/`** — TypeScript data models (LuciqConfig, Report, CustomSpan, etc.)
- **`src/utils/`** — Enums, XhrNetworkInterceptor, CustomSpansManager
- **`cli/`** — CLI tool for source map/SO file uploads (Commander-based, bundled with Rollup)
- **`plugin/`** — Expo config plugin (withLuciq)
- **`ios/`** — Native iOS module (Objective-C/Swift, CocoaPods via `RNLuciq.podspec`, iOS 15.0+)
- **`android/`** — Native Android module (Gradle)
- **`test/`** — Jest tests mirroring src structure; `test/mocks/` has native module mocks; `test/setup.ts` configures mocks and disables network via nock

## Code Style

- **TypeScript strict mode** with `noUnusedLocals`, `noUnusedParameters`, `noImplicitAny`
- **Prettier**: single quotes, semicolons, 100 char width, trailing commas, sorted imports (`@trivago/prettier-plugin-sort-imports`)
- **ESLint**: `@react-native-community` config with prettier and jsdoc plugins
- Import values with `import type` when only used as types (`importsNotUsedAsValues: "error"`)

## Testing

- Jest with `react-native` preset and `ts-jest` transformer
- Test setup in `test/setup.ts` mocks all native modules and disables HTTP with nock
- Coverage collected from `src/**/*.(js|ts)`
