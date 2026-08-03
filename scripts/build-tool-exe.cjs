const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')

const rootDir = process.cwd()
const bundleDir = path.join(rootDir, 'dist-tool-bundle')
const outputDir = path.join(rootDir, 'dist-tools-exe')
const toolDir = path.join(rootDir, 'public', '3dtile')
const bundlePath = path.join(bundleDir, 'merge-update-tool.cjs')
const blobPath = path.join(outputDir, 'merge-update-tool.blob')
const seaConfigPath = path.join(outputDir, 'sea-config.json')
const exePath = path.join(outputDir, 'merge-update-tool.exe')
const postjectPath = path.join(rootDir, 'node_modules', '.bin', 'postject.cmd')

function assertFile(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${label} 不存在: ${filePath}`)
  }
}

function collectAssets(dir, prefix, result) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const sourcePath = path.join(dir, entry.name)
    const assetKey = `${prefix}/${entry.name}`.replace(/\\/g, '/')
    if (entry.isDirectory()) {
      collectAssets(sourcePath, assetKey, result)
    } else if (entry.isFile()) {
      result[assetKey] = sourcePath
    }
  }
}

assertFile(bundlePath, '工具 bundle')
assertFile(path.join(toolDir, '3dtile.exe'), '3dtile.exe')
assertFile(postjectPath, 'postject')

fs.mkdirSync(outputDir, { recursive: true })

const assets = {}
collectAssets(toolDir, '3dtile', assets)

fs.writeFileSync(
  seaConfigPath,
  JSON.stringify({
    main: bundlePath,
    output: blobPath,
    disableExperimentalSEAWarning: true,
    useSnapshot: false,
    useCodeCache: false,
    assets,
  }, null, 2),
  'utf-8',
)

execFileSync(process.execPath, ['--experimental-sea-config', seaConfigPath], {
  stdio: 'inherit',
})

fs.copyFileSync(process.execPath, exePath)

execFileSync(postjectPath, [
  exePath,
  'NODE_SEA_BLOB',
  blobPath,
  '--sentinel-fuse',
  'NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2',
  '--overwrite',
], {
  shell: true,
  stdio: 'inherit',
})

console.log(`已生成: ${exePath}`)
