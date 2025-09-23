#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <LuciqSDK/LCQTypes.h>

typedef void (^ LCQURLRequestAsyncObfuscationCompletedHandler)(NSURLRequest * _Nonnull request);
typedef void (^LCQURLRequestResponseAsyncFilteringCompletedHandler)(BOOL keep);

typedef NS_ENUM(NSInteger, NetworkListenerType) {
    NetworkListenerTypeFiltering,
    NetworkListenerTypeObfuscation,
    NetworkListenerTypeBoth
};

@interface LuciqNetworkLoggerBridge : RCTEventEmitter <RCTBridgeModule>

@property NSMutableDictionary<NSString *, LCQURLRequestAsyncObfuscationCompletedHandler> * _Nonnull requestObfuscationCompletionDictionary;
@property NSMutableDictionary<NSString *, NetworkObfuscationCompletionBlock> * _Nonnull responseObfuscationCompletionDictionary;
@property NSMutableDictionary<NSString *, LCQURLRequestResponseAsyncFilteringCompletedHandler> * _Nonnull requestFilteringCompletionDictionary;
@property NSMutableDictionary<NSString *, LCQURLRequestResponseAsyncFilteringCompletedHandler> * _Nonnull responseFilteringCompletionDictionary;

/*
 +------------------------------------------------------------------------+
 |                            NetworkLogger Module                        |
 +------------------------------------------------------------------------+
 */

- (BOOL)isNativeInterceptionEnabled;

- (void) registerNetworkLogsListener:(NetworkListenerType)listenerType;

- (void)updateNetworkLogSnapshot:(NSString * _Nonnull)url
                        callbackID:(NSString * _Nonnull)callbackID
                        requestBody:(NSString * _Nullable)requestBody
                        responseBody:(NSString * _Nullable)responseBody
                        responseCode:(double)responseCode
                        requestHeaders:(NSDictionary * _Nullable)requestHeaders
                        responseHeaders:(NSDictionary * _Nullable)responseHeaders;

- (void) setNetworkLoggingRequestFilterPredicateIOS:(NSString * _Nonnull) callbackID : (BOOL)value;

- (void)forceStartNetworkLoggingIOS;

- (void)forceStopNetworkLoggingIOS;
@end
