#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <LuciqSDK/LCQTypes.h>

typedef void (^LCQURLRequestAsyncObfuscationCompletedHandler)(NSURLRequest * _Nonnull request);
typedef void (^LCQURLRequestResponseAsyncFilteringCompletedHandler)(BOOL keep);

@interface LuciqNetworkLoggerBridge : RCTEventEmitter <RCTBridgeModule>

@property NSMutableDictionary<NSString *, LCQURLRequestAsyncObfuscationCompletedHandler> * _Nonnull requestObfuscationCompletionDictionary;
@property NSMutableDictionary<NSString *, NetworkObfuscationCompletionBlock> * _Nonnull responseObfuscationCompletionDictionary;
@property NSMutableDictionary<NSString *, LCQURLRequestResponseAsyncFilteringCompletedHandler> * _Nonnull requestFilteringCompletionDictionary;
@property NSMutableDictionary<NSString *, LCQURLRequestResponseAsyncFilteringCompletedHandler> * _Nonnull responseFilteringCompletionDictionary;

@end
