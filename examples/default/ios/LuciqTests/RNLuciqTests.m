#import <XCTest/XCTest.h>
#import "OCMock/OCMock.h"
#import "InstabugSDK/InstabugSDK.h"
#import <InstabugSDK/IBGTypes.h>
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
  self.mLuciq = OCMClassMock([Instabug class]);
  self.mLCQNetworkLogger = OCMClassMock([IBGNetworkLogger class]);

  [RNLuciq reset];
}

- (void)testInitWithoutLogsLevel {
  NSString *token = @"app-token";
  IBGInvocationEvent invocationEvents = IBGInvocationEventFloatingButton | IBGInvocationEventShake;

  [RNLuciq initWithToken:token invocationEvents:invocationEvents];

  OCMVerify([self.mLuciq startWithToken:token invocationEvents:invocationEvents]);
  OCMVerify([self.mLuciq setCurrentPlatform:IBGPlatformReactNative]);
  OCMVerify([self.mLCQNetworkLogger disableAutomaticCapturingOfNetworkLogs]);
  OCMVerify([self.mLCQNetworkLogger setEnabled:YES]);
}

- (void)testInitWithNativeNetworkInterception {
  NSString *token = @"app-token";
  IBGInvocationEvent invocationEvents = IBGInvocationEventFloatingButton | IBGInvocationEventShake;
  BOOL useNativeNetworkInterception = YES;

  [RNLuciq initWithToken:token invocationEvents:invocationEvents useNativeNetworkInterception:useNativeNetworkInterception];

  OCMVerify([self.mLuciq startWithToken:token invocationEvents:invocationEvents]);
  OCMVerify([self.mLuciq setCurrentPlatform:IBGPlatformReactNative]);
  OCMVerify(never(), [self.mLCQNetworkLogger disableAutomaticCapturingOfNetworkLogs]);
  OCMVerify([self.mLCQNetworkLogger setEnabled:YES]);
}

- (void)testInitWithLogsLevel {
  NSString *token = @"app-token";
  IBGInvocationEvent invocationEvents = IBGInvocationEventFloatingButton | IBGInvocationEventShake;
  IBGSDKDebugLogsLevel debugLogsLevel = IBGSDKDebugLogsLevelDebug;

  [RNLuciq initWithToken:token invocationEvents:invocationEvents debugLogsLevel:debugLogsLevel];

  OCMVerify([self.mLuciq startWithToken:token invocationEvents:invocationEvents]);
  OCMVerify([self.mLuciq setCurrentPlatform:IBGPlatformReactNative]);
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
    @"service":@(IBGOverAirTypeExpo),
    @"version":@"D0A12345-6789-4B3C-A123-4567ABCDEF01"
  };

  [RNLuciq setOverAirVersion:overAirVersion];

  OCMVerify([self.mLuciq setOverAirVersion:overAirVersion[@"version"] withType:[overAirVersion[@"service"] intValue]]);
}

- (void)testSetOverAirVersionCodepush {
  NSDictionary *overAirVersion = @{
    @"service":@(IBGOverAirTypeCodePush),
    @"version":@"2.0.0"
  };

  [RNLuciq setOverAirVersion:overAirVersion];

  OCMVerify([self.mLuciq setOverAirVersion:overAirVersion[@"version"] withType:[overAirVersion[@"service"] intValue]]);
}

@end
