# Luciq for React Native

[![npm](https://img.shields.io/npm/v/@luciq/react-native.svg)](https://www.npmjs.com/package/@luciq/react-native)
[![npm](https://img.shields.io/npm/dt/@luciq/react-native.svg)](https://www.npmjs.com/package/@luciq/react-native)
[![npm](https://img.shields.io/npm/l/@luciq/react-native.svg)](https://github.com/luciqai/luciq-reactnative-sdk/blob/master/LICENSE)
[![Twitter](https://img.shields.io/badge/twitter-@Luciq-blue.svg)](https://twitter.com/Luciqai)
[![Analytics](https://luciq-ga.appspot.com/UA-41982088-6/github/Luciq/@luciq/react-native?pixel)](https://luciq.ai)

Luciq is the Agentic Observability Platform built for Mobile.

Our intelligent AI agents help you capture rich, contextual data for every issue, including full session replays, console logs, and detailed network requests, to proactively detect, prioritize, and resolve problems automatically. From traditional bug reporting to proactive resolution, Luciq equips you with the building blocks to your app’s success.

Ship faster, deliver frustration-free user sessions, and focus on building what matters.

For more info, visit Luciq.ai.

## Installation

1. In Terminal, navigate to your React Native directory and install the `@luciq/react-native` package:

   ```bash
   npm install @luciq/react-native
   ```

   Or if you prefer to use Yarn instead of npm:

   ```bash
   yarn add @luciq/react-native
   ```

2. if you are using expo you need to add `@luciq/react-native` plugin to `app.json`:

   ```json
      "plugins" : [
         [
           "@luciq/react-native",
           {
              // optional that add Mic,Photo permission on iOS and FOREGROUND_SERVICE_MEDIA_PROJECTION on android
             "addScreenRecordingBugReportingPermission": true
           }
         ]
   ]
   ```

3. CocoaPods on iOS needs this extra step:

   ```bash
   cd ios && pod install && cd ..
   ```

## Initializing Luciq

To start using Luciq, import it as follows, then initialize it in the `constructor` or `componentWillMount`. This line will let the SDK work with the default behavior. The SDK will be invoked when the device is shaken. You can customize this behavior through the APIs.

```javascript
import Luciq from '@luciq/react-native';

Luciq.init({
  token: 'APP_TOKEN',
  invocationEvents: [Luciq.invocationEvent.shake],
});
```

_You can find your app token by selecting the SDK tab from your [**Luciq dashboard**](https://dashboard.luciq.ai)._

## Microphone and Photo Library Usage Description (iOS Only)

Luciq needs access to the microphone and photo library to be able to let users add audio and video attachments. Starting from iOS 10, apps that don’t provide a usage description for those 2 permissions would be rejected when submitted to the App Store.

For your app not to be rejected, you’ll need to add the following 2 keys to your app’s info.plist file with text explaining to the user why those permissions are needed:

- `NSMicrophoneUsageDescription`
- `NSPhotoLibraryUsageDescription`

If your app doesn’t already access the microphone or photo library, we recommend using a usage description like:

- "`<app name>` needs access to the microphone to be able to attach voice notes."
- "`<app name>` needs access to your photo library for you to be able to attach images."

**The permission alert for accessing the microphone/photo library will NOT appear unless users attempt to attach a voice note/photo while using Luciq.**

## Uploading Source Map Files for Crash Reports

For your app crashes to show up with a fully symbolicated stack trace, we will automatically generate the source map files and upload them to your dashboard on release build. To do so, we rely on your app token being explicitly added to `Luciq.init({token: 'YOUR_APP_TOKEN'})` in JavaScript.

If your app token is defined as a constant, you can set an environment variable `LUCIQ_APP_TOKEN` to be used instead.
We also automatically read your `versionName` and `versionCode` to upload your sourcemap file. alternatively, can also set the environment variables `LUCIQ_APP_VERSION_NAME` and `LUCIQ_APP_VERSION_CODE` to be used instead.

To disable the automatic upload, you can set the environment variable `LUCIQ_SOURCEMAPS_UPLOAD_DISABLE` to TRUE.

## Network Logging

Luciq network logging is enabled by default. It intercepts any requests performed with `fetch` or `XMLHttpRequest` and attaches them to the report that will be sent to the dashboard. To disable network logs:

```javascript
import { NetworkLogger } from '@luciq/react-native';
```

```javascript
NetworkLogger.setEnabled(false);
```

## Repro Steps

Luciq Repro Steps are enabled by default. It captures a screenshot of each screen the user navigates to. These screens are attached to the BugReport when sent.

We support the two most popular React Native navigation libraries:

- **[react-navigation](https://github.com/react-navigation/react-navigation)**
  - **v5**
    set the `onStateChange` to `Luciq.onStateChange` in your NavigationContainer as follows:

    ```javascript
    <NavigationContainer onStateChange={Luciq.onStateChange} />
    ```

  - **<=v4**
    set the `onNavigationStateChange` to `Luciq.onNavigationStateChange` in your App wrapper as follows:

    ```javascript
    export default () => <App onNavigationStateChange={Luciq.onNavigationStateChange} />;
    ```

- **[react-native-navigation](https://github.com/wix/react-native-navigation)**

  Register `luciq.aiponentDidAppearListener` listener using:

  ```javascript
  Navigation.events().registerComponentDidAppearListener(luciq.aiponentDidAppearListener);
  ```

Alternatively, you can report your screen changes manually using the following API

```javascript
Luciq.reportScreenChange('screenName');
```

You can disable Repro Steps using the following API:

```javascript
Luciq.setReproStepsConfig({ all: ReproStepsMode.disabled });
```

## Custom Spans

Custom spans allow you to manually instrument arbitrary code paths for performance tracking. This feature enables tracking of operations not covered by automatic instrumentation.

### Starting and Ending a Span

```javascript
import { APM } from '@luciq/react-native';

// Start a custom span
const span = await APM.startCustomSpan('Load User Profile');

if (span) {
  try {
    // Perform your operation
    await loadUserProfile();
  } finally {
    // Always end the span, even if operation fails
    await span.end();
  }
}
```

### Recording a Completed Span

```javascript
const start = new Date();
// ... operation already completed ...
const end = new Date();

await APM.addCompletedCustomSpan('Cache Lookup', start, end);
```

### Important Notes

- **Span Limit**: Maximum of 100 concurrent spans at any time
- **Name Length**: Span names are truncated to 150 characters
- **Validation**: Empty names or invalid timestamps will be rejected
- **Idempotent**: Calling `span.end()` multiple times is safe
- **Feature Flags**: Spans are only created when SDK is initialized, APM is enabled, and custom spans feature is enabled

### API Reference

#### `APM.startCustomSpan(name: string): Promise<CustomSpan | null>`

Starts a custom span for performance tracking.

**Parameters:**

- `name` (string): The name of the span. Cannot be empty. Max 150 characters.

**Returns:**

- `Promise<CustomSpan | null>`: The span object to end later, or `null` if the span could not be created.

**Example:**

```javascript
const span = await APM.startCustomSpan('Database Query');
if (span) {
  // ... perform operation ...
  await span.end();
}
```

#### `CustomSpan.end(): Promise<void>`

Ends the custom span and reports it to the SDK. This method is idempotent.

#### `APM.addCompletedCustomSpan(name: string, startDate: Date, endDate: Date): Promise<void>`

Records a completed custom span with pre-recorded timestamps.

**Parameters:**

- `name` (string): The name of the span. Cannot be empty. Max 150 characters.
- `startDate` (Date): The start time of the operation.
- `endDate` (Date): The end time of the operation (must be after startDate).

**Example:**

```javascript
const start = new Date(Date.now() - 1500);
const end = new Date();
await APM.addCompletedCustomSpan('Background Task', start, end);
```

## Documentation

For more details about the supported APIs and how to use them, check our [**Documentation**](https://docs.luciq.ai/docs/react-native-overview).

## Contributing: Adding a Native Method

The library is a dual-architecture TurboModule — one spec drives codegen for both the legacy bridge and the new architecture. When you add a new native method, you'll touch the files listed below. The exact Android step depends on which pattern the target module uses.

### 1. Spec (one file, source of truth)

Declare the method in the corresponding spec file under `src/native/specs/`:

| Module | Spec file |
|---|---|
| Core | `NativeLuciq.ts` |
| `LCQBugReporting` | `NativeBugReporting.ts` |
| `LCQCrashReporting` | `NativeCrashReporting.ts` |
| `LCQAPM` | `NativeAPM.ts` |
| `LCQSurveys` | `NativeSurveys.ts` |
| `LCQReplies` | `NativeReplies.ts` |
| `LCQFeatureRequests` | `NativeFeatureRequests.ts` |
| `LCQSessionReplay` | `NativeSessionReplay.ts` |
| `LCQNetworkLogger` | `NativeNetworkLogger.ts` |

Example — adding `setFoo(value: string): Promise<boolean>` to Crash Reporting:

```ts
// src/native/specs/NativeCrashReporting.ts
export interface Spec extends TurboModule {
  // …existing methods…
  setFoo(value: string): Promise<boolean>;
}
```

Spec type constraints to keep in mind:

- Parameter types must be: `boolean`, `number`, `string`, `Object`, `UnsafeObject`, `Array<T>`, or explicit `T | null`. No TS enums, no unions of non-null types, no optional `?` parameters, no `Record<K,V>`.
- Enums → `string`. The rich enum type stays in the public wrapper (`src/modules/*.ts`), which converts to the string value before the native call.
- Nullable args → explicit `| null`, not `?`.
- Arbitrary object payloads → `UnsafeObject` (from `react-native/Libraries/Types/CodegenTypes`).
- Callback function args aren't supported. Use a no-arg method plus a `NativeEventEmitter` subscription on the JS side.

### 2. JS wrapper types

Add the method to the legacy interface so public code type-checks:

```ts
// src/native/NativeCrashReporting.ts
export interface CrashReportingNativeModule extends NativeModule {
  // …existing methods…
  setFoo(value: string): Promise<boolean>;
}
```

If the method is part of the developer-facing API, also expose it from `src/modules/*.ts` with rich types (enums, overloads, etc.). That wrapper is responsible for converting rich types to the spec-compatible primitives.

### 3. iOS (one file — `.mm`)

Add an `RCT_EXPORT_METHOD` block to the corresponding bridge under `ios/RNLuciq/`:

```objc
// ios/RNLuciq/LuciqCrashReportingBridge.mm
RCT_EXPORT_METHOD(setFoo:(NSString *)value
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
  // implementation
  resolve(@YES);
}
```

The same `RCT_EXPORT_METHOD` serves both old and new architecture. Match the selector labels (`resolve:`, `reject:`) to the codegen-generated protocol — don't use `resolver:` / `rejecter:`. The `#ifdef RCT_NEW_ARCH_ENABLED` block at the bottom of each bridge (`getTurboModule:`) is already in place; you don't need to touch it.

### 4. Android

All 9 modules use the **shim pattern**. Add the method directly to the real module file in `android/src/main/java/ai/luciq/reactlibrary/RNLuciqXModule.java` with an `@ReactMethod` annotation whose signature matches the spec exactly:

```java
@ReactMethod
public void setFoo(String value, Promise promise) {
    MainThreadHandler.runOnMainThread(() -> {
        // implementation
        promise.resolve(true);
    });
}
```

How it works under the hood: each module extends a thin `RNLuciqXBaseSpec` abstract class that exists in two flavors:

- `android/src/oldarch/java/.../RNLuciqXBaseSpec.java` — extends `EventEmitterModule` or `ReactContextBaseJavaModule`
- `android/src/newarch/java/.../RNLuciqXBaseSpec.java` — extends the codegen-generated `NativeXSpec`

Gradle activates one or the other based on `newArchEnabled`. You don't edit these shim files when adding a method — only the main module file. On old arch `@ReactMethod` handles dispatch; on new arch your method's signature overrides the abstract method on `NativeXSpec`.

If the new-arch abstract signature uses `double` (codegen maps TS `number` → `double`) or `@Nullable Double` (for `number | null`), make sure your method matches exactly — the compiler will tell you if it doesn't.

### 5. Verify

Run the full check:

```bash
# Type-check and unit tests
yarn build:lib && yarn test

# Android — old arch
cd examples/default/android && ./gradlew :app:compileDebugJavaWithJavac

# Android — new arch
./gradlew :app:compileDebugJavaWithJavac -PnewArchEnabled=true

# iOS — old arch
cd examples/default/ios && pod install && xcodebuild -workspace LuciqExample.xcworkspace -scheme LuciqExample -configuration Debug -destination 'generic/platform=iOS Simulator' -sdk iphonesimulator build

# iOS — new arch
RCT_NEW_ARCH_ENABLED=1 pod install && RCT_NEW_ARCH_ENABLED=1 xcodebuild -workspace LuciqExample.xcworkspace -scheme LuciqExample -configuration Debug -destination 'generic/platform=iOS Simulator' -sdk iphonesimulator build
```

All four builds must pass before merging.

### Platform-only methods

If a method only applies to one platform (e.g. `setNotificationIcon` for Android, `setShakingThresholdForiPad` for iOS), still declare it in the spec — then stub it as a no-op on the other platform so the unified abstract class stays satisfied.
