#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// -----------------------------------
// Configuration
// -----------------------------------

// Multiple refactor methods with multiple search-replace pairs
const REFACTOR_METHODS = [
  {
    name: 'Instabug to Luciq',
    description: 'Replace all instances of Instabug with Luciq',
    searchReplace: [
      { search: 'Instabug', replacement: 'Luciq' },
      { search: 'instabug', replacement: 'luciq' },
      { search: 'INSTABUG', replacement: 'LUCIQ' },
      { search: 'IBG', replacement: 'LCQ' },
      { search: 'ibg', replacement: 'lcq' },
    ],
    targetExtensions: [
      '.h',
      '.m',
      '.plist',
      '.pbxproj',
      '.xcscheme',
      '.sh',
      '.java',
      '.kt',
      '.ts',
      '.tsx',
      '.js',
      '.jsx',
      '.json',
      '.xml',
      '.gradle',
      '.properties',
      '.md',
      '.txt',
    ],
    ignoredDirs: [
      'node_modules',
      'build',
      'Pods',
      'vendor',
      '.git',
      'dist',
      'coverage',
      '.next',
      '.nuxt',
      'target',
    ],
    enabled: true,
  },
  {
    name: 'Package Name Update',
    description: 'Update package names and references',
    searchReplace: [
      { search: 'com.instabug', replacement: 'ai.luciq' },
      { search: 'com.instabug.reactlibrary', replacement: 'ai.luciq.reactlibrary' },
      { search: 'RNInstabug', replacement: 'RNLuciq' },
      { search: 'rninstabug', replacement: 'rnluciq' },
    ],
    targetExtensions: [
      '.java',
      '.kt',
      '.xml',
      '.gradle',
      '.properties',
      '.ts',
      '.tsx',
      '.js',
      '.jsx',
      '.json',
    ],
    ignoredDirs: ['node_modules', 'build', 'Pods', 'vendor', '.git', 'dist', 'coverage'],
    enabled: false,
  },
  {
    name: 'File Extension Cleanup',
    description: 'Clean up file extensions and references',
    searchReplace: [
      { search: '.instabug', replacement: '.luciq' },
      { search: '_instabug', replacement: '_luciq' },
      { search: 'instabug_', replacement: 'luciq_' },
    ],
    targetExtensions: [
      '.ts',
      '.tsx',
      '.js',
      '.jsx',
      '.json',
      '.xml',
      '.gradle',
      '.properties',
      '.md',
      '.txt',
    ],
    ignoredDirs: ['node_modules', 'build', 'Pods', 'vendor', '.git', 'dist', 'coverage'],
    enabled: false,
  },
];

// Global settings
const GLOBAL_SETTINGS = {
  enableGitCheck: false,
  backupBeforeRefactor: false,
  dryRun: false,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  verbose: true,
};

// -----------------------------------
// Utility Functions
// -----------------------------------

function checkGitClean() {
  if (!GLOBAL_SETTINGS.enableGitCheck) {
    return;
  }

  try {
    const status = execSync('git status --porcelain').toString();
    if (status.trim()) {
      console.error('❌ Uncommitted changes detected. Please commit or stash your changes first.');
      process.exit(1);
    }
  } catch (error) {
    console.warn('⚠️ Git check failed, continuing without git validation...');
  }
}

function isIgnored(filePath, ignoredDirs) {
  return ignoredDirs.some((dir) => filePath.split(path.sep).includes(dir));
}

function casePreservingReplace(str, searchReplace) {
  let result = str;

  for (const { search, replacement } of searchReplace) {
    result = result.replace(new RegExp(search, 'gi'), (match) => {
      if (match === match.toUpperCase()) {
        return replacement.toUpperCase();
      }
      if (match[0] === match[0].toUpperCase()) {
        return replacement[0].toUpperCase() + replacement.slice(1);
      }
      return replacement.toLowerCase();
    });
  }

  return result;
}

function createBackup(filePath) {
  if (!GLOBAL_SETTINGS.backupBeforeRefactor) {
    return;
  }

  const backupPath = `${filePath}.backup.${Date.now()}`;
  try {
    fs.copyFileSync(filePath, backupPath);
    if (GLOBAL_SETTINGS.verbose) {
      console.log(`💾 Backup created: ${backupPath}`);
    }
  } catch (error) {
    console.warn(`⚠️ Failed to create backup for ${filePath}:`, error.message);
  }
}

// -----------------------------------
// File Processing
// -----------------------------------

function processFile(filePath, method) {
  if (isIgnored(filePath, method.ignoredDirs)) {
    return;
  }

  try {
    const stats = fs.statSync(filePath);
    if (stats.size > GLOBAL_SETTINGS.maxFileSize) {
      if (GLOBAL_SETTINGS.verbose) {
        console.log(
          `⏭️ Skipping large file: ${filePath} (${(stats.size / 1024 / 1024).toFixed(2)}MB)`,
        );
      }
      return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const newContent = casePreservingReplace(content, method.searchReplace);

    if (newContent !== content) {
      if (GLOBAL_SETTINGS.dryRun) {
        console.log(`📝 [${method.name}] Would update content: ${filePath}`);
        return;
      }

      createBackup(filePath);
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`📝 [${method.name}] Updated content: ${filePath}`);
    }

    const dir = path.dirname(filePath);
    const fileName = path.basename(filePath);
    const newFileName = casePreservingReplace(fileName, method.searchReplace);

    if (fileName !== newFileName) {
      const newPath = path.join(dir, newFileName);
      if (!fs.existsSync(newPath)) {
        if (GLOBAL_SETTINGS.dryRun) {
          console.log(`📁 [${method.name}] Would rename file: ${filePath} → ${newPath}`);
          return;
        }

        fs.renameSync(filePath, newPath);
        console.log(`📁 [${method.name}] Renamed file: ${filePath} → ${newPath}`);
      } else {
        console.warn(
          `⚠️ [${method.name}] Skipping file rename: ${filePath} → ${newPath} (target exists)`,
        );
      }
    }
  } catch (error) {
    console.error(`❌ Error processing file ${filePath}:`, error.message);
  }
}

// -----------------------------------
// Folder Rename
// -----------------------------------

function renameFolderIfNeeded(dirPath, method) {
  if (isIgnored(dirPath, method.ignoredDirs)) {
    return dirPath;
  }

  try {
    const parentDir = path.dirname(dirPath);
    const currentFolder = path.basename(dirPath);
    const newFolder = casePreservingReplace(currentFolder, method.searchReplace);

    if (currentFolder !== newFolder) {
      const newPath = path.join(parentDir, newFolder);

      // Check if target already exists
      if (fs.existsSync(newPath)) {
        console.warn(
          `⚠️ [${method.name}] Skipping folder rename: ${dirPath} → ${newPath} (target exists)`,
        );
        return dirPath;
      }

      // Check if we can actually rename the directory
      try {
        // Test if we can read the directory
        fs.accessSync(dirPath, fs.constants.R_OK);
      } catch (error) {
        console.warn(`⚠️ [${method.name}] Cannot access directory for rename: ${dirPath}`);
        return dirPath;
      }

      if (GLOBAL_SETTINGS.dryRun) {
        console.log(`📂 [${method.name}] Would rename folder: ${dirPath} → ${newPath}`);
        return dirPath;
      }

      // Perform the rename
      fs.renameSync(dirPath, newPath);
      console.log(`📂 [${method.name}] Renamed folder: ${dirPath} → ${newPath}`);
      return newPath;
    }
  } catch (error) {
    console.error(`❌ Error renaming folder ${dirPath}:`, error.message);
  }

  return dirPath;
}

// -----------------------------------
// Recursive Walk
// -----------------------------------

function walkAndRename(dirPath, method) {
  if (isIgnored(dirPath, method.ignoredDirs)) {
    return;
  }

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    // Process children (files and subdirectories)
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        // Recursively process subdirectories for files only
        walkAndRename(fullPath, method);
      } else if (method.targetExtensions.includes(path.extname(entry.name))) {
        // Process files
        processFile(fullPath, method);
      }
    }

    // Note: Directory renaming is now handled separately in processDirectories()
  } catch (error) {
    console.error(`❌ Error processing directory ${dirPath}:`, error.message);
  }
}

// -----------------------------------
// Main Directory Processing
// -----------------------------------

function processDirectories(method) {
  console.log(`\n📂 Processing directories for method: ${method.name}`);

  // Get all directories that need to be processed
  const directoriesToProcess = [];

  function collectDirectories(currentPath, depth = 0) {
    if (isIgnored(currentPath, method.ignoredDirs) || depth > 20) {
      // Prevent infinite recursion
      return;
    }

    try {
      const entries = fs.readdirSync(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const fullPath = path.join(currentPath, entry.name);
          directoriesToProcess.push(fullPath);
          collectDirectories(fullPath, depth + 1);
        }
      }
    } catch (error) {
      if (GLOBAL_SETTINGS.verbose) {
        console.log(`⚠️ [${method.name}] Could not read directory: ${currentPath}`);
      }
    }
  }

  // Collect all directories first
  collectDirectories(process.cwd());

  if (directoriesToProcess.length === 0) {
    console.log(`   No directories to process for method: ${method.name}`);
    return;
  }

  console.log(`   Found ${directoriesToProcess.length} directories to process`);

  // Sort directories by depth (deepest first) to avoid conflicts
  directoriesToProcess.sort((a, b) => {
    const depthA = a.split(path.sep).length;
    const depthB = b.split(path.sep).length;
    return depthB - depthA;
  });

  let renamedCount = 0;
  let skippedCount = 0;

  // Process directories from deepest to shallowest
  for (const dirPath of directoriesToProcess) {
    try {
      if (fs.existsSync(dirPath)) {
        // Check if directory still exists
        const originalPath = dirPath;
        const newPath = renameFolderIfNeeded(dirPath, method);

        if (newPath !== originalPath) {
          renamedCount++;
        } else {
          skippedCount++;
        }
      }
    } catch (error) {
      if (GLOBAL_SETTINGS.verbose) {
        console.log(`⚠️ [${method.name}] Could not process directory: ${dirPath}`);
      }
    }
  }

  console.log(
    `   Directory processing complete: ${renamedCount} renamed, ${skippedCount} unchanged`,
  );
}

// -----------------------------------
// Method Execution
// -----------------------------------

function executeMethod(method) {
  if (!method.enabled) {
    if (GLOBAL_SETTINGS.verbose) {
      console.log(`⏭️ Skipping disabled method: ${method.name}`);
    }
    return;
  }

  console.log(`\n🚀 Starting method: ${method.name}`);
  if (method.description) {
    console.log(`   Description: ${method.description}`);
  }
  console.log(`   Search/Replace pairs: ${method.searchReplace.length}`);
  console.log(`   Target extensions: ${method.targetExtensions.join(', ')}`);
  console.log(`   Ignored directories: ${method.ignoredDirs.join(', ')}`);

  const startTime = Date.now();

  // First process all files
  console.log(`\n📝 Processing files for method: ${method.name}`);
  walkAndRename(process.cwd(), method);

  // Then process directories (renaming them if needed)
  processDirectories(method);

  const endTime = Date.now();

  console.log(`✅ Method "${method.name}" completed in ${endTime - startTime}ms`);
}

function executeAllMethods() {
  const enabledMethods = REFACTOR_METHODS.filter((method) => method.enabled);

  if (enabledMethods.length === 0) {
    console.log(
      '⚠️ No enabled methods found. Please enable at least one method in the configuration.',
    );
    return;
  }

  console.log(`🎯 Executing ${enabledMethods.length} enabled method(s)...`);

  if (GLOBAL_SETTINGS.dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made');
  }

  for (const method of enabledMethods) {
    try {
      executeMethod(method);
    } catch (error) {
      console.error(`❌ Error executing method "${method.name}":`, error.message);
    }
  }
}

// -----------------------------------
// CLI Arguments
// -----------------------------------

function parseArguments() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: node script.js [options]

Options:
  --help, -h          Show this help message
  --list-methods      List all configured methods
  --enable-method <name> Enable a specific method by name
  --disable-method <name> Disable a specific method by name
  --dry-run           Show what would be changed without making changes
  --git-check         Enable git clean check
  --backup            Create backups before making changes
  --verbose           Enable verbose output
  --quiet             Disable verbose output
`);
    process.exit(0);
  }

  if (args.includes('--list-methods')) {
    console.log('\n📋 Available Methods:');
    REFACTOR_METHODS.forEach((method, index) => {
      const status = method.enabled ? '✅ Enabled' : '❌ Disabled';
      console.log(`\n${index + 1}. ${method.name} (${status})`);
      if (method.description) {
        console.log(`   Description: ${method.description}`);
      }
      console.log('   Search/Replace pairs:');
      method.searchReplace.forEach(({ search, replacement }) => {
        console.log(`     "${search}" → "${replacement}"`);
      });
    });
    process.exit(0);
  }

  if (args.includes('--enable-method')) {
    const methodIndex = args.indexOf('--enable-method');
    const methodName = args[methodIndex + 1];
    const method = REFACTOR_METHODS.find((m) => m.name === methodName);

    if (method) {
      method.enabled = true;
      console.log(`✅ Enabled method: ${methodName}`);
    } else {
      console.error(`❌ Method not found: ${methodName}`);
      process.exit(1);
    }
  }

  if (args.includes('--disable-method')) {
    const methodIndex = args.indexOf('--disable-method');
    const methodName = args[methodIndex + 1];
    const method = REFACTOR_METHODS.find((m) => m.name === methodName);

    if (method) {
      method.enabled = false;
      console.log(`❌ Disabled method: ${methodName}`);
    } else {
      console.error(`❌ Method not found: ${methodName}`);
      process.exit(1);
    }
  }

  if (args.includes('--dry-run')) {
    GLOBAL_SETTINGS.dryRun = true;
    console.log('🔍 Dry run mode enabled');
  }

  if (args.includes('--git-check')) {
    GLOBAL_SETTINGS.enableGitCheck = true;
    console.log('🔒 Git check enabled');
  }

  if (args.includes('--backup')) {
    GLOBAL_SETTINGS.backupBeforeRefactor = true;
    console.log('💾 Backup mode enabled');
  }

  if (args.includes('--verbose')) {
    GLOBAL_SETTINGS.verbose = true;
    console.log('📢 Verbose mode enabled');
  }

  if (args.includes('--quiet')) {
    GLOBAL_SETTINGS.verbose = false;
    console.log('🔇 Quiet mode enabled');
  }
}

// -----------------------------------
// Main
// -----------------------------------

function main() {
  console.log('🔄 Multi-Method Refactor Script');
  console.log('================================');

  parseArguments();
  checkGitClean();
  executeAllMethods();

  if (GLOBAL_SETTINGS.dryRun) {
    console.log('\n🔍 Dry run completed. No changes were made.');
  } else {
    console.log('\n🎉 All methods completed successfully!');
  }
}

if (require.main === module) {
  main();
}

module.exports = { REFACTOR_METHODS, executeMethod, executeAllMethods, GLOBAL_SETTINGS };
