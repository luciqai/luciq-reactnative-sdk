#import <Foundation/Foundation.h>

@interface LuciqScreenLoadingFrameTracker : NSObject

+ (instancetype)sharedInstance;
- (void)startTrackingForSpanId:(NSString *)spanId;
- (NSNumber *)getFrameTimestampForSpanId:(NSString *)spanId;
- (void)initializeFrameTracking;
- (void)cleanup;

@end
