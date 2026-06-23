import { patchAppDelegate, setMetaData } from '../../plugin/src/preInitHelpers';

describe('Pre-init Expo plugin transforms', () => {
  describe('patchAppDelegate (objc)', () => {
    const objc = `#import "AppDelegate.h"
#import <React/RCTBundleURLProvider.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.moduleName = @"main";
  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

@end
`;

    it('inserts the import and the startPreInit call', () => {
      const result = patchAppDelegate(objc, 'objc');
      expect(result).toContain('#import <RNLuciq/RNLuciq.h>');
      expect(result).toContain('[RNLuciq startPreInit];');
      // call is inside didFinishLaunchingWithOptions
      const callIndex = result.indexOf('[RNLuciq startPreInit];');
      const methodIndex = result.indexOf('didFinishLaunchingWithOptions');
      expect(callIndex).toBeGreaterThan(methodIndex);
    });

    it('is idempotent', () => {
      const once = patchAppDelegate(objc, 'objc');
      const twice = patchAppDelegate(once, 'objc');
      expect(twice).toBe(once);
      expect(twice.match(/startPreInit/g)).toHaveLength(1);
    });
  });

  describe('patchAppDelegate (swift)', () => {
    const swift = `import Expo
import React
import UIKit

@UIApplicationMain
class AppDelegate: ExpoAppDelegate {
  func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
}
`;

    it('inserts the import and the startPreInit call', () => {
      const result = patchAppDelegate(swift, 'swift');
      expect(result).toContain('import RNLuciq');
      expect(result).toContain('RNLuciq.startPreInit()');
    });

    it('is idempotent', () => {
      const once = patchAppDelegate(swift, 'swift');
      const twice = patchAppDelegate(once, 'swift');
      expect(twice).toBe(once);
      expect(twice.match(/startPreInit/g)).toHaveLength(1);
    });
  });

  describe('setMetaData', () => {
    it('adds entries when none exist', () => {
      const result = setMetaData(undefined, {
        'ai.luciq.preinit.enabled': 'true',
        'ai.luciq.preinit.token': 'abc123',
      });
      expect(result).toEqual([
        { $: { 'android:name': 'ai.luciq.preinit.enabled', 'android:value': 'true' } },
        { $: { 'android:name': 'ai.luciq.preinit.token', 'android:value': 'abc123' } },
      ]);
    });

    it('updates an existing entry instead of duplicating', () => {
      const existing = [
        { $: { 'android:name': 'ai.luciq.preinit.token', 'android:value': 'old' } },
      ];
      const result = setMetaData(existing, { 'ai.luciq.preinit.token': 'new' });
      expect(result).toHaveLength(1);
      expect(result[0].$['android:value']).toBe('new');
    });

    it('preserves unrelated entries', () => {
      const existing = [{ $: { 'android:name': 'other.meta', 'android:value': 'keep' } }];
      const result = setMetaData(existing, { 'ai.luciq.preinit.enabled': 'true' });
      expect(result).toHaveLength(2);
      expect(result[0].$['android:name']).toBe('other.meta');
    });
  });
});
