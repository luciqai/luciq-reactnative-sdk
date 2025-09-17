import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface SearchReplaceRule {
  search: string;
  replacement: string;
  isRegex?: boolean;
}

interface MigrationMethod {
  name: string;
  description: string;
  searchReplace: SearchReplaceRule[];
  targetExtensions: string[];
  ignoredDirs: string[];
  enabled: boolean;
}

interface MigrationConfig {
  migrationMethods: MigrationMethod[];
  defaultOptions: {
    dryRun: boolean;
    silent: boolean;
  };
}

interface MigrateOptions {
  dryRun?: boolean;
  silent?: boolean;
  configPath?: string;
}

/**
 * Loads migration configuration from JSON file
 */
function loadMigrationConfig(configPath?: string): MigrationMethod[] {
  const defaultConfigPath = path.join(__dirname, '../config/migration-config.json');
  const configFilePath = configPath || defaultConfigPath;

  if (!fs.existsSync(configFilePath)) {
    throw new Error(`Configuration file not found: ${configFilePath}`);
  }

  const config: MigrationConfig = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
  return config.migrationMethods;
}

/**
 * Performs migration operations on the codebase.
 *
 * @param opts Options for the migration process.
 * @returns A promise that resolves to a boolean indicating whether the migration was successful.
 */
export const migrate = async (opts: MigrateOptions): Promise<boolean> => {
  try {
    const allMethods = loadMigrationConfig(opts.configPath);
    const enabledMethods = allMethods.filter((m) => m.enabled);

    if (enabledMethods.length === 0) {
      if (!opts.silent) {
        console.error('❌ No migration methods are enabled');
        process.exit(1);
      }
      return false;
    }

    // Check git status automatically
    checkGitClean(opts.silent);

    if (!opts.silent) {
      console.log('🔄 Starting migration with all enabled methods');
      console.log(`📝 Found ${enabledMethods.length} enabled method(s):`);
      enabledMethods.forEach((method) => {
        console.log(`   - ${method.name}: ${method.description}`);
      });
      if (opts.dryRun) {
        console.log('🔍 Dry run mode enabled - no changes will be made');
      }
      console.log('================================');
    }

    await executeAllMethods(enabledMethods, opts.dryRun || false, opts.silent);

    if (!opts.silent) {
      if (opts.dryRun) {
        console.log('\n🔍 Dry run completed. No changes were made.');
      } else {
        console.log('\n🎉 All migrations completed successfully!');
      }
    }

    return true;
  } catch (error) {
    if (!opts.silent) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
    return false;
  }
};

function checkGitClean(silent?: boolean): void {
  try {
    const status = execSync('git status --porcelain').toString();
    if (status.trim()) {
      if (!silent) {
        console.error(
          '❌ Uncommitted changes detected. Please commit or stash your changes first.',
        );
        process.exit(1);
      }
    }
  } catch (error) {
    if (!silent) {
      console.warn('⚠️ Git check failed, continuing without git validation...');
    }
  }
}

function isIgnored(filePath: string, ignoredDirs: string[]): boolean {
  return ignoredDirs.some((dir) => filePath.split(path.sep).includes(dir));
}

function casePreservingReplace(str: string, searchReplace: SearchReplaceRule[]): string {
  let result = str;

  for (const { search, replacement, isRegex } of searchReplace) {
    if (isRegex) {
      // For regex patterns, use direct replacement without case preservation
      result = result.replace(new RegExp(search, 'g'), replacement);
    } else {
      // For literal strings, preserve case
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
  }

  return result;
}

function processFile(
  filePath: string,
  method: MigrationMethod,
  dryRun: boolean,
  silent?: boolean,
): void {
  if (isIgnored(filePath, method.ignoredDirs)) {
    return;
  }

  try {
    const fileExt = path.extname(filePath);

    if (!method.targetExtensions.includes(fileExt)) {
      return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const newContent = casePreservingReplace(content, method.searchReplace);

    if (newContent !== content) {
      if (dryRun) {
        if (!silent) {
          console.log(`📝 [${method.name}] Would update content: ${filePath}`);
        }
        return;
      }

      fs.writeFileSync(filePath, newContent, 'utf8');
      if (!silent) {
        console.log(`📝 [${method.name}] Updated content: ${filePath}`);
      }
    }

    const dir = path.dirname(filePath);
    const fileName = path.basename(filePath);
    const newFileName = casePreservingReplace(fileName, method.searchReplace);

    if (fileName !== newFileName) {
      const newPath = path.join(dir, newFileName);
      if (!fs.existsSync(newPath)) {
        if (dryRun) {
          if (!silent) {
            console.log(`📁 [${method.name}] Would rename file: ${filePath} → ${newPath}`);
          }
          return;
        }

        fs.renameSync(filePath, newPath);
        if (!silent) {
          console.log(`📁 [${method.name}] Renamed file: ${filePath} → ${newPath}`);
        }
      } else {
        if (!silent) {
          console.warn(
            `⚠️ [${method.name}] Skipping file rename: ${filePath} → ${newPath} (target exists)`,
          );
        }
      }
    }
  } catch (error) {
    if (!silent) {
      console.error(`❌ Error processing file ${filePath}:`, error);
    }
  }
}

function renameFolderIfNeeded(
  dirPath: string,
  method: MigrationMethod,
  dryRun: boolean,
  silent?: boolean,
): string {
  if (isIgnored(dirPath, method.ignoredDirs)) {
    return dirPath;
  }

  try {
    const parentDir = path.dirname(dirPath);
    const currentFolder = path.basename(dirPath);
    const newFolder = casePreservingReplace(currentFolder, method.searchReplace);

    if (currentFolder !== newFolder) {
      const newPath = path.join(parentDir, newFolder);

      if (fs.existsSync(newPath)) {
        if (!silent) {
          console.warn(
            `⚠️ [${method.name}] Skipping folder rename: ${dirPath} → ${newPath} (target exists)`,
          );
        }
        return dirPath;
      }

      try {
        fs.accessSync(dirPath, fs.constants.R_OK);
      } catch (error) {
        if (!silent) {
          console.warn(`⚠️ [${method.name}] Cannot access directory for rename: ${dirPath}`);
        }
        return dirPath;
      }

      if (dryRun) {
        if (!silent) {
          console.log(`📂 [${method.name}] Would rename folder: ${dirPath} → ${newPath}`);
        }
        return dirPath;
      }

      fs.renameSync(dirPath, newPath);
      if (!silent) {
        console.log(`📂 [${method.name}] Renamed folder: ${dirPath} → ${newPath}`);
      }
      return newPath;
    }
  } catch (error) {
    if (!silent) {
      console.error(`❌ Error renaming folder ${dirPath}:`, error);
    }
  }

  return dirPath;
}

function walkAndRename(
  dirPath: string,
  method: MigrationMethod,
  dryRun: boolean,
  silent?: boolean,
): void {
  if (isIgnored(dirPath, method.ignoredDirs)) {
    return;
  }

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        const newDirPath = renameFolderIfNeeded(fullPath, method, dryRun, silent);
        walkAndRename(newDirPath, method, dryRun, silent);
      } else {
        processFile(fullPath, method, dryRun, silent);
      }
    }
  } catch (error) {
    if (!silent) {
      console.error(`❌ Error walking directory ${dirPath}:`, error);
    }
  }
}

async function executeAllMethods(
  methods: MigrationMethod[],
  dryRun: boolean,
  silent?: boolean,
): Promise<void> {
  for (const method of methods) {
    await executeMethod(method, dryRun, silent);
  }
}

async function executeMethod(
  method: MigrationMethod,
  dryRun: boolean,
  silent?: boolean,
): Promise<void> {
  const startDir = process.cwd();

  if (!silent) {
    console.log(`🚀 Executing method: ${method.name}`);
  }

  walkAndRename(startDir, method, dryRun, silent);
}
