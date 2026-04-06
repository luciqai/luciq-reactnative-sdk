//
//  LQAPM+PrivateAPIs.h
//  Pods
//
//  Created by Luciq on 02/06/2024.
//

//#import "LQAPM.h"

@interface LCQAPM (PrivateAPIs)

@property (class, atomic, assign) BOOL networkEnabled;

+ (BOOL)customSpansEnabled;

@end
