# Luciq for React Native

[![npm](https://img.shields.io/npm/v/@luciq/react-native.svg)](https://www.npmjs.com/package/@luciq/react-native)
[![npm](https://img.shields.io/npm/dt/@luciq/react-native.svg)](https://www.npmjs.com/package/@luciq/react-native)
[![npm](https://img.shields.io/npm/l/@luciq/react-native.svg)](https://github.com/luciqai/luciq-reactnative-sdk/blob/master/LICENSE)
[![Twitter](https://img.shields.io/badge/twitter-@Luciq-blue.svg)](https://twitter.com/Luciqai)

Luciq is the Agentic Observability Platform built for Mobile.

Our intelligent AI agents capture rich, contextual data for every issue — session replays, console logs, and detailed network requests — so you can proactively detect, prioritize, and resolve problems automatically. From traditional bug reporting to proactive resolution, Luciq equips you with the building blocks for your app's success.

Ship faster, deliver frustration-free user sessions, and focus on building what matters. Visit [luciq.ai](https://luciq.ai) for more.

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

| Variable                            | Purpose                                 |
| ----------------------------------- | --------------------------------------- |
| `LUCIQ_APP_TOKEN`                   | App token used for the upload           |
| `LUCIQ_APP_VERSION_NAME`            | Overrides the inferred `versionName`    |
| `LUCIQ_APP_VERSION_CODE`            | Overrides the inferred `versionCode`    |
| `LUCIQ_SOURCEMAPS_UPLOAD_DISABLE`   | Set to `TRUE` to skip the upload step   |

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

<NavigationContainer onStateChange={Luciq.onStateChange}>
  {/* ... */}
</NavigationContainer>;
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

## Documentation

For the full API reference and integration guides, see the [**Luciq documentation**](https://docs.luciq.ai/docs/react-native-overview).
