//
//  RCTConvert+LuciqEnums.m
//  luciqDemo
//
//  Created by Yousef Hamza on 9/29/16.
//  Copyright © 2016 Facebook. All rights reserved.
//

#import "RCTConvert+LuciqEnums.h"
#import <LuciqSDK/LCQTypes.h>

@implementation RCTConvert (LuciqEnums)

RCT_ENUM_CONVERTER(
  LCQSDKDebugLogsLevel,
  ArgsRegistry.sdkLogLevels,
  LCQSDKDebugLogsLevelError,
  integerValue
);

RCT_ENUM_CONVERTER(
  LCQInvocationEvent,
  ArgsRegistry.invocationEvents,
  LCQInvocationEventNone,
  integerValue
);

RCT_ENUM_CONVERTER(
  LCQBugReportingOption,
  ArgsRegistry.invocationOptions,
  LCQBugReportingOptionNone,
  integerValue
);

RCT_ENUM_CONVERTER(
  LCQColorTheme,
  ArgsRegistry.colorThemes,
  LCQColorThemeLight,
  integerValue
);

RCT_ENUM_CONVERTER(
  CGRectEdge,
  ArgsRegistry.floatingButtonEdges,
  CGRectMinXEdge,
  unsignedIntegerValue
);

RCT_ENUM_CONVERTER(
  LCQPosition,
  ArgsRegistry.recordButtonPositions,
  LCQPositionBottomRight,
  integerValue
);

RCT_ENUM_CONVERTER(
  LCQWelcomeMessageMode,
  ArgsRegistry.welcomeMessageStates,
  LCQWelcomeMessageModeLive,
  integerValue
);

RCT_ENUM_CONVERTER(
  LCQBugReportingReportType,
  ArgsRegistry.reportTypes,
  LCQBugReportingReportTypeBug,
  integerValue
);

RCT_ENUM_CONVERTER(
  LCQDismissType,
  ArgsRegistry.dismissTypes,
  LCQDismissTypeSubmit,
  integerValue
);

RCT_ENUM_CONVERTER(
  LCQAction,
  ArgsRegistry.actionTypes,
  LCQActionAllActions,
  integerValue
);

RCT_ENUM_CONVERTER(
  LCQExtendedBugReportMode,
  ArgsRegistry.extendedBugReportStates,
  LCQExtendedBugReportModeDisabled,
  integerValue
);

RCT_ENUM_CONVERTER(
  LCQUserStepsMode,
  ArgsRegistry.reproStates,
  LCQUserStepsModeEnabledWithNoScreenshots,
  integerValue
);

RCT_ENUM_CONVERTER(
  LCQLocale,
  ArgsRegistry.locales,
  LCQLocaleEnglish,
  integerValue
);

RCT_ENUM_CONVERTER(
  LCQNonFatalLevel,
  ArgsRegistry.nonFatalExceptionLevel,
  LCQNonFatalLevelError,
  integerValue
);

RCT_ENUM_CONVERTER(
  LCQAutoMaskScreenshotOption,
  ArgsRegistry.autoMaskingTypes,
  LCQAutoMaskScreenshotOptionMaskNothing,
  integerValue
);

RCT_ENUM_CONVERTER(
                   LCQConsentAction,
  ArgsRegistry.userConsentActionTypes,
                   LCQConsentActionNoChat,
  integerValue
);

@end

