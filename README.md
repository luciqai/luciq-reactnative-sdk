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

## Documentation

For more details about the supported APIs and how to use them, check our [**Documentation**](https://docs.luciq.ai/docs/react-native-overview).
