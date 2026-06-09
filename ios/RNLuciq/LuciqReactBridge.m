//
//  LuciqReactBridge.m
//  luciqDemo
//
//  Created by Yousef Hamza on 9/29/16.

#import "LuciqReactBridge.h"
#import <LuciqSDK/LuciqSDK.h>
#import <LuciqSDK/LCQBugReporting.h>
#import <LuciqSDK/LCQCrashReporting.h>
#import <LuciqSDK/LCQLog.h>
#import <LuciqSDK/LCQAPM.h>
#import <asl.h>
#import <os/log.h>
#import <React/RCTUIManager.h>
#import "RNLuciq.h"
#import "Util/LCQNetworkLogger+CP.h"
#import "Util/LuciqRNLogger.h"
#import "Util/LuciqRNDebugTags.h"

@interface Luciq (PrivateWillSendAPI)
+ (void)setWillSendReportHandler_private:(void(^)(LCQReport *report, void(^reportCompletionHandler)(LCQReport *)))willSendReportHandler_private;
@end

@implementation LuciqReactBridge

- (NSArray<NSString *> *)supportedEvents {
    return @[@"LCQpreSendingHandler" , @"LCQNetworkLoggerHandler"];
}

RCT_EXPORT_MODULE(Luciq)

- (dispatch_queue_t)methodQueue {
    return dispatch_get_main_queue();
}


RCT_EXPORT_METHOD(setEnabled:(BOOL)isEnabled) {
    [LuciqRNLogger d:[LuciqRNDebugTags core] format:@"[setEnabled] called isEnabled=%@", (isEnabled ? @"YES" : @"NO")];
    Luciq.enabled = isEnabled;
}

RCT_EXPORT_METHOD(init:(NSString *)token
          invocationEvents:(NSArray *)invocationEventsArray
          debugLogsLevel:(LCQSDKDebugLogsLevel)sdkDebugLogsLevel
          useNativeNetworkInterception:(BOOL)useNativeNetworkInterception
          codePushVersion:(NSString *)codePushVersion
          appVariant:(NSString *)appVariant
          options:(nullable NSDictionary *)options
          overAirVersion :(NSDictionary *)overAirVersion
          ) {
    [LuciqRNLogger setLevel:sdkDebugLogsLevel];
    [LuciqRNLogger d:[LuciqRNDebugTags core] format:@"[init] Called - logLevel=%ld, useNativeNetworkInterception=%d, codePushVersion=%@, appVariant=%@", (long)sdkDebugLogsLevel, useNativeNetworkInterception, codePushVersion, appVariant];

           if(appVariant != nil){
                  Luciq.appVariant = appVariant;
              }

    LCQInvocationEvent invocationEvents = 0;

    for (NSNumber *boxedValue in invocationEventsArray) {
        invocationEvents |= [boxedValue intValue];
    }

    [Luciq setCodePushVersion:codePushVersion];

    [Luciq setOverAirVersion:overAirVersion[@"version"] withType:[overAirVersion[@"service"] intValue]];

    [RNLuciq initWithToken:token
             invocationEvents:invocationEvents
               debugLogsLevel:sdkDebugLogsLevel
 useNativeNetworkInterception:useNativeNetworkInterception];
    [LuciqRNLogger d:[LuciqRNDebugTags core] format:@"[init] SDK build complete"];
}

RCT_EXPORT_METHOD(setCodePushVersion:(NSString *)version) {
    [LuciqRNLogger d:[LuciqRNDebugTags core] format:@"[setCodePushVersion] called version=%@", version];
    [Luciq setCodePushVersion:version];
}

RCT_EXPORT_METHOD(setOverAirVersion:(NSDictionary *)overAirVersion) {
    [LuciqRNLogger d:[LuciqRNDebugTags core] format:@"[setOverAirVersion] called keys.count=%lu", (unsigned long)overAirVersion.count];
    [Luciq setOverAirVersion:overAirVersion[@"version"] withType:[overAirVersion[@"service"] intValue]];
}

RCT_EXPORT_METHOD(setAppVariant:(NSString *)appVariant) {
    [LuciqRNLogger d:[LuciqRNDebugTags core] format:@"[setAppVariant] called appVariantLength=%lu, present=%@", (unsigned long)appVariant.length, (appVariant != nil ? @"YES" : @"NO")];
    Luciq.appVariant = appVariant;
}

RCT_EXPORT_METHOD(setReproStepsConfig:(LCQUserStepsMode)bugMode :(LCQUserStepsMode)crashMode:(LCQUserStepsMode)sessionReplayMode) {
    [LuciqRNLogger d:[LuciqRNDebugTags core] format:@"[setReproStepsConfig] called bugMode=%ld crashMode=%ld sessionReplayMode=%ld", (long)bugMode, (long)crashMode, (long)sessionReplayMode];
    [Luciq setReproStepsFor:LCQIssueTypeBug withMode:bugMode];
    [Luciq setReproStepsFor:LCQIssueTypeAllCrashes withMode:crashMode];
    [Luciq setReproStepsFor:LCQIssueTypeSessionReplay withMode:sessionReplayMode];
}

RCT_EXPORT_METHOD(setFileAttachment:(NSString *)fileLocation) {
    [LuciqRNLogger d:[LuciqRNDebugTags core] format:@"[setFileAttachment] called fileLocation=%@", [LuciqRNLogger redactURL:fileLocation]];
    NSURL *url = [NSURL URLWithString:fileLocation];
    [Luciq addFileAttachmentWithURL:url];
}

RCT_EXPORT_METHOD(setUserData:(NSString *)userData) {
    [LuciqRNLogger d:[LuciqRNDebugTags core] format:@"[setUserData] called length=%lu, present=%@", (unsigned long)userData.length, (userData != nil ? @"YES" : @"NO")];
    [Luciq setUserData:userData];
}

RCT_EXPORT_METHOD(setTrackUserSteps:(BOOL)isEnabled) {
    [LuciqRNLogger d:[LuciqRNDebugTags core] format:@"[setTrackUserSteps] called isEnabled=%@", (isEnabled ? @"YES" : @"NO")];
    [Luciq setTrackUserSteps:isEnabled];
}

RCT_EXPORT_METHOD(setWebViewMonitoringEnabled:(BOOL)isEnabled) {
    [LuciqRNLogger d:[LuciqRNDebugTags core] format:@"[setWebViewMonitoringEnabled] called isEnabled=%@", (isEnabled ? @"YES" : @"NO")];
    [Luciq setWebViewMonitoringEnabled:isEnabled];
}

RCT_EXPORT_METHOD(setWebViewNetworkTrackingEnabled:(BOOL)isEnabled) {
    [LuciqRNLogger d:[LuciqRNDebugTags core] format:@"[setWebViewNetworkTrackingEnabled] called isEnabled=%@", (isEnabled ? @"YES" : @"NO")];
    [Luciq setWebViewNetworkTrackingEnabled:isEnabled];
}

RCT_EXPORT_METHOD(setWebViewUserInteractionsTrackingEnabled:(BOOL)isEnabled) {
    [LuciqRNLogger d:[LuciqRNDebugTags core] format:@"[setWebViewUserInteractionsTrackingEnabled] called isEnabled=%@", (isEnabled ? @"YES" : @"NO")];
    [Luciq setWebViewUserInteractionsTrackingEnabled:isEnabled];
}

LCQReport *currentReport = nil;
RCT_EXPORT_METHOD(setPreSendingHandler:(RCTResponseSenderBlock)callBack) {
    [LuciqRNLogger d:[LuciqRNDebugTags bugReporting] format:@"[setPreSendingHandler] called callBack.present=%@", (callBack != nil ? @"YES" : @"NO")];
    if (callBack != nil) {
        Luciq.willSendReportHandler = ^LCQReport * _Nonnull(LCQReport * _Nonnull report) {
            NSArray *tagsArray = report.tags;
            NSArray *luciqLogs= report.luciqLogs;
            NSArray *consoleLogs= report.consoleLogs;
            NSDictionary *userAttributes= report.userAttributes;
            NSArray *fileAttachments= report.fileLocations;
            NSDictionary *dict = @{ @"tagsArray" : tagsArray, @"luciqLogs" : luciqLogs, @"consoleLogs" : consoleLogs,       @"userAttributes" : userAttributes, @"fileAttachments" : fileAttachments};
            [self sendEventWithName:@"LCQpreSendingHandler" body:dict];
            [LuciqRNLogger d:[LuciqRNDebugTags bugReporting] format:@"[LCQpreSendingHandler] emitted"];

            currentReport = report;
            return report;
        };
    } else {
        Luciq.willSendReportHandler = nil;
    }
}

RCT_EXPORT_METHOD(appendTagToReport:(NSString*) tag) {
    [LuciqRNLogger d:[LuciqRNDebugTags bugReporting] format:@"[appendTagToReport] called length=%lu, present=%@", (unsigned long)tag.length, (tag != nil ? @"YES" : @"NO")];
    if (currentReport != nil) {
        [currentReport appendTag:tag];
    }
}

RCT_EXPORT_METHOD(appendConsoleLogToReport:(NSString*) consoleLog) {
    [LuciqRNLogger d:[LuciqRNDebugTags bugReporting] format:@"[appendConsoleLogToReport] called length=%lu, present=%@", (unsigned long)consoleLog.length, (consoleLog != nil ? @"YES" : @"NO")];
    if (currentReport != nil) {
        [currentReport appendToConsoleLogs:consoleLog];
    }
}

RCT_EXPORT_METHOD(setUserAttributeToReport:(NSString*) key:(NSString*) value) {
    [LuciqRNLogger d:[LuciqRNDebugTags bugReporting] format:@"[setUserAttributeToReport] called keyLength=%lu valueLength=%lu present=%@", (unsigned long)key.length, (unsigned long)value.length, (key != nil ? @"YES" : @"NO")];
    if (currentReport != nil) {
        [currentReport setUserAttribute:value withKey:key];
    }
}

RCT_EXPORT_METHOD(logDebugToReport:(NSString*) log) {
    [LuciqRNLogger d:[LuciqRNDebugTags bugReporting] format:@"[logDebugToReport] called length=%lu, present=%@", (unsigned long)log.length, (log != nil ? @"YES" : @"NO")];
    if (currentReport != nil) {
        [currentReport logDebug:log];
    }
}

RCT_EXPORT_METHOD(logVerboseToReport:(NSString*) log) {
    [LuciqRNLogger d:[LuciqRNDebugTags bugReporting] format:@"[logVerboseToReport] called length=%lu, present=%@", (unsigned long)log.length, (log != nil ? @"YES" : @"NO")];
    if (currentReport != nil) {
        [currentReport logVerbose:log];
    }
}

RCT_EXPORT_METHOD(logWarnToReport:(NSString*) log) {
    [LuciqRNLogger d:[LuciqRNDebugTags bugReporting] format:@"[logWarnToReport] called length=%lu, present=%@", (unsigned long)log.length, (log != nil ? @"YES" : @"NO")];
    if (currentReport != nil) {
        [currentReport logWarn:log];
    }
}

RCT_EXPORT_METHOD(logErrorToReport:(NSString*) log) {
    [LuciqRNLogger d:[LuciqRNDebugTags bugReporting] format:@"[logErrorToReport] called length=%lu, present=%@", (unsigned long)log.length, (log != nil ? @"YES" : @"NO")];
    if (currentReport != nil) {
        [currentReport logError:log];
    }
}

RCT_EXPORT_METHOD(logInfoToReport:(NSString*) log) {
    [LuciqRNLogger d:[LuciqRNDebugTags bugReporting] format:@"[logInfoToReport] called length=%lu, present=%@", (unsigned long)log.length, (log != nil ? @"YES" : @"NO")];
    if (currentReport != nil) {
        [currentReport logInfo:log];
    }
}

RCT_EXPORT_METHOD(addFileAttachmentWithURLToReport:(NSString*) urlString) {
    [LuciqRNLogger d:[LuciqRNDebugTags bugReporting] format:@"[addFileAttachmentWithURLToReport] called urlString=%@", [LuciqRNLogger redactURL:urlString]];
    if (currentReport != nil) {
        NSURL *url = [NSURL URLWithString:urlString];
        [currentReport addFileAttachmentWithURL:url];
    }
}

RCT_EXPORT_METHOD(addFileAttachmentWithDataToReport:(NSString*) dataString) {
    [LuciqRNLogger d:[LuciqRNDebugTags bugReporting] format:@"[addFileAttachmentWithDataToReport] called length=%lu, present=%@", (unsigned long)dataString.length, (dataString != nil ? @"YES" : @"NO")];
    if (currentReport != nil) {
        NSData* data = [dataString dataUsingEncoding:NSUTF8StringEncoding];
        [currentReport addFileAttachmentWithData:data];
    }
}

RCT_EXPORT_METHOD(setLocale:(LCQLocale)locale) {
    [LuciqRNLogger d:[LuciqRNDebugTags core] format:@"[setLocale] called locale=%ld", (long)locale];
    [Luciq setLocale:locale];
}

RCT_EXPORT_METHOD(setColorTheme:(LCQColorTheme)colorTheme) {
    [LuciqRNLogger d:[LuciqRNDebugTags core] format:@"[setColorTheme] called colorTheme=%ld", (long)colorTheme];
        [Luciq setColorTheme:colorTheme];
}


RCT_EXPORT_METHOD(setTheme:(NSDictionary *)themeConfig) {
    [LuciqRNLogger d:[LuciqRNDebugTags core] format:@"[setTheme] called themeConfig.count=%lu", (unsigned long)themeConfig.count];
    LCQTheme *theme = [[LCQTheme alloc] init];

    NSDictionary *colorMapping = @{
        @"primaryColor": ^(UIColor *color) { theme.primaryColor = color; },
        @"backgroundColor": ^(UIColor *color) { theme.backgroundColor = color; },
        @"titleTextColor": ^(UIColor *color) { theme.titleTextColor = color; },
        @"subtitleTextColor": ^(UIColor *color) { theme.subtitleTextColor = color; },
        @"primaryTextColor": ^(UIColor *color) { theme.primaryTextColor = color; },
        @"secondaryTextColor": ^(UIColor *color) { theme.secondaryTextColor = color; },
        @"callToActionTextColor": ^(UIColor *color) { theme.callToActionTextColor = color; },
        @"headerBackgroundColor": ^(UIColor *color) { theme.headerBackgroundColor = color; },
        @"footerBackgroundColor": ^(UIColor *color) { theme.footerBackgroundColor = color; },
        @"rowBackgroundColor": ^(UIColor *color) { theme.rowBackgroundColor = color; },
        @"selectedRowBackgroundColor": ^(UIColor *color) { theme.selectedRowBackgroundColor = color; },
        @"rowSeparatorColor": ^(UIColor *color) { theme.rowSeparatorColor = color; }
    };

    for (NSString *key in colorMapping) {
        if (themeConfig[key]) {
            NSString *colorString = themeConfig[key];
            UIColor *color = [self colorFromHexString:colorString];
            if (color) {
                void (^setter)(UIColor *) = colorMapping[key];
                setter(color);
            }
        }
    }

    [self setFontIfPresent:themeConfig[@"primaryFontPath"] forTheme:theme type:@"primary"];
    [self setFontIfPresent:themeConfig[@"secondaryFontPath"] forTheme:theme type:@"secondary"];
    [self setFontIfPresent:themeConfig[@"ctaFontPath"] forTheme:theme type:@"cta"];

    Luciq.theme = theme;
}

- (void)setFontIfPresent:(NSString *)fontPath forTheme:(LCQTheme *)theme type:(NSString *)type {
    if (fontPath) {
        NSString *fileName = [fontPath lastPathComponent];
        NSString *nameWithoutExtension = [fileName stringByDeletingPathExtension];
        UIFont *font = [UIFont fontWithName:nameWithoutExtension size:17.0];
        if (font) {
            if ([type isEqualToString:@"primary"]) {
                theme.primaryTextFont = font;
            } else if ([type isEqualToString:@"secondary"]) {
                theme.secondaryTextFont = font;
            } else if ([type isEqualToString:@"cta"]) {
                theme.callToActionTextFont = font;
            }
        }
    }
}

- (UIColor *)colorFromHexString:(NSString *)hexString {
    NSString *cleanString = [hexString stringByReplacingOccurrencesOfString:@"#" withString:@""];

    if (cleanString.length == 6) {
        unsigned int rgbValue = 0;
        NSScanner *scanner = [NSScanner scannerWithString:cleanString];
        [scanner scanHexInt:&rgbValue];

        return [UIColor colorWithRed:((rgbValue & 0xFF0000) >> 16) / 255.0
                               green:((rgbValue & 0xFF00) >> 8) / 255.0
                                blue:(rgbValue & 0xFF) / 255.0
                               alpha:1.0];
    } else if (cleanString.length == 8) {
        unsigned int rgbaValue = 0;
        NSScanner *scanner = [NSScanner scannerWithString:cleanString];
        [scanner scanHexInt:&rgbaValue];

        return [UIColor colorWithRed:((rgbaValue & 0xFF000000) >> 24) / 255.0
                               green:((rgbaValue & 0xFF0000) >> 16) / 255.0
                                blue:((rgbaValue & 0xFF00) >> 8) / 255.0
                               alpha:(rgbaValue & 0xFF) / 255.0];
    }

    return [UIColor blackColor];
}



RCT_EXPORT_METHOD(appendTags:(NSArray *)tags) {
    [LuciqRNLogger d:[LuciqRNDebugTags core] format:@"[appendTags] called tags.count=%lu", (unsigned long)tags.count];
    [Luciq appendTags:tags];
}

RCT_EXPORT_METHOD(resetTags) {
    [LuciqRNLogger d:[LuciqRNDebugTags core] format:@"[resetTags] called"];
    [Luciq resetTags];
}

RCT_EXPORT_METHOD(getTags:(RCTPromiseResolveBlock)resolve :(RCTPromiseRejectBlock)reject) {
    [LuciqRNLogger d:[LuciqRNDebugTags core] format:@"[getTags] called"];
    @try {
        NSArray *result = [Luciq getTags];
        [LuciqRNLogger d:[LuciqRNDebugTags core] format:@"[getTags] success result.count=%lu", (unsigned long)result.count];
        resolve(result);
    } @catch (NSException *exception) {
        [LuciqRNLogger e:[LuciqRNDebugTags core] format:@"[getTags] failed: %@", exception];
        reject(@"GET_TAGS_ERROR", exception.reason ?: @"Failed to get tags", nil);
    }
}

RCT_EXPORT_METHOD(setString:(NSString*)value toKey:(NSString*)key) {
    [LuciqRNLogger d:[LuciqRNDebugTags core] format:@"[setString] called keyLength=%lu valueLength=%lu present=%@", (unsigned long)key.length, (unsigned long)value.length, (key != nil ? @"YES" : @"NO")];
    [Luciq setValue:value forStringWithKey:key];
}

RCT_EXPORT_METHOD(addFileAttachment:(NSString *)fileURLString) {
    [LuciqRNLogger d:[LuciqRNDebugTags core] format:@"[addFileAttachment] called fileURLString=%@", [LuciqRNLogger redactURL:fileURLString]];
    [Luciq addFileAttachmentWithURL:[NSURL URLWithString:fileURLString]];
}

RCT_EXPORT_METHOD(clearFileAttachments) {
    [LuciqRNLogger d:[LuciqRNDebugTags core] format:@"[clearFileAttachments] called"];
    [Luciq clearFileAttachments];
}

RCT_EXPORT_METHOD(identifyUser:(NSString *)email name:(NSString *)name userId:(nullable NSString *)userId) {
    [LuciqRNLogger d:[LuciqRNDebugTags core] format:@"[identifyUser] called emailLength=%lu nameLength=%lu userIdLength=%lu present=%@", (unsigned long)email.length, (unsigned long)name.length, (unsigned long)userId.length, (userId != nil ? @"YES" : @"NO")];
    [Luciq identifyUserWithID:userId email:email name:name];
}

RCT_EXPORT_METHOD(logOut) {
    [LuciqRNLogger d:[LuciqRNDebugTags core] format:@"[logOut] called"];
    [Luciq logOut];
}

RCT_EXPORT_METHOD(setUserAttribute:(NSString *)key withValue:(NSString *)value) {
    [LuciqRNLogger d:[LuciqRNDebugTags core] format:@"[setUserAttribute] called keyLength=%lu valueLength=%lu present=%@", (unsigned long)key.length, (unsigned long)value.length, (key != nil ? @"YES" : @"NO")];
    [Luciq setUserAttribute:value withKey:key];
}

RCT_EXPORT_METHOD(getUserAttribute:(NSString *)key :(RCTPromiseResolveBlock)resolve :(RCTPromiseRejectBlock)reject) {
    [LuciqRNLogger d:[LuciqRNDebugTags core] format:@"[getUserAttribute] called keyLength=%lu present=%@", (unsigned long)key.length, (key != nil ? @"YES" : @"NO")];
    @try {
        NSString *result = [Luciq userAttributeForKey:key];
        [LuciqRNLogger d:[LuciqRNDebugTags core] format:@"[getUserAttribute] success resultLength=%lu present=%@", (unsigned long)result.length, (result != nil ? @"YES" : @"NO")];
        resolve(result);
    } @catch (NSException *exception) {
        // Resolve with "" for backward compatibility (callers expect a string), but log at warn since this is a non-fatal lookup miss / native exception.
        [LuciqRNLogger w:[LuciqRNDebugTags core] format:@"[getUserAttribute] exception caught, resolving with empty string: %@", exception];
        resolve(@"");
    }
}

RCT_EXPORT_METHOD(removeUserAttribute:(NSString *)key) {
    [LuciqRNLogger d:[LuciqRNDebugTags core] format:@"[removeUserAttribute] called keyLength=%lu present=%@", (unsigned long)key.length, (key != nil ? @"YES" : @"NO")];
    [Luciq removeUserAttributeForKey:key];
}

RCT_EXPORT_METHOD(getAllUserAttributes:(RCTPromiseResolveBlock)resolve :(RCTPromiseRejectBlock)reject) {
    [LuciqRNLogger d:[LuciqRNDebugTags core] format:@"[getAllUserAttributes] called"];
    @try {
        NSDictionary *result = [Luciq userAttributes];
        [LuciqRNLogger d:[LuciqRNDebugTags core] format:@"[getAllUserAttributes] success result.count=%lu", (unsigned long)result.count];
        resolve(result);
    } @catch (NSException *exception) {
        [LuciqRNLogger e:[LuciqRNDebugTags core] format:@"[getAllUserAttributes] failed: %@", exception];
        reject(@"GET_ALL_USER_ATTRIBUTES_ERROR", exception.reason ?: @"Failed to get user attributes", nil);
    }
}

RCT_EXPORT_METHOD(clearAllUserAttributes) {
    [LuciqRNLogger d:[LuciqRNDebugTags core] format:@"[clearAllUserAttributes] called"];
    for (NSString *key in [Luciq userAttributes].allKeys) {
        [Luciq removeUserAttributeForKey:key];
    }
}

RCT_EXPORT_METHOD(logUserEvent:(NSString *)name) {
    [LuciqRNLogger d:[LuciqRNDebugTags core] format:@"[logUserEvent] called nameLength=%lu present=%@", (unsigned long)name.length, (name != nil ? @"YES" : @"NO")];
    [Luciq logUserEventWithName:name];
}

RCT_EXPORT_METHOD(setLCQLogPrintsToConsole:(BOOL) printsToConsole) {
    [LuciqRNLogger d:[LuciqRNDebugTags core] format:@"[setLCQLogPrintsToConsole] called printsToConsole=%@", (printsToConsole ? @"YES" : @"NO")];
    LCQLog.printsToConsole = printsToConsole;
}

RCT_EXPORT_METHOD(logVerbose:(NSString *)log) {
    [LuciqRNLogger d:[LuciqRNDebugTags core] format:@"[logVerbose] called length=%lu, present=%@", (unsigned long)log.length, (log != nil ? @"YES" : @"NO")];
    [LCQLog logVerbose:log];
}

RCT_EXPORT_METHOD(logDebug:(NSString *)log) {
    [LuciqRNLogger d:[LuciqRNDebugTags core] format:@"[logDebug] called length=%lu, present=%@", (unsigned long)log.length, (log != nil ? @"YES" : @"NO")];
    [LCQLog logDebug:log];
}

RCT_EXPORT_METHOD(logInfo:(NSString *)log) {
    [LuciqRNLogger d:[LuciqRNDebugTags core] format:@"[logInfo] called length=%lu, present=%@", (unsigned long)log.length, (log != nil ? @"YES" : @"NO")];
    [LCQLog logInfo:log];
}

RCT_EXPORT_METHOD(logWarn:(NSString *)log) {
    [LuciqRNLogger d:[LuciqRNDebugTags core] format:@"[logWarn] called length=%lu, present=%@", (unsigned long)log.length, (log != nil ? @"YES" : @"NO")];
    [LCQLog logWarn:log];
}

RCT_EXPORT_METHOD(logError:(NSString *)log) {
    [LuciqRNLogger d:[LuciqRNDebugTags core] format:@"[logError] called length=%lu, present=%@", (unsigned long)log.length, (log != nil ? @"YES" : @"NO")];
    [LCQLog logError:log];
}

RCT_EXPORT_METHOD(clearLogs) {
    [LuciqRNLogger d:[LuciqRNDebugTags core] format:@"[clearLogs] called"];
    [LCQLog clearAllLogs];
}

RCT_EXPORT_METHOD(setSessionProfilerEnabled:(BOOL)sessionProfilerEnabled) {
    [LuciqRNLogger d:[LuciqRNDebugTags core] format:@"[setSessionProfilerEnabled] called sessionProfilerEnabled=%@", (sessionProfilerEnabled ? @"YES" : @"NO")];
    [Luciq setSessionProfilerEnabled:sessionProfilerEnabled];
}

RCT_EXPORT_METHOD(showWelcomeMessageWithMode:(LCQWelcomeMessageMode)welcomeMessageMode) {
    [LuciqRNLogger d:[LuciqRNDebugTags core] format:@"[showWelcomeMessageWithMode] called welcomeMessageMode=%ld", (long)welcomeMessageMode];
    [Luciq showWelcomeMessageWithMode:welcomeMessageMode];
}

RCT_EXPORT_METHOD(setWelcomeMessageMode:(LCQWelcomeMessageMode)welcomeMessageMode) {
    [LuciqRNLogger d:[LuciqRNDebugTags core] format:@"[setWelcomeMessageMode] called welcomeMessageMode=%ld", (long)welcomeMessageMode];
    [Luciq setWelcomeMessageMode:welcomeMessageMode];
}

RCT_EXPORT_METHOD(setNetworkLoggingEnabled:(BOOL)isEnabled) {
    [LuciqRNLogger d:[LuciqRNDebugTags network] format:@"[setNetworkLoggingEnabled] called isEnabled=%@", (isEnabled ? @"YES" : @"NO")];
    if(isEnabled) {
        LCQNetworkLogger.enabled = YES;
    } else {
        LCQNetworkLogger.enabled = NO;
    }
}

RCT_EXPORT_METHOD(networkLogIOS:(NSString * _Nonnull)url
                         method:(NSString * _Nonnull)method
                    requestBody:(NSString * _Nonnull)requestBody
                requestBodySize:(double)requestBodySize
                   responseBody:(NSString * _Nonnull)responseBody
               responseBodySize:(double)responseBodySize
                   responseCode:(double)responseCode
                 requestHeaders:(NSDictionary * _Nonnull)requestHeaders
                responseHeaders:(NSDictionary * _Nonnull)responseHeaders
                    contentType:(NSString * _Nonnull)contentType
                    errorDomain:(NSString * _Nullable)errorDomain
                      errorCode:(double)errorCode
                      startTime:(double)startTime
                       duration:(double)duration
                   gqlQueryName:(NSString * _Nullable)gqlQueryName
             serverErrorMessage:(NSString * _Nullable)serverErrorMessage
                  w3cExternalTraceAttributes:(NSDictionary * _Nullable)w3cExternalTraceAttributes){
    [LuciqRNLogger d:[LuciqRNDebugTags network] format:@"[networkLogIOS] Received from JS: %@ %@, status=%d, duration=%.0fms, startTime=%.0f, error=%@, gqlQuery=%@, reqBodyLen=%lu, resBodyLen=%lu", method, [LuciqRNLogger redactURL:url], (int)responseCode, duration * 1000, startTime, errorDomain, gqlQueryName, (unsigned long)requestBody.length, (unsigned long)responseBody.length];
   NSNumber *isW3cCaught = (w3cExternalTraceAttributes[@"isW3cHeaderFound"] != [NSNull null]) ? w3cExternalTraceAttributes[@"isW3cHeaderFound"] : nil;
        NSNumber * partialID = (w3cExternalTraceAttributes[@"partialId"] != [NSNull null]) ? w3cExternalTraceAttributes[@"partialId"] : nil;
        NSNumber * timestamp = (w3cExternalTraceAttributes[@"networkStartTimeInSeconds"] != [NSNull null]) ? w3cExternalTraceAttributes[@"networkStartTimeInSeconds"] : nil;
        NSString * generatedW3CTraceparent = (w3cExternalTraceAttributes[@"w3cGeneratedHeader"] != [NSNull null]) ? w3cExternalTraceAttributes[@"w3cGeneratedHeader"] : nil;
        NSString * caughtW3CTraceparent = (w3cExternalTraceAttributes[@"w3cCaughtHeader"] != [NSNull null]) ? w3cExternalTraceAttributes[@"w3cCaughtHeader"] : nil;
    [LuciqRNLogger d:[LuciqRNDebugTags network] format:@"[networkLogIOS] W3C attrs - isW3cCaughted=%@, partialID=%@, timestamp=%@, generatedHeader=%@, caughtHeader=%@", isW3cCaught, partialID, timestamp, generatedW3CTraceparent, caughtW3CTraceparent];

    [LCQNetworkLogger addNetworkLogWithUrl:url
                                    method:method
                               requestBody:requestBody
                           requestBodySize:requestBodySize
                              responseBody:responseBody
                          responseBodySize:responseBodySize
                              responseCode:responseCode
                            requestHeaders:requestHeaders
                           responseHeaders:responseHeaders
                               contentType:contentType
                               errorDomain:errorDomain
                                 errorCode:errorCode
                                 startTime:startTime * 1000
                                  duration:duration * 1000
                              gqlQueryName:gqlQueryName
                        serverErrorMessage:serverErrorMessage
                          isW3cCaughted:isW3cCaught
                           partialID:partialID
                            timestamp:timestamp
                        generatedW3CTraceparent:generatedW3CTraceparent
                        caughtedW3CTraceparent:caughtW3CTraceparent
                        ];
    [LuciqRNLogger d:[LuciqRNDebugTags network] format:@"[networkLogIOS] Forwarded to LCQNetworkLogger: %@ %@", method, [LuciqRNLogger redactURL:url]];
}

RCT_EXPORT_METHOD(addPrivateView: (nonnull NSNumber *)reactTag) {
    [LuciqRNLogger d:[LuciqRNDebugTags privateView] format:@"[addPrivateView] called reactTag=%@", reactTag];
    UIView* view = [self.bridge.uiManager viewForReactTag:reactTag];
    if (view == nil) {
        [LuciqRNLogger w:[LuciqRNDebugTags privateView] format:@"[addPrivateView] view not found for reactTag=%@ (will NOT be masked)", reactTag];
        return;
    }
    view.Luciq_privateView = true;
}

RCT_EXPORT_METHOD(removePrivateView: (nonnull NSNumber *)reactTag) {
    [LuciqRNLogger d:[LuciqRNDebugTags privateView] format:@"[removePrivateView] called reactTag=%@", reactTag];
    UIView* view = [self.bridge.uiManager viewForReactTag:reactTag];
    if (view == nil) {
        [LuciqRNLogger w:[LuciqRNDebugTags privateView] format:@"[removePrivateView] view not found for reactTag=%@ (no-op)", reactTag];
        return;
    }
    view.Luciq_privateView = false;
}

RCT_EXPORT_METHOD(show) {
    [LuciqRNLogger d:[LuciqRNDebugTags core] format:@"[show] called"];
    [[NSRunLoop mainRunLoop] performSelector:@selector(show) target:[Luciq class] argument:nil order:0 modes:@[NSDefaultRunLoopMode]];
}

RCT_EXPORT_METHOD(reportScreenChange:(NSString *)screenName spanId:(NSString * _Nullable)spanId) {
    [LuciqRNLogger d:[LuciqRNDebugTags screenTracking] format:@"[reportScreenChange] called screenNameLength=%lu present=%@ spanIdLength=%lu spanIdPresent=%@", (unsigned long)screenName.length, (screenName != nil ? @"YES" : @"NO"), (unsigned long)spanId.length, (spanId != nil ? @"YES" : @"NO")];
    SEL setPrivateApiSEL = NSSelectorFromString(@"logViewDidAppearEvent:");
    if ([[Luciq class] respondsToSelector:setPrivateApiSEL]) {
        NSInvocation *inv = [NSInvocation invocationWithMethodSignature:[[Luciq class] methodSignatureForSelector:setPrivateApiSEL]];
        [inv setSelector:setPrivateApiSEL];
        [inv setTarget:[Luciq class]];
        [inv setArgument:&(screenName) atIndex:2];
        [inv invoke];
    }
}

RCT_EXPORT_METHOD(addFeatureFlags:(NSDictionary *)featureFlagsMap) {
    [LuciqRNLogger d:[LuciqRNDebugTags featureFlags] format:@"[addFeatureFlags] called featureFlagsMap.count=%lu", (unsigned long)featureFlagsMap.count];
    NSMutableArray<LCQFeatureFlag *> *featureFlags = [NSMutableArray array];
    for(id key in featureFlagsMap){
        NSString* variant =[featureFlagsMap objectForKey:key];
        if ([variant length]==0) {
            [featureFlags addObject:[[LCQFeatureFlag alloc] initWithName:key]];
        } else{
            [featureFlags addObject:[[LCQFeatureFlag alloc] initWithName:key variant:variant]];
        }
    }

    [Luciq addFeatureFlags:featureFlags];
}

RCT_EXPORT_METHOD(removeFeatureFlags:(NSArray *)featureFlags) {
    [LuciqRNLogger d:[LuciqRNDebugTags featureFlags] format:@"[removeFeatureFlags] called featureFlags.count=%lu", (unsigned long)featureFlags.count];
    NSMutableArray<LCQFeatureFlag *> *features = [NSMutableArray array];
    for(id item in featureFlags){
        [features addObject:[[LCQFeatureFlag alloc] initWithName:item]];
    }

    @try {
        [Luciq removeFeatureFlags:features];
    }
    @catch (NSException *exception) {
        [LuciqRNLogger e:[LuciqRNDebugTags featureFlags] format:@"[removeFeatureFlags] failed: %@", exception];
        NSLog(@"%@", exception);
    }
}

RCT_EXPORT_METHOD(removeAllFeatureFlags) {
    [LuciqRNLogger d:[LuciqRNDebugTags featureFlags] format:@"[removeAllFeatureFlags] called"];
    [Luciq removeAllFeatureFlags];
}

RCT_EXPORT_METHOD(willRedirectToStore){
    [LuciqRNLogger d:[LuciqRNDebugTags core] format:@"[willRedirectToStore] called"];
    [Luciq willRedirectToAppStore];
}

RCT_EXPORT_METHOD(isW3ExternalTraceIDEnabled:(RCTPromiseResolveBlock)resolve :(RCTPromiseRejectBlock)reject) {
    BOOL enabled = LCQNetworkLogger.w3ExternalTraceIDEnabled;
    [LuciqRNLogger d:[LuciqRNDebugTags network] format:@"[isW3ExternalTraceIDEnabled] Result=%d", enabled];
    resolve(@(enabled));
}
RCT_EXPORT_METHOD(isW3ExternalGeneratedHeaderEnabled:(RCTPromiseResolveBlock)resolve :(RCTPromiseRejectBlock)reject) {
    BOOL enabled = LCQNetworkLogger.w3ExternalGeneratedHeaderEnabled;
    [LuciqRNLogger d:[LuciqRNDebugTags network] format:@"[isW3ExternalGeneratedHeaderEnabled] Result=%d", enabled];
    resolve(@(enabled));
}
RCT_EXPORT_METHOD(isW3CaughtHeaderEnabled:(RCTPromiseResolveBlock)resolve :(RCTPromiseRejectBlock)reject) {
    BOOL enabled = LCQNetworkLogger.w3CaughtHeaderEnabled;
    [LuciqRNLogger d:[LuciqRNDebugTags network] format:@"[isW3CaughtHeaderEnabled] Result=%d", enabled];
    resolve(@(enabled));
}


- (NSDictionary *)constantsToExport {
    return ArgsRegistry.getAll;
}

- (void) setBaseUrlForDeprecationLogs {
    SEL setCurrentPlatformSEL = NSSelectorFromString(@"setCurrentPlatform:");
    if([[Luciq class] respondsToSelector:setCurrentPlatformSEL]) {
        NSInvocation *inv = [NSInvocation invocationWithMethodSignature:[[Luciq class] methodSignatureForSelector:setCurrentPlatformSEL]];
        [inv setSelector:setCurrentPlatformSEL];
        [inv setTarget:[Luciq class]];
        LCQPlatform platform = LCQPlatformReactNative;
        [inv setArgument:&(platform) atIndex:2];

        [inv invoke];
    }
}

+ (BOOL)requiresMainQueueSetup
{
    return NO;
}

+ (BOOL)iOSVersionIsLessThan:(NSString *)iOSVersion {
    return [iOSVersion compare:[UIDevice currentDevice].systemVersion options:NSNumericSearch] == NSOrderedDescending;
};

RCT_EXPORT_METHOD(enableAutoMasking:(NSArray *)autoMaskingTypes) {
    [LuciqRNLogger d:[LuciqRNDebugTags privateView] format:@"[enableAutoMasking] called autoMaskingTypes.count=%lu", (unsigned long)autoMaskingTypes.count];

   LCQAutoMaskScreenshotOption autoMaskingOptions = 0;

    for (NSNumber *event in autoMaskingTypes) {

        autoMaskingOptions |= [event intValue];
    }

    [Luciq setAutoMaskScreenshots: autoMaskingOptions];
};

RCT_EXPORT_METHOD(getNetworkBodyMaxSize:(RCTPromiseResolveBlock)resolve :(RCTPromiseRejectBlock)reject) {
    NSUInteger limit = LCQNetworkLogger.getNetworkBodyMaxSize;
    [LuciqRNLogger d:[LuciqRNDebugTags network] format:@"[getNetworkBodyMaxSize] Result=%lu", (unsigned long)limit];
    resolve(@(limit));
}

RCT_EXPORT_METHOD(setNetworkLogBodyEnabled:(BOOL)isEnabled) {
    [LuciqRNLogger d:[LuciqRNDebugTags network] format:@"[setNetworkLogBodyEnabled] called isEnabled=%@", (isEnabled ? @"YES" : @"NO")];
    LCQNetworkLogger.logBodyEnabled = isEnabled;
}

// Checks if Luciq SDK is initialized
RCT_EXPORT_METHOD(isBuilt:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    [LuciqRNLogger d:[LuciqRNDebugTags core] format:@"[isBuilt] called"];
    @try {
        BOOL isBuilt = YES;
        [LuciqRNLogger d:[LuciqRNDebugTags core] format:@"[isBuilt] success result=%@", (isBuilt ? @"YES" : @"NO")];
        resolve(@(isBuilt));
    } @catch (NSException *exception) {
        [LuciqRNLogger e:[LuciqRNDebugTags core] format:@"[isBuilt] failed: %@", exception];
        NSLog(@"[Luciq] Error checking if SDK is built: %@", exception);
        resolve(@NO);
    }
}

@end
