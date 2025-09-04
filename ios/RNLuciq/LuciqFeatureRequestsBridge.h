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
#import <InstabugSDK/IBGTypes.h>

@interface LuciqFeatureRequestsBridge : RCTEventEmitter <RCTBridgeModule>
/*
 +------------------------------------------------------------------------+
 |                            Feature Requests Module                     |
 +------------------------------------------------------------------------+
 */

- (void)setEmailFieldRequiredForFeatureRequests:(BOOL)isEmailFieldRequired forAction:(NSArray *)actionTypesArray;

- (void)show;

- (void)setEnabled:(BOOL) isEnabled;


@end


