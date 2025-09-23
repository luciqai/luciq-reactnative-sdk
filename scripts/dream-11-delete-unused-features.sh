#!/bin/bash

# remove survey and featureRequest features in JavaScript files
deletedFeaturesFilesInJavaScript=("Surveys" "FeatureRequests" "Survey")
for feature in "${deletedFeaturesFilesInJavaScript[@]}"; do
	echo "$feature"

	rm -f src/modules/"$feature".ts
	rm -f src/native/Native"$feature".ts
	rm -f test/mocks/mock"$feature".ts
	rm -f test/modules/"$feature".spec.ts

	node scripts/replace.js --pattern "import.+$feature';" "" src/index.ts
	node scripts/replace.js --pattern "$feature," "" src/index.ts
	node scripts/replace.js --pattern ".*$feature.*" "" src/native/NativePackage.ts
	node scripts/replace.js --pattern ".*$feature.*" "" test/mocks/mockNativeModules.ts
done

npx eslint src/index.ts --fix

# remove survey and featureRequest features in Android  files
deletedFeaturesFilesInAndroidApp=("RNLuciqSurveysModule" "RNLuciqFeatureRequestsModule")
for feature in "${deletedFeaturesFilesInAndroidApp[@]}"; do
	echo "$feature"

	rm -f android/src/main/java/ai/luciq/reactlibrary/"$feature".java
	rm -f android/src/test/java/ai/luciq/reactlibrary/"$feature"Test.java
	node scripts/replace.js "modules.add(new $feature(reactContext));" "" android/src/main/java/ai/luciq/reactlibrary/RNLuciqReactnativePackage.java
done

# remove survey and featureRequest features in IOS  files
deletedFeaturesFilesInIosApp=("LuciqSurveysBridge" "LuciqFeatureRequestsBridge")
for feature in "${deletedFeaturesFilesInIosApp[@]}"; do
	echo "$feature"
	rm -f ios/RNLuciq/"$feature".h
	rm -f ios/RNLuciq/"$feature".m
done

# Remove unused features iOS test files
iosTestFiles=("LuciqSurveysTests.m" "LuciqFeatureRequestsTests.m")
for file in "${iosTestFiles[@]}"; do
	echo "Deleting $file"

	rm -f examples/default/ios/LuciqTests/"$file"
	node scripts/replace.js --pattern ".*$file.*" "" examples/default/ios/LuciqExample.xcodeproj/project.pbxproj
done

node scripts/replace.js "#import <Luciq/LQSurveys.h>" "" ios/RNLuciq/LuciqReactBridge.m
node scripts/replace.js "#import <Luciq/LQSurveys.h>" "" ios/RNLuciq/LuciqReactBridge.h

# Remove all locales except for English
# This ugly regular expression matches all lines not containing "english" and containing "constants.locale"
node scripts/replace.js --pattern "^(?!.*english).+constants\.locale.*" "" src/utils/Enums.ts
npx eslint src/index.ts --fix src/utils/Enums.ts

node scripts/replace.js "return (major == 7 && minor >= 3) || major >= 8" "return false" android/build.gradle

# Note: printf is used here as the string contains a newline character which would be escaped otherwise.
node scripts/replace.js "static boolean supportsNamespace() {" "$(printf "static boolean supportsNamespace() {\n  return false")" android/build.gradle

# Add Dream11 custom iOS build podspec to Podfile
node scripts/replace.js "target 'LuciqExample' do" "$(printf "target 'LuciqExample' do\n  pod 'Luciq', :podspec => 'https://ios-releases.luciq.ai/custom/dream11/Luciq.podspec'")" examples/default/ios/Podfile
