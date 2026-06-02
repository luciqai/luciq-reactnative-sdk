<div align="center">
  <img src=".github/assets/luciq-logo.png" alt="Luciq" width="120" />

  <p><strong>🚀 The Agentic Observability Platform built for Mobile</strong></p>

[![npm version](https://img.shields.io/npm/v/@luciq/react-native.svg?style=for-the-badge&color=blue)](https://www.npmjs.com/package/@luciq/react-native)
[![npm downloads](https://img.shields.io/npm/dt/@luciq/react-native.svg?style=for-the-badge)](https://www.npmjs.com/package/@luciq/react-native)
[![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android-lightgrey.svg?style=for-the-badge)](https://www.npmjs.com/package/@luciq/react-native)
[![License](https://img.shields.io/npm/l/@luciq/react-native.svg?style=for-the-badge)](https://github.com/luciqai/luciq-reactnative-sdk/blob/master/LICENSE)

  <br />

Our intelligent AI agents help you capture rich, contextual data for every issue, including full session replays, console logs, and detailed network requests, to proactively detect, prioritize, and resolve problems automatically.

<strong>Ship faster, deliver frustration-free user sessions, and focus on building what matters.</strong>

</div>

---

## Table of Contents

- [Requirements](#requirements)
- [Installation](#installation)
- [Initializing Luciq](#initializing-luciq)
- [iOS Usage Descriptions](#ios-usage-descriptions)
- [Source Map Uploads for Crash Reports](#source-map-uploads-for-crash-reports)
- [Network Logging](#network-logging)
- [Repro Steps](#repro-steps)
  - [React Navigation](#react-navigation)
  - [React Native Navigation (Wix)](#react-native-navigation-wix)
  - [Manual screen reporting](#manual-screen-reporting)
  - [Disabling Repro Steps](#disabling-repro-steps)
- [Custom Spans (APM)](#custom-spans-apm)
  - [Start / end a span](#start--end-a-span)
  - [Record a completed span](#record-a-completed-span)
  - [Behavior](#behavior)
  - [API reference](#api-reference)
- [TypeScript](#typescript)
- [Support](#support)

---

## Requirements

- React Native `>= 0.72.3`
- iOS `>= 13.4`
- Android `minSdkVersion >= 21`

## Installation

1. Install the package:

   ```bash
   npm install @luciq/react-native
   # or
   yarn add @luciq/react-native
   ```

2. **Expo only.** Add the Luciq config plugin to `app.json`:

   ```json
   {
     "expo": {
       "plugins": [
         [
           "@luciq/react-native",
           {
             "addScreenRecordingBugReportingPermission": true
           }
         ]
       ]
     }
   }
   ```

   `addScreenRecordingBugReportingPermission` is optional — when `true`, the plugin adds the iOS microphone & photo-library usage descriptions and the Android `FOREGROUND_SERVICE_MEDIA_PROJECTION` permission required for screen recording in bug reports.

3. **iOS only.** Install CocoaPods:

   ```bash
   cd ios && pod install && cd ..
   ```

## Initializing Luciq

Call `Luciq.init` once, as early as possible — at the top of your entry file (`index.js` or `App.tsx`), outside any component. `InvocationEvent` is a named export, not a property on the default `Luciq` namespace.

```ts
import Luciq, { InvocationEvent } from '@luciq/react-native';

Luciq.init({
  token: 'APP_TOKEN',
  invocationEvents: [InvocationEvent.shake],
});
```

You can combine multiple invocation events:

```ts
Luciq.init({
  token: 'APP_TOKEN',
  invocationEvents: [
    InvocationEvent.shake,
    InvocationEvent.screenshot,
    InvocationEvent.floatingButton,
  ],
});
```

Available `InvocationEvent` values: `shake`, `screenshot`, `twoFingersSwipe`, `floatingButton`, `none`.

Find your app token in your [**Luciq dashboard**](https://dashboard.luciq.ai) under **Settings → SDK Integration**.

## iOS Usage Descriptions

Luciq needs microphone access to capture audio during screen recordings, and photo-library access to let users attach images to bug reports. Apple rejects apps that omit usage descriptions for either, so add the following keys to your app's `Info.plist`:

- `NSMicrophoneUsageDescription`
- `NSPhotoLibraryUsageDescription`

Suggested copy:

- _"`<app name>` needs microphone access to record audio with screen recordings attached to bug reports."_
- _"`<app name>` needs photo-library access to attach images to bug reports."_

The permission prompts only appear when a user actually starts a screen recording or attaches a photo from the Luciq UI.

## Source Map Uploads for Crash Reports

For your app crashes to show fully symbolicated stack traces, the build scripts in `@luciq/react-native` will generate and upload source maps to your dashboard on release builds. The uploader reads your app token from the `Luciq.init({ token: 'YOUR_APP_TOKEN' })` call in JavaScript.

If your token is defined as a constant or imported from elsewhere, override the lookup with environment variables:

| Variable                          | Purpose                               |
| --------------------------------- | ------------------------------------- |
| `LUCIQ_APP_TOKEN`                 | App token used for the upload         |
| `LUCIQ_APP_VERSION_NAME`          | Overrides the inferred `versionName`  |
| `LUCIQ_APP_VERSION_CODE`          | Overrides the inferred `versionCode`  |
| `LUCIQ_SOURCEMAPS_UPLOAD_DISABLE` | Set to `TRUE` to skip the upload step |

## Network Logging

Network logging is enabled by default. It intercepts `fetch` and `XMLHttpRequest` calls and attaches them to outgoing reports. Disable it with:

```ts
import { NetworkLogger } from '@luciq/react-native';

NetworkLogger.setEnabled(false);
```

## Repro Steps

Luciq Repro Steps record the screens a user visits. Each screen is attached to a bug report when it's sent. Repro Steps are enabled by default.

### React Navigation

**v5+** — pass `Luciq.onStateChange` to your `NavigationContainer`:

```tsx
import { NavigationContainer } from '@react-navigation/native';
import Luciq from '@luciq/react-native';

<NavigationContainer onStateChange={Luciq.onStateChange}>{/* ... */}</NavigationContainer>;
```

**v4 and below** — wire `Luciq.onNavigationStateChange` to the root app:

```tsx
export default () => <App onNavigationStateChange={Luciq.onNavigationStateChange} />;
```

### React Native Navigation (Wix)

Register `Luciq.componentDidAppearListener`:

```ts
import { Navigation } from 'react-native-navigation';
import Luciq from '@luciq/react-native';

Navigation.events().registerComponentDidAppearListener(Luciq.componentDidAppearListener);
```

### Manual screen reporting

For custom navigation, report screen changes yourself:

```ts
Luciq.reportScreenChange('CheckoutScreen');
```

### Disabling Repro Steps

```ts
import Luciq, { ReproStepsMode } from '@luciq/react-native';

Luciq.setReproStepsConfig({ all: ReproStepsMode.disabled });
```

`ReproStepsMode` values: `enabled`, `enabledWithNoScreenshots`, `disabled`.

## Custom Spans (APM)

Custom spans let you manually instrument arbitrary code paths for performance tracking — useful for operations that aren't covered by the automatic instrumentation.

### Start / end a span

```ts
import { APM } from '@luciq/react-native';

const span = await APM.startCustomSpan('Load User Profile');

if (span) {
  try {
    await loadUserProfile();
  } finally {
    await span.end();
  }
}
```

### Record a completed span

```ts
import { APM } from '@luciq/react-native';

const start = new Date(Date.now() - 1500);
const end = new Date();

await APM.addCompletedCustomSpan('Cache Lookup', start, end);
```

### Behavior

- **Limit:** up to 100 concurrent spans at a time.
- **Name length:** truncated to 150 characters; empty names are rejected.
- **Timestamps:** `endDate` must be after `startDate`; otherwise the span is rejected.
- **Idempotent:** calling `span.end()` more than once is safe.
- **Gating:** spans are only created when the SDK is initialized, APM is enabled, and the custom-spans feature is enabled for your account.

### API reference

#### `APM.startCustomSpan(name: string): Promise<CustomSpan | null>`

Starts a custom span. Returns the span object, or `null` if the span couldn't be created (e.g. feature disabled, span cap reached, invalid name).

#### `CustomSpan.end(): Promise<void>`

Ends the span and reports it. Idempotent.

#### `APM.addCompletedCustomSpan(name: string, startDate: Date, endDate: Date): Promise<void>`

Records a span whose start and end times are already known.

## TypeScript

The package ships with type definitions. The public surface is exposed as:

- `Luciq` (default export) — top-level SDK actions: `init`, `onStateChange`, `onNavigationStateChange`, `componentDidAppearListener`, `reportScreenChange`, `setReproStepsConfig`, and many more.
- Named modules: `APM`, `BugReporting`, `CrashReporting`, `FeatureRequests`, `NetworkLogger`, `Replies`, `SessionReplay`, `Surveys`.
- Named enums: `InvocationEvent`, `ReproStepsMode`, `LogLevel`, `NetworkInterceptionMode`, `Locale`, `ColorTheme`, `WelcomeMessageMode`, `ExtendedBugReportMode`, `NonFatalErrorLevel`, and more.
- Named types: `LuciqConfig`, `ThemeConfig`, `NetworkData`, `Survey`, `SessionMetadata`.

```ts
import Luciq, {
  APM,
  BugReporting,
  CrashReporting,
  InvocationEvent,
  NetworkLogger,
  ReproStepsMode,
  type LuciqConfig,
} from '@luciq/react-native';
```

## Support

<div align="center">

## Adding a new feature

The library supports both the old bridge architecture and the new architecture (TurboModules) from a single source tree. Adding a new API — either a new method on an existing module or a brand-new module — requires touching the JS layer, the Codegen spec, and both native platforms in lockstep so that the types stay aligned.

### Adding a method to an existing module

1. **Codegen spec** — add the method signature to `src/specs/Native<Module>.ts`. Signatures here must use Codegen-compatible types (`boolean`, `string`, `number` / `double`, `Array<...>`, `Object`, `Promise<T>`, `void`). Avoid `int` — use `double`. Callbacks for spec methods are typed as `(value: Object) => void`.
2. **JS native wrapper** — mirror the method on the `NativeModule` interface in `src/native/Native<Module>.ts`. This is the richly-typed surface (enum types, unions) that the JS modules consume; the spec is the Codegen-safe subset.
3. **JS module** — expose the public API in `src/modules/<Module>.ts`, calling through `Native<Module>.<method>(...)`.
4. **Android** — implement the method in `android/src/main/java/ai/luciq/reactlibrary/RNLuciq<Module>Module.java`. The module extends `Native<Module>Spec`; annotate with `@ReactMethod` and match the spec's parameter types exactly (e.g. `double` not `int`, `Promise` where the spec returns `Promise<T>`).
5. **iOS** — implement the method in `ios/RNLuciq/Luciq<Module>Bridge.mm` using `RCT_EXPORT_METHOD`. The bridge file extension is `.mm` (Objective-C++) so the same source compiles on both architectures.
6. **Tests** — add coverage in `test/modules/<Module>.spec.ts` and `android/src/test/java/ai/luciq/reactlibrary/RNLuciq<Module>ModuleTest.java`.

### Adding a brand-new module

In addition to the steps above, register the new module in each arch-specific location:

1. **Codegen spec** — create `src/specs/Native<Module>.ts` and export the module via `TurboModuleRegistry.get<Spec>('LCQ<Module>')`. Keep the `LCQ` prefix — it must match the iOS `RCT_EXPORT_MODULE` name and the Android `NAME` constant.
2. **JS native wrapper** — create `src/native/Native<Module>.ts` with a fallback: `(TurboSpec ?? ReactNativeModules.LCQ<Module>) as unknown as <Module>NativeModule`. Add the module to the `LuciqNativePackage` interface in `src/native/NativePackage.ts`.
3. **JS module and public export** — create `src/modules/<Module>.ts` and re-export it from `src/index.ts`.
4. **Android Codegen spec** — add `android/src/oldarch/java/ai/luciq/reactlibrary/Native<Module>Spec.java` extending `ReactContextBaseJavaModule`, with `public static final String NAME = "LCQ<Module>"`. The newarch variant is generated into `build/generated/source/codegen/java` by React Gradle Plugin at build time, so nothing is hand-authored under `android/src/newarch/`.
5. **Android module** — create `android/src/main/java/ai/luciq/reactlibrary/RNLuciq<Module>Module.java` extending `Native<Module>Spec`, and register it inside `createNativeModules` in `RNLuciqReactnativePackage.java`.
6. **iOS bridge** — create `ios/RNLuciq/Luciq<Module>Bridge.h` / `.mm`. Use `RCT_EXPORT_MODULE(LCQ<Module>)` so the name resolves on both architectures.

### Running Codegen locally

Codegen runs automatically during the example app's build. To regenerate manually from the library root:

```bash
cd examples/default/android && ./gradlew generateCodegenArtifactsFromSchema
cd examples/default/ios && RCT_NEW_ARCH_ENABLED=1 pod install
```

If the JS spec and the native implementation disagree on a type, Codegen will fail the build with a mismatch error — that's the signal to bring the three layers back in sync.

### Need Help?

🌐 **[Visit our website](https://luciq.ai)** • 📖 **[Read the docs](https://docs.luciq.ai/)** • 💬 **[Get help](https://help.luciq.ai)**

### Contact Us

**Primary Contact Email:** [support@luciq.ai](mailto:support@luciq.ai)

**LinkedIn:** [linkedin.com/company/luciq](https://linkedin.com/company/luciq)

---

<p>Made with ❤️ by the Luciq team</p>

<img src=".github/assets/luciq-logo.png" alt="Luciq" width="60" />

</div>
