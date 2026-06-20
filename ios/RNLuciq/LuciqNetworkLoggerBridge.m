//
//  LuciqNetworkLoggerBridge.m
//  RNLuciq
//
//  Created by Andrew Amin on 01/10/2024.
//
#import "LuciqNetworkLoggerBridge.h"
#import "Util/LCQNetworkLogger+CP.h"
#import "Util/LuciqRNLogger.h"
#import "Util/LuciqRNDebugTags.h"

#import <React/RCTLog.h>
#import <React/RCTConvert.h>

// Extend RCTConvert to handle NetworkListenerType enum conversion
@implementation RCTConvert (NetworkListenerType)

// The RCT_ENUM_CONVERTER macro handles the conversion between JS values (Int) and Objective-C enum values
RCT_ENUM_CONVERTER(NetworkListenerType, (@{
    @"filtering": @(NetworkListenerTypeFiltering),
    @"obfuscation": @(NetworkListenerTypeObfuscation),
    @"both": @(NetworkListenerTypeBoth)
}), NetworkListenerTypeFiltering, integerValue)

@end

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



// Will be called when this module's first listener is added.
-(void)startObserving {
    lcq_hasListeners = YES;
    [LuciqRNLogger d:[LuciqRNDebugTags network] format:@"[EventEmitter] startObserving - LCQNetworkLogger listeners ON"];
    // Set up any upstream listeners or background tasks as necessary
}

// Will be called when this module's last listener is removed, or on dealloc.
-(void)stopObserving {
    lcq_hasListeners = NO;
    [LuciqRNLogger d:[LuciqRNDebugTags network] format:@"[EventEmitter] stopObserving - LCQNetworkLogger listeners OFF"];
    // Remove upstream listeners, stop unnecessary background tasks
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(isNativeInterceptionEnabled) {
    BOOL enabled = LCQNetworkLogger.isNativeNetworkInterceptionFeatureEnabled;
    [LuciqRNLogger d:[LuciqRNDebugTags network] format:@"[isNativeInterceptionEnabled] Result=%d", enabled];
    return @(enabled);
}



RCT_EXPORT_METHOD(registerNetworkLogsListener: (NetworkListenerType) listenerType) {
    [LuciqRNLogger d:[LuciqRNDebugTags network] format:@"[registerNetworkLogsListener] listenerType=%ld", (long)listenerType];
    switch (listenerType) {
         case NetworkListenerTypeFiltering:
             [self setupRequestFilteringHandler];
             break;

         case NetworkListenerTypeObfuscation:
             [self setupRequestObfuscationHandler];
             break;

         case NetworkListenerTypeBoth:
            // The obfuscation handler sends additional data to the JavaScript side. If filtering is applied, the request will be ignored; otherwise, it will be obfuscated and saved in the database.
            [self setupRequestObfuscationHandler];
             break;

         default:
             [LuciqRNLogger e:[LuciqRNDebugTags network] format:@"[registerNetworkLogsListener] Unknown NetworkListenerType=%ld", (long)listenerType];
             break;
     }
}


RCT_EXPORT_METHOD(updateNetworkLogSnapshot:(NSString * _Nonnull)url
                  callbackID:(NSString * _Nonnull)callbackID
                  requestBody:(NSString * _Nullable)requestBody
                  responseBody:(NSString * _Nullable)responseBody
                  responseCode:(double)responseCode
                  requestHeaders:(NSDictionary * _Nullable)requestHeaders
                  responseHeaders:(NSDictionary * _Nullable)responseHeaders)
{
    [LuciqRNLogger d:[LuciqRNDebugTags network] format:@"[updateNetworkLogSnapshot] callbackID=%@, url=%@, responseCode=%d, obfuscationMapSize=%lu", callbackID, [LuciqRNLogger redactURL:url], (int)responseCode, (unsigned long)self.requestObfuscationCompletionDictionary.count];

    // Validate and construct the URL
    NSURL *requestURL = [NSURL URLWithString:url];
    if (!requestURL) {
        [LuciqRNLogger e:[LuciqRNDebugTags network] format:@"[updateNetworkLogSnapshot] Invalid URL: %@", [LuciqRNLogger redactURL:url]];
        return;
    }

    // Initialize the NSMutableURLRequest
    NSMutableURLRequest *request = [[NSMutableURLRequest alloc] initWithURL:requestURL];

    // Set the HTTP body if provided
    if (requestBody && [requestBody isKindOfClass:[NSString class]]) {
        request.HTTPBody = [requestBody dataUsingEncoding:NSUTF8StringEncoding];
    }

    // Ensure requestHeaders is a valid dictionary before setting it
    if (requestHeaders && [requestHeaders isKindOfClass:[NSDictionary class]]) {
        request.allHTTPHeaderFields = requestHeaders;
    } else {
        [LuciqRNLogger e:[LuciqRNDebugTags network] format:@"[updateNetworkLogSnapshot] Invalid requestHeaders format, expected NSDictionary - url=%@", [LuciqRNLogger redactURL:url]];
    }

    // Ensure callbackID is valid and the completion handler exists
    LCQURLRequestAsyncObfuscationCompletedHandler completionHandler = self.requestObfuscationCompletionDictionary[callbackID];
    if (callbackID && [callbackID isKindOfClass:[NSString class]] && completionHandler) {
        // Call the completion handler with the constructed request
        completionHandler(request);
        [LuciqRNLogger d:[LuciqRNDebugTags network] format:@"[updateNetworkLogSnapshot] Obfuscation completion invoked for callbackID=%@", callbackID];
    } else {
        [LuciqRNLogger e:[LuciqRNDebugTags network] format:@"[updateNetworkLogSnapshot] CallbackID not found or completion handler unavailable for callbackID=%@, mapSize=%lu", callbackID, (unsigned long)self.requestObfuscationCompletionDictionary.count];
    }
}

RCT_EXPORT_METHOD(setNetworkLoggingRequestFilterPredicateIOS: (NSString * _Nonnull) callbackID : (BOOL)value ){
    [LuciqRNLogger d:[LuciqRNDebugTags network] format:@"[setNetworkLoggingRequestFilterPredicateIOS] callbackID=%@, save=%d, filteringMapSize=%lu", callbackID, value, (unsigned long)self.requestFilteringCompletionDictionary.count];

    if (self.requestFilteringCompletionDictionary[callbackID] != nil) {
        // ⬇️ YES == Request will be saved, NO == will be ignored
        ((LCQURLRequestResponseAsyncFilteringCompletedHandler)self.requestFilteringCompletionDictionary[callbackID])(value);
    } else {
        [LuciqRNLogger e:[LuciqRNDebugTags network] format:@"[setNetworkLoggingRequestFilterPredicateIOS] Filtering completion not found for callbackID=%@", callbackID];
    }
}


#pragma mark - Helper Methods

// Set up the filtering handler
- (void)setupRequestFilteringHandler {
    [LuciqRNLogger d:[LuciqRNDebugTags network] format:@"[setupRequestFilteringHandler] Registering filtering handler with LCQNetworkLogger"];
    [LCQNetworkLogger setCPRequestFilteringHandler:^(NSURLRequest * _Nonnull request, void (^ _Nonnull completion)(BOOL)) {
        NSString *callbackID = [[[NSUUID alloc] init] UUIDString];
        self.requestFilteringCompletionDictionary[callbackID] = completion;
        [LuciqRNLogger d:[LuciqRNDebugTags network] format:@"[FilteringHandler] Received request - callbackID=%@, url=%@, mapSize=%lu", callbackID, [LuciqRNLogger redactURL:request.URL.absoluteString], (unsigned long)self.requestFilteringCompletionDictionary.count];

        NSDictionary *dict = [self createNetworkRequestDictForRequest:request callbackID:callbackID];
        if(lcq_hasListeners){
            [self sendEventWithName:@"LCQNetworkLoggerHandler" body:dict];
            [LuciqRNLogger d:[LuciqRNDebugTags network] format:@"[LCQNetworkLoggerHandler] emitted (filtering) url=%@", [LuciqRNLogger redactURL:request.URL.absoluteString]];
        } else {
            [LuciqRNLogger d:[LuciqRNDebugTags network] format:@"[FilteringHandler] Event DROPPED (no JS listeners) for url=%@", [LuciqRNLogger redactURL:request.URL.absoluteString]];
        }

    }];
}

// Set up the obfuscation handler
- (void)setupRequestObfuscationHandler {
    [LuciqRNLogger d:[LuciqRNDebugTags network] format:@"[setupRequestObfuscationHandler] Registering obfuscation handler with LCQNetworkLogger"];
    [LCQNetworkLogger setCPRequestAsyncObfuscationHandler:^(NSURLRequest * _Nonnull request, void (^ _Nonnull completion)(NSURLRequest * _Nonnull)) {
        NSString *callbackID = [[[NSUUID alloc] init] UUIDString];
        self.requestObfuscationCompletionDictionary[callbackID] = completion;
        [LuciqRNLogger d:[LuciqRNDebugTags network] format:@"[ObfuscationHandler] Received request - callbackID=%@, url=%@, mapSize=%lu", callbackID, [LuciqRNLogger redactURL:request.URL.absoluteString], (unsigned long)self.requestObfuscationCompletionDictionary.count];


        NSDictionary *dict = [self createNetworkRequestDictForRequest:request callbackID:callbackID];
        if (lcq_hasListeners) {
            [self sendEventWithName:@"LCQNetworkLoggerHandler" body:dict];
            [LuciqRNLogger d:[LuciqRNDebugTags network] format:@"[LCQNetworkLoggerHandler] emitted (obfuscation) url=%@", [LuciqRNLogger redactURL:request.URL.absoluteString]];
        } else {
            [LuciqRNLogger d:[LuciqRNDebugTags network] format:@"[ObfuscationHandler] Event DROPPED (no JS listeners) for url=%@", [LuciqRNLogger redactURL:request.URL.absoluteString]];
        }

    }];
}

// Helper to create a dictionary from the request and callbackID
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

RCT_EXPORT_METHOD(forceStartNetworkLoggingIOS) {
    [LuciqRNLogger d:[LuciqRNDebugTags network] format:@"[forceStartNetworkLoggingIOS] Starting native network logging"];
    [LCQNetworkLogger forceStartNetworkLogging];
}

RCT_EXPORT_METHOD(forceStopNetworkLoggingIOS) {
    [LuciqRNLogger d:[LuciqRNDebugTags network] format:@"[forceStopNetworkLoggingIOS] Stopping native network logging"];
    [LCQNetworkLogger forceStopNetworkLogging];
}



@end
