//
//  RCTConvert+LuciqEnums.m
//  luciqDemo
//
//  Created by Yousef Hamza on 9/29/16.
//  Copyright © 2016 Facebook. All rights reserved.
//

#import "RCTConvert+LuciqEnums.h"
#import <InstabugSDK/IBGTypes.h>

@implementation RCTConvert (LuciqEnums)

RCT_ENUM_CONVERTER(
  IBGSDKDebugLogsLevel,
  ArgsRegistry.sdkLogLevels,
  IBGSDKDebugLogsLevelError,
  integerValue
);

RCT_ENUM_CONVERTER(
  IBGInvocationEvent,
  ArgsRegistry.invocationEvents,
  IBGInvocationEventNone,
  integerValue
);

RCT_ENUM_CONVERTER(
  IBGBugReportingOption,
  ArgsRegistry.invocationOptions,
  IBGBugReportingOptionNone,
  integerValue
);

RCT_ENUM_CONVERTER(
  IBGColorTheme,
  ArgsRegistry.colorThemes,
  IBGColorThemeLight,
  integerValue
);

RCT_ENUM_CONVERTER(
  CGRectEdge,
  ArgsRegistry.floatingButtonEdges,
  CGRectMinXEdge,
  unsignedIntegerValue
);

RCT_ENUM_CONVERTER(
  IBGPosition,
  ArgsRegistry.recordButtonPositions,
  IBGPositionBottomRight,
  integerValue
);

RCT_ENUM_CONVERTER(
  IBGWelcomeMessageMode,
  ArgsRegistry.welcomeMessageStates,
  IBGWelcomeMessageModeLive,
  integerValue
);

RCT_ENUM_CONVERTER(
  IBGBugReportingReportType,
  ArgsRegistry.reportTypes,
  IBGBugReportingReportTypeBug,
  integerValue
);

RCT_ENUM_CONVERTER(
  IBGDismissType,
  ArgsRegistry.dismissTypes,
  IBGDismissTypeSubmit,
  integerValue
);

RCT_ENUM_CONVERTER(
  IBGAction,
  ArgsRegistry.actionTypes,
  IBGActionAllActions,
  integerValue
);

RCT_ENUM_CONVERTER(
  IBGExtendedBugReportMode,
  ArgsRegistry.extendedBugReportStates,
  IBGExtendedBugReportModeDisabled,
  integerValue
);

RCT_ENUM_CONVERTER(
  IBGUserStepsMode,
  ArgsRegistry.reproStates,
  IBGUserStepsModeEnabledWithNoScreenshots,
  integerValue
);

RCT_ENUM_CONVERTER(
  IBGLocale,
  ArgsRegistry.locales,
  IBGLocaleEnglish,
  integerValue
);

RCT_ENUM_CONVERTER(
  IBGNonFatalLevel,
  ArgsRegistry.nonFatalExceptionLevel,
  IBGNonFatalLevelError,
  integerValue
);

RCT_ENUM_CONVERTER(
  IBGAutoMaskScreenshotOption,
  ArgsRegistry.autoMaskingTypes,
  IBGAutoMaskScreenshotOptionMaskNothing,
  integerValue
);

RCT_ENUM_CONVERTER(
  IBGActionType,
  ArgsRegistry.userConsentActionTypes,
  IBGActionTypeNoChat,
  integerValue
);

@end

