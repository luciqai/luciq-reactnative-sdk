# Changelog

## [19.4.1](https://github.com/luciqai/luciq-reactnative-sdk/compare/v19.4.0...19.3.0)

### Added

- **Custom Spans**: New feature to manually instrument code paths for performance tracking
  - `APM.startCustomSpan(name)` - Start a custom span and return a span object
  - `CustomSpan.end()` - End the span and report to SDK
  - `APM.addCompletedCustomSpan(name, startDate, endDate)` - Record a pre-completed span
  - Support for up to 100 concurrent spans
  - Comprehensive validation (name length, empty checks, timestamp validation)
  - Feature flag support to enable/disable custom spans

## [19.3.0](https://github.com/luciqai/luciq-reactnative-sdk/compare/v19.3.0...19.2.1)

### Added

- **Custom Spans**: New feature to manually instrument code paths for performance tracking
  - `APM.startCustomSpan(name)` - Start a custom span and return a span object
  - `CustomSpan.end()` - End the span and report to SDK
  - `APM.addCompletedCustomSpan(name, startDate, endDate)` - Record a pre-completed span
  - Support for up to 100 concurrent spans
  - Comprehensive validation (name length, empty checks, timestamp validation)
  - Feature flag support to enable/disable custom spans

### Changed

- Bump Luciq iOS SDK to v19.5.0 ([#37](https://github.com/luciqai/luciq-reactnative-sdk/pull/37)). [See release notes](https://github.com/luciqai/Luciq-iOS-sdk/releases/tag/19.5.0).

- Bump Luciq Android SDK to v19.3.0 ([#37](https://github.com/luciqai/luciq-reactnative-sdk/pull/37)). [See release notes](https://github.com/luciqai/Luciq-Android-sdk/releases/tag/v19.4.0).

## [19.2.2](https://github.com/luciqai/luciq-reactnative-sdk/compare/v19.2.2...19.2.1)

### Changed

- Bump Luciq iOS SDK to v19.4.1 ([#34](https://github.com/luciqai/luciq-reactnative-sdk/pull/34)). [See release notes](https://github.com/luciqai/Luciq-iOS-sdk/releases/tag/19.4.1).

- Bump Luciq Android SDK to v19.2.2 ([#34](https://github.com/luciqai/luciq-reactnative-sdk/pull/34)). [See release notes](https://github.com/luciqai/Luciq-Android-sdk/releases/tag/v19.2.2).

## [19.2.1](https://github.com/luciqai/luciq-reactnative-sdk/compare/v19.2.1...19.1.0)

### Added

- Add support for handling aborted and canceled Axios network requests. ([#36](https://github.com/luciqai/luciq-reactnative-sdk/pull/36))

- Add new UserConsentActionType - noAutomaticBugGrouping. ([#20](https://github.com/luciqai/luciq-reactnative-sdk/pull/20))

### Changed

- Bump Luciq iOS SDK to v19.4.0 ([#29](https://github.com/luciqai/luciq-reactnative-sdk/pull/29)). [See release notes](https://github.com/luciqai/Luciq-iOS-sdk/releases/tag/19.4.0).

- Bump Luciq Android SDK to v19.2.1 ([#29](https://github.com/luciqai/luciq-reactnative-sdk/pull/29)). [See release notes](https://github.com/luciqai/Luciq-Android-sdk/releases/tag/v19.2.1).

### Fixed

- Running Expo Plugin on ios [#31](https://github.com/luciqai/luciq-reactnative-sdk/pull/31))

## [19.1.0](https://github.com/luciqai/luciq-reactnative-sdk/compare/v19.1.0...19.0.0)

### Added

- Add support session replay Video-Like. ([#19](https://github.com/luciqai/luciq-reactnative-sdk/pull/19))

### Changed

- Bump Luciq iOS SDK to v19.3.0 ([#22](https://github.com/luciqai/luciq-reactnative-sdk/pull/22)). [See release notes](https://github.com/luciqai/Luciq-iOS-sdk/releases/tag/19.3.0).

- Bump Luciq Android SDK to v19.1.0 ([#22](https://github.com/luciqai/luciq-reactnative-sdk/pull/22)). [See release notes](https://github.com/luciqai/Luciq-Android-sdk/releases/tag/v19.1.0).

## [19.0.0](https://github.com/luciqai/luciq-reactnative-sdk/compare/v19.0.0...dev)

### Added

- Add support for Screen Rendering ([#4](https://github.com/luciqai/luciq-reactnative-sdk/pull/4)).

### Changed

- Bump Luciq iOS SDK to v19.2.0 ([#4](https://github.com/luciqai/luciq-reactnative-sdk/pull/4)). [See release notes](https://github.com/luciqai/Luciq-iOS-sdk/releases/tag/19.2.0).

- Bump Luciq Android SDK to v19.0.0 ([#4](https://github.com/luciqai/luciq-reactnative-sdk/pull/4)). [See release notes](https://github.com/luciqai/Luciq-Android-sdk/releases/tag/v19.0.0).

## [18.2.0](https://github.com/luciqai/luciq-reactnative-sdk/compare/v18.2.0...18.0.1)

### Changed

- Bump Luciq iOS SDK to v18.2.0 ([#11](https://github.com/luciqai/luciq-reactnative-sdk/pull/11)). [See release notes](https://github.com/luciqai/Luciq-iOS-sdk/releases/tag/18.2.0).

- Bump Luciq Android SDK to v18.1.0 ([#11](https://github.com/luciqai/luciq-reactnative-sdk/pull/11)). [See release notes](https://github.com/luciqai/Luciq-Android-sdk/releases/tag/v19.1.0).

### Added

- Replace jcenter with mavencentral. ([#10](https://github.com/luciqai/luciq-reactnative-sdk/pull/10))

## [18.0.1] (https://github.com/luciqai/luciq-reactnative-sdk/compare/v18.0.1...18.0.0) (October 27, 2025)

### Added

- Add support for proactive bug-reporting ([#2](https://github.com/luciqai/luciq-reactnative-sdk/pull/2))
-
- Add support for chaining errors. ([#3](https://github.com/luciqai/luciq-reactnative-sdk/pull/3))

### Changed

- Bump Luciq iOS SDK to v18.0.1 ([#6](https://github.com/luciqai/luciq-reactnative-sdk/pull/7)). [See release notes](https://github.com/luciqai/Luciq-iOS-sdk/releases/tag/18.0.1).

- Bump Luciq Android SDK to v18.0.1 ([#6](https://github.com/luciqai/luciq-reactnative-sdk/pull/7)). [See release notes](https://github.com/luciqai/Luciq-Android-sdk/releases/tag/v18.0.1).

### Fixed

- guard GraphQL network parsing that caused a crash. ([#5](https://github.com/luciqai/luciq-reactnative-sdk/pull/5))

## [18.0.0](https://github.com/luciqai/luciq-reactnative-sdk/compare/v18.0.0...dev) (September 24, 2025)

- SDK rebranded from Instabug to Luciq.
