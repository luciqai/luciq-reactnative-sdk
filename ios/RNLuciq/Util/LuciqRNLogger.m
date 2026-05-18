//
//  LuciqRNLogger.m
//  RNLuciq
//

#import "LuciqRNLogger.h"

@implementation LuciqRNLogger

static LCQSDKDebugLogsLevel _currentLevel = LCQSDKDebugLogsLevelError;

+ (void)setLevel:(LCQSDKDebugLogsLevel)level {
    _currentLevel = level;
}

+ (LCQSDKDebugLogsLevel)level {
    return _currentLevel;
}

// LCQSDKDebugLogsLevel: Verbose=1, Debug=2, Error=3, None=4 — smaller = more verbose.
// A method emits when its required level is >= currentLevel.
+ (BOOL)allowsDebug {
    return _currentLevel <= LCQSDKDebugLogsLevelDebug;
}

+ (BOOL)allowsError {
    return _currentLevel <= LCQSDKDebugLogsLevelError;
}

+ (void)d:(NSString *)tag format:(NSString *)format, ... {
    if (![self allowsDebug]) { return; }
    va_list args;
    va_start(args, format);
    NSString *message = [[NSString alloc] initWithFormat:format arguments:args];
    va_end(args);
    NSLog(@"[%@] %@", tag, message);
}

+ (void)w:(NSString *)tag format:(NSString *)format, ... {
    if (![self allowsDebug]) { return; }
    va_list args;
    va_start(args, format);
    NSString *message = [[NSString alloc] initWithFormat:format arguments:args];
    va_end(args);
    NSLog(@"[%@] WARN: %@", tag, message);
}

+ (void)e:(NSString *)tag format:(NSString *)format, ... {
    if (![self allowsError]) { return; }
    va_list args;
    va_start(args, format);
    NSString *message = [[NSString alloc] initWithFormat:format arguments:args];
    va_end(args);
    NSLog(@"[%@] ERROR: %@", tag, message);
}

@end
