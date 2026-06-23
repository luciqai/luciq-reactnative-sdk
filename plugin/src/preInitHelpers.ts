// Pure, dependency-free transforms used to enable native pre-init crash capture.
// Kept separate from the Expo config-plugin modules so they can be unit tested in isolation.

const PRE_INIT_SENTINEL = '@luciq pre-init';

// Insert the pre-init call (and import) into the app's AppDelegate, idempotently.
export function patchAppDelegate(contents: string, language: string): string {
  if (contents.includes(PRE_INIT_SENTINEL)) {
    return contents;
  }

  if (language === 'swift') {
    let patched = contents;
    if (!/^\s*import RNLuciq/m.test(patched)) {
      patched = patched.replace(/(^import [^\n]+\n)/m, '$1import RNLuciq\n');
    }
    const didFinish = /(func application\([^)]*didFinishLaunchingWithOptions[^)]*\)[^{]*\{)/;
    if (!didFinish.test(patched)) {
      console.warn(
        '[Luciq] Could not find didFinishLaunchingWithOptions in Swift AppDelegate. Add `RNLuciq.startPreInit()` manually.',
      );
      return contents;
    }
    return patched.replace(didFinish, `$1\n    RNLuciq.startPreInit() // ${PRE_INIT_SENTINEL}`);
  }

  // objc / objcpp
  let patched = contents;
  if (!/#import (<RNLuciq\/RNLuciq.h>|"RNLuciq.h")/.test(patched)) {
    patched = patched.replace(/(^#import [^\n]+\n)/m, '$1#import <RNLuciq/RNLuciq.h>\n');
  }
  const didFinish = /(-\s*\(BOOL\)application:[^\n]*didFinishLaunchingWithOptions:[^{]*\{)/;
  if (!didFinish.test(patched)) {
    console.warn(
      '[Luciq] Could not find didFinishLaunchingWithOptions in AppDelegate. Add `[RNLuciq startPreInit];` manually.',
    );
    return contents;
  }
  return patched.replace(didFinish, `$1\n  [RNLuciq startPreInit]; // ${PRE_INIT_SENTINEL}`);
}

// Upsert <meta-data> entries (by android:name) into an application node's meta-data array.
export function setMetaData(existing: any[] | undefined, entries: Record<string, string>): any[] {
  const metaData = existing ? [...existing] : [];

  for (const [name, value] of Object.entries(entries)) {
    const found = metaData.find((entry) => entry?.$?.['android:name'] === name);
    if (found) {
      found.$['android:value'] = value;
    } else {
      metaData.push({ $: { 'android:name': name, 'android:value': value } });
    }
  }

  return metaData;
}
