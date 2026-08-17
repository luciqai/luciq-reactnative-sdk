#import "LuciqJSHangProfiler.h"

#import "Util/LuciqRNDebugTags.h"
#import "Util/LuciqRNLogger.h"

#if __has_include(<hermes/hermes.h>)
#define LCQ_HERMES_AVAILABLE 1
#import <hermes/hermes.h>
#else
#define LCQ_HERMES_AVAILABLE 0
#endif

#ifndef LCQ_HERMES_PROFILER_EXCLUSIVE_OWNERSHIP
#define LCQ_HERMES_PROFILER_EXCLUSIVE_OWNERSHIP 0
#endif

static NSString *const LCQJSHangProfileDirectory = @"luciq_js_hang_profiles";
#if LCQ_HERMES_AVAILABLE && LCQ_HERMES_PROFILER_EXCLUSIVE_OWNERSHIP
static NSTimeInterval const LCQJSHangMaximumProfileWindow = 1.0;
#endif
static NSUInteger const LCQJSHangMaximumProfileBytes = 1024 * 1024;
static NSUInteger const LCQJSHangMaximumSamples = 512;
static NSUInteger const LCQJSHangMaximumStackFrames = 4096;
static NSUInteger const LCQJSHangMaximumFramesPerStack = 64;
static NSUInteger const LCQJSHangMaximumStringLength = 512;

static dispatch_queue_t LCQJSHangProfilerQueue(void) {
    static dispatch_queue_t queue;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        queue = dispatch_queue_create("ai.luciq.reactlibrary.js-hang-profiler", DISPATCH_QUEUE_SERIAL);
    });
    return queue;
}

#if LCQ_HERMES_AVAILABLE && LCQ_HERMES_PROFILER_EXCLUSIVE_OWNERSHIP
static BOOL LCQProfilerActive = NO;
#endif
static NSUInteger LCQProfilerGeneration = 0;
static NSString *LCQProfilerPath = nil;

static NSString *LCQBoundedString(id value, NSString *fallback) {
    NSString *string = [value isKindOfClass:NSString.class] ? value : fallback;
    if (string.length <= LCQJSHangMaximumStringLength) {
        return string;
    }
    return [string substringToIndex:LCQJSHangMaximumStringLength];
}

@implementation LuciqJSHangProfiler

+ (NSString *)capabilityStatus {
#if !LCQ_HERMES_AVAILABLE
    return @"unavailable_hermes_headers";
#elif !LCQ_HERMES_PROFILER_EXCLUSIVE_OWNERSHIP
    // Hermes exposes process-global enable/disable methods but no ownership
    // token or current-owner query. An in-process Luciq lock cannot detect
    // another profiler consumer, so default builds must fail closed. A host
    // may define LCQ_HERMES_PROFILER_EXCLUSIVE_OWNERSHIP=1 only when it can
    // guarantee that no other integration uses the sampling profiler.
    return @"unavailable_process_global_ownership";
#else
    return @"available_bounded_exclusive_hermes";
#endif
}

+ (NSString *)profilePathForEpochMs:(long long)epochMs {
    NSString *directory = [NSSearchPathForDirectoriesInDomains(NSApplicationSupportDirectory, NSUserDomainMask, YES).firstObject
        stringByAppendingPathComponent:LCQJSHangProfileDirectory];
    [[NSFileManager defaultManager] createDirectoryAtPath:directory
                              withIntermediateDirectories:YES
                                               attributes:nil
                                                    error:nil];
    return [directory stringByAppendingPathComponent:
        [NSString stringWithFormat:@"js_hang_%lld.cpuprofile", epochMs]];
}

+ (void)deleteProfileIntermediates {
    NSString *directory = [NSSearchPathForDirectoriesInDomains(
        NSApplicationSupportDirectory, NSUserDomainMask, YES).firstObject
        stringByAppendingPathComponent:LCQJSHangProfileDirectory];
    NSArray<NSString *> *files =
        [[NSFileManager defaultManager] contentsOfDirectoryAtPath:directory error:nil];
    for (NSString *file in files) {
        if ([file hasPrefix:@"js_hang_"] && [file hasSuffix:@".cpuprofile"]) {
            [[NSFileManager defaultManager]
                removeItemAtPath:[directory stringByAppendingPathComponent:file] error:nil];
        }
    }
}

+ (void)stopLockedAndDump:(BOOL)dump {
#if LCQ_HERMES_AVAILABLE && LCQ_HERMES_PROFILER_EXCLUSIVE_OWNERSHIP
    if (!LCQProfilerActive) {
        return;
    }
    NSString *path = LCQProfilerPath;
    BOOL dumpSucceeded = NO;
    @try {
        if (dump && path.length > 0) {
            @try {
                [[NSFileManager defaultManager] removeItemAtPath:path error:nil];
                try {
                    facebook::hermes::HermesRuntime::dumpSampledTraceToFile(std::string(path.UTF8String));
                    dumpSucceeded = [[NSFileManager defaultManager] fileExistsAtPath:path];
                } catch (...) {
                    [LuciqRNLogger e:[LuciqRNDebugTags jsHang] format:@"[profiler] C++ dump failed"];
                }
            } @catch (NSException *exception) {
                [LuciqRNLogger e:[LuciqRNDebugTags jsHang] format:@"[profiler] dump failed: %@", exception.name];
            }
        }
    } @finally {
        @try {
            try {
                facebook::hermes::HermesRuntime::disableSamplingProfiler();
            } catch (...) {
                [LuciqRNLogger e:[LuciqRNDebugTags jsHang] format:@"[profiler] C++ disable failed"];
            }
        } @catch (NSException *exception) {
            [LuciqRNLogger e:[LuciqRNDebugTags jsHang] format:@"[profiler] disable failed: %@", exception.name];
        }
        LCQProfilerActive = NO;
        if (!dumpSucceeded && path.length > 0) {
            [[NSFileManager defaultManager] removeItemAtPath:path error:nil];
            LCQProfilerPath = nil;
        }
    }
#endif
}

+ (void)disableAfterFailedEnableLocked {
#if LCQ_HERMES_AVAILABLE && LCQ_HERMES_PROFILER_EXCLUSIVE_OWNERSHIP
    @try {
        try {
            facebook::hermes::HermesRuntime::disableSamplingProfiler();
        } catch (...) {
            [LuciqRNLogger e:[LuciqRNDebugTags jsHang]
                      format:@"[profiler] C++ cleanup after enable failure failed"];
        }
    } @catch (NSException *exception) {
        [LuciqRNLogger e:[LuciqRNDebugTags jsHang]
                  format:@"[profiler] cleanup after enable failure failed: %@", exception.name];
    }
#endif
}

+ (BOOL)startWithHangStartEpochMs:(long long)hangStartEpochMs {
    if (![[self capabilityStatus] hasPrefix:@"available_"]) {
        [LuciqRNLogger d:[LuciqRNDebugTags jsHang] format:@"[profiler] %@", [self capabilityStatus]];
        return NO;
    }
    __block BOOL started = NO;
    dispatch_sync(LCQJSHangProfilerQueue(), ^{
#if LCQ_HERMES_AVAILABLE && LCQ_HERMES_PROFILER_EXCLUSIVE_OWNERSHIP
        if (LCQProfilerActive) {
            return;
        }
#endif
        [self deleteProfileIntermediates];
#if LCQ_HERMES_AVAILABLE && LCQ_HERMES_PROFILER_EXCLUSIVE_OWNERSHIP
        LCQProfilerPath = [self profilePathForEpochMs:hangStartEpochMs];
        [[NSFileManager defaultManager] removeItemAtPath:LCQProfilerPath error:nil];
        @try {
            try {
                facebook::hermes::HermesRuntime::enableSamplingProfiler();
                LCQProfilerActive = YES;
                started = YES;
            } catch (...) {
                [LuciqRNLogger e:[LuciqRNDebugTags jsHang] format:@"[profiler] C++ enable failed"];
            }
        } @catch (NSException *exception) {
            [LuciqRNLogger e:[LuciqRNDebugTags jsHang] format:@"[profiler] enable failed: %@", exception.name];
        }
        if (!started) {
            [self disableAfterFailedEnableLocked];
        }
        NSUInteger generation = ++LCQProfilerGeneration;
        if (started) {
            dispatch_after(dispatch_time(DISPATCH_TIME_NOW,
                                         (int64_t)(LCQJSHangMaximumProfileWindow * NSEC_PER_SEC)),
                           LCQJSHangProfilerQueue(), ^{
                if (LCQProfilerActive && generation == LCQProfilerGeneration) {
                    [self stopLockedAndDump:YES];
                }
            });
        } else {
            LCQProfilerPath = nil;
        }
#endif
    });
    return started;
}

+ (nullable NSString *)dumpAndStopWithHangStartEpochMs:(long long)hangStartEpochMs {
    (void)hangStartEpochMs;
    __block NSString *path = nil;
    dispatch_sync(LCQJSHangProfilerQueue(), ^{
        [self stopLockedAndDump:YES];
        path = [LCQProfilerPath copy];
        LCQProfilerPath = nil;
    });
    return path;
}

+ (void)abortAndStop {
    dispatch_sync(LCQJSHangProfilerQueue(), ^{
        ++LCQProfilerGeneration;
        [self stopLockedAndDump:NO];
        if (LCQProfilerPath.length > 0) {
            [[NSFileManager defaultManager] removeItemAtPath:LCQProfilerPath error:nil];
        }
        LCQProfilerPath = nil;
        [self deleteProfileIntermediates];
    });
}

+ (nullable NSString *)leftoverTracePathForEpochMs:(long long)epochMs {
    NSString *path = [self profilePathForEpochMs:epochMs];
    return [[NSFileManager defaultManager] fileExistsAtPath:path] ? path : nil;
}

+ (nullable NSArray<NSDictionary *> *)culpritFramesFromTraceAtPath:(NSString *)path
                                                        bundleName:(NSString *)bundleName
                                               sampleWindowSeconds:(NSTimeInterval)sampleWindowSeconds {
    @try {
        NSNumber *fileSize = [[[NSFileManager defaultManager] attributesOfItemAtPath:path error:nil] objectForKey:NSFileSize];
        if (fileSize == nil || fileSize.unsignedLongLongValue > LCQJSHangMaximumProfileBytes) {
            return nil;
        }
        NSData *data = [NSData dataWithContentsOfFile:path];
        if (data == nil) {
            return nil;
        }
        // Hermes dumps Chrome trace-event JSON: "samples" is an array of
        // {sf, ts, ...} where sf is the leaf stack-frame id, and "stackFrames"
        // maps id -> {name, category, parent} with JS frame names shaped as
        // "funcName(file:line:column)".
        NSDictionary *trace = [NSJSONSerialization JSONObjectWithData:data options:0 error:nil];
        if (![trace isKindOfClass:NSDictionary.class]) {
            return nil;
        }
        NSArray *samples = trace[@"samples"];
        NSDictionary *stackFrames = trace[@"stackFrames"];
        if (![samples isKindOfClass:NSArray.class] || samples.count == 0 ||
            ![stackFrames isKindOfClass:NSDictionary.class] || stackFrames.count == 0 ||
            stackFrames.count > LCQJSHangMaximumStackFrames) {
            return nil;
        }

        // Trace timestamps are microsecond deltas on an engine-private clock
        // base, so post-recovery samples are dropped relative to the earliest
        // sample; a non-positive window keeps every sample.
        double minTimestamp = INFINITY;
        for (id sample in samples) {
            NSNumber *timestamp = [sample isKindOfClass:NSDictionary.class] ? sample[@"ts"] : nil;
            if ([timestamp isKindOfClass:NSNumber.class]) {
                minTimestamp = MIN(minTimestamp, timestamp.doubleValue);
            }
        }
        double windowMicros = sampleWindowSeconds > 0 && isfinite(minTimestamp)
            ? sampleWindowSeconds * 1000000.0 : 0;

        NSCountedSet<NSString *> *leafCounts = [NSCountedSet new];
        NSUInteger inspectedSamples = 0;
        NSUInteger filteredSamples = 0;
        for (id sample in samples) {
            if (inspectedSamples++ >= LCQJSHangMaximumSamples) {
                break;
            }
            if (![sample isKindOfClass:NSDictionary.class]) {
                continue;
            }
            NSNumber *timestamp = sample[@"ts"];
            if (windowMicros > 0 && [timestamp isKindOfClass:NSNumber.class] &&
                timestamp.doubleValue - minTimestamp > windowMicros) {
                filteredSamples++;
                continue;
            }
            if (sample[@"sf"] != nil) {
                [leafCounts addObject:[NSString stringWithFormat:@"%@", sample[@"sf"]]];
            }
        }
        [LuciqRNLogger d:[LuciqRNDebugTags jsHang]
                  format:@"[profiler] sampleWindow=%.0fms counted=%lu filteredPostRecovery=%lu",
            sampleWindowSeconds * 1000.0, (unsigned long)leafCounts.count, (unsigned long)filteredSamples];
        NSString *leafId = nil;
        NSUInteger leafCount = 0;
        for (NSString *sf in leafCounts) {
            NSUInteger count = [leafCounts countForObject:sf];
            if (count > leafCount) {
                leafCount = count;
                leafId = sf;
            }
        }
        if (leafId == nil) {
            return nil;
        }

        static NSRegularExpression *frameRegex;
        static dispatch_once_t onceToken;
        dispatch_once(&onceToken, ^{
            frameRegex = [NSRegularExpression regularExpressionWithPattern:@"^(.*)\\((.+):(\\d+):(\\d+)\\)$"
                                                                   options:0
                                                                     error:nil];
        });

        NSMutableArray<NSDictionary *> *frames = [NSMutableArray new];
        NSString *frameId = leafId;
        // Parent links come from the trace; bound the walk in case of a cycle.
        NSUInteger guard = 0;
        while (frameId != nil && guard++ < LCQJSHangMaximumFramesPerStack) {
            NSDictionary *frame = stackFrames[frameId];
            if (![frame isKindOfClass:NSDictionary.class]) {
                break;
            }
            NSString *name = LCQBoundedString(frame[@"name"], @"");
            NSString *category = LCQBoundedString(frame[@"category"], @"");
            NSTextCheckingResult *match = [frameRegex firstMatchInString:name
                                                                 options:0
                                                                   range:NSMakeRange(0, name.length)];
            if (match != nil) {
                // Source-location frame: "funcName(file:line:column)".
                NSString *methodName = LCQBoundedString([name substringWithRange:[match rangeAtIndex:1]], @"anonymous");
                NSString *file = LCQBoundedString([name substringWithRange:[match rangeAtIndex:2]], bundleName);
                NSInteger line = [name substringWithRange:[match rangeAtIndex:3]].integerValue;
                NSInteger column = [name substringWithRange:[match rangeAtIndex:4]].integerValue;
                [frames addObject:@{
                    @"methodName" : methodName.length > 0 ? methodName : @"anonymous",
                    @"file" : file,
                    @"lineNumber" : @(line),
                    @"column" : @(column),
                }];
            } else if ([category isEqualToString:@"JavaScript"] && frame[@"funcVirtAddr"] != nil) {
                // Bytecode-bundle frame (hermesc release build): no source
                // location, only bytecode addresses. Hermes error stacks report
                // these as "address at <bundle>:1:<virtualAddress>" and the
                // composed source map resolves (line 1, column virtualAddress),
                // so mirror that shape for backend symbolication.
                long long virtualAddress = [frame[@"funcVirtAddr"] longLongValue] + [frame[@"offset"] longLongValue];
                // "anonymous" matches Hermes error-stack naming for unnamed
                // functions, keeping hang frames identical to handled-crash frames.
                [frames addObject:@{
                    @"methodName" : name.length > 0 ? name : @"anonymous",
                    @"file" : LCQBoundedString(bundleName, @"main.jsbundle"),
                    @"lineNumber" : @1,
                    @"column" : @(virtualAddress),
                }];
            }
            // [root], native builtins, and other locationless frames are skipped.
            id parent = frame[@"parent"];
            frameId = parent != nil
                ? LCQBoundedString([NSString stringWithFormat:@"%@", parent], @"") : nil;
        }
        return frames.count > 0 ? frames : nil;
    } @catch (NSException *exception) {
        [LuciqRNLogger e:[LuciqRNDebugTags jsHang] format:@"[profiler] trace parse failed: %@", exception.name];
        return nil;
    } @finally {
        [[NSFileManager defaultManager] removeItemAtPath:path error:nil];
    }
}

@end
