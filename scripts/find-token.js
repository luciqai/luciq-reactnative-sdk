const fs = require('fs');
const path = require('path');

/**
 * Prints the Luciq app token used by the app so build scripts can upload source maps.
 *
 * Usage: node find-token.js [nativeDir...]
 *
 * It first looks for `Luciq.init({ token })` or `Luciq.start('token')` in the JavaScript sources of
 * the current directory. When none is found, it looks for the token in native sources, which is
 * where hybrid apps that call `Luciq.attachToNativeApp()` start the SDK: the current directory's
 * `android` and `ios` folders plus any directories passed as arguments.
 *
 * On success the token is the only thing printed to stdout, and the exit code is 0.
 * On failure nothing is printed to stdout, so callers never mistake the message for a token.
 */

const IGNORED_DIRS = new Set(['node_modules', 'ios', 'android']);
const INCLUDED_EXTENSIONS = new Set(['.js', '.ts', '.jsx', '.tsx']);

const NATIVE_IGNORED_DIRS = new Set([
  'node_modules',
  'build',
  'Pods',
  'DerivedData',
  '.gradle',
  '.git',
  '.idea',
  '.cxx',
]);
const NATIVE_EXTENSIONS = new Set(['.java', '.kt', '.swift', '.m', '.mm']);

const NATIVE_TOKEN_PATTERNS = [
  // Java or Kotlin: Luciq.Builder(application, "TOKEN")
  /Luciq\.Builder\(\s*[^,()]+(?:\([^()]*\))?\s*,\s*"([0-9a-zA-Z]+)"/,
  // Swift: Luciq.start(withToken: "TOKEN", ...)
  /Luciq\.start\(\s*withToken:\s*"([0-9a-zA-Z]+)"/,
  // Objective-C: [Luciq startWithToken:@"TOKEN" ...]
  /\[\s*Luciq\s+startWithToken:\s*@"([0-9a-zA-Z]+)"/,
];

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (!IGNORED_DIRS.has(file)) {
        getAllFiles(fullPath, fileList);
      }
    } else {
      if (INCLUDED_EXTENSIONS.has(path.extname(fullPath))) {
        fileList.push(fullPath);
      }
    }
  }
  return fileList;
}

/** Lists native source files, skipping build outputs and symlinks so large native trees stay cheap. */
function getNativeFiles(dir, fileList = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    return fileList;
  }
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!NATIVE_IGNORED_DIRS.has(entry.name)) {
        getNativeFiles(fullPath, fileList);
      }
    } else if (entry.isFile() && NATIVE_EXTENSIONS.has(path.extname(entry.name))) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

function extractTokenFromInit(content) {
  const initMatch = content.match(/Luciq\.init\(\s*{[\s\S]*?token:\s*['"]([0-9a-zA-Z]+)['"]/);
  return initMatch ? initMatch[1] : null;
}

function extractTokenFromStart(content) {
  const startMatch = content.match(/Luciq\.start\(\s*['"]([0-9a-zA-Z]+)['"]/);
  return startMatch ? startMatch[1] : null;
}

function extractTokenFromNative(content) {
  for (const pattern of NATIVE_TOKEN_PATTERNS) {
    const match = content.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
}

function findJsToken() {
  for (const file of getAllFiles('.')) {
    const content = fs.readFileSync(file, 'utf-8');
    const token = extractTokenFromInit(content) || extractTokenFromStart(content);
    if (token) {
      return token;
    }
  }
  return null;
}

function findNativeToken(extraDirs) {
  const dirs = [
    path.resolve('android'),
    path.resolve('ios'),
    ...extraDirs.map((d) => path.resolve(d)),
  ];
  const seen = new Set();
  for (const dir of dirs) {
    if (seen.has(dir) || !fs.existsSync(dir)) {
      continue;
    }
    seen.add(dir);
    for (const file of getNativeFiles(dir)) {
      const token = extractTokenFromNative(fs.readFileSync(file, 'utf-8'));
      if (token) {
        return token;
      }
    }
  }
  return null;
}

function findLuciqToken() {
  const token = findJsToken() || findNativeToken(process.argv.slice(2));

  if (token) {
    console.log(token);
    process.exit(0);
  }

  console.error("Couldn't find Luciq's app token");
  process.exit(1);
}

findLuciqToken();
