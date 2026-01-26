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
+ (void)startObservingDisplayLinkWithCallback:(LCQDisplayLinkObservationCallback _Nonnull)callback;
+ (void)stopObservingDisplayLink;
@end
