#import <XCTest/XCTest.h>
#import "OCMock/OCMock.h"
#import "LuciqSDK/LuciqSDK.h"
#import <LuciqSDK/LCQTypes.h>
#import "RNLuciq.h"
#import "RNLuciq/Luciq+CP.h"
#import "RNLuciq/LCQNetworkLogger+CP.h"
#import "LCQConstants.h"

@interface RNLuciqTests : XCTestCase

@property (nonatomic, strong) id mLuciq;
@property (nonatomic, strong) id mLCQNetworkLogger;

@end

// Expose the `reset` API on RNLuciq to allow multiple calls to `initWithToken`.
@interface RNLuciq (Test)
+ (void)reset;
@end

@implementation RNLuciqTests

- (void)setUp {
  self.mLuciq = OCMClassMock([Luciq class]);
  self.mLCQNetworkLogger = OCMClassMock([LCQNetworkLogger class]);

  [RNLuciq reset];
}

- (void)testInitWithoutLogsLevel {
  NSString *token = @"app-token";
  LCQInvocationEvent invocationEvents = LCQInvocationEventFloatingButton | LCQInvocationEventShake;

  [RNLuciq initWithToken:token invocationEvents:invocationEvents];

  OCMVerify([self.mLuciq startWithToken:token invocationEvents:invocationEvents]);
  OCMVerify([self.mLuciq setCurrentPlatform:LCQPlatformReactNative]);
  OCMVerify([self.mLCQNetworkLogger disableAutomaticCapturingOfNetworkLogs]);
  OCMVerify([self.mLCQNetworkLogger setEnabled:YES]);
}

- (void)testInitWithNativeNetworkInterception {
  NSString *token = @"app-token";
  LCQInvocationEvent invocationEvents = LCQInvocationEventFloatingButton | LCQInvocationEventShake;
  BOOL useNativeNetworkInterception = YES;

  [RNLuciq initWithToken:token invocationEvents:invocationEvents useNativeNetworkInterception:useNativeNetworkInterception];

  OCMVerify([self.mLuciq startWithToken:token invocationEvents:invocationEvents]);
  OCMVerify([self.mLuciq setCurrentPlatform:LCQPlatformReactNative]);
  OCMVerify(never(), [self.mLCQNetworkLogger disableAutomaticCapturingOfNetworkLogs]);
  OCMVerify([self.mLCQNetworkLogger setEnabled:YES]);
}

- (void)testInitWithLogsLevel {
  NSString *token = @"app-token";
  LCQInvocationEvent invocationEvents = LCQInvocationEventFloatingButton | LCQInvocationEventShake;
  LCQSDKDebugLogsLevel debugLogsLevel = LCQSDKDebugLogsLevelDebug;

  [RNLuciq initWithToken:token invocationEvents:invocationEvents debugLogsLevel:debugLogsLevel];

  OCMVerify([self.mLuciq startWithToken:token invocationEvents:invocationEvents]);
  OCMVerify([self.mLuciq setCurrentPlatform:LCQPlatformReactNative]);
  OCMVerify([self.mLCQNetworkLogger disableAutomaticCapturingOfNetworkLogs]);
  OCMVerify([self.mLCQNetworkLogger setEnabled:YES]);
}

- (void) testSetCodePushVersion {
  NSString *codePushVersion = @"1.0.0(1)";
  [RNLuciq setCodePushVersion:codePushVersion];

  OCMVerify([self.mLuciq setCodePushVersion:codePushVersion]);
}

- (void)testSetOverAirVersionExpo {
  NSDictionary *overAirVersion = @{
    @"service":@(LCQOverAirTypeExpo),
    @"version":@"D0A12345-6789-4B3C-A123-4567ABCDEF01"
  };

  [RNLuciq setOverAirVersion:overAirVersion];

  OCMVerify([self.mLuciq setOverAirVersion:overAirVersion[@"version"] withType:(LCQOverAirType)[overAirVersion[@"service"] intValue]]);
}

- (void)testSetOverAirVersionCodepush {
  NSDictionary *overAirVersion = @{
    @"service":@(LCQOverAirTypeCodePush),
    @"version":@"2.0.0"
  };

  [RNLuciq setOverAirVersion:overAirVersion];

  OCMVerify([self.mLuciq setOverAirVersion:overAirVersion[@"version"] withType:(LCQOverAirType)[overAirVersion[@"service"] intValue]]);
}

@end
