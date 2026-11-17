# Custom report bridge fixtures

These JSON files are the cross-platform contract for the custom report bridge
(`BugReporting.setReportCategoriesScope`, `getReportConfiguration`, `submitReport`).

- `report.*.json`: the payload JS sends to the native module for `submitReport`
  (every key of `CustomReport` except `reportType`, which is passed separately).
- `result.*.json`: what the native module resolves `submitReport` with.
- `configuration.*.json`: what the native module resolves `getReportConfiguration` with.

Consumers:

- Jest: `test/modules/BugReportingCustomReport.spec.ts`, `test/models/*.spec.ts`.
- Android JUnit: `android/src/test/.../utils/CustomReportArgsTest.java`,
  `CustomReportResultMapperTest.java`, `ReportConfigurationMapperTest.java`
  read the files from this folder and compare the mapper output with them.
- iOS XCTest: `examples/default/ios/LuciqTests/LuciqBugReportingTests.m` mirrors the
  same values by hand (the test bundle carries no resources).

Enum values always travel as lower-camel names (`tryLater`, `extendedField`,
`tooShort`, ...), never as native ordinals, because the Android and iOS ordinals differ.
