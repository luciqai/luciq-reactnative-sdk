import { spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

const script = path.resolve(__dirname, '../../ios/sourcemaps.sh');

// The script reads Info.plist with macOS's PlistBuddy, as Xcode runs it.
const itOnMac = process.platform === 'darwin' ? it : it.skip;

let root: string;

const write = (relativePath: string, content: string, mode?: number) => {
  const file = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  if (mode) {
    fs.chmodSync(file, mode);
  }
  return file;
};

const infoPlist = (
  versionName: string,
  versionCode: string,
) => `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleShortVersionString</key>
  <string>${versionName}</string>
  <key>CFBundleVersion</key>
  <string>${versionCode}</string>
</dict>
</plist>
`;

/**
 * Runs ios/sourcemaps.sh as the Xcode build phase would, with a fake `node` on the PATH that resolves
 * the package, finds no token in code, and records the upload command instead of uploading.
 */
const runUploadPhase = (
  plist: { name: string; code: string },
  buildSettings: Record<string, string>,
) => {
  write('app/ios/HelloRN/Info.plist', infoPlist(plist.name, plist.code));
  write('derived/main.jsbundle.map', '{}');
  write('luciq/package.json', '{}');
  const uploadLog = path.join(root, 'upload.log');
  write(
    'bin/node',
    `#!/bin/sh
case "$1" in
  -p) echo "${root}/luciq/package.json" ;;
  *find-token.js) echo "" ;;
  *) printf '%s\\n' "$@" > "${uploadLog}" ;;
esac
`,
    0o755,
  );

  const result = spawnSync('/bin/sh', [script], {
    encoding: 'utf-8',
    env: {
      PATH: `${path.join(root, 'bin')}:/usr/bin:/bin`,
      CONFIGURATION: 'Release',
      PROJECT_DIR: path.join(root, 'app/ios'),
      INFOPLIST_FILE: 'HelloRN/Info.plist',
      DERIVED_FILE_DIR: path.join(root, 'derived'),
      PODS_ROOT: path.join(root, 'app/ios/Pods'),
      LUCIQ_APP_TOKEN: 'app-token',
      ...buildSettings,
    },
  });
  const uploadArgs = fs.existsSync(uploadLog)
    ? fs.readFileSync(uploadLog, 'utf-8').trim().split('\n')
    : null;
  return { output: `${result.stdout}${result.stderr}`, uploadArgs };
};

const argAfter = (args: string[] | null, flag: string) =>
  args ? args[args.indexOf(flag) + 1] : undefined;

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'luciq-sourcemaps-ios-'));
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

describe('ios/sourcemaps.sh', () => {
  itOnMac('uploads under the app version when Info.plist references build settings', () => {
    const { uploadArgs } = runUploadPhase(
      { name: '$(MARKETING_VERSION)', code: '${CURRENT_PROJECT_VERSION}' },
      { MARKETING_VERSION: '2.3.1', CURRENT_PROJECT_VERSION: '45' },
    );

    expect(argAfter(uploadArgs, '--name')).toBe('2.3.1');
    expect(argAfter(uploadArgs, '--code')).toBe('45');
    expect(argAfter(uploadArgs, '--token')).toBe('app-token');
  });

  itOnMac('uploads under a literal version unchanged', () => {
    const { uploadArgs } = runUploadPhase({ name: '1.4.0', code: '140' }, {});

    expect(argAfter(uploadArgs, '--name')).toBe('1.4.0');
    expect(argAfter(uploadArgs, '--code')).toBe('140');
  });

  itOnMac('expands several references and ignores modifiers', () => {
    const { uploadArgs } = runUploadPhase(
      { name: '$(MARKETING_VERSION)-$(BUILD_SUFFIX:lower)', code: '$(CURRENT_PROJECT_VERSION)' },
      { MARKETING_VERSION: '2.3.1', BUILD_SUFFIX: 'beta', CURRENT_PROJECT_VERSION: '45' },
    );

    expect(argAfter(uploadArgs, '--name')).toBe('2.3.1-beta');
  });

  itOnMac(
    'skips the upload instead of using the literal reference when the setting is missing',
    () => {
      const { output, uploadArgs } = runUploadPhase(
        { name: '$(MARKETING_VERSION)', code: '$(CURRENT_PROJECT_VERSION)' },
        {},
      );

      expect(uploadArgs).toBeNull();
      expect(output).toContain('Unable to find Version Name');
    },
  );

  itOnMac('lets LUCIQ_APP_VERSION_NAME and LUCIQ_APP_VERSION_CODE override the version', () => {
    const { uploadArgs } = runUploadPhase(
      { name: '$(MARKETING_VERSION)', code: '$(CURRENT_PROJECT_VERSION)' },
      {
        MARKETING_VERSION: '2.3.1',
        CURRENT_PROJECT_VERSION: '45',
        LUCIQ_APP_VERSION_NAME: '9.9.9',
        LUCIQ_APP_VERSION_CODE: '999',
      },
    );

    expect(argAfter(uploadArgs, '--name')).toBe('9.9.9');
    expect(argAfter(uploadArgs, '--code')).toBe('999');
  });
});
