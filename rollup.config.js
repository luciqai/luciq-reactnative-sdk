import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import cleanup from 'rollup-plugin-cleanup';
import shebang from 'rollup-plugin-preserve-shebang';
import { copyFileSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';

// Custom copy function to replace rollup-plugin-copy
function copyFiles(src, dest) {
  return {
    name: 'copy-files',
    generateBundle() {
      function copyRecursive(sourcePath, destPath) {
        const srcStat = statSync(sourcePath);
        if (srcStat.isDirectory()) {
          mkdirSync(destPath, { recursive: true });
          const files = readdirSync(sourcePath);
          for (const file of files) {
            copyRecursive(join(sourcePath, file), join(destPath, file));
          }
        } else {
          mkdirSync(dirname(destPath), { recursive: true });
          copyFileSync(sourcePath, destPath);
        }
      }
      copyRecursive(src, dest);
    },
  };
}

const commonPlugins = [
  shebang(),
  json(),
  nodeResolve({ preferBuiltins: true }),
  commonjs(),
  cleanup(),
];

/** @type import('rollup').RollupOptions */
export default [
  {
    input: ['cli/index.ts'],
    output: {
      dir: 'bin',
      format: 'cjs',
    },
    plugins: [
      ...commonPlugins,
      typescript({
        tsconfig: './tsconfig.cli.json',
        skipLibCheck: true,
        compilerOptions: {
          types: ['node'],
        },
      }),
      copyFiles('cli/config', 'bin/config'),
    ],
  },
  {
    input: ['plugin/src/index.ts'],
    output: {
      dir: 'plugin/build',
      format: 'cjs',
    },
    plugins: [
      ...commonPlugins,
      typescript({
        tsconfig: './plugin/tsconfig.json',
        skipLibCheck: true,
        compilerOptions: {
          types: ['node'],
        },
      }),
    ],
  },
  {
    input: ['cli/upload/index.ts'],
    output: {
      dir: 'upload',
      format: 'cjs',
    },
    plugins: [
      ...commonPlugins,
      typescript({
        tsconfig: './tsconfig.upload.json',
        skipLibCheck: true,
        compilerOptions: {
          types: ['node'],
        },
      }),
    ],
  },
];
