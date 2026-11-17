import { spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

const script = path.resolve(__dirname, '../../scripts/find-token.js');

let root: string;

const write = (relativePath: string, content: string) => {
  const file = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
};

const findToken = (cwd: string, ...args: string[]) => {
  const result = spawnSync('node', [script, ...args], { cwd, encoding: 'utf-8' });
  return { status: result.status, stdout: result.stdout.trim(), stderr: result.stderr.trim() };
};

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'luciq-find-token-'));
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

describe('find-token.js', () => {
  it('finds the token passed to Luciq.init in JavaScript', () => {
    write('src/App.tsx', "Luciq.init({\n  token: 'jsToken123',\n});");
    write(
      'android/app/src/main/java/MainApplication.kt',
      'Luciq.Builder(this, "nativeToken").build()',
    );

    expect(findToken(root)).toEqual({ status: 0, stdout: 'jsToken123', stderr: '' });
  });

  it('finds the token passed to Luciq.Builder in Kotlin when JavaScript only attaches', () => {
    write('src/App.tsx', 'Luciq.attachToNativeApp();');
    write(
      'android/app/src/main/java/MainApplication.kt',
      'Luciq.Builder(this, "kotlinToken1").build()',
    );

    expect(findToken(root).stdout).toBe('kotlinToken1');
  });

  it('finds the token passed to Luciq.Builder in Java with a call as the first argument', () => {
    write(
      'android/app/src/main/java/MainApplication.java',
      'new Luciq.Builder(getApplication(), "javaToken1")\n    .build();',
    );

    expect(findToken(root).stdout).toBe('javaToken1');
  });

  it('finds the token passed to Luciq.start in Swift', () => {
    write(
      'ios/App/AppDelegate.swift',
      'Luciq.start(withToken: "swiftToken1", invocationEvents: [.shake])',
    );

    expect(findToken(root).stdout).toBe('swiftToken1');
  });

  it('finds the token passed to startWithToken in Objective-C', () => {
    write(
      'ios/App/AppDelegate.m',
      '[Luciq startWithToken:@"objcToken1" invocationEvents:LCQInvocationEventShake];',
    );

    expect(findToken(root).stdout).toBe('objcToken1');
  });

  it('searches native folders passed as arguments when they are outside the JavaScript root', () => {
    write('rn/src/App.tsx', 'Luciq.attachToNativeApp();');
    write('host/app/src/main/java/MainApplication.kt', 'Luciq.Builder(this, "hostToken1").build()');

    expect(findToken(path.join(root, 'rn'), path.join(root, 'host')).stdout).toBe('hostToken1');
  });

  it('ignores tokens in native build outputs and dependencies', () => {
    write('android/app/build/generated/Stub.java', 'new Luciq.Builder(app, "buildToken")');
    write('ios/Pods/Some/Stub.m', '[Luciq startWithToken:@"podsToken"];');

    expect(findToken(root).status).toBe(1);
  });

  it('prints nothing to stdout when no token is found so the message is never used as a token', () => {
    write('src/App.tsx', 'Luciq.attachToNativeApp();');

    expect(findToken(root)).toEqual({
      status: 1,
      stdout: '',
      stderr: "Couldn't find Luciq's app token",
    });
  });
});
