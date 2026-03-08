//
//  LQAPM+PrivateAPIs.h
//  Pods
//
//  Created by Luciq on 02/06/2024.
//

//#import "LQAPM.h"

@interface LCQAPM (PrivateAPIs)

@property (class, atomic, assign) BOOL networkEnabled;
@property (class, atomic, readonly) BOOL endScreenLoadingEnabled;

typedef void (^LCQDisplayLinkObservationCallback)(NSTimeInterval currentTimestamp, NSTimeInterval targetTimestamp);

+ (void)endScreenLoadingCPWithEndTimestampMUS:(double)endTimestampMUS;
+ (void)reportScreenLoadingCPWithStartTimestampMUS:(double)startTimestampMUS
                                       durationMUS:(double)durationMUS
                                    stages:(nullable NSDictionary<NSString *, NSNumber *> *)stages;;

+ (void)startObservingDisplayLinkWithCallback:(LCQDisplayLinkObservationCallback _Nonnull)callback;
+ (void)stopObservingDisplayLink;
+ (void)reportScreenLoadingCPUITraceWithName:(NSString *_Nonnull)name
                       screenLoadingStartMUS:(double)screenLoadingStartMUS
                    screenLoadingDurationMUS:(double)screenLoadingDurationMUS
                                      stages:(nullable NSDictionary<NSString *, NSNumber *> *)stages;
@end
