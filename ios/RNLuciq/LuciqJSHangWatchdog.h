#import <Foundation/Foundation.h>

@class RCTBridge;

NS_ASSUME_NONNULL_BEGIN

/// Detects JS thread hangs from a native watchdog timer.
///
/// A GCD timer on a background serial queue enqueues a pong block onto the JS
/// thread every 500 ms and tracks when it last executed. While the JS thread is
/// blocked the pong cannot run, so the observed gap grows; once it crosses the
/// 3 s threshold the hang is recorded (and a marker is persisted so hangs the
/// app dies in are reported on the next launch). The hang is reported with its
/// duration when the JS thread recovers.
///
/// Never runs in dev builds (Metro reloads and debuggers block the JS thread
/// legitimately) or while a debugger is attached.
@interface LuciqJSHangWatchdog : NSObject

+ (instancetype)sharedInstance;

/// YES only for a classic RCTBridge exposing the verified JS-queue dispatch
/// contract; bridgeless proxies and nil are unsupported.
+ (BOOL)supportsClassicBridge:(nullable id)bridge;

- (void)startWithBridge:(RCTBridge *)bridge;
- (void)stop;

@end

NS_ASSUME_NONNULL_END
