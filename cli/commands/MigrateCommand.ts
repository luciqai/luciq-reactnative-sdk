import { Command, Option } from 'commander';
// @ts-ignore
import { migrate, MigrateOptions } from '../upload';

/**
 * This script performs migration operations on the codebase.
 * Usage: node migrate.js [--dry-run]
 */

export const MigrateCommand = new Command();

MigrateCommand.name('migrate')
  .addOption(
    new Option('--dry-run', 'Show what would be changed without making actual changes').default(
      false,
    ),
  )
  .addOption(
    new Option('--config <path>', 'Path to custom migration configuration file').default(undefined),
  )
  .addOption(new Option('--silent', 'Run migration silently without console output').default(false))
  .action(function (this: Command) {
    const options = this.opts<MigrateOptions>();
    migrate(options);
  })
  .showHelpAfterError();
