import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'
import http from 'node:http'
import net from 'node:net'
import { spawn, type ChildProcess } from 'node:child_process'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ─── Environment paths ────────────────────────────────────────────────
process.env.APP_ROOT = path.join(__dirname, '../..')

export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

// ─── Platform checks ──────────────────────────────────────────────────
if (process.platform === 'win32' && os.release().startsWith('6.1')) app.disableHardwareAcceleration()
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

// ─── Get 3dtile.exe path ──────────────────────────────────────────────
function get3dtilePath(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, '3dtile', '3dtile.exe')
  }
  return path.join(process.env.APP_ROOT!, 'public', '3dtile', '3dtile.exe')
}

function get3dtileDir(): string {
  return path.dirname(get3dtilePath())
}

// ─── Metadata XML parsing ─────────────────────────────────────────────
interface MetadataInfo {
  srs: string | null
  srsOrigin: { x: number; y: number; z: number } | null
  version: string | null
}

interface OsgbMergeInfo {
  inputDir: string
  tempDir: string
  baseTileCount: number
  updateTileCount: number
  replacedTileCount: number
  addedTileCount: number
}

function parseMetadataXml(filePath: string): MetadataInfo | null {
  try {
    if (!fs.existsSync(filePath)) return null
    const content = fs.readFileSync(filePath, 'utf-8')

    const result: MetadataInfo = { srs: null, srsOrigin: null, version: null }

    const srsMatch = content.match(/<SRS>([^<]+)<\/SRS>/)
    if (srsMatch) result.srs = srsMatch[1].trim()

    const srsOriginMatch = content.match(/<SRSOrigin>([^<]+)<\/SRSOrigin>/)
    if (srsOriginMatch) {
      const parts = srsOriginMatch[1].trim().split(',').map(Number)
      if (parts.length >= 3) {
        // SRSOrigin format is typically: lat,lon,height or lon,lat,height
        // The converter expects x=lon, y=lat, so order depends on SRS
        result.srsOrigin = { x: parts[1] ?? 0, y: parts[0] ?? 0, z: parts[2] ?? 0 }
      }
    }

    const versionMatch = content.match(/<_version>([^<]+)<\/_version>/)
    if (versionMatch) result.version = versionMatch[1].trim()

    if (!result.srs && !result.srsOrigin && !result.version) return null
    return result
  } catch {
    return null
  }
}

function validateOsgbStructure(dirPath: string): { valid: boolean; message: string } {
  const dataDir = path.join(dirPath, 'Data')
  if (!fs.existsSync(dataDir) || !fs.statSync(dataDir).isDirectory()) {
    return { valid: false, message: '未找到 Data 子目录，请确认选择的目录包含 Data/ 文件夹' }
  }

  // Check if Data/ contains at least one tile subdirectory with matching .osgb file
  try {
    const entries = fs.readdirSync(dataDir)
    let tileCount = 0
    for (const entry of entries) {
      const tilePath = path.join(dataDir, entry)
      if (fs.statSync(tilePath).isDirectory()) {
        const osgbFile = path.join(tilePath, `${entry}.osgb`)
        if (fs.existsSync(osgbFile)) {
          tileCount++
        }
      }
    }
    if (tileCount === 0) {
      return { valid: true, message: '目录结构有效，但未检测到标准命名的 .osgb 文件（格式: Tile_xxx_xxx/Tile_xxx_xxx.osgb）' }
    }
    return { valid: true, message: `检测到 ${tileCount} 个瓦片目录，结构有效` }
  } catch {
    return { valid: false, message: '无法读取 Data 目录内容' }
  }
}

function sameMetadataValue(a: string | null, b: string | null): boolean {
  return !a || !b || a === b
}

function sameSrsOrigin(
  a: MetadataInfo['srsOrigin'],
  b: MetadataInfo['srsOrigin'],
): boolean {
  if (!a || !b) return true
  const tolerance = 1e-7
  return (
    Math.abs(a.x - b.x) <= tolerance &&
    Math.abs(a.y - b.y) <= tolerance &&
    Math.abs(a.z - b.z) <= tolerance
  )
}

function safeRemoveInside(rootDir: string, targetPath: string): void {
  const relative = path.relative(rootDir, targetPath)
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`拒绝删除临时目录之外的路径: ${targetPath}`)
  }
  removeTempEntry(targetPath)
}

function removeTempEntry(targetPath: string): void {
  if (!fs.existsSync(targetPath)) return
  const stat = fs.lstatSync(targetPath)
  if (stat.isSymbolicLink() || stat.isFile()) {
    fs.unlinkSync(targetPath)
    return
  }
  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(targetPath)) {
      removeTempEntry(path.join(targetPath, entry))
    }
    fs.rmdirSync(targetPath)
    return
  }
  fs.rmSync(targetPath, { force: true })
}

function linkOrCopyDirectory(sourcePath: string, targetPath: string): void {
  try {
    fs.symlinkSync(sourcePath, targetPath, 'junction')
  } catch {
    fs.cpSync(sourcePath, targetPath, { recursive: true })
  }
}

function copyOrLinkEntry(sourcePath: string, targetPath: string): void {
  const stat = fs.statSync(sourcePath)
  if (stat.isDirectory()) {
    linkOrCopyDirectory(sourcePath, targetPath)
  } else if (stat.isFile()) {
    fs.copyFileSync(sourcePath, targetPath)
  }
}

function listOsgbTileDirs(dataDir: string): string[] {
  return fs.readdirSync(dataDir).filter((entry) => {
    const tilePath = path.join(dataDir, entry)
    return fs.statSync(tilePath).isDirectory()
  })
}

function normalizeUpdateDirs(inputDir: string, updateDirs?: string[]): string[] {
  const normalizedInput = path.resolve(inputDir).toLowerCase()
  const seen = new Set<string>()
  const result: string[] = []

  for (const dir of updateDirs ?? []) {
    if (!dir) continue
    const resolved = path.resolve(dir)
    const key = resolved.toLowerCase()
    if (key === normalizedInput || seen.has(key)) continue
    seen.add(key)
    result.push(resolved)
  }

  return result
}

function assertCompatibleMetadata(baseDir: string, updateDir: string): void {
  const baseMetadata = parseMetadataXml(path.join(baseDir, 'metadata.xml'))
  const updateMetadata = parseMetadataXml(path.join(updateDir, 'metadata.xml'))
  if (!baseMetadata || !updateMetadata) return

  if (!sameMetadataValue(baseMetadata.srs, updateMetadata.srs)) {
    throw new Error(`小范围 OSGB 坐标系与大范围不一致: ${updateDir}`)
  }

  if (!sameSrsOrigin(baseMetadata.srsOrigin, updateMetadata.srsOrigin)) {
    throw new Error(`小范围 OSGB 原点与大范围不一致，第一版暂不支持直接合并: ${updateDir}`)
  }
}

function createMergedOsgbInput(inputDir: string, updateDirs: string[]): OsgbMergeInfo {
  const baseValidation = validateOsgbStructure(inputDir)
  if (!baseValidation.valid) {
    throw new Error(`大范围 OSGB 无效: ${baseValidation.message}`)
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'osgb-merge-'))
  const tempDataDir = path.join(tempDir, 'Data')
  fs.mkdirSync(tempDataDir, { recursive: true })

  try {
    for (const entry of fs.readdirSync(inputDir)) {
      if (entry.toLowerCase() === 'data') continue
      copyOrLinkEntry(path.join(inputDir, entry), path.join(tempDir, entry))
    }

    const baseDataDir = path.join(inputDir, 'Data')
    const baseTileDirs = listOsgbTileDirs(baseDataDir)
    for (const tileName of baseTileDirs) {
      linkOrCopyDirectory(path.join(baseDataDir, tileName), path.join(tempDataDir, tileName))
    }

    let updateTileCount = 0
    let replacedTileCount = 0
    let addedTileCount = 0

    for (const updateDir of updateDirs) {
      const updateValidation = validateOsgbStructure(updateDir)
      if (!updateValidation.valid) {
        throw new Error(`小范围 OSGB 无效: ${updateDir}，${updateValidation.message}`)
      }
      assertCompatibleMetadata(inputDir, updateDir)

      const updateDataDir = path.join(updateDir, 'Data')
      const updateTileDirs = listOsgbTileDirs(updateDataDir)
      for (const tileName of updateTileDirs) {
        const targetTileDir = path.join(tempDataDir, tileName)
        if (fs.existsSync(targetTileDir)) {
          safeRemoveInside(tempDir, targetTileDir)
          replacedTileCount++
        } else {
          addedTileCount++
        }
        linkOrCopyDirectory(path.join(updateDataDir, tileName), targetTileDir)
        updateTileCount++
      }
    }

    return {
      inputDir: tempDir,
      tempDir,
      baseTileCount: baseTileDirs.length,
      updateTileCount,
      replacedTileCount,
      addedTileCount,
    }
  } catch (err) {
    cleanupMergedOsgbInput(tempDir)
    throw err
  }
}

function cleanupMergedOsgbInput(tempDir: string | null): void {
  if (!tempDir) return
  try {
    removeTempEntry(tempDir)
  } catch {}
}

// ─── Conversion state ─────────────────────────────────────────────────
let conversionProcess: ChildProcess | null = null
let isCancelled = false

// ─── HTTP server for 3D Tiles preview ───────────────────────────────
let previewServer: http.Server | null = null
let previewPort = 0
let lastOutputDir = ''
let lastConfigX = 0
let lastConfigY = 0
let lastConfigOffset = 0

// MIME types for static file serving
const MIME_TYPES: Record<string, string> = {
  '.json': 'application/json',
  '.b3dm': 'application/octet-stream',
  '.i3dm': 'application/octet-stream',
  '.pnts': 'application/octet-stream',
  '.cmpt': 'application/octet-stream',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.bin': 'application/octet-stream',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.html': 'text/html',
  '.xml': 'application/xml',
  '.wasm': 'application/wasm',
  '.ktx2': 'image/ktx2',
  '.basis': 'application/octet-stream',
}

function findFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.unref()
    server.on('error', reject)
    server.listen(0, () => {
      const address = server.address()
      if (address && typeof address === 'object') {
        const port = address.port
        server.close(() => resolve(port))
      } else {
        reject(new Error('Failed to find free port'))
      }
    })
  })
}

function getCesiumPath(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'cesium')
  }
  return path.join(process.env.APP_ROOT!, 'public', 'cesium')
}

function resolveServedFile(rootDir: string, urlPath: string): string | null {
  const filePath = path.normalize(path.join(rootDir, urlPath))
  const relative = path.relative(rootDir, filePath)
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    return null
  }
  return filePath
}

function startStaticServer(serveDir: string, port: number): Promise<http.Server> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      // Handle CORS preflight
      if (req.method === 'OPTIONS') {
        res.writeHead(204, {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Range',
        })
        res.end()
        return
      }

      // Parse URL to separate pathname from query string
      const parsedUrl = new URL(req.url || '/', 'http://localhost')
      let urlPath = decodeURIComponent(parsedUrl.pathname)
      if (urlPath.includes('..')) {
        res.writeHead(403)
        res.end('Forbidden')
        return
      }

      // Default: serve tileset.json at root
      if (urlPath === '/' || urlPath === '') {
        urlPath = '/tileset.json'
      }

      const cesiumPrefix = '/cesium/'
      const serveRoot = urlPath.startsWith(cesiumPrefix) ? getCesiumPath() : serveDir
      const relativePath = urlPath.startsWith(cesiumPrefix)
        ? urlPath.slice(cesiumPrefix.length)
        : urlPath.slice(1)
      const filePath = resolveServedFile(serveRoot, relativePath)

      // Check file exists
      if (!filePath || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        res.writeHead(404)
        res.end('Not Found')
        return
      }

      const ext = path.extname(filePath).toLowerCase()
      const contentType = MIME_TYPES[ext] || 'application/octet-stream'

      // CORS headers for Cesium worker/asset loading
      res.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Range',
        'Cross-Origin-Resource-Policy': 'cross-origin',
      })

      // Stream the file
      const stream = fs.createReadStream(filePath)
      stream.on('error', () => {
        res.writeHead(500)
        res.end('Internal Error')
      })
      stream.pipe(res)
    })

    server.on('error', reject)
    server.listen(port, () => resolve(server))
  })
}

function stopStaticServer(): void {
  if (previewServer) {
    previewServer.close()
    previewServer = null
    previewPort = 0
  }
}

function getPreviewHtmlPath(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'cesium-preview.html')
  }
  return path.join(process.env.APP_ROOT!, 'public', 'cesium-preview.html')
}

// ─── Window management ────────────────────────────────────────────────
let win: BrowserWindow | null = null
const preload = path.join(__dirname, '../preload/index.mjs')
const indexHtml = path.join(RENDERER_DIST, 'index.html')

async function createWindow() {
  win = new BrowserWindow({
    title: '3DMine(osgb转3dtile工具)',
    icon: path.join(process.env.VITE_PUBLIC!, 'logo.png'),
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload,
    },
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
    win.webContents.openDevTools()
  } else {
    win.loadFile(indexHtml)
  }

  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  win = null
  if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
  if (win) {
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length) {
    BrowserWindow.getAllWindows()[0]?.focus()
  } else {
    createWindow()
  }
})

// ─── IPC Handlers ─────────────────────────────────────────────────────

// Select OSGB input directory
ipcMain.handle('select-osgb-dir', async () => {
  if (!win) return null
  const result = await dialog.showOpenDialog(win, {
    title: '选择 OSGB 数据目录',
    properties: ['openDirectory'],
    message: '请选择包含 Data/ 子目录和 metadata.xml 的 OSGB 数据根目录',
  })
  if (result.canceled || result.filePaths.length === 0) return null
  return result.filePaths[0]!
})

// Select output directory
ipcMain.handle('select-output-dir', async () => {
  if (!win) return null
  const result = await dialog.showOpenDialog(win, {
    title: '选择 3D Tiles 输出目录',
    properties: ['openDirectory', 'createDirectory'],
    message: '选择 3D Tiles 文件的输出目标目录',
  })
  if (result.canceled || result.filePaths.length === 0) return null
  return result.filePaths[0]!
})

// Read and parse metadata.xml
ipcMain.handle('read-metadata', async (_event, dirPath: string) => {
  const metadataPath = path.join(dirPath, 'metadata.xml')
  const exists = fs.existsSync(metadataPath)
  if (!exists) {
    return { found: false, data: null }
  }
  const data = parseMetadataXml(metadataPath)
  return { found: true, path: metadataPath, data }
})

// Validate OSGB directory structure
ipcMain.handle('validate-osgb-structure', async (_event, dirPath: string) => {
  return validateOsgbStructure(dirPath)
})

// Get default conversion config
ipcMain.handle('get-default-config', async () => {
  return {
    x: '',
    y: '',
    offset: 0,
    max_lvl: 20,
    pbr: false,
  }
})

// Start conversion
ipcMain.handle('start-conversion', async (event, params: {
  inputDir: string
  outputDir: string
  config: { x?: number | string; y?: number | string; offset?: number; max_lvl?: number; pbr?: boolean }
  updateDirs?: string[]
}) => {
  const { inputDir, outputDir, config } = params

  // Build config JSON
  const configObj: Record<string, unknown> = {}
  if (config.x !== '' && config.x !== undefined) configObj.x = Number(config.x)
  if (config.y !== '' && config.y !== undefined) configObj.y = Number(config.y)
  if (config.offset !== undefined) configObj.offset = Number(config.offset)
  configObj.max_lvl = config.max_lvl ?? 20
  configObj.pbr = config.pbr ?? false

  const configJson = JSON.stringify(configObj)
  const exePath = get3dtilePath()
  const exeDir = get3dtileDir()

  // Store for preview
  lastOutputDir = outputDir
  lastConfigX = configObj.x !== undefined ? Number(configObj.x) : 0
  lastConfigY = configObj.y !== undefined ? Number(configObj.y) : 0
  lastConfigOffset = Number(configObj.offset ?? 0)

  // Ensure the tool exists
  if (!fs.existsSync(exePath)) {
    return { success: false, error: `转换工具未找到: ${exePath}` }
  }

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  // Set GDAL_DATA environment variable so GDAL can find its data files
  const gdalDataPath = path.join(exeDir, 'gdal_data')

  isCancelled = false

  let conversionInputDir = inputDir
  let tempMergeDir: string | null = null
  const updateDirs = normalizeUpdateDirs(inputDir, params.updateDirs)

  if (updateDirs.length > 0) {
    try {
      event.sender.send('conversion-stdout', `开始合并 OSGB 更新目录，共 ${updateDirs.length} 个\n`)
      const mergeInfo = createMergedOsgbInput(inputDir, updateDirs)
      conversionInputDir = mergeInfo.inputDir
      tempMergeDir = mergeInfo.tempDir
      event.sender.send(
        'conversion-stdout',
        `OSGB 合并完成: 大范围瓦片 ${mergeInfo.baseTileCount} 个，更新瓦片 ${mergeInfo.updateTileCount} 个，替换 ${mergeInfo.replacedTileCount} 个，新增 ${mergeInfo.addedTileCount} 个\n`,
      )
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      event.sender.send('conversion-stderr', `OSGB 合并失败: ${message}`)
      event.sender.send('conversion-status', 'error')
      cleanupMergedOsgbInput(tempMergeDir)
      return { success: false, error: `OSGB 合并失败: ${message}` }
    }
  }

  return new Promise<{ success: boolean; error?: string }>((resolve) => {
    try {
      conversionProcess = spawn(exePath, [
        '-i', conversionInputDir,
        '-o', outputDir,
        '-f', 'osgb',
        '-c', configJson,
      ], {
        cwd: exeDir,
        env: {
          ...process.env,
          GDAL_DATA: gdalDataPath,
          PROJ_LIB: gdalDataPath,
        },
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
      })

      // Stream stdout
      conversionProcess.stdout?.on('data', (data: Buffer) => {
        const text = data.toString('utf-8')
        event.sender.send('conversion-stdout', text)
      })

      // Stream stderr
      conversionProcess.stderr?.on('data', (data: Buffer) => {
        const text = data.toString('utf-8')
        event.sender.send('conversion-stderr', text)
      })

      // Handle process exit
      conversionProcess.on('close', (code) => {
        conversionProcess = null
        cleanupMergedOsgbInput(tempMergeDir)
        if (isCancelled) {
          event.sender.send('conversion-status', 'cancelled')
          resolve({ success: false, error: '转换已取消' })
        } else if (code === 0) {
          event.sender.send('conversion-status', 'success')
          resolve({ success: true })
        } else {
          event.sender.send('conversion-status', 'error')
          resolve({ success: false, error: `转换进程异常退出，退出码: ${code}` })
        }
      })

      // Handle process error
      conversionProcess.on('error', (err) => {
        conversionProcess = null
        cleanupMergedOsgbInput(tempMergeDir)
        const message = err.message.includes('ENOENT')
          ? `无法启动转换工具: ${exePath}，请确认文件存在`
          : `启动转换进程失败: ${err.message}`
        event.sender.send('conversion-stderr', message)
        event.sender.send('conversion-status', 'error')
        resolve({ success: false, error: message })
      })

      event.sender.send('conversion-status', 'running')
    } catch (err: unknown) {
      cleanupMergedOsgbInput(tempMergeDir)
      const message = err instanceof Error ? err.message : String(err)
      event.sender.send('conversion-status', 'error')
      resolve({ success: false, error: `启动转换失败: ${message}` })
    }
  })
})

// Cancel conversion
ipcMain.handle('cancel-conversion', async () => {
  if (conversionProcess) {
    isCancelled = true
    conversionProcess.kill('SIGTERM')
    // Force kill after 3 seconds if still running
    setTimeout(() => {
      if (conversionProcess) {
        conversionProcess.kill('SIGKILL')
        conversionProcess = null
      }
    }, 3000)
    return true
  }
  return false
})

// Check tool exists
ipcMain.handle('check-tool', async () => {
  const exePath = get3dtilePath()
  return {
    exists: fs.existsSync(exePath),
    path: exePath,
  }
})

// Open output directory in file explorer
ipcMain.handle('open-output-dir', async (_event, dirPath: string) => {
  if (fs.existsSync(dirPath)) {
    shell.openPath(dirPath)
  }
})

// Start 3D Tiles preview with Cesium
ipcMain.handle('start-preview', async (event, params?: {
  outputDir?: string
  centerX?: number
  centerY?: number
  offset?: number
}) => {
  const outDir = params?.outputDir || lastOutputDir
  const cx = params?.centerX ?? lastConfigX
  const cy = params?.centerY ?? lastConfigY
  const heightOffset = params?.offset ?? lastConfigOffset

  if (!outDir) {
    return { success: false, error: '没有可预览的输出目录' }
  }

  const tilesetPath = path.join(outDir, 'tileset.json')
  if (!fs.existsSync(tilesetPath)) {
    return { success: false, error: `未找到 tileset.json: ${tilesetPath}` }
  }

  try {
    // Stop any existing preview server
    stopStaticServer()

    // Copy preview HTML into output dir so it's served via HTTP (not file://)
    const previewHtmlPath = getPreviewHtmlPath()
    if (!fs.existsSync(previewHtmlPath)) {
      return { success: false, error: `预览页面未找到: ${previewHtmlPath}` }
    }

    const destPreviewPath = path.join(outDir, 'preview.html')
    fs.copyFileSync(previewHtmlPath, destPreviewPath)

    // Start HTTP server on a free port (serves 3D tiles data + preview.html)
    const port = await findFreePort()
    previewServer = await startStaticServer(outDir, port)
    previewPort = port

    // Open preview window via HTTP so Cesium workers load correctly
    const previewUrl = `http://localhost:${port}/preview.html?url=tileset.json&x=${cx}&y=${cy}&h=${heightOffset}`

    const previewWin = new BrowserWindow({
      title: '3D Tiles 预览 - Cesium',
      width: 1400,
      height: 900,
      minWidth: 800,
      minHeight: 600,
      autoHideMenuBar: true,
      webPreferences: {
        webSecurity: true,
      },
    })

    await previewWin.loadURL(previewUrl)

    // Clean up server + temp preview.html when preview window closes
    previewWin.on('closed', () => {
      stopStaticServer()
      try { fs.unlinkSync(destPreviewPath) } catch {}
    })

    return { success: true, port, url: `http://localhost:${port}/tileset.json` }
  } catch (err: unknown) {
    stopStaticServer()
    const message = err instanceof Error ? err.message : String(err)
    return { success: false, error: `启动预览失败: ${message}` }
  }
})

// Stop preview server
ipcMain.handle('stop-preview', async () => {
  stopStaticServer()
  return true
})

// New window example
ipcMain.handle('open-win', (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  if (VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${VITE_DEV_SERVER_URL}#${arg}`)
  } else {
    childWindow.loadFile(indexHtml, { hash: arg })
  }
})
