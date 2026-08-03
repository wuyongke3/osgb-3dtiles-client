const fs = require('node:fs')
const path = require('node:path')

const rootDir = process.cwd()
const distDir = path.join(rootDir, 'dist-tools')
const windowsPath = path.join(distDir, 'merge-update-tool.cmd')
const unixPath = path.join(distDir, 'merge-update-tool')

fs.mkdirSync(distDir, { recursive: true })

fs.writeFileSync(
  windowsPath,
  [
    '@echo off',
    'setlocal',
    'node "%~dp0service\\merge-update-tool.js" %*',
    'exit /b %ERRORLEVEL%',
    '',
  ].join('\r\n'),
  'utf-8',
)

fs.writeFileSync(
  unixPath,
  [
    '#!/usr/bin/env sh',
    'DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"',
    'exec node "$DIR/service/merge-update-tool.js" "$@"',
    '',
  ].join('\n'),
  'utf-8',
)

try {
  fs.chmodSync(unixPath, 0o755)
} catch {}
