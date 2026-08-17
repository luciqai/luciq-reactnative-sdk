#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/// Bounded, optional culprit attribution for Hermes. Sampling fails closed
/// unless the build explicitly guarantees exclusive ownership of Hermes'
/// process-global sampling profiler.
@interface LuciqJSHangProfiler : NSObject

/// A stable machine-readable capability/fidelity value.
+ (NSString *)capabilityStatus;

/// Starts a sampling window of fixed maximum duration.
+ (BOOL)startWithHangStartEpochMs:(long long)hangStartEpochMs;

/// Dumps (unless the maximum window already dumped) and stops sampling.
+ (nullable NSString *)dumpAndStopWithHangStartEpochMs:(long long)hangStartEpochMs;

/// Idempotently disables sampling and deletes every intermediate.
+ (void)abortAndStop;

/// Returns the on-disk trace a previous process dumped mid-hang, or nil.
/// Lets a next-launch report carry the culprit stack of a hang the process
/// died in.
+ (nullable NSString *)leftoverTracePathForEpochMs:(long long)epochMs;

/// Deletes every dumped trace intermediate.
+ (void)deleteProfileIntermediates;

/// Extracts a bounded culprit stack and always deletes the trace intermediate.
/// When sampleWindowSeconds is positive, samples later than that window
/// (relative to the earliest sample) are dropped so post-recovery work is
/// never attributed as the hang's culprit.
+ (nullable NSArray<NSDictionary *> *)culpritFramesFromTraceAtPath:(NSString *)path
                                                        bundleName:(NSString *)bundleName
                                               sampleWindowSeconds:(NSTimeInterval)sampleWindowSeconds;

@end

NS_ASSUME_NONNULL_END
