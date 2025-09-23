#!/usr/bin/env node
import { Command } from 'commander';

import { uploadSourcemapsCommand } from './commands/UploadSourcemaps';
import { UploadSoFilesCommand } from './commands/UploadSoFiles';
import { uploadEasUpdatesSourcemapsCommand } from './commands/UploadEasUpdatesSourcemaps';
import { MigrateCommand } from './commands/MigrateCommand';

const program = new Command();

program
  .name('luciq')
  .version('1.0.0-beta1')
  .description('A CLI for uploading source maps to Luciq dashboard.')
  .usage('[command]')
  .addCommand(uploadSourcemapsCommand)
  .addCommand(UploadSoFilesCommand)
  .addCommand(uploadEasUpdatesSourcemapsCommand)
  .addCommand(MigrateCommand);

program.parse(process.argv);
