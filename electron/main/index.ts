import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'
import http from 'node:http'
import net from 'node:net'
import { spawn, type ChildProcess } from 'node:child_process'
import { aggregateTiles } from './tileAggregator'
import { DatabaseSync } from 'node:sqlite'

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

function getDefaultOutputDir(inputDir: string): string {
  const resolvedInputDir = path.resolve(inputDir)
  return path.join(path.dirname(resolvedInputDir), `${path.basename(resolvedInputDir)}_3dtiles`)
}

// ─── Metadata XML parsing ─────────────────────────────────────────────
interface MetadataInfo {
  srs: string | null
  srsOrigin: { x: number; y: number; z: number } | null
  version: string | null
}

interface OsgbBoundingSphere {
  center: { x: number; y: number; z: number }
  radius: number
}

interface OsgbBounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
  minZ: number
  maxZ: number
}

interface OsgbTileDescriptor {
  name: string
  sourcePath: string
  rootFilePath: string | null
  bounds: OsgbBounds | null
}

interface ActiveMergeTile extends OsgbTileDescriptor {
  targetName: string
}

interface CoordinateDelta {
  x: number
  y: number
  z: number
}

interface EdgePruneOptions {
  edgePrecision: number
  removeOverlapRatio: number
  centerOverlapRatio: number
  edgeSeamRatio: number
}

interface OsgbMergeInfo {
  inputDir: string
  tempDir: string
  baseTileCount: number
  updateTileCount: number
  replacedTileCount: number
  addedTileCount: number
}

const PAGED_LOD_MARKER = Buffer.from('osg::PagedLOD')
const VEC3_ARRAY_MARKER = Buffer.from('osg::Vec3Array')
const DEFAULT_OUTPUT_TRANSPARENCY_OPACITY = 50

function isLikelyGeographicSrs(srs: string | null): boolean {
  return /EPSG\s*:\s*(4326|4490|4610|4269|4258)\b/i.test(srs ?? '')
}

function isCgcs2000GaussKrugerCm81(srs: string | null): boolean {
  return /EPSG\s*:\s*4536\b/i.test(srs ?? '')
}

function inverseCgcs2000GaussKrugerCm81(easting: number, northing: number): { x: number; y: number } {
  const semiMajorAxis = 6378137
  const inverseFlattening = 298.257222101
  const flattening = 1 / inverseFlattening
  const eccentricitySquared = 2 * flattening - flattening * flattening
  const secondEccentricitySquared = eccentricitySquared / (1 - eccentricitySquared)
  const centralMeridian = 81 * Math.PI / 180
  const falseEasting = 500000

  const x = easting - falseEasting
  const meridianArc = northing
  const e1 = (1 - Math.sqrt(1 - eccentricitySquared)) / (1 + Math.sqrt(1 - eccentricitySquared))
  const mu = meridianArc / (
    semiMajorAxis *
    (1 - eccentricitySquared / 4 - 3 * eccentricitySquared ** 2 / 64 - 5 * eccentricitySquared ** 3 / 256)
  )

  const footprintLatitude = (
    mu +
    (3 * e1 / 2 - 27 * e1 ** 3 / 32) * Math.sin(2 * mu) +
    (21 * e1 ** 2 / 16 - 55 * e1 ** 4 / 32) * Math.sin(4 * mu) +
    (151 * e1 ** 3 / 96) * Math.sin(6 * mu) +
    (1097 * e1 ** 4 / 512) * Math.sin(8 * mu)
  )

  const sinFp = Math.sin(footprintLatitude)
  const cosFp = Math.cos(footprintLatitude)
  const tanFp = Math.tan(footprintLatitude)
  const radiusPrimeVertical = semiMajorAxis / Math.sqrt(1 - eccentricitySquared * sinFp * sinFp)
  const radiusMeridian = (
    semiMajorAxis *
    (1 - eccentricitySquared) /
    (1 - eccentricitySquared * sinFp * sinFp) ** 1.5
  )
  const c1 = secondEccentricitySquared * cosFp * cosFp
  const t1 = tanFp * tanFp
  const d = x / radiusPrimeVertical

  const latitude = footprintLatitude - (
    radiusPrimeVertical * tanFp / radiusMeridian *
    (
      d ** 2 / 2 -
      (5 + 3 * t1 + 10 * c1 - 4 * c1 ** 2 - 9 * secondEccentricitySquared) * d ** 4 / 24 +
      (
        61 + 90 * t1 + 298 * c1 + 45 * t1 ** 2 -
        252 * secondEccentricitySquared - 3 * c1 ** 2
      ) * d ** 6 / 720
    )
  )
  const longitude = centralMeridian + (
    d -
    (1 + 2 * t1 + c1) * d ** 3 / 6 +
    (5 - 2 * c1 + 28 * t1 - 3 * c1 ** 2 + 8 * secondEccentricitySquared + 24 * t1 ** 2) * d ** 5 / 120
  ) / cosFp

  return {
    x: longitude * 180 / Math.PI,
    y: latitude * 180 / Math.PI,
  }
}

function getConversionCenterFromMetadata(metadata: MetadataInfo): { x: number; y: number } | null {
  const origin = metadata.srsOrigin
  if (!origin) return null

  if (isLikelyGeographicSrs(metadata.srs)) {
    return { x: origin.x, y: origin.y }
  }

  if (isCgcs2000GaussKrugerCm81(metadata.srs)) {
    return inverseCgcs2000GaussKrugerCm81(origin.x, origin.y)
  }

  return { x: origin.x, y: origin.y }
}

function parseSrsOrigin(parts: number[], srs: string | null): MetadataInfo['srsOrigin'] {
  if (parts.length < 3 || parts.some((part) => Number.isNaN(part))) return null

  if (
    isLikelyGeographicSrs(srs) &&
    Math.abs(parts[0]) <= 90 &&
    Math.abs(parts[1]) <= 180
  ) {
    return { x: parts[1], y: parts[0], z: parts[2] ?? 0 }
  }

  return { x: parts[0] ?? 0, y: parts[1] ?? 0, z: parts[2] ?? 0 }
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
      result.srsOrigin = parseSrsOrigin(parts, result.srs)
    }

    const versionMatch = content.match(/<_version>([^<]+)<\/_version>/)
    if (versionMatch) result.version = versionMatch[1].trim()

    if (!result.srs && !result.srsOrigin && !result.version) return null
    return result
  } catch {
    return null
  }
}

function getOsgbDataDir(dirPath: string): string {
  const directDataDir = path.join(dirPath, 'Data')
  if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
    return directDataDir
  }

  if (fs.existsSync(directDataDir) && fs.statSync(directDataDir).isDirectory()) {
    return directDataDir
  }

  const dataEntry = fs.readdirSync(dirPath, { withFileTypes: true }).find((entry) => (
    entry.isDirectory() && entry.name.toLowerCase() === 'data'
  ))
  return dataEntry ? path.join(dirPath, dataEntry.name) : directDataDir
}

function validateOsgbStructure(dirPath: string): { valid: boolean; message: string } {
  const dataDir = getOsgbDataDir(dirPath)
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
        if (findRootOsgbFile(tilePath, entry)) {
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

function getOriginDelta(baseDir: string, updateDir: string): CoordinateDelta | null {
  const baseMetadata = parseMetadataXml(path.join(baseDir, 'metadata.xml'))
  const updateMetadata = parseMetadataXml(path.join(updateDir, 'metadata.xml'))
  if (!baseMetadata?.srsOrigin || !updateMetadata?.srsOrigin) return null
  if (sameSrsOrigin(baseMetadata.srsOrigin, updateMetadata.srsOrigin)) return null

  return {
    x: updateMetadata.srsOrigin.x - baseMetadata.srsOrigin.x,
    y: updateMetadata.srsOrigin.y - baseMetadata.srsOrigin.y,
    z: updateMetadata.srsOrigin.z - baseMetadata.srsOrigin.z,
  }
}

function hasCoordinateDelta(delta: CoordinateDelta | null): delta is CoordinateDelta {
  return !!delta && (
    Math.abs(delta.x) > 1e-7 ||
    Math.abs(delta.y) > 1e-7 ||
    Math.abs(delta.z) > 1e-7
  )
}

function normalizeEdgePrecision(value: unknown): number {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return 85
  return Math.min(Math.max(numeric, 50), 98)
}

function buildEdgePruneOptions(edgePrecisionValue: unknown): EdgePruneOptions {
  const edgePrecision = normalizeEdgePrecision(edgePrecisionValue)
  const removeOverlapRatio = edgePrecision / 100
  return {
    edgePrecision,
    removeOverlapRatio,
    // Center-overlap threshold: if the update coverage contains the tile center
    // and covers at least 25-35% of it, remove the old tile content so updated
    // data is not hidden under stale base tiles. Lower than the edge precision
    // ratio on purpose (base tiles are usually larger than the update area).
    centerOverlapRatio: Math.max(removeOverlapRatio - 0.5, 0.25),
    // Edge stitching ratio: a non-leaf tile's stale content is removed when its
    // kept children cover this fraction of the part outside the update area.
    edgeSeamRatio: 0.95,
  }
}

function isReasonableOsgbSphere(sphere: OsgbBoundingSphere): boolean {
  const { center, radius } = sphere
  return (
    Number.isFinite(center.x) &&
    Number.isFinite(center.y) &&
    Number.isFinite(center.z) &&
    Number.isFinite(radius) &&
    Math.abs(center.x) + Math.abs(center.y) + Math.abs(center.z) > 0.01 &&
    Math.abs(center.x) <= 1_000_000 &&
    Math.abs(center.y) <= 1_000_000 &&
    Math.abs(center.z) <= 1_000_000 &&
    radius > 0.01 &&
    radius <= 1_000_000
  )
}

function readFirstPagedLodSphere(filePath: string): OsgbBoundingSphere | null {
  try {
    const buffer = fs.readFileSync(filePath)
    const markerOffset = buffer.indexOf(PAGED_LOD_MARKER)
    if (markerOffset < 0) return null

    const candidates: Array<{ relativeOffset: number; sphere: OsgbBoundingSphere }> = []
    for (let relativeOffset = 30; relativeOffset <= 90; relativeOffset++) {
      const offset = markerOffset + relativeOffset
      if (offset + 32 > buffer.length) continue

      const sphere = {
        center: {
          x: buffer.readDoubleLE(offset),
          y: buffer.readDoubleLE(offset + 8),
          z: buffer.readDoubleLE(offset + 16),
        },
        radius: buffer.readDoubleLE(offset + 24),
      }

      if (isReasonableOsgbSphere(sphere)) {
        candidates.push({ relativeOffset, sphere })
      }
    }

    candidates.sort((a, b) => b.relativeOffset - a.relativeOffset)
    return candidates[0]?.sphere ?? null
  } catch {
    return null
  }
}

function sphereToBounds(sphere: OsgbBoundingSphere): OsgbBounds {
  const { center, radius } = sphere
  return {
    minX: center.x - radius,
    maxX: center.x + radius,
    minY: center.y - radius,
    maxY: center.y + radius,
    minZ: center.z - radius,
    maxZ: center.z + radius,
  }
}

function translateSphere(
  sphere: OsgbBoundingSphere,
  origin: MetadataInfo['srsOrigin'],
): OsgbBoundingSphere {
  if (!origin) return sphere
  return {
    center: {
      x: sphere.center.x + origin.x,
      y: sphere.center.y + origin.y,
      z: sphere.center.z + origin.z,
    },
    radius: sphere.radius,
  }
}

function boundsContains(container: OsgbBounds, target: OsgbBounds): boolean {
  const tolerance = 0.001
  return (
    container.minX <= target.minX + tolerance &&
    container.maxX >= target.maxX - tolerance &&
    container.minY <= target.minY + tolerance &&
    container.maxY >= target.maxY - tolerance
  )
}

function boundsIntersects(container: OsgbBounds, target: OsgbBounds): boolean {
  const tolerance = 0.001
  return !(
    container.maxX < target.minX - tolerance ||
    container.minX > target.maxX + tolerance ||
    container.maxY < target.minY - tolerance ||
    container.minY > target.maxY + tolerance
  )
}

function findPagedLodSphereOffset(buffer: Buffer, markerOffset: number): number | null {
  const candidates: Array<{ relativeOffset: number }> = []
  for (let relativeOffset = 30; relativeOffset <= 90; relativeOffset++) {
    const offset = markerOffset + relativeOffset
    if (offset + 32 > buffer.length) continue

    const sphere = {
      center: {
        x: buffer.readDoubleLE(offset),
        y: buffer.readDoubleLE(offset + 8),
        z: buffer.readDoubleLE(offset + 16),
      },
      radius: buffer.readDoubleLE(offset + 24),
    }

    if (isReasonableOsgbSphere(sphere)) {
      candidates.push({ relativeOffset })
    }
  }

  candidates.sort((a, b) => b.relativeOffset - a.relativeOffset)
  return candidates[0] ? markerOffset + candidates[0].relativeOffset : null
}

function findVec3ArrayData(buffer: Buffer, markerOffset: number): { offset: number; count: number } | null {
  const candidates: Array<{ relativeOffset: number; offset: number; count: number }> = []

  for (let relativeOffset = VEC3_ARRAY_MARKER.length; relativeOffset <= 90; relativeOffset++) {
    const countOffset = markerOffset + relativeOffset
    if (countOffset + 4 > buffer.length) continue

    const count = buffer.readUInt32LE(countOffset)
    const dataOffset = countOffset + 4
    if (count <= 0 || count > 2_000_000 || dataOffset + count * 12 > buffer.length) continue

    const sampleCount = Math.min(count, 5)
    let nonZeroSamples = 0
    let validSamples = 0
    let unitVectorSamples = 0

    for (let index = 0; index < sampleCount; index++) {
      const offset = dataOffset + index * 12
      const x = buffer.readFloatLE(offset)
      const y = buffer.readFloatLE(offset + 4)
      const z = buffer.readFloatLE(offset + 8)
      const valid = (
        Number.isFinite(x) &&
        Number.isFinite(y) &&
        Number.isFinite(z) &&
        Math.abs(x) <= 1_000_000 &&
        Math.abs(y) <= 1_000_000 &&
        Math.abs(z) <= 1_000_000
      )
      if (!valid) break
      validSamples++
      if (Math.abs(x) + Math.abs(y) + Math.abs(z) > 0.01) {
        nonZeroSamples++
      }
      const length = Math.sqrt(x * x + y * y + z * z)
      if (length >= 0.5 && length <= 1.5) {
        unitVectorSamples++
      }
    }

    if (
      validSamples === sampleCount &&
      nonZeroSamples > 0 &&
      unitVectorSamples < sampleCount
    ) {
      candidates.push({ relativeOffset, offset: dataOffset, count })
    }
  }

  candidates.sort((a, b) => b.relativeOffset - a.relativeOffset)
  return candidates[0] ?? null
}

function translateOsgbBuffer(buffer: Buffer, delta: CoordinateDelta): boolean {
  let changed = false
  let markerOffset = 0
  const vec3Arrays: Array<{ offset: number; count: number }> = []

  while ((markerOffset = buffer.indexOf(VEC3_ARRAY_MARKER, markerOffset)) >= 0) {
    const vec3Array = findVec3ArrayData(buffer, markerOffset)
    if (vec3Array) {
      vec3Arrays.push(vec3Array)
    }
    markerOffset += VEC3_ARRAY_MARKER.length
  }

  if (vec3Arrays.length === 0) {
    return false
  }

  markerOffset = 0
  while ((markerOffset = buffer.indexOf(PAGED_LOD_MARKER, markerOffset)) >= 0) {
    const sphereOffset = findPagedLodSphereOffset(buffer, markerOffset)
    if (sphereOffset !== null) {
      buffer.writeDoubleLE(buffer.readDoubleLE(sphereOffset) + delta.x, sphereOffset)
      buffer.writeDoubleLE(buffer.readDoubleLE(sphereOffset + 8) + delta.y, sphereOffset + 8)
      buffer.writeDoubleLE(buffer.readDoubleLE(sphereOffset + 16) + delta.z, sphereOffset + 16)
      changed = true
    }
    markerOffset += PAGED_LOD_MARKER.length
  }

  for (const vec3Array of vec3Arrays) {
    for (let index = 0; index < vec3Array.count; index++) {
      const offset = vec3Array.offset + index * 12
      buffer.writeFloatLE(buffer.readFloatLE(offset) + delta.x, offset)
      buffer.writeFloatLE(buffer.readFloatLE(offset + 4) + delta.y, offset + 4)
      buffer.writeFloatLE(buffer.readFloatLE(offset + 8) + delta.z, offset + 8)
    }
    changed = true
  }

  return changed
}

function translateOsgbFile(filePath: string, delta: CoordinateDelta): void {
  const buffer = fs.readFileSync(filePath)
  if (translateOsgbBuffer(buffer, delta)) {
    fs.writeFileSync(filePath, buffer)
  }
}

function translateOsgbFilesInDirectory(dirPath: string, delta: CoordinateDelta): void {
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const entryPath = path.join(dirPath, entry.name)
    if (entry.isDirectory()) {
      translateOsgbFilesInDirectory(entryPath, delta)
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.osgb')) {
      translateOsgbFile(entryPath, delta)
    }
  }
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

function pathContains(parentPath: string, childPath: string): boolean {
  const relative = path.relative(parentPath, childPath)
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))
}

function assertSafeOutputDirectory(inputDir: string, outputDir: string, updateDirs: string[]): void {
  const resolvedOutput = path.resolve(outputDir)
  const parsedOutput = path.parse(resolvedOutput)
  if (resolvedOutput === parsedOutput.root) {
    throw new Error('输出目录不能是磁盘根目录')
  }

  const protectedDirs = [inputDir, ...updateDirs].map((dir) => path.resolve(dir))
  for (const protectedDir of protectedDirs) {
    if (pathContains(resolvedOutput, protectedDir) || pathContains(protectedDir, resolvedOutput)) {
      throw new Error(`输出目录不能是输入目录、小范围目录，或它们的上级/子级目录: ${resolvedOutput}`)
    }
  }

  const appRoot = process.env.APP_ROOT ? path.resolve(process.env.APP_ROOT) : null
  if (appRoot && resolvedOutput === appRoot) {
    throw new Error('输出目录不能是当前程序工程目录')
  }
}

function clearOutputDirectory(outputDir: string): void {
  fs.mkdirSync(outputDir, { recursive: true })
  for (const entry of fs.readdirSync(outputDir)) {
    safeRemoveInside(outputDir, path.join(outputDir, entry))
  }
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

function findRootOsgbFile(tilePath: string, tileName: string): string | null {
  const exactFile = path.join(tilePath, `${tileName}.osgb`)
  if (fs.existsSync(exactFile) && fs.statSync(exactFile).isFile()) return exactFile

  const files = fs.readdirSync(tilePath, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.osgb'))
    .map((entry) => entry.name)

  const rootCandidates = files.filter((file) => !/_L\d+_/i.test(file))
  const preferred = rootCandidates.find((file) => (
    path.basename(file, path.extname(file)).toLowerCase() === tileName.toLowerCase()
  ))
  if (preferred) return path.join(tilePath, preferred)
  if (rootCandidates.length === 1) return path.join(tilePath, rootCandidates[0])
  if (rootCandidates.length > 1) return path.join(tilePath, rootCandidates.sort()[0])
  return files.length > 0 ? path.join(tilePath, files.sort()[0]) : null
}

function buildOsgbTileDescriptors(rootDir: string): { dataDir: string; tiles: OsgbTileDescriptor[] } {
  const dataDir = getOsgbDataDir(rootDir)
  const metadata = parseMetadataXml(path.join(rootDir, 'metadata.xml'))
  const tiles = listOsgbTileDirs(dataDir).map((name) => {
    const sourcePath = path.join(dataDir, name)
    const rootFilePath = findRootOsgbFile(sourcePath, name)
    const localSphere = rootFilePath ? readFirstPagedLodSphere(rootFilePath) : null
    const worldSphere = localSphere ? translateSphere(localSphere, metadata?.srsOrigin ?? null) : null
    return {
      name,
      sourcePath,
      rootFilePath,
      bounds: worldSphere ? sphereToBounds(worldSphere) : null,
    }
  })

  return { dataDir, tiles }
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

  // Different SRSOrigin is handled by translating copied update OSGB files into
  // the base origin before conversion.
}

function findReplaceableTiles(
  activeTiles: Map<string, ActiveMergeTile>,
  updateTile: OsgbTileDescriptor,
): ActiveMergeTile[] {
  if (!updateTile.bounds) {
    const sameName = activeTiles.get(updateTile.name)
    return sameName ? [sameName] : []
  }

  const matches = Array.from(activeTiles.values()).filter((activeTile) => (
    activeTile.bounds
      ? boundsContains(updateTile.bounds!, activeTile.bounds)
      : activeTile.targetName.toLowerCase() === updateTile.name.toLowerCase()
  ))

  if (matches.length > 0) return matches

  const sameName = activeTiles.get(updateTile.name)
  return sameName ? [sameName] : []
}

function assertMergedDataReadable(dataDir: string): void {
  const missingRoots: string[] = []
  for (const tileName of listOsgbTileDirs(dataDir)) {
    const tilePath = path.join(dataDir, tileName)
    if (!findRootOsgbFile(tilePath, tileName)) {
      missingRoots.push(tileName)
    }
  }

  if (missingRoots.length > 0) {
    throw new Error(`合并后存在无法读取根 OSGB 的瓦片目录: ${missingRoots.slice(0, 8).join(', ')}`)
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
      if (entry.toLowerCase().endsWith('.osgb')) continue
      copyOrLinkEntry(path.join(inputDir, entry), path.join(tempDir, entry))
    }

    const baseTiles = buildOsgbTileDescriptors(inputDir).tiles
    const activeTiles = new Map<string, ActiveMergeTile>()
    for (const tile of baseTiles) {
      linkOrCopyDirectory(tile.sourcePath, path.join(tempDataDir, tile.name))
      activeTiles.set(tile.name, { ...tile, targetName: tile.name })
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

      const originDelta = getOriginDelta(inputDir, updateDir)
      const updateTiles = buildOsgbTileDescriptors(updateDir).tiles
      for (const updateTile of updateTiles) {
        const replaceableTiles = findReplaceableTiles(activeTiles, updateTile)

        for (const replaceableTile of replaceableTiles) {
          const replaceableTargetDir = path.join(tempDataDir, replaceableTile.targetName)
          if (fs.existsSync(replaceableTargetDir)) {
            safeRemoveInside(tempDir, replaceableTargetDir)
          }
          activeTiles.delete(replaceableTile.targetName)
          replacedTileCount++
        }

        const existingTarget = activeTiles.get(updateTile.name)
        const targetTileDir = path.join(tempDataDir, updateTile.name)
        if (existingTarget) {
          if (fs.existsSync(targetTileDir)) {
            safeRemoveInside(tempDir, targetTileDir)
          }
          activeTiles.delete(existingTarget.targetName)
          replacedTileCount++
        }

        if (replaceableTiles.length === 0 && !existingTarget) {
          addedTileCount++
        }

        if (fs.existsSync(targetTileDir)) {
          safeRemoveInside(tempDir, targetTileDir)
        }
        if (hasCoordinateDelta(originDelta)) {
          fs.cpSync(updateTile.sourcePath, targetTileDir, { recursive: true })
          translateOsgbFilesInDirectory(targetTileDir, originDelta)
        } else {
          linkOrCopyDirectory(updateTile.sourcePath, targetTileDir)
        }
        activeTiles.set(updateTile.name, { ...updateTile, targetName: updateTile.name })
        updateTileCount++
      }
    }

    assertMergedDataReadable(tempDataDir)

    return {
      inputDir: tempDir,
      tempDir,
      baseTileCount: baseTiles.length,
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
type TilesetJson = {
  asset?: Record<string, unknown>
  geometricError?: number
  root?: TileJson
}

type TileJson = {
  boundingVolume?: {
    box?: number[]
    sphere?: number[]
    region?: number[]
  }
  geometricError?: number
  refine?: string
  transform?: number[]
  content?: {
    uri?: string
    url?: string
    boundingVolume?: TileJson['boundingVolume']
    [key: string]: unknown
  }
  children?: TileJson[]
  [key: string]: unknown
}

function readJsonFile<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T
}

function writeJsonFile(filePath: string, data: unknown): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

function padBuffer(buffer: Buffer, paddingByte: number): Buffer {
  const paddingLength = (4 - (buffer.length % 4)) % 4
  if (paddingLength === 0) return buffer
  return Buffer.concat([buffer, Buffer.alloc(paddingLength, paddingByte)])
}

function parseGltfJson(buffer: Buffer): Record<string, unknown> {
  const text = buffer.toString('utf-8').replace(/[\u0000\s]+$/g, '')
  return JSON.parse(text) as Record<string, unknown>
}

function normalizeOutputOpacity(value: unknown): number {
  if (value === true) return 100
  if (value === false || value === null) return 100
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return 100
  return Math.min(Math.max(numeric, 1), 100)
}

function shouldEnableOutputTransparency(config: ConversionConfigParams): boolean {
  return config.output_transparency === true || normalizeOutputOpacity(config.output_opacity) < 100
}

// null: add transparency attributes only (BLEND + baseColorFactor), alpha stays 1 (opaque), later controlled by preview slider.
// number: target alpha ratio (explicit output_opacity < 100 writes semi-transparent alpha).
function getOutputOpacityRatio(config: ConversionConfigParams): number | null {
  if (config.output_transparency === true) return null
  const opacity = normalizeOutputOpacity(config.output_opacity)
  return opacity < 100 ? opacity / 100 : null
}

function applyGltfOpacity(gltf: Record<string, unknown>, opacityRatio: number | null): boolean {
  const materials = Array.isArray(gltf.materials)
    ? gltf.materials as Array<Record<string, unknown>>
    : []
  const meshes = Array.isArray(gltf.meshes)
    ? gltf.meshes as Array<Record<string, unknown>>
    : []

  if (materials.length === 0 && meshes.length === 0) return false

  for (const material of materials) {
    const pbr = material.pbrMetallicRoughness && typeof material.pbrMetallicRoughness === 'object'
      ? material.pbrMetallicRoughness as Record<string, unknown>
      : {}
    const factor = Array.isArray(pbr.baseColorFactor)
      ? [...pbr.baseColorFactor as number[]]
      : [1, 1, 1, 1]

    while (factor.length < 4) factor.push(1)
    if (opacityRatio !== null) {
      factor[3] = Math.min(Math.max(Number(factor[3] ?? 1), 0), 1) * opacityRatio
      // BLEND is only enabled when an explicit semi-transparent alpha is written.
      // Keeping the material OPAQUE when alpha stays 1 avoids the translucent
      // rendering pass (no depth writes) that causes visible gaps between tiles.
      material.alphaMode = 'BLEND'
    }
    pbr.baseColorFactor = factor
    material.pbrMetallicRoughness = pbr
  }

  if (opacityRatio !== null) {
    let defaultTransparentMaterialIndex: number | null = null
    for (const mesh of meshes) {
      const primitives = Array.isArray(mesh.primitives)
        ? mesh.primitives as Array<Record<string, unknown>>
        : []

      for (const primitive of primitives) {
        if (primitive.material !== undefined) continue
        if (defaultTransparentMaterialIndex === null) {
          defaultTransparentMaterialIndex = materials.length
          materials.push({
            pbrMetallicRoughness: { baseColorFactor: [1, 1, 1, opacityRatio] },
            alphaMode: 'BLEND',
          })
        }
        primitive.material = defaultTransparentMaterialIndex
      }
    }
  }

  gltf.materials = materials
  return true
}

function rewriteGlbOpacity(buffer: Buffer, opacityRatio: number | null): Buffer | null {
  if (buffer.length < 20 || buffer.toString('ascii', 0, 4) !== 'glTF') return null

  const version = buffer.readUInt32LE(4)
  if (version === 2) {
    const chunks: Array<{ type: number; data: Buffer }> = []
    let jsonChunkIndex = -1
    let offset = 12

    while (offset + 8 <= buffer.length) {
      const chunkLength = buffer.readUInt32LE(offset)
      const chunkType = buffer.readUInt32LE(offset + 4)
      const dataStart = offset + 8
      const dataEnd = dataStart + chunkLength
      if (dataEnd > buffer.length) return null

      if (chunkType === 0x4E4F534A && jsonChunkIndex === -1) {
        jsonChunkIndex = chunks.length
      }
      chunks.push({ type: chunkType, data: buffer.subarray(dataStart, dataEnd) })
      offset = dataEnd
    }

    if (jsonChunkIndex < 0) return null
    const gltf = parseGltfJson(chunks[jsonChunkIndex]!.data)
    if (!applyGltfOpacity(gltf, opacityRatio)) return null

    chunks[jsonChunkIndex] = {
      type: 0x4E4F534A,
      data: padBuffer(Buffer.from(JSON.stringify(gltf), 'utf-8'), 0x20),
    }

    const totalLength = 12 + chunks.reduce((total, chunk) => total + 8 + chunk.data.length, 0)
    const result = Buffer.alloc(totalLength)
    result.write('glTF', 0, 'ascii')
    result.writeUInt32LE(2, 4)
    result.writeUInt32LE(totalLength, 8)

    let writeOffset = 12
    for (const chunk of chunks) {
      result.writeUInt32LE(chunk.data.length, writeOffset)
      result.writeUInt32LE(chunk.type, writeOffset + 4)
      chunk.data.copy(result, writeOffset + 8)
      writeOffset += 8 + chunk.data.length
    }
    return result
  }

  if (version === 1) {
    const contentLength = buffer.readUInt32LE(12)
    const contentFormat = buffer.readUInt32LE(16)
    const contentStart = 20
    const contentEnd = contentStart + contentLength
    if (contentFormat !== 0 || contentEnd > buffer.length) return null

    const gltf = parseGltfJson(buffer.subarray(contentStart, contentEnd))
    if (!applyGltfOpacity(gltf, opacityRatio)) return null

    const jsonBuffer = padBuffer(Buffer.from(JSON.stringify(gltf), 'utf-8'), 0x20)
    const bodyBuffer = buffer.subarray(contentEnd)
    const totalLength = 20 + jsonBuffer.length + bodyBuffer.length
    const result = Buffer.alloc(totalLength)
    result.write('glTF', 0, 'ascii')
    result.writeUInt32LE(1, 4)
    result.writeUInt32LE(totalLength, 8)
    result.writeUInt32LE(jsonBuffer.length, 12)
    result.writeUInt32LE(0, 16)
    jsonBuffer.copy(result, 20)
    bodyBuffer.copy(result, 20 + jsonBuffer.length)
    return result
  }

  return null
}

function getB3dmGlbOffset(buffer: Buffer): number | null {
  if (buffer.length < 28 || buffer.toString('ascii', 0, 4) !== 'b3dm') return null
  const featureTableJsonLength = buffer.readUInt32LE(12)
  const featureTableBinaryLength = buffer.readUInt32LE(16)
  const batchTableJsonLength = buffer.readUInt32LE(20)
  const batchTableBinaryLength = buffer.readUInt32LE(24)
  const glbOffset = 28 + featureTableJsonLength + featureTableBinaryLength + batchTableJsonLength + batchTableBinaryLength
  if (glbOffset + 12 > buffer.length || buffer.toString('ascii', glbOffset, glbOffset + 4) !== 'glTF') {
    return null
  }
  return glbOffset
}

function rewriteB3dmOpacity(buffer: Buffer, opacityRatio: number | null): Buffer | null {
  const glbOffset = getB3dmGlbOffset(buffer)
  if (glbOffset === null) return null

  const rewrittenGlb = rewriteGlbOpacity(buffer.subarray(glbOffset), opacityRatio)
  if (!rewrittenGlb) return null

  const result = Buffer.concat([buffer.subarray(0, glbOffset), rewrittenGlb])
  result.writeUInt32LE(result.length, 8)
  return result
}

function applyOutputTransparency(outputDir: string, config: ConversionConfigParams): {
  enabled: boolean
  opacity: number
  processed: number
  skipped: number
} {
  const opacity = config.output_transparency === true ? 100 : normalizeOutputOpacity(config.output_opacity)
  if (!shouldEnableOutputTransparency(config)) return { enabled: false, opacity, processed: 0, skipped: 0 }
  const opacityRatio = getOutputOpacityRatio(config)

  let processed = 0
  let skipped = 0

  const visit = (dirPath: string): void => {
    for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
      const entryPath = path.join(dirPath, entry.name)
      if (entry.isDirectory()) {
        visit(entryPath)
        continue
      }
      if (!entry.isFile()) continue

      const lowerName = entry.name.toLowerCase()
      if (!lowerName.endsWith('.b3dm') && !lowerName.endsWith('.glb')) continue

      try {
        const source = fs.readFileSync(entryPath)
        const rewritten = lowerName.endsWith('.b3dm')
          ? rewriteB3dmOpacity(source, opacityRatio)
          : rewriteGlbOpacity(source, opacityRatio)
        if (rewritten) {
          fs.writeFileSync(entryPath, rewritten)
          processed++
        } else {
          skipped++
        }
      } catch {
        skipped++
      }
    }
  }

  visit(outputDir)
  return { enabled: true, opacity, processed, skipped }
}

function buildConversionConfig(
  config: { x?: number | string; y?: number | string; offset?: number; max_lvl?: number; pbr?: boolean },
  metadataDir?: string,
): Record<string, unknown> {
  const configObj: Record<string, unknown> = {}
  const metadata = metadataDir ? parseMetadataXml(path.join(metadataDir, 'metadata.xml')) : null
  const userHeightOffset = config.offset !== undefined ? Number(config.offset) : 0

  const conversionCenter = metadata ? getConversionCenterFromMetadata(metadata) : null

  if (metadata?.srsOrigin && conversionCenter) {
    configObj.x = conversionCenter.x
    configObj.y = conversionCenter.y
    configObj.offset = metadata.srsOrigin.z + (Number.isFinite(userHeightOffset) ? userHeightOffset : 0)
  } else {
    if (config.x !== '' && config.x !== undefined) configObj.x = Number(config.x)
    if (config.y !== '' && config.y !== undefined) configObj.y = Number(config.y)
    if (config.offset !== undefined) configObj.offset = Number(config.offset)
  }

  configObj.max_lvl = config.max_lvl ?? 20
  configObj.pbr = config.pbr ?? false
  return configObj
}

function getConfigOrigin(configObj: Record<string, unknown>): CoordinateDelta | null {
  const x = Number(configObj.x)
  const y = Number(configObj.y)
  const z = Number(configObj.offset ?? 0)
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null
  return { x, y, z: Number.isFinite(z) ? z : 0 }
}

function getCoverageOrigin(metadataDir: string, configObj: Record<string, unknown>): CoordinateDelta | null {
  const metadata = parseMetadataXml(path.join(metadataDir, 'metadata.xml'))
  if (metadata?.srsOrigin) return metadata.srsOrigin
  return getConfigOrigin(configObj)
}

function getTileContentUri(tile: TileJson): string | null {
  return tile.content?.uri ?? tile.content?.url ?? null
}

function boundsFromPoints(points: Array<[number, number, number]>): OsgbBounds | null {
  if (points.length === 0) return null
  const min = [Infinity, Infinity, Infinity]
  const max = [-Infinity, -Infinity, -Infinity]
  for (const point of points) {
    for (let index = 0; index < 3; index++) {
      min[index] = Math.min(min[index], point[index])
      max[index] = Math.max(max[index], point[index])
    }
  }
  return {
    minX: min[0],
    maxX: max[0],
    minY: min[1],
    maxY: max[1],
    minZ: min[2],
    maxZ: max[2],
  }
}

function isTransformMatrix(transform: number[] | undefined): transform is number[] {
  return Array.isArray(transform) && transform.length >= 16
}

function getCombinedTransform(parentTransform: number[] | undefined, tile: TileJson): number[] | undefined {
  if (!isTransformMatrix(tile.transform)) return parentTransform
  return parentTransform ? multiplyTransforms(parentTransform, tile.transform) : tile.transform
}

function getMaxTransformScale(transform: number[] | undefined): number {
  if (!isTransformMatrix(transform)) return 1
  const xScale = Math.hypot(transform[0], transform[1], transform[2])
  const yScale = Math.hypot(transform[4], transform[5], transform[6])
  const zScale = Math.hypot(transform[8], transform[9], transform[10])
  return Math.max(xScale, yScale, zScale, 1e-12)
}

function getBoxBounds(box: number[], transform?: number[]): OsgbBounds | null {
  if (box.length < 12) return null
  const cx = box[0]
  const cy = box[1]
  const cz = box[2]
  const corners: Array<[number, number, number]> = []
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      for (const sz of [-1, 1]) {
        corners.push(transformPoint(transform, [
          cx + sx * box[3] + sy * box[6] + sz * box[9],
          cy + sx * box[4] + sy * box[7] + sz * box[10],
          cz + sx * box[5] + sy * box[8] + sz * box[11],
        ]))
      }
    }
  }
  return boundsFromPoints(corners)
}

function getTileBounds(tile: TileJson, transform?: number[]): OsgbBounds | null {
  const volume = tile.boundingVolume ?? tile.content?.boundingVolume
  const box = volume?.box
  if (box) return getBoxBounds(box, transform)
  const sphere = volume?.sphere
  if (sphere && sphere.length >= 4) {
    const [x, y, z, r] = sphere
    const center = transformPoint(transform, [x, y, z])
    const radius = r * getMaxTransformScale(transform)
    return {
      minX: center[0] - radius,
      maxX: center[0] + radius,
      minY: center[1] - radius,
      maxY: center[1] + radius,
      minZ: center[2] - radius,
      maxZ: center[2] + radius,
    }
  }
  return null
}

function translateBounds(bounds: OsgbBounds, delta: CoordinateDelta): OsgbBounds {
  return {
    minX: bounds.minX + delta.x,
    maxX: bounds.maxX + delta.x,
    minY: bounds.minY + delta.y,
    maxY: bounds.maxY + delta.y,
    minZ: bounds.minZ + delta.z,
    maxZ: bounds.maxZ + delta.z,
  }
}

function coverageContains(bounds: OsgbBounds, coverage: OsgbBounds[]): boolean {
  return coverage.some((cover) => boundsContains(cover, bounds))
}

function coverageIntersects(bounds: OsgbBounds, coverage: OsgbBounds[]): boolean {
  return coverage.some((cover) => boundsIntersects(cover, bounds))
}

function coverageContainsCenter(bounds: OsgbBounds, coverage: OsgbBounds[]): boolean {
  const centerX = (bounds.minX + bounds.maxX) / 2
  const centerY = (bounds.minY + bounds.maxY) / 2
  return coverage.some((cover) => (
    centerX >= cover.minX &&
    centerX <= cover.maxX &&
    centerY >= cover.minY &&
    centerY <= cover.maxY
  ))
}

function boundsArea(bounds: OsgbBounds): number {
  return Math.max(bounds.maxX - bounds.minX, 0) * Math.max(bounds.maxY - bounds.minY, 0)
}

function unionIntersectionArea(bounds: OsgbBounds, coverage: OsgbBounds[]): number {
  const intersections = coverage
    .filter((cover) => boundsIntersects(cover, bounds))
    .map((cover) => ({
      minX: Math.max(bounds.minX, cover.minX),
      maxX: Math.min(bounds.maxX, cover.maxX),
      minY: Math.max(bounds.minY, cover.minY),
      maxY: Math.min(bounds.maxY, cover.maxY),
    }))
    .filter((rect) => rect.maxX > rect.minX && rect.maxY > rect.minY)

  if (intersections.length === 0) return 0

  const xStops = Array.from(new Set(intersections.flatMap((rect) => [rect.minX, rect.maxX]))).sort((a, b) => a - b)
  let totalArea = 0

  for (let index = 0; index < xStops.length - 1; index++) {
    const minX = xStops[index]!
    const maxX = xStops[index + 1]!
    const width = maxX - minX
    if (width <= 0) continue

    const yRanges = intersections
      .filter((rect) => rect.minX < maxX && rect.maxX > minX)
      .map((rect) => [rect.minY, rect.maxY] as const)
      .sort((a, b) => a[0] - b[0])

    let coveredHeight = 0
    let currentMin: number | null = null
    let currentMax: number | null = null
    for (const [rangeMin, rangeMax] of yRanges) {
      if (currentMin === null || currentMax === null) {
        currentMin = rangeMin
        currentMax = rangeMax
      } else if (rangeMin <= currentMax) {
        currentMax = Math.max(currentMax, rangeMax)
      } else {
        coveredHeight += currentMax - currentMin
        currentMin = rangeMin
        currentMax = rangeMax
      }
    }
    if (currentMin !== null && currentMax !== null) {
      coveredHeight += currentMax - currentMin
    }

    totalArea += width * coveredHeight
  }

  return totalArea
}

function coverageOverlapRatio(bounds: OsgbBounds, coverage: OsgbBounds[]): number {
  const area = boundsArea(bounds)
  if (area <= 0) return 0

  return Math.min(unionIntersectionArea(bounds, coverage) / area, 1)
}

function normalizeCoverageBounds(boundsList: OsgbBounds[]): OsgbBounds[] {
  const sorted = [...boundsList].sort((a, b) => boundsArea(b) - boundsArea(a))
  const result: OsgbBounds[] = []

  for (const bounds of sorted) {
    if (result.some((cover) => boundsContains(cover, bounds))) {
      continue
    }
    result.push(bounds)
  }

  return result
}

function coverageOutsideCoveredBy(
  bounds: OsgbBounds,
  coverage: OsgbBounds[],
  keptBounds: OsgbBounds[],
): number {
  const width = bounds.maxX - bounds.minX
  const height = bounds.maxY - bounds.minY
  if (width <= 0 || height <= 0) return 1
  const cell = Math.max(width, height) / 8
  let outside = 0
  let covered = 0
  for (let x = bounds.minX; x <= bounds.maxX - 0.001; x += cell) {
    for (let y = bounds.minY; y <= bounds.maxY - 0.001; y += cell) {
      const px = x + cell / 2
      const py = y + cell / 2
      if (coverage.some((c) => px >= c.minX && px <= c.maxX && py >= c.minY && py <= c.maxY)) continue
      outside++
      if (keptBounds.some((k) => px >= k.minX && px <= k.maxX && py >= k.minY && py <= k.maxY)) covered++
    }
  }
  return outside === 0 ? 1 : covered / outside
}

function shouldRemoveBaseTile(
  bounds: OsgbBounds,
  coverage: OsgbBounds[],
  options: EdgePruneOptions,
  hasChildren: boolean,
  keptChildBounds: OsgbBounds[],
): boolean {
  if (coverageContains(bounds, coverage)) return true

  // Anti-hole policy v3: a tile may be removed only when the update range
  // covers 100% of its area (union of update leaf bounds), so the grafted
  // update data replaces it without overlap. Anything partially covered keeps
  // the base content as a coarser LOD fallback, so no edge/level gaps appear.
  return coverageOverlapRatio(bounds, coverage) >= 1 - 1e-9
}
function collectCoverageFromTileset(tilesetPath: string, deltaToBase: CoordinateDelta): OsgbBounds[] {
  const tileset = readJsonFile<TilesetJson>(tilesetPath)
  const coverage: OsgbBounds[] = []

  const collectTileCoverage = (
    tile: TileJson,
    tilesetDir: string,
    parentTransform?: number[],
    includeOwnTransform = true,
  ): boolean => {
    const tileTransform = includeOwnTransform
      ? getCombinedTransform(parentTransform, tile)
      : parentTransform
    const uri = getTileContentUri(tile)
    const isExternalTileset = !!uri && uri.toLowerCase().endsWith('tileset.json')
    let collectedDescendant = false

    if (isExternalTileset && uri) {
      const externalPath = path.resolve(tilesetDir, uri)
      if (fs.existsSync(externalPath)) {
        const externalTileset = readJsonFile<TilesetJson>(externalPath)
        if (externalTileset.root) {
          collectedDescendant = collectTileCoverage(externalTileset.root, path.dirname(externalPath), tileTransform) || collectedDescendant
        }
      }
    }

    if (tile.children) {
      for (const child of tile.children) {
        collectedDescendant = collectTileCoverage(child, tilesetDir, tileTransform) || collectedDescendant
      }
    }

    if (tile.content && !isExternalTileset && !collectedDescendant) {
      const bounds = getTileBounds(tile, tileTransform)
      if (bounds) {
        coverage.push(translateBounds(bounds, deltaToBase))
        return true
      }
    }

    return collectedDescendant
  }

  if (tileset.root) {
    // The top-level transform georeferences the whole tileset. Coverage is
    // compared in the base tileset's local merge coordinate space instead.
    collectTileCoverage(tileset.root, path.dirname(tilesetPath), undefined, false)
  }

  return coverage
}

interface B3dmFileEntry {
  path: string
  bounds: OsgbBounds
  delta: CoordinateDelta
}

// 递归收集瓦片内所有 b3dm 文件(含中间 LOD 层级),附带瓦片包围盒(已变换到 base 局部)。
function collectB3dmFilesWithBounds(
  tilesetPath: string,
  deltaToBase: CoordinateDelta,
  out: B3dmFileEntry[],
): void {
  const walk = (
    tile: TileJson,
    inheritedTransform: number[] | undefined,
    currentDir: string,
    skipRootTransform = false,
  ): void => {
    const tileTransform = skipRootTransform
      ? inheritedTransform
      : getCombinedTransform(inheritedTransform, tile)
    const uri = getTileContentUri(tile)
    const isExternalTileset = !!uri && uri.toLowerCase().endsWith('tileset.json')
    if (isExternalTileset && uri) {
      const externalPath = path.resolve(currentDir, uri)
      if (fs.existsSync(externalPath)) {
        const externalTileset = readJsonFile<TilesetJson>(externalPath)
        if (externalTileset.root) walk(externalTileset.root, tileTransform, path.dirname(externalPath))
      }
    }
    if (tile.children) {
      for (const child of tile.children) walk(child, tileTransform, currentDir)
    }
    if (tile.content && !isExternalTileset && uri) {
      const bounds = getTileBounds(tile, tileTransform)
      if (bounds) {
        out.push({
          path: path.resolve(currentDir, uri),
          bounds: translateBounds(bounds, deltaToBase),
          delta: deltaToBase,
        })
      }
    }
  }
  const tileset = readJsonFile<TilesetJson>(tilesetPath)
  if (tileset.root) walk(tileset.root, undefined, path.dirname(tilesetPath), true)
}

// 覆盖区掩码:结合 update 瓦片顶点与三角形覆盖(格心落在三角形内即标记),
// 按 cellSize 生成贴合实际几何的覆盖区,并按行合并成矩形段。
// 既避免瓦片包围盒比实际几何大导致边界缝隙(裁剪线悬空),
// 也避免粗 LOD 三角形内部(顶点稀疏处)残留大范围 base 小块。
function collectVertexCoverageFromTilesets(
  updateOutputDirs: Array<{ outputDir: string; deltaToBase: CoordinateDelta }>,
  cellSize = 5,
): OsgbBounds[] {
  const files: B3dmFileEntry[] = []
  for (const update of updateOutputDirs) {
    collectB3dmFilesWithBounds(path.join(update.outputDir, 'tileset.json'), update.deltaToBase, files)
  }
  if (files.length === 0) return []

  const minX = Math.min(...files.map((f) => f.bounds.minX))
  const maxX = Math.max(...files.map((f) => f.bounds.maxX))
  const minY = Math.min(...files.map((f) => f.bounds.minY))
  const maxY = Math.max(...files.map((f) => f.bounds.maxY))
  const cols = Math.max(1, Math.ceil((maxX - minX) / cellSize))
  const rows = Math.max(1, Math.ceil((maxY - minY) / cellSize))
  const mask = new Uint8Array(cols * rows)

  // 三角形覆盖标记:格心落在 update 三角形 XY 投影内则视为被覆盖。
  const markTriangleCoverage = (
    ax: number, ay: number,
    bx: number, by: number,
    cx: number, cy: number,
  ): void => {
    const minTx = Math.min(ax, bx, cx)
    const maxTx = Math.max(ax, bx, cx)
    const minTy = Math.min(ay, by, cy)
    const maxTy = Math.max(ay, by, cy)
    const column0 = Math.max(0, Math.floor((minTx - minX) / cellSize))
    const column1 = Math.min(cols - 1, Math.floor((maxTx - minX) / cellSize))
    const row0 = Math.max(0, Math.floor((minTy - minY) / cellSize))
    const row1 = Math.min(rows - 1, Math.floor((maxTy - minY) / cellSize))
    for (let row = row0; row <= row1; row++) {
      const py = minY + (row + 0.5) * cellSize
      for (let column = column0; column <= column1; column++) {
        const px = minX + (column + 0.5) * cellSize
        const d1 = (px - bx) * (ay - by) - (py - by) * (ax - bx)
        const d2 = (px - cx) * (by - cy) - (py - cy) * (bx - cx)
        const d3 = (px - ax) * (cy - ay) - (py - ay) * (cx - ax)
        const hasNegative = d1 < 0 || d2 < 0 || d3 < 0
        const hasPositive = d1 > 0 || d2 > 0 || d3 > 0
        if (!(hasNegative && hasPositive)) {
          mask[row * cols + column] = 1
        }
      }
    }
  }

  for (const file of files) {
    let buffer: Buffer
    try {
      buffer = fs.readFileSync(file.path)
    } catch {
      continue
    }
    let parts: B3dmParts
    try {
      parts = parseB3dmParts(buffer)
    } catch {
      continue
    }
    let gltf: GltfJson
    let bin: Buffer
    try {
      const parsed = parseGlbParts(parts.glb)
      gltf = parsed.gltf
      bin = parsed.bin
      for (const mesh of gltf.meshes ?? []) {
        for (const primitive of mesh.primitives ?? []) {
          const positionIndex = primitive.attributes?.POSITION
          const indexIndex = primitive.indices
          if (positionIndex == null || indexIndex == null) continue
          const accessor = gltf.accessors?.[positionIndex]
          const view = accessor?.bufferView != null ? gltf.bufferViews?.[accessor.bufferView] : undefined
          const indexAccessor = gltf.accessors?.[indexIndex]
          const indexView = indexAccessor?.bufferView != null ? gltf.bufferViews?.[indexAccessor.bufferView] : undefined
          if (
            !accessor || !view || accessor.type !== 'VEC3' || accessor.componentType !== 5126
            || (view.buffer ?? 0) !== 0
            || !indexAccessor || !indexView || (indexView.buffer ?? 0) !== 0
            || (indexAccessor.componentType !== 5125 && indexAccessor.componentType !== 5123)
          ) continue
          const stride = accessor.byteStride ?? 12
          const start = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0)
          const positions: Array<[number, number]> = []
          for (let index = 0; index < (accessor.count ?? 0); index++) {
            const offset = start + index * stride
            const x = bin.readFloatLE(offset) + file.delta.x
            const y = bin.readFloatLE(offset + 4) + file.delta.y
            positions.push([x, y])
            const column = Math.floor((x - minX) / cellSize)
            const row = Math.floor((y - minY) / cellSize)
            if (column >= 0 && column < cols && row >= 0 && row < rows) {
              mask[row * cols + column] = 1
            }
          }
          const isUint32 = indexAccessor.componentType === 5125
          const indexStride = isUint32 ? 4 : 2
          const indexStart = (indexView.byteOffset ?? 0) + (indexAccessor.byteOffset ?? 0)
          const indexCount = indexAccessor.count ?? 0
          for (let index = 0; index + 2 < indexCount; index += 3) {
            const ia = isUint32
              ? bin.readUInt32LE(indexStart + index * indexStride)
              : bin.readUInt16LE(indexStart + index * indexStride)
            const ib = isUint32
              ? bin.readUInt32LE(indexStart + (index + 1) * indexStride)
              : bin.readUInt16LE(indexStart + (index + 1) * indexStride)
            const ic = isUint32
              ? bin.readUInt32LE(indexStart + (index + 2) * indexStride)
              : bin.readUInt16LE(indexStart + (index + 2) * indexStride)
            const pa = positions[ia]
            const pb = positions[ib]
            const pc = positions[ic]
            if (!pa || !pb || !pc) continue
            markTriangleCoverage(pa[0], pa[1], pb[0], pb[1], pc[0], pc[1])
          }
        }
      }
    } catch {
      continue
    }
  }

  // 按行合并连续 cell 成矩形段,贴合实际几何轮廓。
  const segments: OsgbBounds[] = []
  for (let row = 0; row < rows; row++) {
    let column = 0
    while (column < cols) {
      if (mask[row * cols + column] === 0) { column++; continue }
      let columnEnd = column
      while (columnEnd < cols && mask[row * cols + columnEnd] === 1) columnEnd++
      segments.push({
        minX: minX + column * cellSize,
        maxX: minX + columnEnd * cellSize,
        minY: minY + row * cellSize,
        maxY: minY + (row + 1) * cellSize,
        minZ: -Infinity,
        maxZ: Infinity,
      })
      column = columnEnd
    }
  }
  return segments
}

function pruneTilesetFile(
  tilesetPath: string,
  coverage: OsgbBounds[],
  options: EdgePruneOptions,
  parentTransform?: number[],
  skipRootTransform = false,
  rootCanBeRemoved = false,
): { removed: number; empty: boolean } {
  const tileset = readJsonFile<TilesetJson>(tilesetPath)
  const tilesetDir = path.dirname(tilesetPath)
  let removed = 0

  const pruneTile = (
    tile: TileJson,
    inheritedTransform: number[] | undefined,
    keepTile: boolean,
    skipOwnTransform = false,
  ): { keep: boolean; rects: OsgbBounds[] } => {
    const tileTransform = skipOwnTransform
      ? inheritedTransform
      : getCombinedTransform(inheritedTransform, tile)
    const bounds = getTileBounds(tile, tileTransform)
    const uri = getTileContentUri(tile)
    const isExternalTileset = !!uri && uri.toLowerCase().endsWith('tileset.json')
    const keptRects: OsgbBounds[] = []

    if (isExternalTileset && uri) {
      const externalPath = path.resolve(tilesetDir, uri)
      if (fs.existsSync(externalPath)) {
        const childResult = pruneTilesetFile(externalPath, coverage, options, tileTransform, false, true)
        removed += childResult.removed
        if (childResult.empty) return { keep: false, rects: [] }
        if (bounds) keptRects.push(bounds)
      }
    }

    if (tile.children) {
      tile.children = tile.children.filter((child) => {
        const result = pruneTile(child, tileTransform, false)
        if (result.keep) keptRects.push(...result.rects)
        return result.keep
      })
      if (tile.children.length === 0) delete tile.children
    }

    const hasChildren = !!(tile.children && tile.children.length > 0)
    // ?? tileset ???????????? update ????????????
    // ?? 100% ????????????????????????????
    const removeTile = bounds && (
      isExternalTileset ? coverageOverlapRatio(bounds, coverage) >= 1 - 1e-9 : shouldRemoveBaseTile(bounds, coverage, options, hasChildren, keptRects)
    )

    if (bounds && removeTile) {
      // Fully covered by the update range: remove the whole subtree instead of
      // keeping an empty placeholder node (the update data covers this area).
      if (keepTile) {
        // The root node must always be kept; if its content is missing the
        // post-merge hole-filling pass will fill it.
        return { keep: true, rects: [bounds] }
      }
      removed++
      return { keep: false, rects: [] }
    }

    if (bounds) {
      keptRects.unshift(bounds)
      // Boundary tile kept as a LOD placeholder: children (and the grafted
      // update data) replace it once loaded, so the stale low-detail content
      // does not visually overlap the updated area.
      if (hasChildren && coverageIntersects(bounds, coverage) && !isExternalTileset) {
        tile.refine = 'REPLACE'
      }
    }
    return { keep: true, rects: keptRects }
  }

  let rootRemoved = false
  if (tileset.root) {
    const rootResult = pruneTile(tileset.root, parentTransform, !rootCanBeRemoved, skipRootTransform)
    // ?? tileset ????????????????????????
    // ???????????????????????????
    if (rootCanBeRemoved && !rootResult.keep) {
      rootRemoved = true
      delete tileset.root.content
      delete tileset.root.children
    }
  }

  const rootEmpty = rootRemoved
    || (!tileset.root?.content && (!tileset.root?.children || tileset.root.children.length === 0))
  writeJsonFile(tilesetPath, tileset)
  return { removed, empty: rootEmpty }
}

// --- Hole filling: give every level of the merged tileset real content ---
interface FillContentSource {
  uri: string
  sourceDir: string
  bounds: OsgbBounds | null
  area: number
}

function bestFillContent(bounds: OsgbBounds, candidates: FillContentSource[]): FillContentSource | null {
  if (candidates.length === 0) return null
  let best: FillContentSource | null = null
  let bestScore = -1
  for (const candidate of candidates) {
    if (!candidate.bounds) continue
    let score: number
    if (boundsContains(candidate.bounds, bounds)) {
      // Full coverage: prefer the largest content that completely contains the
      // hole area (coarsest geometry that still covers it entirely).
      score = boundsArea(candidate.bounds) + 1e15
    } else {
      score = unionIntersectionArea(bounds, [candidate.bounds])
    }
    if (score > bestScore) {
      bestScore = score
      best = candidate
    }
  }
  return best
}

function rewriteFillContentUri(uri: string, sourceDir: string, targetDir: string): string {
  const sourcePath = path.resolve(sourceDir, uri)
  let relative = path.relative(targetDir, sourcePath).replace(/\\/g, '/')
  if (!relative.startsWith('.')) relative = `./${relative}`
  return relative
}

function fillPlaceholderHoles(outputDir: string, coverage: OsgbBounds[]): number {
  const rootTilesetPath = path.join(outputDir, 'tileset.json')
  const tileset = readJsonFile<TilesetJson>(rootTilesetPath)
  if (!tileset.root) return 0
  const rootTilesetDir = path.dirname(rootTilesetPath)
  let filled = 0

  // Pre-collect every real content in the whole merged tileset, so hole
  // filling can also borrow coarse base geometry (not only descendants).
  const allContents: FillContentSource[] = []
  const collectContents = (
    tile: TileJson,
    inheritedTransform: number[] | undefined,
    tilesetDir: string,
    skipRootTransform = false,
  ): void => {
    // ? collectCoverageFromTileset ????????? ENU ?????
    // bounds ????????????????????? coverage ???
    const tileTransform = skipRootTransform
      ? inheritedTransform
      : getCombinedTransform(inheritedTransform, tile)
    const bounds = getTileBounds(tile, tileTransform)
    const uri = getTileContentUri(tile)
    const isExternalTileset = !!uri && uri.toLowerCase().endsWith('tileset.json')

    if (isExternalTileset && uri) {
      const externalPath = path.resolve(tilesetDir, uri)
      if (fs.existsSync(externalPath)) {
        const externalTileset = readJsonFile<TilesetJson>(externalPath)
        if (externalTileset.root) {
          collectContents(externalTileset.root, tileTransform, path.dirname(externalPath), false)
        }
      }
    }
    if (tile.children) {
      for (const child of tile.children) {
        collectContents(child, tileTransform, tilesetDir, false)
      }
    }
    if (uri && !isExternalTileset) {
      allContents.push({
        uri,
        sourceDir: tilesetDir,
        bounds,
        area: bounds ? boundsArea(bounds) : 0,
      })
    }
  }
  collectContents(tileset.root, undefined, rootTilesetDir, true)

  const processTile = (
    tile: TileJson,
    inheritedTransform: number[] | undefined,
    tilesetDir: string,
    ancestorContent: FillContentSource | null,
    allowGlobalBorrow: boolean,
    isRootTile: boolean,
    skipRootTransform = false,
  ): { bounds: OsgbBounds | null; childRects: OsgbBounds[]; contents: FillContentSource[] } => {
    // ??? ENU ????? bounds ???? bounds ? coverage ??
    // ?????????? collectCoverageFromTileset ???????
    const tileTransform = skipRootTransform
      ? inheritedTransform
      : getCombinedTransform(inheritedTransform, tile)
    const bounds = getTileBounds(tile, tileTransform)
    const uri = getTileContentUri(tile)
    const isExternalTileset = !!uri && uri.toLowerCase().endsWith('tileset.json')
    // Only the root-local frame may borrow content from the whole tileset.
    // Any node with its own transform (e.g. the grafted update root) lives in
    // a translated frame, so it must borrow only from its own subtree.
    const localAllowGlobalBorrow = allowGlobalBorrow && (isRootTile || !tile.transform)
    const childRects: OsgbBounds[] = []
    const contents: FillContentSource[] = []

    if (isExternalTileset && uri) {
      const externalPath = path.resolve(tilesetDir, uri)
      if (fs.existsSync(externalPath)) {
        const externalTileset = readJsonFile<TilesetJson>(externalPath)
        if (externalTileset.root) {
          const externalResult = processTile(
            externalTileset.root,
            tileTransform,
            path.dirname(externalPath),
            ancestorContent,
            localAllowGlobalBorrow,
            false,
            false,
          )
          if (externalResult.bounds) childRects.push(externalResult.bounds)
          contents.push(...externalResult.contents)
        }
      }
    }

    if (tile.children) {
      for (const child of tile.children) {
        const childResult = processTile(child, tileTransform, tilesetDir, ancestorContent, localAllowGlobalBorrow, false, false)
        if (childResult.bounds) childRects.push(childResult.bounds)
        contents.push(...childResult.contents)
      }
    }

    const hasRealContent = !!uri && !isExternalTileset
    if (hasRealContent) {
      contents.push({
        uri,
        sourceDir: tilesetDir,
        bounds,
        area: bounds ? boundsArea(bounds) : 0,
      })
    }

    // Any node without real content (internal placeholder or empty leaf) gets
    // filled from the nearest ancestor content, falling back to the best
    // content across the whole merged tileset (usually a coarse base tile),
    // so every level has renderable data (no holes).
    // ???????????????????????????????
    // ?? LOD ??????????? Cesium ????????????????
    if (bounds && !hasRealContent && !isExternalTileset
        && !((tile.extras as { mergeCutEmpty?: boolean } | undefined)?.mergeCutEmpty)
        && coverageIntersects(bounds, coverage) && !isRootTile) {
      let source = ancestorContent
      if (!source) {
        source = localAllowGlobalBorrow
          ? bestFillContent(bounds, allContents)
          : bestFillContent(bounds, contents)
      }
      if (source) {
        const contentUri = rewriteFillContentUri(source.uri, source.sourceDir, tilesetDir)
        tile.content = {
          uri: contentUri,
        }
        if (childRects.length > 0) {
          tile.refine = 'REPLACE'
        }
        filled++
        contents.push({
          uri: contentUri,
          sourceDir: tilesetDir,
          bounds,
          area: boundsArea(bounds),
        })
      }
    }

    return { bounds, childRects, contents }
  }

  processTile(tileset.root, undefined, rootTilesetDir, null, true, true, true)
  writeJsonFile(rootTilesetPath, tileset)
  return filled
}

// ─── b3dm / glTF geometry cutting ─────────────────────────────────────
// 小范围(更新)覆盖区必须显示小范围数据,但大范围部分覆盖的瓦片又要保留
// 用来填补边缘(避免空洞)。因此对“部分覆盖”的大范围 b3dm 做几何裁剪:
// 三角形 2D 重心落在更新覆盖区内的直接剔除,保留覆盖区外的三角形。
// 这样更新区只显示小范围数据,而边缘仍有大范围几何兜底,不产生空洞。

interface CoverageGrid {
  minX: number
  minY: number
  cellSize: number
  cols: number
  rows: number
  cells: number[][]
  coverage: OsgbBounds[]
}

interface CoverageDistanceMap {
  minX: number
  minY: number
  cellSize: number
  cols: number
  rows: number
  dist: Float32Array
}

interface B3dmParts {
  header: Buffer
  featureTableJson: Buffer
  featureTableBinary: Buffer
  batchTableJson: Buffer
  batchTableBinary: Buffer
  glb: Buffer
}

interface GltfAccessor {
  bufferView?: number
  byteOffset?: number
  componentType?: number
  count?: number
  type?: string
  byteStride?: number
  min?: number[]
  max?: number[]
}

interface GltfBufferView {
  buffer?: number
  byteOffset?: number
  byteLength?: number
  byteStride?: number
  target?: number
}

interface GltfBuffer {
  byteLength?: number
  uri?: string
}

interface GltfPrimitive {
  attributes?: Record<string, number>
  indices?: number
  mode?: number
  material?: number
}

interface GltfMesh {
  primitives?: GltfPrimitive[]
}

interface GltfJson {
  buffers?: GltfBuffer[]
  bufferViews?: GltfBufferView[]
  accessors?: GltfAccessor[]
  meshes?: GltfMesh[]
  [key: string]: unknown
}

interface CutGlbResult {
  glb: Buffer
  cutTriangles: number
  totalTriangles: number
  empty: boolean
}

interface CutB3dmResult {
  cutTriangles: number
  totalTriangles: number
  empty: boolean
}

interface CutBaseGeometryResult {
  cutTiles: number
  cutTriangles: number
  emptyTiles: number
}

function parseB3dmParts(buffer: Buffer): B3dmParts {
  if (buffer.length < 28 || buffer.toString('utf8', 0, 4) !== 'b3dm') {
    throw new Error('不是有效的 b3dm 文件')
  }
  const featureTableJsonLength = buffer.readUInt32LE(12)
  const featureTableBinaryLength = buffer.readUInt32LE(16)
  const batchTableJsonLength = buffer.readUInt32LE(20)
  const batchTableBinaryLength = buffer.readUInt32LE(24)
  let offset = 28
  const featureTableJson = buffer.subarray(offset, offset + featureTableJsonLength)
  offset += featureTableJsonLength
  const featureTableBinary = buffer.subarray(offset, offset + featureTableBinaryLength)
  offset += featureTableBinaryLength
  const batchTableJson = buffer.subarray(offset, offset + batchTableJsonLength)
  offset += batchTableJsonLength
  const batchTableBinary = buffer.subarray(offset, offset + batchTableBinaryLength)
  offset += batchTableBinaryLength
  return {
    header: buffer.subarray(0, 28),
    featureTableJson,
    featureTableBinary,
    batchTableJson,
    batchTableBinary,
    glb: buffer.subarray(offset),
  }
}

function parseGlbParts(buffer: Buffer): { gltf: GltfJson; bin: Buffer } {
  if (buffer.length < 20 || buffer.toString('utf8', 0, 4) !== 'glTF') {
    throw new Error('不是有效的 glTF(GLB) 文件')
  }
  const jsonLength = buffer.readUInt32LE(12)
  const gltf = JSON.parse(buffer.toString('utf8', 20, 20 + jsonLength)) as GltfJson
  let offset = (20 + jsonLength + 3) & ~3
  let bin = Buffer.alloc(0)
  if (offset + 8 <= buffer.length && buffer.toString('utf8', offset + 4, offset + 8) === 'BIN\u0000') {
    const binLength = buffer.readUInt32LE(offset)
    bin = Buffer.from(buffer.subarray(offset + 8, offset + 8 + binLength))
  }
  return { gltf, bin }
}

function buildGlbBuffer(gltf: GltfJson, bin: Buffer): Buffer {
  let jsonBuffer = Buffer.from(JSON.stringify(gltf), 'utf-8')
  jsonBuffer = Buffer.concat([jsonBuffer, Buffer.alloc((4 - (jsonBuffer.length % 4)) % 4, 0x20)])
  const binPadded = Buffer.concat([bin, Buffer.alloc((4 - (bin.length % 4)) % 4, 0)])
  const header = Buffer.alloc(12)
  header.write('glTF', 0, 'utf-8')
  header.writeUInt32LE(2, 4)
  header.writeUInt32LE(12 + 8 + jsonBuffer.length + 8 + binPadded.length, 8)
  const jsonChunkHeader = Buffer.alloc(8)
  jsonChunkHeader.writeUInt32LE(jsonBuffer.length, 0)
  jsonChunkHeader.write('JSON', 4, 'utf-8')
  const binChunkHeader = Buffer.alloc(8)
  binChunkHeader.writeUInt32LE(binPadded.length, 0)
  binChunkHeader.write('BIN\u0000', 4, 'utf-8')
  return Buffer.concat([header, jsonChunkHeader, jsonBuffer, binChunkHeader, binPadded])
}

function buildB3dmBuffer(parts: B3dmParts, glb: Buffer): Buffer {
  const header = Buffer.alloc(28)
  header.write('b3dm', 0, 'utf-8')
  header.writeUInt32LE(1, 4)
  header.writeUInt32LE(
    28 + parts.featureTableJson.length + parts.featureTableBinary.length
      + parts.batchTableJson.length + parts.batchTableBinary.length + glb.length,
    8,
  )
  header.writeUInt32LE(parts.featureTableJson.length, 12)
  header.writeUInt32LE(parts.featureTableBinary.length, 16)
  header.writeUInt32LE(parts.batchTableJson.length, 20)
  header.writeUInt32LE(parts.batchTableBinary.length, 24)
  return Buffer.concat([
    header,
    parts.featureTableJson,
    parts.featureTableBinary,
    parts.batchTableJson,
    parts.batchTableBinary,
    glb,
  ])
}

function buildCoverageGrid(coverage: OsgbBounds[], cellSize = 40): CoverageGrid {
  const minX = Math.min(...coverage.map((c) => c.minX))
  const maxX = Math.max(...coverage.map((c) => c.maxX))
  const minY = Math.min(...coverage.map((c) => c.minY))
  const maxY = Math.max(...coverage.map((c) => c.maxY))
  const cols = Math.max(1, Math.ceil((maxX - minX) / cellSize))
  const rows = Math.max(1, Math.ceil((maxY - minY) / cellSize))
  const cells: number[][] = Array.from({ length: cols * rows }, () => [])
  for (let index = 0; index < coverage.length; index++) {
    const cover = coverage[index]!
    const x0 = Math.max(0, Math.floor((cover.minX - minX) / cellSize))
    const x1 = Math.min(cols - 1, Math.floor((cover.maxX - minX) / cellSize))
    const y0 = Math.max(0, Math.floor((cover.minY - minY) / cellSize))
    const y1 = Math.min(rows - 1, Math.floor((cover.maxY - minY) / cellSize))
    for (let x = x0; x <= x1; x++) {
      for (let y = y0; y <= y1; y++) {
        cells[y * cols + x]!.push(index)
      }
    }
  }
  return { minX, minY, cellSize, cols, rows, cells, coverage }
}

function pointInCoverage(x: number, y: number, grid: CoverageGrid): boolean {
  const column = Math.floor((x - grid.minX) / grid.cellSize)
  const row = Math.floor((y - grid.minY) / grid.cellSize)
  if (column < 0 || column >= grid.cols || row < 0 || row >= grid.rows) return false
  for (const index of grid.cells[row * grid.cols + column]!) {
    const cover = grid.coverage[index]!
    if (x >= cover.minX && x <= cover.maxX && y >= cover.minY && y <= cover.maxY) return true
  }
  return false
}

// ==================== 精确裁剪:三角形沿覆盖区边界切开(无缝拼接) ====================

interface PolyVertex {
  x: number
  y: number
  z: number
  // 相对原三角形三个顶点的重心坐标,用于新顶点属性(法线/UV)插值
  w: [number, number, number]
}

function polyVertexArea(poly: PolyVertex[]): number {
  let sum = 0
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]!
    const b = poly[(i + 1) % poly.length]!
    sum += a.x * b.y - b.x * a.y
  }
  return Math.abs(sum) / 2
}

function clipConvexPolygonByHalfPlane(
  poly: PolyVertex[],
  edgeX: boolean,
  edgeValue: number,
  edgeDirection: number,
): { inner: PolyVertex[]; outer: PolyVertex[] } {
  const test = (p: PolyVertex): boolean => (
    edgeX ? (p.x - edgeValue) * edgeDirection >= 0 : (p.y - edgeValue) * edgeDirection >= 0
  )
  const inner: PolyVertex[] = []
  const outer: PolyVertex[] = []
  const n = poly.length
  for (let i = 0; i < n; i++) {
    const a = poly[i]!
    const b = poly[(i + 1) % n]!
    const aIn = test(a)
    const bIn = test(b)
    if (aIn) inner.push(a)
    else outer.push(a)
    if (aIn !== bIn) {
      const da = edgeX ? (a.x - edgeValue) * edgeDirection : (a.y - edgeValue) * edgeDirection
      const db = edgeX ? (b.x - edgeValue) * edgeDirection : (b.y - edgeValue) * edgeDirection
      const t = da / (da - db)
      const cross: PolyVertex = {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
        z: a.z + (b.z - a.z) * t,
        w: [
          a.w[0] + (b.w[0] - a.w[0]) * t,
          a.w[1] + (b.w[1] - a.w[1]) * t,
          a.w[2] + (b.w[2] - a.w[2]) * t,
        ] as [number, number, number],
      }
      inner.push(cross)
      outer.push(cross)
    }
  }
  return { inner, outer }
}

function subtractRectFromConvexPoly(poly: PolyVertex[], rect: OsgbBounds): PolyVertex[][] {
  const edges: Array<{ edgeX: boolean; value: number; direction: number }> = [
    { edgeX: true, value: rect.minX, direction: 1 },
    { edgeX: true, value: rect.maxX, direction: -1 },
    { edgeX: false, value: rect.minY, direction: 1 },
    { edgeX: false, value: rect.maxY, direction: -1 },
  ]
  const results: PolyVertex[][] = []
  let current: PolyVertex[][] = [poly]
  for (const edge of edges) {
    const nextCurrent: PolyVertex[][] = []
    for (const p of current) {
      const test = (v: PolyVertex): boolean => (
        edge.edgeX ? (v.x - edge.value) * edge.direction >= 0 : (v.y - edge.value) * edge.direction >= 0
      )
      let insideCount = 0
      for (const v of p) if (test(v)) insideCount++
      if (insideCount === p.length) { nextCurrent.push(p); continue }
      if (insideCount === 0) { results.push(p); continue }
      const { inner, outer } = clipConvexPolygonByHalfPlane(p, edge.edgeX, edge.value, edge.direction)
      if (inner.length >= 3) nextCurrent.push(inner)
      if (outer.length >= 3) results.push(outer)
    }
    current = nextCurrent
  }
  return results
}

function coverageCandidatesForTriangle(
  p0: [number, number, number],
  p1: [number, number, number],
  p2: [number, number, number],
  grid: CoverageGrid,
): Set<number> {
  const minX = Math.min(p0[0], p1[0], p2[0])
  const maxX = Math.max(p0[0], p1[0], p2[0])
  const minY = Math.min(p0[1], p1[1], p2[1])
  const maxY = Math.max(p0[1], p1[1], p2[1])
  const column0 = Math.max(0, Math.floor((minX - grid.minX) / grid.cellSize))
  const column1 = Math.min(grid.cols - 1, Math.floor((maxX - grid.minX) / grid.cellSize))
  const row0 = Math.max(0, Math.floor((minY - grid.minY) / grid.cellSize))
  const row1 = Math.min(grid.rows - 1, Math.floor((maxY - grid.minY) / grid.cellSize))
  const result = new Set<number>()
  for (let row = row0; row <= row1; row++) {
    for (let column = column0; column <= column1; column++) {
      const cell = grid.cells[row * grid.cols + column]
      if (!cell) continue
      for (const index of cell) result.add(index)
    }
  }
  return result
}

interface VertexAttributeReader {
  name: string
  accessorIndex: number
  bufferViewIndex: number
  components: number
  byteStride: number
  byteOffset: number
  data: Buffer
  values: number[][]
  newValues: number[][]
}



function cutGlbTriangles(glb: Buffer, grid: CoverageGrid): CutGlbResult {
  const { gltf, bin } = parseGlbParts(glb)
  const buffers = gltf.buffers ?? []
  const bufferViews = gltf.bufferViews ?? []
  const accessors = gltf.accessors ?? []
  const mainBuffer = buffers[0]
  if (!mainBuffer || mainBuffer.uri) {
    // 只支持内嵌 BIN 的 GLB;外链 buffer 不做裁剪(保持原样)。
    return { glb, cutTriangles: 0, totalTriangles: 0, empty: false }
  }
  const readBufferView = (view: GltfBufferView): Buffer => {
    const start = view.byteOffset ?? 0
    return bin.subarray(start, start + (view.byteLength ?? 0))
  }

  let totalTriangles = 0
  let cutTriangles = 0
  let splitTriangles = 0
  const newViewData = new Map<number, Buffer>()

  for (const mesh of gltf.meshes ?? []) {
    if (!mesh.primitives || mesh.primitives.length === 0) continue
    const keptPrimitives: GltfPrimitive[] = []
    for (const primitive of mesh.primitives) {
      const positionAccessorIndex = primitive.attributes?.POSITION
      const indexAccessorIndex = primitive.indices
      const mode = primitive.mode ?? 4
      if (positionAccessorIndex == null || indexAccessorIndex == null || mode !== 4) {
        keptPrimitives.push(primitive)
        continue
      }
      const positionAccessor = accessors[positionAccessorIndex]
      const indexAccessor = accessors[indexAccessorIndex]
      const positionView = positionAccessor?.bufferView != null ? bufferViews[positionAccessor.bufferView] : undefined
      const indexView = indexAccessor?.bufferView != null ? bufferViews[indexAccessor.bufferView] : undefined
      if (
        !positionAccessor || !indexAccessor || !positionView || !indexView
        || (positionView.buffer ?? 0) !== 0 || (indexView.buffer ?? 0) !== 0
        || positionAccessor.type !== 'VEC3' || positionAccessor.componentType !== 5126
        || (indexAccessor.componentType !== 5125 && indexAccessor.componentType !== 5123)
      ) {
        keptPrimitives.push(primitive)
        continue
      }

      const positionData = readBufferView(positionView)
      const indexData = readBufferView(indexView)
      const positionStride = positionAccessor.byteStride ?? 12
      const positionOffset = positionAccessor.byteOffset ?? 0
      const positionCount = positionAccessor.count ?? 0
      const positions: Array<[number, number, number]> = []
      for (let index = 0; index < positionCount; index++) {
        const offset = positionOffset + index * positionStride
        positions.push([
          positionData.readFloatLE(offset),
          positionData.readFloatLE(offset + 4),
          positionData.readFloatLE(offset + 8),
        ])
      }

      // 解析 POSITION 之外的其他浮点属性(法线/UV 等),用于新交点顶点的插值。
      const attrReaders: VertexAttributeReader[] = []
      let unsupportedAttr = false
      for (const [attrName, attrAccessorIndex] of Object.entries(primitive.attributes ?? {})) {
        if (attrName === 'POSITION') continue
        const attrAccessor = accessors[attrAccessorIndex]
        const attrView = attrAccessor?.bufferView != null ? bufferViews[attrAccessor.bufferView] : undefined
        const components = attrAccessor?.type === 'VEC2' ? 2
          : attrAccessor?.type === 'VEC3' ? 3
          : attrAccessor?.type === 'VEC4' ? 4
          : attrAccessor?.type === 'SCALAR' ? 1
          : 0
        if (
          !attrAccessor || !attrView || (attrView.buffer ?? 0) !== 0
          || attrAccessor.componentType !== 5126 || components === 0
        ) {
          unsupportedAttr = true
          break
        }
        const attrByteStride = attrAccessor.byteStride ?? components * 4
        const attrByteOffset = attrAccessor.byteOffset ?? 0
        const attrData = readBufferView(attrView)
        const values: number[][] = []
        for (let index = 0; index < positionCount; index++) {
          const offset = attrByteOffset + index * attrByteStride
          const row: number[] = []
          for (let c = 0; c < components; c++) row.push(attrData.readFloatLE(offset + c * 4))
          values.push(row)
        }
        attrReaders.push({
          name: attrName,
          accessorIndex: attrAccessorIndex,
          bufferViewIndex: attrAccessor.bufferView!,
          components,
          byteStride: attrByteStride,
          byteOffset: attrByteOffset,
          data: attrData,
          values,
          newValues: [],
        })
      }
      if (unsupportedAttr) {
        keptPrimitives.push(primitive)
        continue
      }

      const indexCount = indexAccessor.count ?? 0
      const isUint32 = indexAccessor.componentType === 5125
      const readIndex = (index: number): number => (
        isUint32 ? indexData.readUInt32LE(index * 4) : indexData.readUInt16LE(index * 2)
      )

      const newPositions: Array<[number, number, number]> = []
      const newVertexMap = new Map<string, number>()
      let primitiveChanged = false

      // 多边形顶点转索引:原始顶点直接复用,边界交点按坐标去重并插值属性。
      const addVertex = (v: PolyVertex, a: number, b: number, c: number): number => {
        const w = v.w
        const maxW = Math.max(w[0], w[1], w[2])
        if (maxW > 0.999999) {
          if (w[0] === maxW) return a
          if (w[1] === maxW) return b
          return c
        }
        const key = `${v.x.toFixed(4)},${v.y.toFixed(4)},${v.z.toFixed(4)}`
        const existing = newVertexMap.get(key)
        if (existing != null) return existing
        const newIndex = positionCount + newPositions.length
        newPositions.push([v.x, v.y, v.z])
        newVertexMap.set(key, newIndex)
        for (const attr of attrReaders) {
          const va = attr.values[a]!
          const vb = attr.values[b]!
          const vc = attr.values[c]!
          const row: number[] = []
          for (let k = 0; k < attr.components; k++) {
            row.push(w[0] * va[k]! + w[1] * vb[k]! + w[2] * vc[k]!)
          }
          attr.newValues.push(row)
        }
        return newIndex
      }

      const keptIndices: number[] = []
      for (let index = 0; index + 2 < indexCount; index += 3) {
        const a = readIndex(index)
        const b = readIndex(index + 1)
        const c = readIndex(index + 2)
        totalTriangles++
        const p0 = positions[a]!
        const p1 = positions[b]!
        const p2 = positions[c]!

        // 三角形 XY 包围盒命中的覆盖区矩形作为裁剪候选。
        const candidates = coverageCandidatesForTriangle(p0, p1, p2, grid)
        if (candidates.size === 0) {
          keptIndices.push(a, b, c)
          continue
        }

        // 三角形逐矩形做减法,得到覆盖区外的凸多边形集合。
        let polys: PolyVertex[][] = [[
          { x: p0[0], y: p0[1], z: p0[2], w: [1, 0, 0] },
          { x: p1[0], y: p1[1], z: p1[2], w: [0, 1, 0] },
          { x: p2[0], y: p2[1], z: p2[2], w: [0, 0, 1] },
        ]]
        let changed = false
        for (const rectIndex of candidates) {
          const rect = grid.coverage[rectIndex]
          if (!rect) continue
          const next: PolyVertex[][] = []
          for (const poly of polys) {
            const parts = subtractRectFromConvexPoly(poly, rect)
            if (parts.length === 1 && parts[0]!.length === poly.length) {
              const same = parts[0]!.every((v, i) => (
                Math.abs(v.x - poly[i]!.x) < 1e-6
                && Math.abs(v.y - poly[i]!.y) < 1e-6
                && Math.abs(v.z - poly[i]!.z) < 1e-6
              ))
              if (same) { next.push(parts[0]!); continue }
            }
            changed = true
            next.push(...parts)
          }
          polys = next
          if (polys.length === 0) break
        }

        if (polys.length === 0) {
          // 三角形完全落在更新覆盖区内:整块剔除。
          cutTriangles++
          primitiveChanged = true
          continue
        }
        if (!changed) {
          // 包围盒命中但实际未被覆盖区切割:原样保留。
          keptIndices.push(a, b, c)
          continue
        }

        // 跨边界三角形:沿覆盖区边界精确切开,只保留覆盖区外的部分(无缝拼接)。
        primitiveChanged = true
        for (const poly of polys) {
          if (poly.length < 3) continue
          if (polyVertexArea(poly) < 1e-9) continue
          splitTriangles += poly.length - 2
          for (let i = 1; i + 1 < poly.length; i++) {
            keptIndices.push(addVertex(poly[0]!, a, b, c), addVertex(poly[i]!, a, b, c), addVertex(poly[i + 1]!, a, b, c))
          }
        }
      }

      if (!primitiveChanged) {
        keptPrimitives.push(primitive)
        continue
      }
      if (keptIndices.length === 0) continue

      // 新顶点追加到 POSITION 及各属性 bufferView。
      if (newPositions.length > 0) {
        const newPositionBuffer = Buffer.alloc(newPositions.length * 12)
        newPositions.forEach((p, i) => {
          newPositionBuffer.writeFloatLE(p[0], i * 12)
          newPositionBuffer.writeFloatLE(p[1], i * 12 + 4)
          newPositionBuffer.writeFloatLE(p[2], i * 12 + 8)
        })
        newViewData.set(positionAccessor.bufferView!, Buffer.concat([readBufferView(positionView), newPositionBuffer]))
        positionAccessor.count = positionCount + newPositions.length
        for (const attr of attrReaders) {
          if (attr.newValues.length === 0) continue
          const newAttrBuffer = Buffer.alloc(attr.newValues.length * attr.components * 4)
          attr.newValues.forEach((row, i) => {
            for (let c = 0; c < attr.components; c++) newAttrBuffer.writeFloatLE(row[c]!, (i * attr.components + c) * 4)
          })
          const attrView = bufferViews[attr.bufferViewIndex]
          if (attrView) newViewData.set(attr.bufferViewIndex, Buffer.concat([readBufferView(attrView), newAttrBuffer]))
          const attrAccessor = accessors[attr.accessorIndex]
          if (attrAccessor) attrAccessor.count = positionCount + attr.newValues.length
        }
      }

      // 索引。
      const newIndexBuffer = Buffer.alloc(keptIndices.length * (isUint32 ? 4 : 2))
      keptIndices.forEach((value, offset) => {
        if (isUint32) newIndexBuffer.writeUInt32LE(value, offset * 4)
        else newIndexBuffer.writeUInt16LE(value, offset * 2)
      })
      newViewData.set(indexAccessor.bufferView!, newIndexBuffer)
      indexAccessor.count = keptIndices.length

      // 更新 POSITION min/max(遍历保留顶点,避免裁剪后包围盒过小被错误剔除)。
      let minX = Infinity
      let minY = Infinity
      let minZ = Infinity
      let maxX = -Infinity
      let maxY = -Infinity
      let maxZ = -Infinity
      for (const idx of keptIndices) {
        const p = idx < positionCount ? positions[idx]! : newPositions[idx - positionCount]!
        if (p[0] < minX) minX = p[0]
        if (p[1] < minY) minY = p[1]
        if (p[2] < minZ) minZ = p[2]
        if (p[0] > maxX) maxX = p[0]
        if (p[1] > maxY) maxY = p[1]
        if (p[2] > maxZ) maxZ = p[2]
      }
      positionAccessor.min = [minX, minY, minZ]
      positionAccessor.max = [maxX, maxY, maxZ]

      keptPrimitives.push(primitive)
    }
    mesh.primitives = keptPrimitives
  }

  if (cutTriangles === 0 && splitTriangles === 0) {
    return { glb, cutTriangles, totalTriangles, empty: false }
  }

  // 重建 BIN:被替换的 bufferView 使用新数据,其余原样拷贝。
  const orderedViews = bufferViews
    .map((view, viewIndex) => ({ view, viewIndex }))
    .sort((a, b) => (a.view.byteOffset ?? 0) - (b.view.byteOffset ?? 0))
  const newBufferViews: Array<GltfBufferView | undefined> = new Array(bufferViews.length)
  const newBinParts: Buffer[] = []
  let newOffset = 0
  for (const { view, viewIndex } of orderedViews) {
    if ((view.buffer ?? 0) !== 0) continue
    const data = newViewData.has(viewIndex) ? newViewData.get(viewIndex)! : readBufferView(view)
    const padding = (4 - (newOffset % 4)) % 4
    newOffset += padding
    if (padding > 0) newBinParts.push(Buffer.alloc(padding, 0))
    newBufferViews[viewIndex] = { ...view, byteOffset: newOffset, byteLength: data.length }
    newBinParts.push(data)
    newOffset += data.length
  }
  for (let viewIndex = 0; viewIndex < bufferViews.length; viewIndex++) {
    const updated = newBufferViews[viewIndex]
    if (updated) bufferViews[viewIndex] = updated
  }

  const newBin = Buffer.concat(newBinParts)
  mainBuffer.byteLength = newBin.length
  const empty = (gltf.meshes ?? []).every((mesh) => !mesh.primitives || mesh.primitives.length === 0)
  return { glb: buildGlbBuffer(gltf, newBin), cutTriangles, totalTriangles, empty }
}


function cutB3dmByCoverage(b3dmPath: string, grid: CoverageGrid): CutB3dmResult {
  let original: Buffer
  try {
    original = fs.readFileSync(b3dmPath)
  } catch {
    return { cutTriangles: 0, totalTriangles: 0, empty: false }
  }
  let parts: B3dmParts
  try {
    parts = parseB3dmParts(original)
  } catch {
    return { cutTriangles: 0, totalTriangles: 0, empty: false }
  }
  const result = cutGlbTriangles(parts.glb, grid)
  if (result.cutTriangles === 0) {
    return { cutTriangles: 0, totalTriangles: result.totalTriangles, empty: false }
  }
  const output = buildB3dmBuffer(parts, result.glb)
  fs.writeFileSync(b3dmPath, output)
  return {
    cutTriangles: result.cutTriangles,
    totalTriangles: result.totalTriangles,
    empty: result.empty,
  }
}



interface GroundGrid {
  minX: number
  minY: number
  cellSize: number
  cols: number
  rows: number
  z: Float32Array
  has: Uint8Array
}

function queryGroundZ(grid: GroundGrid, x: number, y: number, maxRadiusCells = 8): number | null {
  const centerColumn = Math.floor((x - grid.minX) / grid.cellSize)
  const centerRow = Math.floor((y - grid.minY) / grid.cellSize)
  if (
    centerColumn >= 0 && centerColumn < grid.cols && centerRow >= 0 && centerRow < grid.rows
    && grid.has[centerRow * grid.cols + centerColumn]
  ) {
    return grid.z[centerRow * grid.cols + centerColumn]
  }
  for (let radius = 1; radius <= maxRadiusCells; radius++) {
    for (let row = -radius; row <= radius; row++) {
      for (let column = -radius; column <= radius; column++) {
        if (Math.max(Math.abs(row), Math.abs(column)) !== radius) continue
        const cellColumn = centerColumn + column
        const cellRow = centerRow + row
        if (cellColumn < 0 || cellColumn >= grid.cols || cellRow < 0 || cellRow >= grid.rows) continue
        if (grid.has[cellRow * grid.cols + cellColumn]) {
          return grid.z[cellRow * grid.cols + cellColumn]
        }
      }
    }
  }
  return null
}

// 构建大范围地面高程网格:每个 cell 取最低顶点 z(最接近地面),供边界带高程过渡使用。
function buildBaseGroundGrid(baseOutputDir: string, coverage: OsgbBounds[], cellSize = 10, band = 20): GroundGrid {
  if (coverage.length === 0) {
    return { minX: 0, minY: 0, cellSize, cols: 1, rows: 1, z: new Float32Array(1).fill(Infinity), has: new Uint8Array(1) }
  }
  const minX = Math.min(...coverage.map((c) => c.minX))
  const maxX = Math.max(...coverage.map((c) => c.maxX))
  const minY = Math.min(...coverage.map((c) => c.minY))
  const maxY = Math.max(...coverage.map((c) => c.maxY))
  const cols = Math.max(1, Math.ceil((maxX - minX) / cellSize))
  const rows = Math.max(1, Math.ceil((maxY - minY) / cellSize))
  const distanceMap = buildCoverageDistanceMap(coverage, 5)
  const zLists = new Map<number, number[]>()

  const files: B3dmFileEntry[] = []
  collectB3dmFilesWithBounds(path.join(baseOutputDir, 'tileset.json'), { x: 0, y: 0, z: 0 }, files)
  for (const file of files) {
    if (
      file.bounds.maxX < minX - band - 150 || file.bounds.minX > maxX + band + 150
      || file.bounds.maxY < minY - band - 150 || file.bounds.minY > maxY + band + 150
    ) continue
    let buffer: Buffer
    try { buffer = fs.readFileSync(file.path) } catch { continue }
    let parts: B3dmParts
    try { parts = parseB3dmParts(buffer) } catch { continue }
    const { gltf, bin } = parseGlbParts(parts.glb)
    for (const mesh of gltf.meshes ?? []) {
      for (const primitive of mesh.primitives ?? []) {
        const positionIndex = primitive.attributes?.POSITION
        if (positionIndex == null) continue
        const accessor = gltf.accessors?.[positionIndex]
        const view = accessor?.bufferView != null ? gltf.bufferViews?.[accessor.bufferView] : undefined
        if (!accessor || !view || accessor.type !== 'VEC3' || accessor.componentType !== 5126 || (view.buffer ?? 0) !== 0) continue
        const stride = accessor.byteStride ?? 12
        const start = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0)
        for (let index = 0; index < (accessor.count ?? 0); index++) {
          const offset = start + index * stride
          const x = bin.readFloatLE(offset)
          const y = bin.readFloatLE(offset + 4)
          const vertexZ = bin.readFloatLE(offset + 8)
          // ????????? band ??? base ??,????? base ?????
          // ??:5m ?????????? 0~5m ????????,??????????,
          // ????????????????
          if (distanceMap) {
            const d = queryCoverageBoundaryDistance(distanceMap, x, y)
            if (d > 8 || (d < 0 && -d > band)) continue
          }
          const column = Math.floor((x - minX) / cellSize)
          const row = Math.floor((y - minY) / cellSize)
          if (column < 0 || column >= cols || row < 0 || row >= rows) continue
          const cellIndex = row * cols + column
          let list = zLists.get(cellIndex)
          if (!list) { list = []; zLists.set(cellIndex, list) }
          list.push(vertexZ)
        }
      }
    }
  }
  const z = new Float32Array(cols * rows).fill(Infinity)
  const has = new Uint8Array(cols * rows)
  for (const [cellIndex, list] of zLists) {
    list.sort((a, b) => a - b)
    z[cellIndex] = list[Math.floor(list.length / 2)]
    has[cellIndex] = 1
  }
  return { minX, minY, cellSize, cols, rows, z, has }
}

function listB3dmFilesRecursive(dir: string): string[] {
  const result: string[] = []
  const walk = (current: string): void => {
    let entries: fs.Dirent[]
    try { entries = fs.readdirSync(current, { withFileTypes: true }) } catch { return }
    for (const entry of entries) {
      const full = path.join(current, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (entry.isFile() && entry.name.toLowerCase().endsWith('.b3dm')) result.push(full)
    }
  }
  if (fs.existsSync(dir)) walk(dir)
  return result
}

// 点到覆盖区(掩码行段)的最近距离:内部点返回到最近边的距离,外部点返回欧氏距离。
function buildCoverageDistanceMap(coverage: OsgbBounds[], cellSize = 5): CoverageDistanceMap | null {
  if (coverage.length === 0) return null
  const minX = Math.min(...coverage.map((c) => c.minX))
  const maxX = Math.max(...coverage.map((c) => c.maxX))
  const minY = Math.min(...coverage.map((c) => c.minY))
  const maxY = Math.max(...coverage.map((c) => c.maxY))
  const cols = Math.max(1, Math.ceil((maxX - minX) / cellSize))
  const rows = Math.max(1, Math.ceil((maxY - minY) / cellSize))
  const inside = new Uint8Array(cols * rows)
  for (const rect of coverage) {
    const c0 = Math.max(0, Math.floor((rect.minX - minX) / cellSize))
    const c1 = Math.min(cols - 1, Math.floor((rect.maxX - minX) / cellSize))
    const r0 = Math.max(0, Math.floor((rect.minY - minY) / cellSize))
    const r1 = Math.min(rows - 1, Math.floor((rect.maxY - minY) / cellSize))
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) inside[r * cols + c] = 1
    }
  }
  // ?????:?? cell ??(?????),?? cell ??(?????)?
  const dist = new Float32Array(cols * rows).fill(0)
  const queue: number[] = []
  for (let index = 0; index < inside.length; index++) {
    const column = index % cols
    const row = (index - column) / cols
    const neighborOutside =
      (column > 0 && inside[index - 1] === 0) ||
      (column < cols - 1 && inside[index + 1] === 0) ||
      (row > 0 && inside[index - cols] === 0) ||
      (row < rows - 1 && inside[index + cols] === 0)
    const neighborInside =
      (column > 0 && inside[index - 1] === 1) ||
      (column < cols - 1 && inside[index + 1] === 1) ||
      (row > 0 && inside[index - cols] === 1) ||
      (row < rows - 1 && inside[index + cols] === 1)
    if (inside[index] === 1) {
      if (neighborOutside) { dist[index] = 1; queue.push(index) }
      else dist[index] = Infinity
    } else {
      if (neighborInside) { dist[index] = -1; queue.push(index) }
      else dist[index] = -Infinity
    }
  }
  let head = 0
  while (head < queue.length) {
    const index = queue[head++]
    const current = dist[index]
    const next = current > 0 ? current + 1 : current - 1
    const column = index % cols
    const row = (index - column) / cols
    if (column > 0 && inside[index - 1] === inside[index]
      && ((next > 0 && next < dist[index - 1]) || (next < 0 && next > dist[index - 1]))) {
      dist[index - 1] = next
      queue.push(index - 1)
    }
    if (column < cols - 1 && inside[index + 1] === inside[index]
      && ((next > 0 && next < dist[index + 1]) || (next < 0 && next > dist[index + 1]))) {
      dist[index + 1] = next
      queue.push(index + 1)
    }
    if (row > 0 && inside[index - cols] === inside[index]
      && ((next > 0 && next < dist[index - cols]) || (next < 0 && next > dist[index - cols]))) {
      dist[index - cols] = next
      queue.push(index - cols)
    }
    if (row < rows - 1 && inside[index + cols] === inside[index]
      && ((next > 0 && next < dist[index + cols]) || (next < 0 && next > dist[index + cols]))) {
      dist[index + cols] = next
      queue.push(index + cols)
    }
  }
  return { minX, minY, cellSize, cols, rows, dist }
}

// ?????????????(?);??????:?=????,?=?????
function queryCoverageBoundaryDistance(map: CoverageDistanceMap, x: number, y: number): number {
  const column = Math.floor((x - map.minX) / map.cellSize)
  const row = Math.floor((y - map.minY) / map.cellSize)
  if (column < 0 || column >= map.cols || row < 0 || row >= map.rows) return 0
  const cells = map.dist[row * map.cols + column]
  if (!isFinite(cells) || cells === 0) return 0
  const magnitude = Math.max(0, Math.abs(cells) - 0.5) * map.cellSize
  return cells > 0 ? magnitude : -magnitude
}

// 边界带高程过渡:把 update 边界带内顶点 z 向大范围地面渐变(边界处对齐 base,
// 向内部 blendWidth 距离内平滑过渡),消除裁剪拼接处的高程台阶。
function blendUpdateBoundaryHeight(
  updateDataDir: string,
  coverage: OsgbBounds[],
  deltaToBase: CoordinateDelta,
  heightCorrection: number,
  groundGrid: GroundGrid,
  blendWidth = 80,
  snapWidth = 15,
): number {
  if (coverage.length === 0) return 0
  const distanceMap = buildCoverageDistanceMap(coverage, 5)
  const files = listB3dmFilesRecursive(updateDataDir)
  let modifiedVertices = 0
  for (const file of files) {
    let original: Buffer
    try { original = fs.readFileSync(file) } catch { continue }
    let parts: B3dmParts
    try { parts = parseB3dmParts(original) } catch { continue }
    const { gltf, bin } = parseGlbParts(parts.glb)
    let changed = false
    let minZ = Infinity
    let maxZ = -Infinity
    for (const mesh of gltf.meshes ?? []) {
      for (const primitive of mesh.primitives ?? []) {
        const positionIndex = primitive.attributes?.POSITION
        if (positionIndex == null) continue
        const accessor = gltf.accessors?.[positionIndex]
        const view = accessor?.bufferView != null ? gltf.bufferViews?.[accessor.bufferView] : undefined
        if (!accessor || !view || accessor.type !== 'VEC3' || accessor.componentType !== 5126 || (view.buffer ?? 0) !== 0) continue
        const stride = accessor.byteStride ?? 12
        const start = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0)
        for (let index = 0; index < (accessor.count ?? 0); index++) {
          const offset = start + index * stride
          const x = bin.readFloatLE(offset)
          const y = bin.readFloatLE(offset + 4)
          const vertexZ = bin.readFloatLE(offset + 8)
          const px = x + deltaToBase.x
          const py = y + deltaToBase.y
          const renderZ = vertexZ + deltaToBase.z + heightCorrection
          let newZ = vertexZ
          const dist = distanceMap ? Math.max(0, queryCoverageBoundaryDistance(distanceMap, px, py)) : Infinity
          if (dist < blendWidth) {
            const baseZ = queryGroundZ(groundGrid, px, py)
            if (baseZ != null && isFinite(baseZ)) {
              // ?????? snapWidth ????? base(??????),??????
              const weight = dist <= snapWidth ? 1 : Math.max(0, 1 - (dist - snapWidth) / (blendWidth - snapWidth))
              newZ = vertexZ + (baseZ - renderZ) * weight
            }
          }
          if (newZ !== vertexZ) {
            bin.writeFloatLE(newZ, offset + 8)
            modifiedVertices++
            changed = true
          }
          if (newZ < minZ) minZ = newZ
          if (newZ > maxZ) maxZ = newZ
        }
      }
    }
    if (changed) {
      for (const mesh of gltf.meshes ?? []) {
        for (const primitive of mesh.primitives ?? []) {
          const positionIndex = primitive.attributes?.POSITION
          if (positionIndex == null) continue
          const accessor = gltf.accessors?.[positionIndex]
          if (accessor && accessor.min && accessor.max) {
            accessor.min = [accessor.min[0], accessor.min[1], minZ]
            accessor.max = [accessor.max[0], accessor.max[1], maxZ]
          }
        }
      }
      const glb = buildGlbBuffer(gltf, bin)
      fs.writeFileSync(file, buildB3dmBuffer(parts, glb))
    }
  }
  return modifiedVertices
}

function cutBaseGeometryInCoverage(outputDir: string, coverage: OsgbBounds[]): CutBaseGeometryResult {
  const rootTilesetPath = path.join(outputDir, 'tileset.json')
  const tileset = readJsonFile<TilesetJson>(rootTilesetPath)
  if (!tileset.root) return { cutTiles: 0, cutTriangles: 0, emptyTiles: 0 }
  const rootTilesetDir = path.dirname(rootTilesetPath)
  const grid = buildCoverageGrid(coverage)
  const outerCoverageBounds = unionBounds(coverage)
  const coverageOuterIntersects = (bounds: OsgbBounds): boolean => {
    if (!outerCoverageBounds) return false
    return bounds.maxX >= outerCoverageBounds.minX && bounds.minX <= outerCoverageBounds.maxX
      && bounds.maxY >= outerCoverageBounds.minY && bounds.minY <= outerCoverageBounds.maxY
  }
  let cutTiles = 0
  let cutTriangles = 0
  let emptyTiles = 0

  const processTile = (
    tile: TileJson,
    tilesetDir: string,
    inheritedTransform: number[] | undefined,
    skipRootTransform = false,
  ): boolean => {
    const tileTransform = skipRootTransform
      ? inheritedTransform
      : getCombinedTransform(inheritedTransform, tile)
    const uri = getTileContentUri(tile)
    const isExternalTileset = !!uri && uri.toLowerCase().endsWith('tileset.json')
    const bounds = getTileBounds(tile, tileTransform)

    if (isExternalTileset && uri) {
      const externalPath = path.resolve(tilesetDir, uri)
      if (fs.existsSync(externalPath)) {
        const externalTileset = readJsonFile<TilesetJson>(externalPath)
        if (externalTileset.root) {
          const keep = processTile(externalTileset.root, path.dirname(externalPath), tileTransform, false)
          if (!keep) return false
        }
      }
    }

    if (tile.children) {
      tile.children = tile.children.filter((child) => processTile(child, tilesetDir, tileTransform, false))
      if (tile.children.length === 0) delete tile.children
    }

    if (bounds && uri && !isExternalTileset && coverageOuterIntersects(bounds) && coverageIntersects(bounds, coverage)) {
      const b3dmPath = path.resolve(tilesetDir, uri)
      if (fs.existsSync(b3dmPath)) {
        const result = cutB3dmByCoverage(b3dmPath, grid)
        cutTriangles += result.cutTriangles
        if (result.cutTriangles > 0) cutTiles++
        if (result.empty) {
          emptyTiles++
          delete tile.content
          tile.extras = { ...(tile.extras as Record<string, unknown> | undefined), mergeCutEmpty: true }
          // 几何已完全落在更新覆盖区内:删除内容,更新数据会覆盖该区域。
          if (!tile.children || tile.children.length === 0) return false
        }
      }
    }

    return true
  }

  processTile(tileset.root, rootTilesetDir, undefined, true)
  writeJsonFile(rootTilesetPath, tileset)
  return { cutTiles, cutTriangles, emptyTiles }
}

function transformPoint(matrix: number[] | undefined, point: [number, number, number]): [number, number, number] {
  if (!matrix || matrix.length < 16) return point
  const [x, y, z] = point
  return [
    matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12],
    matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13],
    matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14],
  ]
}

function cloneTile(tile: TileJson): TileJson {
  return JSON.parse(JSON.stringify(tile)) as TileJson
}

function makeTranslationTransform(delta: CoordinateDelta): number[] {
  return [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    delta.x, delta.y, delta.z, 1,
  ]
}

function multiplyTransforms(left: number[], right: number[]): number[] {
  const result = new Array<number>(16).fill(0)
  for (let column = 0; column < 4; column++) {
    for (let row = 0; row < 4; row++) {
      for (let index = 0; index < 4; index++) {
        result[column * 4 + row] += left[index * 4 + row] * right[column * 4 + index]
      }
    }
  }
  return result
}

function mergeTileTransform(tile: TileJson, transform: number[]): void {
  tile.transform = tile.transform && tile.transform.length >= 16
    ? multiplyTransforms(transform, tile.transform)
    : transform
}

function rewriteUpdateContentUri(uri: string, updateDataName: string): string {
  const normalized = uri.replace(/\\/g, '/')
  if (normalized.startsWith('./Data/')) return `./Data/${updateDataName}/${normalized.slice('./Data/'.length)}`
  if (normalized.startsWith('Data/')) return `./Data/${updateDataName}/${normalized.slice('Data/'.length)}`
  if (normalized.startsWith('/Data/')) return `./Data/${updateDataName}/${normalized.slice('/Data/'.length)}`
  return normalized
}

function rewriteTileContentUris(tile: TileJson, updateDataName: string): void {
  if (tile.content) {
    if (tile.content.uri) {
      tile.content.uri = rewriteUpdateContentUri(tile.content.uri, updateDataName)
    }
    if (tile.content.url) {
      tile.content.url = rewriteUpdateContentUri(tile.content.url, updateDataName)
    }
  }

  tile.children?.forEach((child) => rewriteTileContentUris(child, updateDataName))
}

function normalizeTileBoundingVolume(tile: TileJson): void {
  const bounds = getTileBounds(tile)
  if (bounds) {
    tile.boundingVolume = { box: boundsToBox(bounds) }
  }
}

function unionBounds(boundsList: OsgbBounds[]): OsgbBounds | null {
  if (boundsList.length === 0) return null
  return boundsList.reduce<OsgbBounds>((acc, bounds) => ({
    minX: Math.min(acc.minX, bounds.minX),
    maxX: Math.max(acc.maxX, bounds.maxX),
    minY: Math.min(acc.minY, bounds.minY),
    maxY: Math.max(acc.maxY, bounds.maxY),
    minZ: Math.min(acc.minZ, bounds.minZ),
    maxZ: Math.max(acc.maxZ, bounds.maxZ),
  }), boundsList[0]!)
}

function boundsToBox(bounds: OsgbBounds): number[] {
  const centerX = (bounds.minX + bounds.maxX) / 2
  const centerY = (bounds.minY + bounds.maxY) / 2
  const centerZ = (bounds.minZ + bounds.maxZ) / 2
  return [
    centerX, centerY, centerZ,
    (bounds.maxX - bounds.minX) / 2, 0, 0,
    0, (bounds.maxY - bounds.minY) / 2, 0,
    0, 0, (bounds.maxZ - bounds.minZ) / 2,
  ]
}

function tilesetWorldSphere(tilesetPath: string): number[] {
  const tileset = readJsonFile<TilesetJson>(tilesetPath)
  const root = tileset.root
  const bounds = root ? getTileBounds(root) : null
  if (!root || !bounds) return [0, 0, 0, 1]

  const corners: Array<[number, number, number]> = [
    [bounds.minX, bounds.minY, bounds.minZ],
    [bounds.minX, bounds.minY, bounds.maxZ],
    [bounds.minX, bounds.maxY, bounds.minZ],
    [bounds.minX, bounds.maxY, bounds.maxZ],
    [bounds.maxX, bounds.minY, bounds.minZ],
    [bounds.maxX, bounds.minY, bounds.maxZ],
    [bounds.maxX, bounds.maxY, bounds.minZ],
    [bounds.maxX, bounds.maxY, bounds.maxZ],
  ]
  const worldCorners = (corners as Array<[number, number, number]>).map((corner) => transformPoint(root.transform, corner))

  const min = [Infinity, Infinity, Infinity]
  const max = [-Infinity, -Infinity, -Infinity]
  for (const corner of worldCorners) {
    for (let i = 0; i < 3; i++) {
      min[i] = Math.min(min[i], corner[i])
      max[i] = Math.max(max[i], corner[i])
    }
  }

  const center = [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2]
  const radius = Math.sqrt(
    Math.pow(max[0] - center[0], 2) +
    Math.pow(max[1] - center[1], 2) +
    Math.pow(max[2] - center[2], 2),
  )
  return [center[0], center[1], center[2], Math.max(radius, 1)]
}

function unionSpheres(spheres: number[][]): number[] {
  if (spheres.length === 0) return [0, 0, 0, 1]
  const min = [Infinity, Infinity, Infinity]
  const max = [-Infinity, -Infinity, -Infinity]
  for (const sphere of spheres) {
    const [x, y, z, r] = sphere
    min[0] = Math.min(min[0], x - r)
    min[1] = Math.min(min[1], y - r)
    min[2] = Math.min(min[2], z - r)
    max[0] = Math.max(max[0], x + r)
    max[1] = Math.max(max[1], y + r)
    max[2] = Math.max(max[2], z + r)
  }
  const center = [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2]
  const radius = Math.sqrt(
    Math.pow(max[0] - center[0], 2) +
    Math.pow(max[1] - center[1], 2) +
    Math.pow(max[2] - center[2], 2),
  )
  return [center[0], center[1], center[2], Math.max(radius, 1)]
}

function prepareMergedOutputDirectory(outputDir: string): void {
  fs.mkdirSync(outputDir, { recursive: true })
  for (const entry of ['base', 'updates', 'Data', 'tileset.json']) {
    safeRemoveInside(outputDir, path.join(outputDir, entry))
  }
}

// ??? Height alignment (stitch update surface onto base surface) ??????

interface LeafZPoint {
  x: number
  y: number
  z: number
}

function medianNumber(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}

function collectLeafZPoints(
  tilesetPath: string,
  delta: CoordinateDelta,
  out: LeafZPoint[],
  parentTransform?: number[],
  skipRootTransform = false,
): boolean {
  const tileset = readJsonFile<TilesetJson>(tilesetPath)
  const tilesetDir = path.dirname(tilesetPath)
  const walk = (
    tile: TileJson,
    inheritedTransform: number[] | undefined,
    skipOwn = false,
  ): boolean => {
    const tileTransform = skipOwn
      ? inheritedTransform
      : getCombinedTransform(inheritedTransform, tile)
    const uri = getTileContentUri(tile)
    const isExternalTileset = !!uri && uri.toLowerCase().endsWith('tileset.json')
    let hasDescendant = false

    if (isExternalTileset && uri) {
      const externalPath = path.resolve(tilesetDir, uri)
      if (fs.existsSync(externalPath)) {
        hasDescendant = collectLeafZPoints(externalPath, delta, out, tileTransform) || hasDescendant
      }
    }
    if (tile.children) {
      for (const child of tile.children) {
        hasDescendant = walk(child, tileTransform) || hasDescendant
      }
    }
    if (tile.content && !isExternalTileset && !hasDescendant) {
      const bounds = getTileBounds(tile, tileTransform)
      if (bounds) {
        out.push({
          x: (bounds.minX + bounds.maxX) / 2,
          y: (bounds.minY + bounds.maxY) / 2,
          z: (bounds.minZ + bounds.maxZ) / 2 + delta.z,
        })
      }
      return true
    }
    return hasDescendant
  }
  if (tileset.root) return walk(tileset.root, parentTransform, skipRootTransform)
  return false
}

function collectBaseZPointsNearCoverage(
  tilesetPath: string,
  coverage: OsgbBounds[],
  out: LeafZPoint[],
  margin = 250,
  parentTransform?: number[],
  skipRootTransform = false,
): void {
  const tileset = readJsonFile<TilesetJson>(tilesetPath)
  const tilesetDir = path.dirname(tilesetPath)
  const walk = (tile: TileJson, inheritedTransform: number[] | undefined, skipOwn = false): void => {
    const tileTransform = skipOwn
      ? inheritedTransform
      : getCombinedTransform(inheritedTransform, tile)
    const uri = getTileContentUri(tile)
    const isExternalTileset = !!uri && uri.toLowerCase().endsWith('tileset.json')

    if (isExternalTileset && uri) {
      const externalPath = path.resolve(tilesetDir, uri)
      if (fs.existsSync(externalPath)) {
        collectBaseZPointsNearCoverage(externalPath, coverage, out, margin, tileTransform)
      }
    }
    if (tile.children) {
      for (const child of tile.children) walk(child, tileTransform)
    }
    if (tile.content && !isExternalTileset) {
      const bounds = getTileBounds(tile, tileTransform)
      if (!bounds) return
      const near = coverage.some((c) => (
        bounds.maxX >= c.minX - margin &&
        bounds.minX <= c.maxX + margin &&
        bounds.maxY >= c.minY - margin &&
        bounds.minY <= c.maxY + margin
      ))
      if (near) {
        out.push({
          x: (bounds.minX + bounds.maxX) / 2,
          y: (bounds.minY + bounds.maxY) / 2,
          z: (bounds.minZ + bounds.maxZ) / 2,
        })
      }
    }
  }
  if (tileset.root) walk(tileset.root, parentTransform, skipRootTransform)
}

function computeHeightCorrection(
  baseTilesetPath: string,
  updateOutputDirs: Array<{ outputDir: string; deltaToBase: CoordinateDelta }>,
  coverage: OsgbBounds[],
): number {
  // Update leaf ground points (in base-local coordinates after delta).
  const updatePoints: LeafZPoint[] = []
  for (const update of updateOutputDirs) {
    collectLeafZPoints(path.join(update.outputDir, 'tileset.json'), update.deltaToBase, updatePoints, undefined, true)
  }
  // Base leaf ground points adjacent to the update coverage.
  const basePoints: LeafZPoint[] = []
  collectBaseZPointsNearCoverage(baseTilesetPath, coverage, basePoints, 250, undefined, true)
  if (updatePoints.length === 0 || basePoints.length === 0) return 0

  // Pair each update leaf with its nearest base leaf and measure the seam gap.
  const diffs: number[] = []
  for (const u of updatePoints) {
    let best: LeafZPoint | null = null
    let bestDist = Infinity
    for (const b of basePoints) {
      const d = Math.hypot(u.x - b.x, u.y - b.y)
      if (d < bestDist) { bestDist = d; best = b }
    }
    if (best && bestDist <= 250) diffs.push(u.z - best.z)
  }
  const medianDiff = medianNumber(diffs)
  if (medianDiff === null) return 0

  // Shift the update surface down by the median seam gap so it stitches onto
  // the base surface instead of floating above (or sinking below) it.
  return -medianDiff
}

function mergeConvertedTilesets(
  baseOutputDir: string,
  updateOutputDirs: Array<{ outputDir: string; deltaToBase: CoordinateDelta }>,
  outputDir: string,
  edgePrecisionValue: unknown,
): {
  removedBaseTiles: number
  addedUpdateTiles: number
  coverageTileCount: number
  edgePrecision: number
  filledHoleCount: number
  cutBaseTiles: number
  cutBaseTriangles: number
} {
  prepareMergedOutputDirectory(outputDir)

  fs.cpSync(baseOutputDir, outputDir, { recursive: true })
  const edgeOptions = buildEdgePruneOptions(edgePrecisionValue)

  const coverage = normalizeCoverageBounds(updateOutputDirs.flatMap((update) => (
    collectCoverageFromTileset(path.join(update.outputDir, 'tileset.json'), update.deltaToBase)
  )))
  // Auto-stitch the update surface onto the base surface (fix floating updates).
  const heightCorrection = computeHeightCorrection(
    path.join(baseOutputDir, 'tileset.json'),
    updateOutputDirs,
    coverage,
  )
  const outputTilesetPath = path.join(outputDir, 'tileset.json')
  const pruneResult = pruneTilesetFile(outputTilesetPath, coverage, edgeOptions, undefined, true)
  // 逐顶点掩码覆盖区:裁剪线贴合 update 实际几何,避免瓦片包围盒悬空造成边界缝隙。
  const vertexCoverage = collectVertexCoverageFromTilesets(updateOutputDirs)
  const cutResult = cutBaseGeometryInCoverage(outputDir, vertexCoverage)
  // 大范围地面高程网格(边界带高程过渡用)。
  const groundGrid = vertexCoverage.length > 0 ? buildBaseGroundGrid(baseOutputDir, vertexCoverage) : null
  const mergedTileset = readJsonFile<TilesetJson>(outputTilesetPath)
  const root = mergedTileset.root
  if (!root) throw new Error('大范围转换结果缺少 root tileset')

  const rootBounds = getTileBounds(root)
  const rootChildren = root.children ?? []
  let addedUpdateTiles = 0

  updateOutputDirs.forEach((update, index) => {
    const updateTilesetPath = path.join(update.outputDir, 'tileset.json')
    const updateTileset = readJsonFile<TilesetJson>(updateTilesetPath)
    const updateRoot = updateTileset.root
    if (!updateRoot) return

    const updateDataName = `__update_${index}`
    const updateDataSourceDir = path.join(update.outputDir, 'Data')
    const updateDataTargetDir = path.join(outputDir, 'Data', updateDataName)
    if (fs.existsSync(updateDataSourceDir)) {
      fs.cpSync(updateDataSourceDir, updateDataTargetDir, { recursive: true })
    }
    if (fs.existsSync(updateDataTargetDir) && groundGrid) {
      // 边界带高程过渡:让 update 边界与 base 地面平滑衔接,消除拼接台阶。
      blendUpdateBoundaryHeight(
        updateDataTargetDir,
        vertexCoverage,
        update.deltaToBase,
        heightCorrection,
        groundGrid,
      )
    }

    const graftedTile = cloneTile(updateRoot)
    // The update root has its own top-level georeference. It must be replaced
    // by the base-local delta when grafted under the base root. The z delta is
    // corrected so the update surface stitches onto the base surface instead of
    // floating above or below it.
    const graftDelta: CoordinateDelta = {
      ...update.deltaToBase,
      z: update.deltaToBase.z + heightCorrection,
    }
    graftedTile.transform = makeTranslationTransform(graftDelta)
    normalizeTileBoundingVolume(graftedTile)
    rewriteTileContentUris(graftedTile, updateDataName)
    rootChildren.push(graftedTile)
    addedUpdateTiles++
  })

  root.children = rootChildren
  const expandedRootBounds = unionBounds([
    ...(rootBounds ? [rootBounds] : []),
    ...coverage,
  ])
  if (expandedRootBounds) {
    root.boundingVolume = { box: boundsToBox(expandedRootBounds) }
  }

  writeJsonFile(outputTilesetPath, mergedTileset)
  const filledHoleCount = fillPlaceholderHoles(outputDir, coverage)
  return {
    removedBaseTiles: pruneResult.removed,
    addedUpdateTiles,
    coverageTileCount: coverage.length,
    edgePrecision: edgeOptions.edgePrecision,
    filledHoleCount,
    cutBaseTiles: cutResult.cutTiles,
    cutBaseTriangles: cutResult.cutTriangles,
  }
}

let conversionProcess: ChildProcess | null = null
let isCancelled = false
let isConversionRunning = false

type ConversionStatus = 'idle' | 'running' | 'success' | 'error' | 'cancelled'

interface ConversionEventSender {
  send(channel: string, ...args: unknown[]): void
}

interface ConversionConfigParams {
  x?: number | string
  y?: number | string
  offset?: number
  max_lvl?: number
  edge_precision?: number
  output_transparency?: boolean
  output_opacity?: number
  pbr?: boolean
  aggregate?: boolean
  aggregateTargetMB?: number
  aggregateMaxMB?: number
}

interface ConversionParams {
  inputDir: string
  outputDir?: string
  config: ConversionConfigParams
  updateDirs?: string[]
  /** 关联的记录 id（日更转化表），转换完成后回写该记录 */
  recordId?: number
}

interface ConversionResult {
  success: boolean
  error?: string
  outputDir?: string
  /** 大范围单独转换的 3D Tiles 目录（分阶段合并时保留） */
  sourceTilesPath?: string
  /** 小范围单独转换的 3D Tiles 目录（分阶段合并时保留） */
  updateTilesPath?: string
}

interface ConversionLogEntry {
  channel: string
  args: unknown[]
}

// ??? Local database (simple built-in store) ?????????????????????????
let db: DatabaseSync | null = null

function getDbPath(): string {
  return path.join(app.getPath('userData'), 'app.db')
}

function ensureColumn(table: string, column: string, ddl: string): void {
  if (!db) return
  try {
    const cols = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>
    if (!cols.some((c) => c.name === column)) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${ddl}`)
    }
  } catch (err: unknown) {
    console.error('[db] ensureColumn failed: ' + (err instanceof Error ? err.message : String(err)))
  }
}

function initDatabase(): void {
  const dbPath = getDbPath()
  db = new DatabaseSync(dbPath)
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );
    CREATE TABLE IF NOT EXISTS batches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );
    CREATE TABLE IF NOT EXISTS records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      input_dir TEXT,
      output_dir TEXT,
      status TEXT,
      tile_count INTEGER DEFAULT 0,
      duration_sec REAL DEFAULT 0,
      batch_id INTEGER,
      source_name TEXT,
      source_path TEXT,
      update_name TEXT,
      update_path TEXT,
      merged_name TEXT,
      merged_path TEXT,
      source_tiles_path TEXT,
      update_tiles_path TEXT,
      transparent INTEGER DEFAULT 2,
      edge_precision INTEGER DEFAULT 85,
      aggregate INTEGER DEFAULT 2,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );
  `)
  // 迁移：给旧 records 表补充新增列
  ensureColumn('records', 'batch_id', 'batch_id INTEGER')
  ensureColumn('records', 'source_name', 'source_name TEXT')
  ensureColumn('records', 'source_path', 'source_path TEXT')
  ensureColumn('records', 'update_name', 'update_name TEXT')
  ensureColumn('records', 'update_path', 'update_path TEXT')
  ensureColumn('records', 'merged_name', 'merged_name TEXT')
  ensureColumn('records', 'merged_path', 'merged_path TEXT')
  ensureColumn('records', 'source_tiles_path', 'source_tiles_path TEXT')
  ensureColumn('records', 'update_tiles_path', 'update_tiles_path TEXT')
  ensureColumn('records', 'transparent', 'transparent INTEGER DEFAULT 2')
  ensureColumn('records', 'edge_precision', 'edge_precision INTEGER DEFAULT 85')
  ensureColumn('records', 'aggregate', 'aggregate INTEGER DEFAULT 2')
  db.prepare('INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)').run('admin', '123456', 'admin')
  console.log('[db] initialized: ' + dbPath)
}

function updateRecordAfterConversion(recordId: number, result: ConversionResult): void {
  if (!db) return
  try {
    const status = result.success ? 'success' : 'error'
    const outputDir = result.outputDir ?? ''
    const mergedName = outputDir ? path.basename(outputDir) : ''
    db.prepare(
      'UPDATE records SET status = ?, output_dir = ?, merged_path = ?, merged_name = ?, source_tiles_path = ?, update_tiles_path = ? WHERE id = ?',
    ).run(
      status,
      outputDir,
      outputDir,
      mergedName,
      result.sourceTilesPath ?? '',
      result.updateTilesPath ?? '',
      Number(recordId),
    )
    console.log('[db] record #' + recordId + ' updated: ' + status)
  } catch (err: unknown) {
    console.error('[db] record update after conversion failed: ' + (err instanceof Error ? err.message : String(err)))
  }
}

function addConversionRecord(inputDir: string, outputDir: string, status: string, tileCount = 0): void {
  if (!db) return
  try {
    db.prepare(
      'INSERT INTO records (name, input_dir, output_dir, status, tile_count, duration_sec) VALUES (?, ?, ?, ?, ?, 0)',
    ).run(
      'OSGB → 3D Tiles ' + new Date().toLocaleString('zh-CN'),
      inputDir,
      outputDir,
      status,
      tileCount,
    )
  } catch (err: unknown) {
    console.error('[db] record add failed: ' + (err instanceof Error ? err.message : String(err)))
  }
}

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

let mergeUpdateApiServer: http.Server | null = null
let mergeUpdateApiPort = 0

function getMergeUpdateApiPort(): number {
  const port = Number(process.env.MERGE_UPDATE_API_PORT)
  return Number.isInteger(port) && port > 0 && port < 65536 ? port : 18080
}

function sendJsonResponse(res: http.ServerResponse, statusCode: number, payload: unknown): void {
  const body = JSON.stringify(payload)
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  })
  res.end(body)
}

function isMergeUpdateApiAuthorized(req: http.IncomingMessage): boolean {
  const token = process.env.MERGE_UPDATE_API_TOKEN
  if (!token) return true

  const headerToken = req.headers['x-merge-update-token']
  const authorization = req.headers.authorization
  return headerToken === token || authorization === `Bearer ${token}`
}

function readJsonRequestBody(req: http.IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let size = 0
    const maxSize = 1024 * 1024

    req.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > maxSize) {
        reject(new Error('请求体超过 1MB'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })

    req.on('end', () => {
      const text = Buffer.concat(chunks).toString('utf-8').trim()
      if (!text) {
        resolve({})
        return
      }

      try {
        resolve(JSON.parse(text))
      } catch {
        reject(new Error('请求体不是有效 JSON'))
      }
    })

    req.on('error', reject)
  })
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function toOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function toUpdateDirs(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined
  return value.filter((item): item is string => typeof item === 'string')
}

function buildHttpConversionParams(body: unknown): ConversionParams {
  const source = asRecord(body)
  const config = asRecord(source.config)
  const inputDir = toOptionalString(source.inputDir) ?? ''

  return {
    inputDir,
    outputDir: toOptionalString(source.outputDir),
    updateDirs: toUpdateDirs(source.updateDirs),
    config: {
      x: (config.x ?? source.x) as number | undefined,
      y: (config.y ?? source.y) as number | undefined,
      offset: (config.offset ?? source.offset) as number | undefined,
      max_lvl: (config.max_lvl ?? source.max_lvl ?? source.maxLvl) as number | undefined,
      edge_precision: (config.edge_precision ?? source.edge_precision ?? source.edgePrecision) as number | undefined,
      output_transparency: (config.output_transparency ?? source.output_transparency ?? source.outputTransparency) as boolean | undefined,
      output_opacity: (config.output_opacity ?? source.output_opacity ?? source.outputOpacity) as number | undefined,
      pbr: (config.pbr ?? source.pbr) as boolean | undefined,
      aggregate: (config.aggregate ?? source.aggregate) as boolean | undefined,
      aggregateTargetMB: (config.aggregateTargetMB ?? source.aggregateTargetMB) as number | undefined,
      aggregateMaxMB: (config.aggregateMaxMB ?? source.aggregateMaxMB) as number | undefined,
    },
  }
}

async function startConversionTask(
  sender: ConversionEventSender,
  params: ConversionParams,
): Promise<ConversionResult> {
  if (isConversionRunning) {
    return { success: false, error: '已有转换任务正在运行' }
  }

  isConversionRunning = true
  try {
    const result = await startConversionFromParams(sender, params)
    if (params.recordId) {
      updateRecordAfterConversion(params.recordId, result)
    } else if (result.outputDir) {
      addConversionRecord(params.inputDir, result.outputDir, result.success ? 'success' : 'error')
    }
    return result
  } finally {
    isConversionRunning = false
  }
}

async function handleMergeUpdateApiRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
  if (!isMergeUpdateApiAuthorized(req)) {
    sendJsonResponse(res, 401, { success: false, error: '未授权' })
    return
  }

  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? '127.0.0.1'}`)

  if (req.method === 'GET' && url.pathname === '/api/merge-update/health') {
    sendJsonResponse(res, 200, {
      success: true,
      status: isConversionRunning ? 'running' : 'idle',
      port: mergeUpdateApiPort,
      tool: {
        exists: fs.existsSync(get3dtilePath()),
        path: get3dtilePath(),
      },
    })
    return
  }

  if (req.method === 'POST' && url.pathname === '/api/merge-update/cancel') {
    if (conversionProcess) {
      isCancelled = true
      conversionProcess.kill('SIGTERM')
      sendJsonResponse(res, 200, { success: true })
    } else {
      sendJsonResponse(res, 200, { success: false, error: '当前没有可取消的转换进程' })
    }
    return
  }

  if (req.method !== 'POST' || url.pathname !== '/api/merge-update') {
    sendJsonResponse(res, 404, { success: false, error: '接口不存在' })
    return
  }

  try {
    const body = await readJsonRequestBody(req)
    const source = asRecord(body)
    const params = buildHttpConversionParams(body)
    if (!params.inputDir.trim()) {
      sendJsonResponse(res, 400, { success: false, error: 'inputDir 不能为空' })
      return
    }

    const logs: ConversionLogEntry[] = []
    const includeLogs = source.includeLogs === true
    const sender: ConversionEventSender = {
      send(channel, ...args) {
        if (!includeLogs) return
        logs.push({ channel, args })
        if (logs.length > 2000) logs.shift()
      },
    }

    const result = await startConversionTask(sender, params)
    sendJsonResponse(res, result.success ? 200 : 500, includeLogs ? { ...result, logs } : result)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    sendJsonResponse(res, 400, { success: false, error: message })
  }
}

function startMergeUpdateApiServer(): Promise<void> {
  if (mergeUpdateApiServer) return Promise.resolve()

  const port = getMergeUpdateApiPort()
  mergeUpdateApiPort = port

  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      handleMergeUpdateApiRequest(req, res).catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err)
        sendJsonResponse(res, 500, { success: false, error: message })
      })
    })

    server.on('error', reject)
    server.listen(port, '127.0.0.1', () => {
      mergeUpdateApiServer = server
      console.log(`Merge update API listening on http://127.0.0.1:${port}`)
      resolve()
    })
  })
}

function stopMergeUpdateApiServer(): void {
  if (!mergeUpdateApiServer) return
  mergeUpdateApiServer.close()
  mergeUpdateApiServer = null
  mergeUpdateApiPort = 0
}

// ─── Window management ────────────────────────────────────────────────
let win: BrowserWindow | null = null
const preload = path.join(__dirname, '../preload/index.mjs')
const indexHtml = path.join(RENDERER_DIST, 'index.html')

async function createWindow() {
  win = new BrowserWindow({
    title: '3DMine(osgb转3dtile工具)',
    icon: path.join(process.env.VITE_PUBLIC!, 'logo.png'),
    width: 1600,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    fullscreen: true,
    autoHideMenuBar: true,
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

app.whenReady().then(async () => {
  try {
  try {
    initDatabase()
  } catch (err: unknown) {
    console.error('[db] init failed: ' + (err instanceof Error ? err.message : String(err)))
  }
    await startMergeUpdateApiServer()
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`Merge update API 启动失败: ${message}`)
  }

  await createWindow()
})

app.on('window-all-closed', () => {
  win = null
  stopMergeUpdateApiServer()
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  stopMergeUpdateApiServer()
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
    edge_precision: 85,
    output_transparency: false,
    pbr: false,
  }
})

function run3dTileConversion(
  sender: ConversionEventSender,
  exePath: string,
  exeDir: string,
  gdalDataPath: string,
  inputDir: string,
  outputDir: string,
  configObj: Record<string, unknown>,
): Promise<void> {
  const configJson = JSON.stringify(configObj)

  return new Promise<void>((resolve, reject) => {
    try {
      conversionProcess = spawn(exePath, [
        '-i', inputDir,
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

      conversionProcess.stdout?.on('data', (data: Buffer) => {
        sender.send('conversion-stdout', data.toString('utf-8'))
      })

      conversionProcess.stderr?.on('data', (data: Buffer) => {
        sender.send('conversion-stderr', data.toString('utf-8'))
      })

      conversionProcess.on('close', (code) => {
        conversionProcess = null
        if (isCancelled) {
          reject(new Error('转换已取消'))
        } else if (code === 0) {
          resolve()
        } else {
          reject(new Error(`转换进程异常退出，退出码: ${code}`))
        }
      })

      conversionProcess.on('error', (err) => {
        conversionProcess = null
        const message = err.message.includes('ENOENT')
          ? `无法启动转换工具: ${exePath}，请确认文件存在`
          : `启动转换进程失败: ${err.message}`
        reject(new Error(message))
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      reject(new Error(`启动转换失败: ${message}`))
    }
  })
}

function applyOutputTransparencyWithLog(
  outputDir: string,
  config: ConversionConfigParams,
  sender: ConversionEventSender,
): void {
  const result = applyOutputTransparency(outputDir, config)
  if (!result.enabled) return

  sender.send(
    'conversion-stdout',
    `正在写入输出透明通道 (alpha=${result.opacity}%，${result.opacity < 100 ? 'BLEND' : '保持不透明、避免瓦片缝隙'}），已处理 ${result.processed} 个 b3dm/glb，跳过 ${result.skipped} 个\n`,
  )
}

function applyAggregationWithLog(
  outputDir: string,
  config: ConversionConfigParams,
  sender: ConversionEventSender,
): void {
  if (config.aggregate !== true) return
  const targetMB = config.aggregateTargetMB && config.aggregateTargetMB > 0 ? config.aggregateTargetMB : 30
  const maxMB = config.aggregateMaxMB && config.aggregateMaxMB > 0 ? config.aggregateMaxMB : 100
  sender.send('conversion-stdout', '?????????????? tile??? LOD?...\n')
  try {
    const stats = aggregateTiles(outputDir, { targetMB, maxMB, clean: true })
    sender.send(
      'conversion-stdout',
      `??????: ${stats.beforeTiles} -> ${stats.afterTiles} ?????? ${stats.reduction.toFixed(1)} ????? ${stats.mergeGroups} ?????? ${stats.cleanedFiles} ???\n`,
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    sender.send('conversion-stderr', `??????: ${message}\n`)
  }
}

async function startConversionFromParams(
  sender: ConversionEventSender,
  params: ConversionParams,
): Promise<ConversionResult> {
  const { inputDir, config } = params
  const outputDir = params.outputDir && params.outputDir.trim()
    ? params.outputDir
    : getDefaultOutputDir(inputDir)

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

  // Set GDAL_DATA environment variable so GDAL can find its data files
  const gdalDataPath = path.join(exeDir, 'gdal_data')

  isCancelled = false

  let conversionInputDir = inputDir
  let tempMergeDir: string | null = null
  const updateDirs = normalizeUpdateDirs(inputDir, params.updateDirs)

  try {
    assertSafeOutputDirectory(inputDir, outputDir, updateDirs)
    clearOutputDirectory(outputDir)
    sender.send('conversion-stdout', `已清空输出目录: ${outputDir}\n`)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    sender.send('conversion-status', 'error')
    return { success: false, error: `清空输出目录失败: ${message}`, outputDir }
  }

  if (updateDirs.length > 0) {
    const baseConfigObj = buildConversionConfig(config, inputDir)

    // 单独转换产物持久化到 outputDir 的兄弟目录（避开合并输出目录，避免被聚合/清理波及）
    const sourceTilesDir = outputDir + '_source_tiles'
    const updateTilesDir = outputDir + '_update_tiles'
    try {
      clearOutputDirectory(sourceTilesDir)
      clearOutputDirectory(updateTilesDir)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      sender.send('conversion-stderr', `清理单独转换目录失败: ${message}\n`)
    }

    lastOutputDir = outputDir
    lastConfigX = baseConfigObj.x !== undefined ? Number(baseConfigObj.x) : 0
    lastConfigY = baseConfigObj.y !== undefined ? Number(baseConfigObj.y) : 0
    lastConfigOffset = Number(baseConfigObj.offset ?? 0)

    sender.send('conversion-status', 'running')
    const tempUpdateDirs: string[] = []
    try {
      sender.send('conversion-stdout', `开始 3D Tiles 分阶段合并：先分别单独转换大范围/小范围，再合并，共 ${updateDirs.length} 个小范围更新目录\n`)

      // 1. 单独转换大范围（持久保留，供前台切换查看）
      sender.send('conversion-stdout', `大范围转换参数: ${JSON.stringify(baseConfigObj)}\n`)
      sender.send('conversion-stdout', `单独转换大范围: ${inputDir}\n`)
      await run3dTileConversion(sender, exePath, exeDir, gdalDataPath, inputDir, sourceTilesDir, baseConfigObj)

      const baseOrigin = getCoverageOrigin(inputDir, baseConfigObj)
      if (!baseOrigin) {
        throw new Error('无法确定大范围转换原点，不能进行 3D Tiles 合并')
      }

      // 2. 单独转换小范围（第一个持久保留，其余作为合并输入用临时目录）
      const convertedUpdates: Array<{ outputDir: string; deltaToBase: CoordinateDelta }> = []
      for (let index = 0; index < updateDirs.length; index++) {
        const updateDir = updateDirs[index]!
        assertCompatibleMetadata(inputDir, updateDir)

        const updateConfigObj = buildConversionConfig(config, updateDir)
        const updateOrigin = getCoverageOrigin(updateDir, updateConfigObj)
        if (!updateOrigin) {
          throw new Error(`无法确定小范围转换原点: ${updateDir}`)
        }

        let updateOutputDir: string
        if (index === 0) {
          updateOutputDir = updateTilesDir
        } else {
          const tempUpdateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tiles-update-'))
          tempUpdateDirs.push(tempUpdateDir)
          updateOutputDir = tempUpdateDir
        }
        sender.send('conversion-stdout', `小范围转换参数 ${index + 1}/${updateDirs.length}: ${JSON.stringify(updateConfigObj)}\n`)
        sender.send('conversion-stdout', `单独转换小范围 ${index + 1}/${updateDirs.length}: ${updateDir}\n`)
        await run3dTileConversion(sender, exePath, exeDir, gdalDataPath, updateDir, updateOutputDir, updateConfigObj)

        convertedUpdates.push({
          outputDir: updateOutputDir,
          deltaToBase: {
            x: updateOrigin.x - baseOrigin.x,
            y: updateOrigin.y - baseOrigin.y,
            z: updateOrigin.z - baseOrigin.z,
          },
        })
      }

      // 3. 合并：大范围作为底图，接入小范围（大范围/小范围单独产物目录不被修改）
      sender.send('conversion-stdout', '正在 3D Tiles 层裁剪大范围并合并小范围\n')
      const mergeResult = mergeConvertedTilesets(
        sourceTilesDir,
        convertedUpdates,
        outputDir,
        config.edge_precision,
      )
      sender.send(
        'conversion-stdout',
        `3D Tiles 合并完成，边缘精细度 ${mergeResult.edgePrecision}%，覆盖细瓦片 ${mergeResult.coverageTileCount} 个，裁剪大范围瓦片节点 ${mergeResult.removedBaseTiles} 个，接入小范围瓦片节点 ${mergeResult.addedUpdateTiles} 个，补齐空洞瓦片节点 ${mergeResult.filledHoleCount ?? 0} 个，裁剪大范围几何 ${mergeResult.cutBaseTiles ?? 0} 个瓦片 / ${mergeResult.cutBaseTriangles ?? 0} 个三角形\n`,
      )

      // 4. 透明通道：合并结果 + 大范围单独产物 + 小范围单独产物统一写入
      applyOutputTransparencyWithLog(outputDir, config, sender)
      applyOutputTransparencyWithLog(sourceTilesDir, config, sender)
      applyOutputTransparencyWithLog(updateTilesDir, config, sender)

      if (config.aggregate === true) {
        setImmediate(() => applyAggregationWithLog(outputDir, config, sender))
      }
      sender.send('conversion-status', 'success')
      return {
        success: true,
        outputDir,
        sourceTilesPath: sourceTilesDir,
        updateTilesPath: updateTilesDir,
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      sender.send('conversion-status', isCancelled ? 'cancelled' : 'error')
      return { success: false, error: message }
    } finally {
      for (const dir of tempUpdateDirs) {
        try { fs.rmSync(dir, { recursive: true, force: true }) } catch {}
      }
    }
  }

  if (updateDirs.length > 0) {
    try {
      sender.send('conversion-stdout', `开始合并 OSGB 更新目录，共 ${updateDirs.length} 个\n`)
      const mergeInfo = createMergedOsgbInput(inputDir, updateDirs)
      conversionInputDir = mergeInfo.inputDir
      tempMergeDir = mergeInfo.tempDir
      sender.send(
        'conversion-stdout',
        `OSGB 合并完成: 大范围瓦片 ${mergeInfo.baseTileCount} 个，更新瓦片 ${mergeInfo.updateTileCount} 个，替换 ${mergeInfo.replacedTileCount} 个，新增 ${mergeInfo.addedTileCount} 个\n`,
      )
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      sender.send('conversion-stderr', `OSGB 合并失败: ${message}`)
      sender.send('conversion-status', 'error')
      cleanupMergedOsgbInput(tempMergeDir)
      return { success: false, error: `OSGB 合并失败: ${message}` }
    }
  }

  return new Promise<{ success: boolean; error?: string; outputDir?: string }>((resolve) => {
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
        sender.send('conversion-stdout', text)
      })

      // Stream stderr
      conversionProcess.stderr?.on('data', (data: Buffer) => {
        const text = data.toString('utf-8')
        sender.send('conversion-stderr', text)
      })

      // Handle process exit
      conversionProcess.on('close', (code) => {
        conversionProcess = null
        cleanupMergedOsgbInput(tempMergeDir)
        if (isCancelled) {
          sender.send('conversion-status', 'cancelled')
          resolve({ success: false, error: '转换已取消' })
        } else if (code === 0) {
          applyOutputTransparencyWithLog(outputDir, config, sender)
          if (config.aggregate === true) {
            setImmediate(() => applyAggregationWithLog(outputDir, config, sender))
          }
          sender.send('conversion-status', 'success')
          resolve({ success: true, outputDir })
        } else {
          sender.send('conversion-status', 'error')
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
        sender.send('conversion-stderr', message)
        sender.send('conversion-status', 'error')
        resolve({ success: false, error: message })
      })

      sender.send('conversion-status', 'running')
    } catch (err: unknown) {
      cleanupMergedOsgbInput(tempMergeDir)
      const message = err instanceof Error ? err.message : String(err)
      sender.send('conversion-status', 'error')
      resolve({ success: false, error: `启动转换失败: ${message}` })
    }
  })
}

// Start conversion
// ??? Auth / records IPC ??????????????????????????????????????????????
ipcMain.handle('auth-login', (_event, username: unknown, password: unknown) => {
  if (!db) return { success: false, error: '数据库未初始化' }
  const row = db.prepare('SELECT id, username, role FROM users WHERE username = ? AND password = ?').get(
    String(username ?? ''),
    String(password ?? ''),
  ) as { id: number; username: string; role: string } | undefined
  if (!row) return { success: false, error: '用户名或密码错误' }
  return { success: true, user: { id: row.id, username: row.username, role: row.role } }
})

ipcMain.handle('records-list', () => {
  if (!db) return []
  return db.prepare('SELECT * FROM records ORDER BY id DESC').all() as unknown[]
})

ipcMain.handle('records-list-by-batch', (_event, batchId: unknown) => {
  if (!db) return []
  return db.prepare('SELECT * FROM records WHERE batch_id = ? ORDER BY id DESC').all(Number(batchId)) as unknown[]
})

ipcMain.handle('records-add', (_event, record: Record<string, unknown>) => {
  if (!db) return { success: false, error: '数据库未初始化' }
  const result = db.prepare(
    'INSERT INTO records (batch_id, name, input_dir, output_dir, status, tile_count, duration_sec, source_name, source_path, update_name, update_path, merged_name, merged_path, source_tiles_path, update_tiles_path, transparent, edge_precision, aggregate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  ).run(
    Number(record.batch_id ?? 0) || null,
    String(record.name ?? ''),
    String(record.input_dir ?? ''),
    String(record.output_dir ?? ''),
    String(record.status ?? 'idle'),
    Number(record.tile_count ?? 0),
    Number(record.duration_sec ?? 0),
    String(record.source_name ?? ''),
    String(record.source_path ?? ''),
    String(record.update_name ?? ''),
    String(record.update_path ?? ''),
    String(record.merged_name ?? ''),
    String(record.merged_path ?? ''),
    String(record.source_tiles_path ?? ''),
    String(record.update_tiles_path ?? ''),
    Number(record.transparent ?? 2),
    Number(record.edge_precision ?? 85),
    Number(record.aggregate ?? 2),
  )
  return { success: true, id: Number(result.lastInsertRowid) }
})

ipcMain.handle('records-update', (_event, id: unknown, patch: Record<string, unknown>) => {
  if (!db) return { success: false, error: '数据库未初始化' }
  const sets: string[] = []
  const vals: unknown[] = []
  for (const key of ['name', 'input_dir', 'output_dir', 'status', 'tile_count', 'duration_sec', 'batch_id', 'source_name', 'source_path', 'update_name', 'update_path', 'merged_name', 'merged_path', 'source_tiles_path', 'update_tiles_path', 'transparent', 'edge_precision', 'aggregate']) {
    if (patch[key] !== undefined) {
      sets.push(key + ' = ?')
      vals.push(patch[key])
    }
  }
  if (sets.length === 0) return { success: false, error: '无更新字段' }
  vals.push(Number(id))
  db.prepare('UPDATE records SET ' + sets.join(', ') + ' WHERE id = ?').run(...(vals as any[]))
  return { success: true }
})

// 日更批次表
ipcMain.handle('batches-list', () => {
  if (!db) return []
  return db.prepare('SELECT * FROM batches ORDER BY id DESC').all() as unknown[]
})

ipcMain.handle('batches-add', (_event, batch: Record<string, unknown>) => {
  if (!db) return { success: false, error: '数据库未初始化' }
  const name = String(batch.name ?? '').trim()
  if (!name) return { success: false, error: '批次名称不能为空' }
  const result = db.prepare('INSERT INTO batches (name, description) VALUES (?, ?)').run(name, String(batch.description ?? ''))
  return { success: true, id: Number(result.lastInsertRowid) }
})

ipcMain.handle('batches-delete', (_event, id: unknown) => {
  if (!db) return { success: false, error: '数据库未初始化' }
  const batchId = Number(id)
  db.prepare('DELETE FROM batches WHERE id = ?').run(batchId)
  db.prepare('DELETE FROM records WHERE batch_id = ?').run(batchId)
  return { success: true }
})

ipcMain.handle('records-delete', (_event, id: unknown) => {
  if (!db) return { success: false, error: '数据库未初始化' }
  db.prepare('DELETE FROM records WHERE id = ?').run(Number(id))
  return { success: true }
})

// Start conversion
ipcMain.handle('start-conversion', async (event, params: ConversionParams) => {
  return startConversionTask(event.sender, params)
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

// Start serving 3D Tiles over HTTP for in-app (front page) preview
ipcMain.handle('preview-serve', async (_event, params?: {
  outputDir?: string
}) => {
  const outDir = params?.outputDir || lastOutputDir
  if (!outDir) {
    return { success: false, error: '没有可预览的输出目录' }
  }
  const tilesetPath = path.join(outDir, 'tileset.json')
  if (!fs.existsSync(tilesetPath)) {
    return { success: false, error: `未找到 tileset.json: ${tilesetPath}` }
  }
  try {
    // Stop any existing preview server, then serve the selected output dir
    stopStaticServer()
    const port = await findFreePort()
    previewServer = await startStaticServer(outDir, port)
    previewPort = port
    lastOutputDir = outDir
    return { success: true, port, url: `http://localhost:${port}/tileset.json` }
  } catch (err: unknown) {
    stopStaticServer()
    const message = err instanceof Error ? err.message : String(err)
    return { success: false, error: `启动预览服务失败: ${message}` }
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
