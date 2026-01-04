# Changelog


## [Unreleased](https://github.com/luciqai/luciq-reactnative-sdk/compare/v19.0.0...dev)

### Added

- **Custom Spans**: New feature to manually instrument code paths for performance tracking
    - `APM.startCustomSpan(name)` - Start a custom span and return a span object
    - `CustomSpan.end()` - End the span and report to SDK
    - `APM.addCompletedCustomSpan(name, startDate, endDate)` - Record a pre-completed span
    - Support for up to 100 concurrent spans
    - Comprehensive validation (name length, empty checks, timestamp validation)
    - Feature flag support to enable/disable custom spans

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

- SDK rebranded from Luciq to Luciq.
