---
description: Troubleshoot common Luciq React Native SDK issues
---

# Debug SDK

Troubleshoot common issues with the Luciq React Native SDK.

## Common Issues

### SDK Not Initializing
1. Verify `Luciq.init()` is called before any other SDK method
2. Check the app token is correct
3. Check platform-specific setup (iOS Info.plist, Android manifest)
4. Enable verbose logging to see initialization output

### Crashes Not Captured
1. Verify `CrashReporting` is enabled
2. Check that the global error handler is properly set up
3. Ensure both JS and native crash handlers are registered
4. Check if the crash is on the native side vs JS side

### Network Requests Not Logged
1. Check network interception mode (JavaScript vs Native)
2. For JS mode: verify XhrNetworkInterceptor is wrapping fetch/XMLHttpRequest
3. Check that network logging is enabled in SDK settings
4. Verify request filtering regex isn't excluding the requests

### Screen Tracking Not Working
1. Verify navigation integration is set up correctly
2. Check which navigation library is being used (React Navigation v4/v6, react-native-navigation v7)
3. Verify `reportScreenChange` is being called
4. Check route names match expected patterns

### Build Failures After SDK Update
1. For iOS: `cd ios && pod install`
2. For Android: Clean build `cd android && ./gradlew clean`
3. Clear Metro cache: `npx react-native start --reset-cache`
4. Clear node_modules: `rm -rf node_modules && yarn install`

### Source Map Upload Issues
1. Check `ios/sourcemaps.sh` has execute permissions
2. Verify `android/sourcemaps.gradle` is properly included
3. Run CLI manually: `npx luciq upload-sourcemaps`

## Diagnostic Commands

```bash
# Check TypeScript compilation
yarn build:lib

# Run tests to verify SDK integrity
yarn test

# Check for lint issues
yarn lint

# Check formatting
yarn format
```
