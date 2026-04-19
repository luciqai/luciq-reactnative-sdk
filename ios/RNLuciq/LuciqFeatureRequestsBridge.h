//
//  LuciqFeatureRequestsBridge.h
//  RNLuciq
//
//  Created by Salma Ali on 7/30/19.
//  Copyright © 2019 luciq. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <LuciqSDK/LCQTypes.h>

@interface LuciqFeatureRequestsBridge : RCTEventEmitter <RCTBridgeModule>
/*
 +------------------------------------------------------------------------+
 |                            Feature Requests Module                     |
 +------------------------------------------------------------------------+
 */

- (void)setEmailFieldRequiredForFeatureRequests:(BOOL)isEmailFieldRequired types:(NSArray *)actionTypesArray;

- (void)show;

- (void)setEnabled:(BOOL) isEnabled;


@end


