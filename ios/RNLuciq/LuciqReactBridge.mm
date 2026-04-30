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

           if(appVariant != nil){
                  Luciq.appVariant = appVariant;
              }

    LCQInvocationEvent invocationEvents = 0;

    for (NSNumber *boxedValue in invocationEventsArray) {
        invocationEvents |= [boxedValue intValue];
    }

    [Luciq setCodePushVersion:codePushVersion];

    [Luciq setOverAirVersion:overAirVersion[@"version"] withType:(LCQOverAirType)[overAirVersion[@"service"] intValue]];

    [RNLuciq initWithToken:token
             invocationEvents:invocationEvents
               debugLogsLevel:sdkDebugLogsLevel
 useNativeNetworkInterception:useNativeNetworkInterception];
}

RCT_EXPORT_METHOD(setCodePushVersion:(NSString *)version) {
    [Luciq setCodePushVersion:version];
}

RCT_EXPORT_METHOD(setOverAirVersion:(NSDictionary *)overAirVersion) {
    [Luciq setOverAirVersion:overAirVersion[@"version"] withType:(LCQOverAirType)[overAirVersion[@"service"] intValue]];
}

RCT_EXPORT_METHOD(setAppVariant:(NSString *)appVariant) {
    Luciq.appVariant = appVariant;
}

RCT_EXPORT_METHOD(setReproStepsConfig:(LCQUserStepsMode)bugMode :(LCQUserStepsMode)crashMode:(LCQUserStepsMode)sessionReplayMode) {
    [Luciq setReproStepsFor:LCQIssueTypeBug withMode:bugMode];
    [Luciq setReproStepsFor:LCQIssueTypeAllCrashes withMode:crashMode];
    [Luciq setReproStepsFor:LCQIssueTypeSessionReplay withMode:sessionReplayMode];
}

RCT_EXPORT_METHOD(setFileAttachment:(NSString *)fileLocation) {
    NSURL *url = [NSURL URLWithString:fileLocation];
    [Luciq addFileAttachmentWithURL:url];
}

RCT_EXPORT_METHOD(setUserData:(NSString *)userData) {
    [Luciq setUserData:userData];
}

RCT_EXPORT_METHOD(setTrackUserSteps:(BOOL)isEnabled) {
    [Luciq setTrackUserSteps:isEnabled];
}

RCT_EXPORT_METHOD(setWebViewMonitoringEnabled:(BOOL)isEnabled) {
    [Luciq setWebViewMonitoringEnabled:isEnabled];
}

RCT_EXPORT_METHOD(setWebViewNetworkTrackingEnabled:(BOOL)isEnabled) {
    [Luciq setWebViewNetworkTrackingEnabled:isEnabled];
}

RCT_EXPORT_METHOD(setWebViewUserInteractionsTrackingEnabled:(BOOL)isEnabled) {
    [Luciq setWebViewUserInteractionsTrackingEnabled:isEnabled];
}

LCQReport *currentReport = nil;
RCT_EXPORT_METHOD(setPreSendingHandler) {
    Luciq.willSendReportHandler = ^LCQReport * _Nonnull(LCQReport * _Nonnull report) {
        NSArray *tagsArray = report.tags;
        NSArray *luciqLogs= report.luciqLogs;
        NSArray *consoleLogs= report.consoleLogs;
        NSDictionary *userAttributes= report.userAttributes;
        NSArray *fileAttachments= report.fileLocations;
        NSDictionary *dict = @{ @"tagsArray" : tagsArray, @"luciqLogs" : luciqLogs, @"consoleLogs" : consoleLogs,       @"userAttributes" : userAttributes, @"fileAttachments" : fileAttachments};
        [self sendEventWithName:@"LCQpreSendingHandler" body:dict];

        currentReport = report;
        return report;
    };
}

RCT_EXPORT_METHOD(appendTagToReport:(NSString*) tag) {
    if (currentReport != nil) {
        [currentReport appendTag:tag];
    }
}

RCT_EXPORT_METHOD(appendConsoleLogToReport:(NSString*) consoleLog) {
    if (currentReport != nil) {
        [currentReport appendToConsoleLogs:consoleLog];
    }
}

RCT_EXPORT_METHOD(setUserAttributeToReport:(NSString*) key:(NSString*) value) {
    if (currentReport != nil) {
        [currentReport setUserAttribute:value withKey:key];
    }
}

RCT_EXPORT_METHOD(logDebugToReport:(NSString*) log) {
    if (currentReport != nil) {
        [currentReport logDebug:log];
    }
}

RCT_EXPORT_METHOD(logVerboseToReport:(NSString*) log) {
    if (currentReport != nil) {
        [currentReport logVerbose:log];
    }
}

RCT_EXPORT_METHOD(logWarnToReport:(NSString*) log) {
    if (currentReport != nil) {
        [currentReport logWarn:log];
    }
}

RCT_EXPORT_METHOD(logErrorToReport:(NSString*) log) {
    if (currentReport != nil) {
        [currentReport logError:log];
    }
}

RCT_EXPORT_METHOD(logInfoToReport:(NSString*) log) {
    if (currentReport != nil) {
        [currentReport logInfo:log];
    }
}

RCT_EXPORT_METHOD(addFileAttachmentWithURLToReport:(NSString*) urlString) {
    if (currentReport != nil) {
        NSURL *url = [NSURL URLWithString:urlString];
        [currentReport addFileAttachmentWithURL:url];
    }
}

RCT_EXPORT_METHOD(addFileAttachmentWithDataToReport:(NSString*) dataString) {
    if (currentReport != nil) {
        NSData* data = [dataString dataUsingEncoding:NSUTF8StringEncoding];
        [currentReport addFileAttachmentWithData:data];
    }
}

RCT_EXPORT_METHOD(setLocale:(LCQLocale)locale) {
    [Luciq setLocale:locale];
}

RCT_EXPORT_METHOD(setColorTheme:(LCQColorTheme)colorTheme) {
        [Luciq setColorTheme:colorTheme];
}


RCT_EXPORT_METHOD(setTheme:(NSDictionary *)themeConfig) {
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
    [Luciq appendTags:tags];
}

RCT_EXPORT_METHOD(resetTags) {
    [Luciq resetTags];
}

RCT_EXPORT_METHOD(getTags:(RCTPromiseResolveBlock)resolve :(RCTPromiseRejectBlock)reject) {
    resolve([Luciq getTags]);
}

RCT_EXPORT_METHOD(setString:(NSString*)value toKey:(NSString*)key) {
    [Luciq setValue:value forStringWithKey:key];
}

RCT_EXPORT_METHOD(addFileAttachment:(NSString *)fileURLString) {
    [Luciq addFileAttachmentWithURL:[NSURL URLWithString:fileURLString]];
}

RCT_EXPORT_METHOD(clearFileAttachments) {
    [Luciq clearFileAttachments];
}

RCT_EXPORT_METHOD(identifyUser:(NSString *)email name:(NSString *)name userId:(nullable NSString *)userId) {
    [Luciq identifyUserWithID:userId email:email name:name];
}

RCT_EXPORT_METHOD(logOut) {
    [Luciq logOut];
}

RCT_EXPORT_METHOD(setUserAttribute:(NSString *)key withValue:(NSString *)value) {
    [Luciq setUserAttribute:value withKey:key];
}

RCT_EXPORT_METHOD(getUserAttribute:(NSString *)key :(RCTPromiseResolveBlock)resolve :(RCTPromiseRejectBlock)reject) {
    @try {
        resolve([Luciq userAttributeForKey:key]);
    } @catch (NSException *exception) {
        resolve(@"");
    }
}

RCT_EXPORT_METHOD(removeUserAttribute:(NSString *)key) {
    [Luciq removeUserAttributeForKey:key];
}

RCT_EXPORT_METHOD(getAllUserAttributes:(RCTPromiseResolveBlock)resolve :(RCTPromiseRejectBlock)reject) {
    resolve([Luciq userAttributes]);
}

RCT_EXPORT_METHOD(clearAllUserAttributes) {
    for (NSString *key in [Luciq userAttributes].allKeys) {
        [Luciq removeUserAttributeForKey:key];
    }
}

RCT_EXPORT_METHOD(logUserEvent:(NSString *)name) {
    [Luciq logUserEventWithName:name];
}

RCT_EXPORT_METHOD(setLCQLogPrintsToConsole:(BOOL) printsToConsole) {
    LCQLog.printsToConsole = printsToConsole;
}

RCT_EXPORT_METHOD(logVerbose:(NSString *)log) {
    [LCQLog logVerbose:log];
}

RCT_EXPORT_METHOD(logDebug:(NSString *)log) {
    [LCQLog logDebug:log];
}

RCT_EXPORT_METHOD(logInfo:(NSString *)log) {
    [LCQLog logInfo:log];
}

RCT_EXPORT_METHOD(logWarn:(NSString *)log) {
    [LCQLog logWarn:log];
}

RCT_EXPORT_METHOD(logError:(NSString *)log) {
    [LCQLog logError:log];
}

RCT_EXPORT_METHOD(clearLogs) {
    [LCQLog clearAllLogs];
}

RCT_EXPORT_METHOD(setSessionProfilerEnabled:(BOOL)sessionProfilerEnabled) {
    [Luciq setSessionProfilerEnabled:sessionProfilerEnabled];
}

RCT_EXPORT_METHOD(showWelcomeMessageWithMode:(LCQWelcomeMessageMode)welcomeMessageMode) {
    [Luciq showWelcomeMessageWithMode:welcomeMessageMode];
}

RCT_EXPORT_METHOD(setWelcomeMessageMode:(LCQWelcomeMessageMode)welcomeMessageMode) {
    [Luciq setWelcomeMessageMode:welcomeMessageMode];
}

RCT_EXPORT_METHOD(setNetworkLoggingEnabled:(BOOL)isEnabled) {
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
   NSNumber *isW3cCaught = (w3cExternalTraceAttributes[@"isW3cHeaderFound"] != [NSNull null]) ? w3cExternalTraceAttributes[@"isW3cHeaderFound"] : nil;
        NSNumber * partialID = (w3cExternalTraceAttributes[@"partialId"] != [NSNull null]) ? w3cExternalTraceAttributes[@"partialId"] : nil;
        NSNumber * timestamp = (w3cExternalTraceAttributes[@"networkStartTimeInSeconds"] != [NSNull null]) ? w3cExternalTraceAttributes[@"networkStartTimeInSeconds"] : nil;
        NSString * generatedW3CTraceparent = (w3cExternalTraceAttributes[@"w3cGeneratedHeader"] != [NSNull null]) ? w3cExternalTraceAttributes[@"w3cGeneratedHeader"] : nil;
        NSString * caughtW3CTraceparent = (w3cExternalTraceAttributes[@"w3cCaughtHeader"] != [NSNull null]) ? w3cExternalTraceAttributes[@"w3cCaughtHeader"] : nil;

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
}

RCT_EXPORT_METHOD(addPrivateView: (nonnull NSNumber *)reactTag) {
    UIView* view = [self.bridge.uiManager viewForReactTag:reactTag];
    view.Luciq_privateView = true;
}

RCT_EXPORT_METHOD(removePrivateView: (nonnull NSNumber *)reactTag) {
    UIView* view = [self.bridge.uiManager viewForReactTag:reactTag];
    view.Luciq_privateView = false;
}

RCT_EXPORT_METHOD(show) {
    [[NSRunLoop mainRunLoop] performSelector:@selector(show) target:[Luciq class] argument:nil order:0 modes:@[NSDefaultRunLoopMode]];
}

RCT_EXPORT_METHOD(reportScreenChange:(NSString *)screenName) {
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
    NSMutableArray<LCQFeatureFlag *> *features = [NSMutableArray array];
    for(id item in featureFlags){
        [features addObject:[[LCQFeatureFlag alloc] initWithName:item]];
    }

    @try {
        [Luciq removeFeatureFlags:features];
    }
    @catch (NSException *exception) {
        NSLog(@"%@", exception);
    }
}

RCT_EXPORT_METHOD(removeAllFeatureFlags) {
    [Luciq removeAllFeatureFlags];
}

RCT_EXPORT_METHOD(willRedirectToStore){
    [Luciq willRedirectToAppStore];
}

RCT_EXPORT_METHOD(isW3ExternalTraceIDEnabled:(RCTPromiseResolveBlock)resolve :(RCTPromiseRejectBlock)reject) {
    resolve(@(LCQNetworkLogger.w3ExternalTraceIDEnabled));
}
RCT_EXPORT_METHOD(isW3ExternalGeneratedHeaderEnabled:(RCTPromiseResolveBlock)resolve :(RCTPromiseRejectBlock)reject) {
    resolve(@(LCQNetworkLogger.w3ExternalGeneratedHeaderEnabled));
}
RCT_EXPORT_METHOD(isW3CaughtHeaderEnabled:(RCTPromiseResolveBlock)resolve :(RCTPromiseRejectBlock)reject) {
    resolve(@(LCQNetworkLogger.w3CaughtHeaderEnabled));
}


- (NSDictionary *)constantsToExport {
    return ArgsRegistry.getAll;
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(getAllConstants) {
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

   LCQAutoMaskScreenshotOption autoMaskingOptions = 0;

    for (NSNumber *event in autoMaskingTypes) {

        autoMaskingOptions |= [event intValue];
    }

    [Luciq setAutoMaskScreenshots: autoMaskingOptions];
};

RCT_EXPORT_METHOD(getNetworkBodyMaxSize:(RCTPromiseResolveBlock)resolve :(RCTPromiseRejectBlock)reject) {
    resolve(@(LCQNetworkLogger.getNetworkBodyMaxSize));
}

RCT_EXPORT_METHOD(setNetworkLogBodyEnabled:(BOOL)isEnabled) {
    LCQNetworkLogger.logBodyEnabled = isEnabled;
}

// Checks if Luciq SDK is initialized
RCT_EXPORT_METHOD(isBuilt:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        BOOL isBuilt = YES;
        resolve(@(isBuilt));
    } @catch (NSException *exception) {
        NSLog(@"[Luciq] Error checking if SDK is built: %@", exception);
        resolve(@NO);
    }
}

@end
