#import "LuciqNetworkLoggerBridge.h"
#import "Util/LCQNetworkLogger+CP.h"

#import <React/RCTLog.h>
#import <React/RCTConvert.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import <RNLuciqSpec/RNLuciqSpec.h>

@interface LuciqNetworkLoggerBridge () <NativeNetworkLoggerSpec>
@end
#endif

@implementation LuciqNetworkLoggerBridge

- (instancetype)init {
    self = [super init];
    if (self) {
        _requestObfuscationCompletionDictionary = [[NSMutableDictionary alloc] init];
        _responseObfuscationCompletionDictionary = [[NSMutableDictionary alloc] init];
        _requestFilteringCompletionDictionary = [[NSMutableDictionary alloc] init];
        _responseFilteringCompletionDictionary = [[NSMutableDictionary alloc] init];
    }
    return self;
}

- (dispatch_queue_t)methodQueue {
    return dispatch_get_main_queue();
}

+ (BOOL)requiresMainQueueSetup
{
    return NO;
}

- (NSArray<NSString *> *)supportedEvents {
    return @[
        @"LCQpreInvocationHandler",
        @"LCQNetworkLoggerHandler"
    ];
}

RCT_EXPORT_MODULE(LCQNetworkLogger)

bool lcq_hasListeners = NO;

- (void)startObserving {
    lcq_hasListeners = YES;
}

- (void)stopObserving {
    lcq_hasListeners = NO;
}

RCT_EXPORT_SYNCHRONOUS_TYPED_METHOD(NSNumber *, isNativeInterceptionEnabled) {
    return @(LCQNetworkLogger.isNativeNetworkInterceptionFeatureEnabled);
}

RCT_EXPORT_METHOD(registerNetworkLogsListener:(NSString * _Nullable)type) {
    NSString *value = type ?: @"filtering";
    if ([value isEqualToString:@"filtering"]) {
        [self setupRequestFilteringHandler];
    } else if ([value isEqualToString:@"obfuscation"] || [value isEqualToString:@"both"]) {
        // Obfuscation pipeline also subsumes filtering: filtered requests get dropped, the rest obfuscated.
        [self setupRequestObfuscationHandler];
    } else {
        NSLog(@"Unknown network listener type: %@", value);
    }
}

RCT_EXPORT_METHOD(updateNetworkLogSnapshot:(NSString *)url
                  callbackID:(NSString *)callbackID
                  requestBody:(NSString * _Nullable)requestBody
                  responseBody:(NSString * _Nullable)responseBody
                  responseCode:(double)responseCode
                  requestHeaders:(NSDictionary *)requestHeaders
                  responseHeaders:(NSDictionary *)responseHeaders)
{
    NSURL *requestURL = [NSURL URLWithString:url];
    if (!requestURL) {
        NSLog(@"Invalid URL: %@", url);
        return;
    }

    NSMutableURLRequest *request = [[NSMutableURLRequest alloc] initWithURL:requestURL];

    if (requestBody && [requestBody isKindOfClass:[NSString class]]) {
        request.HTTPBody = [requestBody dataUsingEncoding:NSUTF8StringEncoding];
    }

    if (requestHeaders && [requestHeaders isKindOfClass:[NSDictionary class]]) {
        request.allHTTPHeaderFields = requestHeaders;
    }

    LCQURLRequestAsyncObfuscationCompletedHandler completionHandler = self.requestObfuscationCompletionDictionary[callbackID];
    if (callbackID && [callbackID isKindOfClass:[NSString class]] && completionHandler) {
        completionHandler(request);
    } else {
        NSLog(@"CallbackID not found or completion handler is unavailable for CallbackID: %@", callbackID);
    }
}

RCT_EXPORT_METHOD(setNetworkLoggingRequestFilterPredicateIOS:(NSString *)callbackID
                  value:(BOOL)value) {
    if (self.requestFilteringCompletionDictionary[callbackID] != nil) {
        ((LCQURLRequestResponseAsyncFilteringCompletedHandler)self.requestFilteringCompletionDictionary[callbackID])(value);
    } else {
        NSLog(@"Not Available Completion");
    }
}

RCT_EXPORT_METHOD(forceStartNetworkLoggingIOS) {
    [LCQNetworkLogger forceStartNetworkLogging];
}

RCT_EXPORT_METHOD(forceStopNetworkLoggingIOS) {
    [LCQNetworkLogger forceStopNetworkLogging];
}

// Android-only methods — iOS no-ops to satisfy the unified spec.
RCT_EXPORT_METHOD(hasAPMNetworkPlugin:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
    resolve(@NO);
}

RCT_EXPORT_METHOD(resetNetworkLogsListener) { }

#pragma mark - Helper Methods

- (void)setupRequestFilteringHandler {
    [LCQNetworkLogger setCPRequestFilteringHandler:^(NSURLRequest * _Nonnull request, void (^ _Nonnull completion)(BOOL)) {
        NSString *callbackID = [[[NSUUID alloc] init] UUIDString];
        self.requestFilteringCompletionDictionary[callbackID] = completion;

        NSDictionary *dict = [self createNetworkRequestDictForRequest:request callbackID:callbackID];
        if (lcq_hasListeners) {
            [self sendEventWithName:@"LCQNetworkLoggerHandler" body:dict];
        }
    }];
}

- (void)setupRequestObfuscationHandler {
    [LCQNetworkLogger setCPRequestAsyncObfuscationHandler:^(NSURLRequest * _Nonnull request, void (^ _Nonnull completion)(NSURLRequest * _Nonnull)) {
        NSString *callbackID = [[[NSUUID alloc] init] UUIDString];
        self.requestObfuscationCompletionDictionary[callbackID] = completion;

        NSDictionary *dict = [self createNetworkRequestDictForRequest:request callbackID:callbackID];
        if (lcq_hasListeners) {
            [self sendEventWithName:@"LCQNetworkLoggerHandler" body:dict];
        }
    }];
}

- (NSDictionary *)createNetworkRequestDictForRequest:(NSURLRequest *)request callbackID:(NSString *)callbackID  {
    NSString *urlString = request.URL.absoluteString ?: @"";
    NSString *bodyString = [[NSString alloc] initWithData:request.HTTPBody encoding:NSUTF8StringEncoding] ?: @"";
    NSDictionary *headerDict = request.allHTTPHeaderFields ?: @{};

    return @{
        @"id": callbackID,
        @"url": urlString,
        @"requestBody": bodyString,
        @"requestHeader": headerDict
    };
}

#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeNetworkLoggerSpecJSI>(params);
}
#endif

@end
