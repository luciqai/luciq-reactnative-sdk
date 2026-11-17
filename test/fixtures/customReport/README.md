# Custom report bridge fixtures

These JSON files are the cross-platform contract for the custom report bridge
(`BugReporting.setReportCategoriesScope`, `getReportConfiguration`, `submitReport`).

- `report.full.json`: the payload JS sends to the native module for `submitReport`
  (`CustomReport` without `reportType`, which is passed separately, and without null entries).
- `result.*.json`: what the native module resolves `submitReport` with.
- `configuration.*.json`: what the native module resolves `getReportConfiguration` with
  (JS adds the `reportType` it asked for).

Consumers:

- Jest: `test/modules/BugReportingCustomReport.spec.ts`, `test/models/CustomReport.spec.ts`.
- Android JUnit: `android/src/test/.../utils/CustomReportUtilTest.java` reads the files
  from this folder and compares the bridge maps with them.
- iOS XCTest: `examples/default/ios/LuciqTests/LuciqBugReportingTests.m` mirrors the
  same values by hand (the test bundle carries no resources).

Enum values always travel as lower-camel names (`tryLater`, `extendedField`,
`tooShort`, ...), never as native ordinals, because the Android and iOS ordinals differ.
