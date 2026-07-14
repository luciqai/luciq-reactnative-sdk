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

+ (NSString *)redactURL:(NSString *)url {
    if (url.length == 0) { return @""; }

    // Strip userinfo (`scheme://user:pass@host/...` -> `scheme://host/...`).
    // Only treat `@` as userinfo when it appears in the authority (between
    // `://` and the next `/`, `?`, or `#`), so `@` inside a path is preserved.
    NSString *stripped = url;
    NSRange schemeRange = [stripped rangeOfString:@"://"];
    if (schemeRange.location != NSNotFound) {
        NSUInteger authorityStart = schemeRange.location + schemeRange.length;
        NSUInteger authorityEnd = stripped.length;
        for (NSUInteger i = authorityStart; i < stripped.length; i++) {
            unichar c = [stripped characterAtIndex:i];
            if (c == '/' || c == '?' || c == '#') {
                authorityEnd = i;
                break;
            }
        }
        if (authorityEnd > authorityStart) {
            NSRange searchRange = NSMakeRange(authorityStart, authorityEnd - authorityStart);
            NSRange atRange = [stripped rangeOfString:@"@"
                                              options:NSBackwardsSearch
                                                range:searchRange];
            if (atRange.location != NSNotFound) {
                NSUInteger afterAt = atRange.location + atRange.length;
                stripped = [[stripped substringToIndex:authorityStart]
                            stringByAppendingString:[stripped substringFromIndex:afterAt]];
            }
        }
    }

    NSRange queryRange = [stripped rangeOfString:@"?"];
    NSRange fragRange  = [stripped rangeOfString:@"#"];
    NSUInteger cutoff = NSNotFound;

    if (queryRange.location != NSNotFound) {
        cutoff = queryRange.location;
    }
    if (fragRange.location != NSNotFound && (cutoff == NSNotFound || fragRange.location < cutoff)) {
        cutoff = fragRange.location;
    }
    if (cutoff == NSNotFound) {
        return stripped;
    }

    // Only mark a redacted query when the `?` preceded any `#`. A `?` inside
    // a fragment is part of the fragment, not a query, and must not be
    // advertised as redacted.
    BOOL cutAtQuery = (queryRange.location != NSNotFound) &&
        (fragRange.location == NSNotFound || queryRange.location < fragRange.location);
    NSString *base = [stripped substringToIndex:cutoff];
    return cutAtQuery ? [base stringByAppendingString:@"?<redacted>"] : base;
}

@end
