import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'
import { spawn, type ChildProcess } from 'node:child_process'

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
    centerOverlapRatio: Math.max(removeOverlapRatio - 0.2, 0.5),
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

function scanMaxOsgbLevel(rootDir: string): number | null {
  const dataDir = getOsgbDataDir(rootDir)
  if (!fs.existsSync(dataDir) || !fs.statSync(dataDir).isDirectory()) return null

  let maxLevel: number | null = null
  const scanDir = (dirPath: string): void => {
    for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
      const entryPath = path.join(dirPath, entry.name)
      if (entry.isDirectory()) {
        scanDir(entryPath)
        continue
      }
      if (!entry.isFile() || !entry.name.toLowerCase().endsWith('.osgb')) continue

      const matches = entry.name.matchAll(/_L(\d+)(?:_|\.|$)/gi)
      for (const match of matches) {
        const level = Number(match[1])
        if (Number.isInteger(level)) {
          maxLevel = maxLevel === null ? level : Math.max(maxLevel, level)
        }
      }
    }
  }

  scanDir(dataDir)
  return maxLevel
}

function resolveAutoMaxLevel(inputDir: string, updateDirs: string[], params: HeadlessMergeUpdateParams): number {
  const dirs = [inputDir, ...updateDirs]
  let maxLevel: number | null = null

  for (const dir of dirs) {
    const level = scanMaxOsgbLevel(dir)
    if (level !== null) {
      maxLevel = maxLevel === null ? level : Math.max(maxLevel, level)
    }
  }

  const resolved = maxLevel ?? 20
  emitStdout(params, maxLevel === null
    ? `未扫描到 OSGB 层级，max_lvl 使用默认值: ${resolved}\n`
    : `已扫描 OSGB 最大层级: ${resolved}\n`)
  return resolved
}

function prepareConversionConfig(
  config: HeadlessMergeUpdateConfig,
  inputDir: string,
  updateDirs: string[],
  params: HeadlessMergeUpdateParams,
): HeadlessMergeUpdateConfig {
  if (config.max_lvl !== undefined && config.max_lvl !== null) return config
  return {
    ...config,
    max_lvl: resolveAutoMaxLevel(inputDir, updateDirs, params),
  }
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

function boundsIntersectionArea(a: OsgbBounds, b: OsgbBounds): number {
  const width = Math.max(Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX), 0)
  const height = Math.max(Math.min(a.maxY, b.maxY) - Math.max(a.minY, b.minY), 0)
  return width * height
}

function coverageOverlapRatio(bounds: OsgbBounds, coverage: OsgbBounds[]): number {
  const area = boundsArea(bounds)
  if (area <= 0) return 0

  const intersectionArea = coverage.reduce((totalArea, cover) => {
    if (!boundsIntersects(cover, bounds)) return totalArea
    return totalArea + boundsIntersectionArea(cover, bounds)
  }, 0)

  return Math.min(intersectionArea / area, 1)
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

function shouldRemoveBaseTile(
  bounds: OsgbBounds,
  coverage: OsgbBounds[],
  _options: EdgePruneOptions,
): boolean {
  if (coverageContains(bounds, coverage)) return true
  return coverageIntersects(bounds, coverage)
}

function collectCoverageFromTileset(tilesetPath: string, deltaToBase: CoordinateDelta): OsgbBounds[] {
  const tileset = readJsonFile<TilesetJson>(tilesetPath)
  const coverage: OsgbBounds[] = []

  const collectTileCoverage = (
    tile: TileJson,
    tilesetDir: string,
    parentTransform?: number[],
    includeOwnTransform = true,
  ): void => {
    const tileTransform = includeOwnTransform
      ? getCombinedTransform(parentTransform, tile)
      : parentTransform
    const uri = getTileContentUri(tile)
    const isExternalTileset = !!uri && uri.toLowerCase().endsWith('tileset.json')

    if (isExternalTileset && uri) {
      const externalPath = path.resolve(tilesetDir, uri)
      if (fs.existsSync(externalPath)) {
        const externalTileset = readJsonFile<TilesetJson>(externalPath)
        if (externalTileset.root) {
          collectTileCoverage(externalTileset.root, path.dirname(externalPath), tileTransform)
        }
      }
    }

    if (tile.content && !isExternalTileset) {
      const bounds = getTileBounds(tile, tileTransform)
      if (bounds) coverage.push(translateBounds(bounds, deltaToBase))
    }

    tile.children?.forEach((child) => collectTileCoverage(child, tilesetDir, tileTransform))
  }

  if (tileset.root) {
    // The top-level transform georeferences the whole tileset. Coverage is
    // compared in the base tileset's local merge coordinate space instead.
    collectTileCoverage(tileset.root, path.dirname(tilesetPath), undefined, false)
  }

  return coverage
}

function pruneTilesetFile(
  tilesetPath: string,
  coverage: OsgbBounds[],
  options: EdgePruneOptions,
  parentTransform?: number[],
  skipRootTransform = false,
): { removed: number; empty: boolean } {
  const tileset = readJsonFile<TilesetJson>(tilesetPath)
  const tilesetDir = path.dirname(tilesetPath)
  let removed = 0

  const pruneTile = (
    tile: TileJson,
    inheritedTransform: number[] | undefined,
    keepTile: boolean,
    skipOwnTransform = false,
  ): boolean => {
    const tileTransform = skipOwnTransform
      ? inheritedTransform
      : getCombinedTransform(inheritedTransform, tile)
    const bounds = getTileBounds(tile, tileTransform)
    const uri = getTileContentUri(tile)
    const isExternalTileset = !!uri && uri.toLowerCase().endsWith('tileset.json')

    if (isExternalTileset && uri) {
      const externalPath = path.resolve(tilesetDir, uri)
      if (fs.existsSync(externalPath)) {
        const childResult = pruneTilesetFile(externalPath, coverage, options, tileTransform)
        removed += childResult.removed
        if (childResult.empty) return false
      }
    }

    if (tile.children) {
      tile.children = tile.children.filter((child) => pruneTile(child, tileTransform, false))
      if (tile.children.length === 0) delete tile.children
    }

    const removeTile = bounds && (
      isExternalTileset ? coverageContains(bounds, coverage) : shouldRemoveBaseTile(bounds, coverage, options)
    )

    if (bounds && removeTile) {
      if ((keepTile || (tile.children && tile.children.length > 0)) && !isExternalTileset) {
        if (tile.content) {
          delete tile.content
          removed++
        }
        return true
      }

      removed++
      return false
    }

    return true
  }

  if (tileset.root) {
    pruneTile(tileset.root, parentTransform, true, skipRootTransform)
  }

  const rootEmpty = !tileset.root?.content && (!tileset.root?.children || tileset.root.children.length === 0)
  writeJsonFile(tilesetPath, tileset)
  return { removed, empty: rootEmpty }
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

  const sourceCorners: Array<[number, number, number]> = [
    [bounds.minX, bounds.minY, bounds.minZ],
    [bounds.minX, bounds.minY, bounds.maxZ],
    [bounds.minX, bounds.maxY, bounds.minZ],
    [bounds.minX, bounds.maxY, bounds.maxZ],
    [bounds.maxX, bounds.minY, bounds.minZ],
    [bounds.maxX, bounds.minY, bounds.maxZ],
    [bounds.maxX, bounds.maxY, bounds.minZ],
    [bounds.maxX, bounds.maxY, bounds.maxZ],
  ]
  const corners = sourceCorners.map((corner) => transformPoint(root.transform, corner))

  const min = [Infinity, Infinity, Infinity]
  const max = [-Infinity, -Infinity, -Infinity]
  for (const corner of corners) {
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
} {
  prepareMergedOutputDirectory(outputDir)

  fs.cpSync(baseOutputDir, outputDir, { recursive: true })
  const edgeOptions = buildEdgePruneOptions(edgePrecisionValue)

  const coverage = normalizeCoverageBounds(updateOutputDirs.flatMap((update) => (
    collectCoverageFromTileset(path.join(update.outputDir, 'tileset.json'), update.deltaToBase)
  )))
  const outputTilesetPath = path.join(outputDir, 'tileset.json')
  const pruneResult = pruneTilesetFile(outputTilesetPath, coverage, edgeOptions, undefined, true)
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

    const graftedTile = cloneTile(updateRoot)
    // The update root has its own top-level georeference. It must be replaced
    // by the base-local delta when grafted under the base root.
    graftedTile.transform = makeTranslationTransform(update.deltaToBase)
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
  return {
    removedBaseTiles: pruneResult.removed,
    addedUpdateTiles,
    coverageTileCount: coverage.length,
    edgePrecision: edgeOptions.edgePrecision,
  }
}

export interface HeadlessMergeUpdateConfig {
  x?: number | string
  y?: number | string
  offset?: number
  max_lvl?: number
  edge_precision?: number
  pbr?: boolean
}

export interface HeadlessMergeUpdateParams {
  inputDir: string
  outputDir?: string
  updateDirs?: string[]
  config?: HeadlessMergeUpdateConfig
  toolDir?: string
  exePath?: string
  onStdout?: (text: string) => void
  onStderr?: (text: string) => void
  onStatus?: (status: 'running' | 'success' | 'error' | 'cancelled') => void
}

interface PreparedInputDirs {
  inputDir: string
  updateDirs?: string[]
  cleanupDir: string | null
}

export interface HeadlessMergeUpdateResult {
  success: boolean
  error?: string
  outputDir?: string
}

let conversionProcess: ChildProcess | null = null
let isCancelled = false

function getDefaultToolDir(): string {
  return path.resolve(process.cwd(), 'public', '3dtile')
}

function getHeadlessExePath(params: HeadlessMergeUpdateParams): string {
  if (params.exePath) return path.resolve(params.exePath)
  const toolDir = params.toolDir ? path.resolve(params.toolDir) : getDefaultToolDir()
  return path.join(toolDir, process.platform === 'win32' ? '3dtile.exe' : '3dtile')
}

function emitStdout(params: HeadlessMergeUpdateParams, text: string): void {
  params.onStdout?.(text)
}

function emitStderr(params: HeadlessMergeUpdateParams, text: string): void {
  params.onStderr?.(text)
}

function emitStatus(params: HeadlessMergeUpdateParams, status: 'running' | 'success' | 'error' | 'cancelled'): void {
  params.onStatus?.(status)
}

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value)
}

function safePathPart(value: string): string {
  const cleaned = value.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').replace(/\.+$/g, '')
  return cleaned || 'download'
}

function fileNameFromUrl(url: string): string {
  const parsed = new URL(url)
  const name = decodeURIComponent(parsed.pathname.split('/').filter(Boolean).pop() ?? '')
  return safePathPart(name || 'download')
}

function looksLikeArchiveUrl(url: string): boolean {
  return /\.(zip|tar\.gz|tgz)$/i.test(new URL(url).pathname)
}

async function fetchOk(url: string): Promise<Response> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`下载失败 ${response.status} ${response.statusText}: ${url}`)
  }
  return response
}

async function downloadFile(url: string, outputPath: string): Promise<void> {
  const response = await fetchOk(url)
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  const bytes = Buffer.from(await response.arrayBuffer())
  fs.writeFileSync(outputPath, bytes)
}

function stripHtmlTags(text: string): string {
  return text.replace(/<[^>]*>/g, '')
}

function decodeHtmlEntity(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function parseDirectoryLinks(html: string, baseUrl: string): string[] {
  const links: string[] = []
  const pattern = /<a\b[^>]*\bhref\s*=\s*(["'])(.*?)\1/gi
  let match: RegExpExecArray | null

  while ((match = pattern.exec(html))) {
    const rawHref = decodeHtmlEntity(stripHtmlTags(match[2] ?? '').trim())
    if (!rawHref || rawHref === '../' || rawHref === './' || rawHref.startsWith('#')) continue
    if (/^(mailto|javascript):/i.test(rawHref)) continue

    const nextUrl = new URL(rawHref, baseUrl).toString()
    const base = new URL(baseUrl)
    const next = new URL(nextUrl)
    if (next.origin !== base.origin) continue
    if (!next.pathname.startsWith(base.pathname.endsWith('/') ? base.pathname : `${base.pathname}/`)) continue
    links.push(nextUrl)
  }

  return Array.from(new Set(links))
}

async function extractZip(zipPath: string, outputDir: string): Promise<void> {
  fs.mkdirSync(outputDir, { recursive: true })
  await new Promise<void>((resolve, reject) => {
    const child = spawn('powershell.exe', [
      '-NoProfile',
      '-ExecutionPolicy',
      'Bypass',
      '-Command',
      'Expand-Archive -LiteralPath $args[0] -DestinationPath $args[1] -Force',
      zipPath,
      outputDir,
    ], {
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    })

    let stderr = ''
    child.stderr?.on('data', (data: Buffer) => {
      stderr += data.toString('utf-8')
    })
    child.on('close', (code) => {
      code === 0 ? resolve() : reject(new Error(`解压 zip 失败: ${stderr || code}`))
    })
    child.on('error', reject)
  })
}

async function extractTarGz(archivePath: string, outputDir: string): Promise<void> {
  fs.mkdirSync(outputDir, { recursive: true })
  await new Promise<void>((resolve, reject) => {
    const child = spawn('tar.exe', ['-xzf', archivePath, '-C', outputDir], {
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    })

    let stderr = ''
    child.stderr?.on('data', (data: Buffer) => {
      stderr += data.toString('utf-8')
    })
    child.on('close', (code) => {
      code === 0 ? resolve() : reject(new Error(`解压 tar.gz 失败: ${stderr || code}`))
    })
    child.on('error', reject)
  })
}

function findOsgbRoot(dirPath: string): string {
  if (fs.existsSync(path.join(dirPath, 'Data'))) return dirPath
  const entries = fs.existsSync(dirPath) ? fs.readdirSync(dirPath, { withFileTypes: true }) : []
  const dirs = entries.filter((entry) => entry.isDirectory())
  if (dirs.length === 1) {
    const nested = path.join(dirPath, dirs[0]!.name)
    if (fs.existsSync(path.join(nested, 'Data'))) return nested
  }
  return dirPath
}

async function downloadHttpDirectory(url: string, outputDir: string): Promise<void> {
  const baseUrl = url.endsWith('/') ? url : `${url}/`
  const visited = new Set<string>()

  const visit = async (currentUrl: string): Promise<void> => {
    if (visited.has(currentUrl)) return
    visited.add(currentUrl)

    const response = await fetchOk(currentUrl)
    const contentType = response.headers.get('content-type') ?? ''
    if (!contentType.includes('text/html')) {
      const relative = decodeURIComponent(new URL(currentUrl).pathname.slice(new URL(baseUrl).pathname.length))
      const targetPath = path.join(outputDir, ...relative.split('/').filter(Boolean).map(safePathPart))
      await downloadFile(currentUrl, targetPath || path.join(outputDir, fileNameFromUrl(currentUrl)))
      return
    }

    const html = await response.text()
    const links = parseDirectoryLinks(html, currentUrl)
    for (const link of links) {
      const parsed = new URL(link)
      if (parsed.pathname.endsWith('/')) {
        await visit(link)
      } else {
        const relative = decodeURIComponent(parsed.pathname.slice(new URL(baseUrl).pathname.length))
        const targetPath = path.join(outputDir, ...relative.split('/').filter(Boolean).map(safePathPart))
        await downloadFile(link, targetPath)
      }
    }
  }

  await visit(baseUrl)
}

async function prepareHttpInput(url: string, rootDir: string, name: string, params: HeadlessMergeUpdateParams): Promise<string> {
  const targetDir = path.join(rootDir, safePathPart(name))
  fs.mkdirSync(targetDir, { recursive: true })
  emitStdout(params, `下载远程 OSGB: ${url}\n`)

  if (looksLikeArchiveUrl(url)) {
    const archivePath = path.join(rootDir, `${safePathPart(name)}_${fileNameFromUrl(url)}`)
    await downloadFile(url, archivePath)
    if (/\.zip$/i.test(new URL(url).pathname)) {
      await extractZip(archivePath, targetDir)
    } else if (/\.(tar\.gz|tgz)$/i.test(new URL(url).pathname)) {
      await extractTarGz(archivePath, targetDir)
    }
    return findOsgbRoot(targetDir)
  }

  await downloadHttpDirectory(url, targetDir)
  return findOsgbRoot(targetDir)
}

async function prepareInputDirs(params: HeadlessMergeUpdateParams): Promise<PreparedInputDirs> {
  const inputDir = params.inputDir.trim()
  const updateDirs = params.updateDirs ?? []
  const hasRemoteInput = isHttpUrl(inputDir) || updateDirs.some(isHttpUrl)

  if (!hasRemoteInput) {
    return { inputDir, updateDirs, cleanupDir: null }
  }

  const cleanupDir = fs.mkdtempSync(path.join(os.tmpdir(), 'merge-update-http-'))
  const preparedInputDir = isHttpUrl(inputDir)
    ? await prepareHttpInput(inputDir, cleanupDir, 'original_scope', params)
    : inputDir

  const preparedUpdateDirs: string[] = []
  for (let index = 0; index < updateDirs.length; index++) {
    const updateDir = updateDirs[index]!
    preparedUpdateDirs.push(isHttpUrl(updateDir)
      ? await prepareHttpInput(updateDir, cleanupDir, `new_scope_${index}`, params)
      : updateDir)
  }

  return {
    inputDir: preparedInputDir,
    updateDirs: preparedUpdateDirs,
    cleanupDir,
  }
}

function runHeadless3dTileConversion(
  params: HeadlessMergeUpdateParams,
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
        emitStdout(params, data.toString('utf-8'))
      })

      conversionProcess.stderr?.on('data', (data: Buffer) => {
        emitStderr(params, data.toString('utf-8'))
      })

      conversionProcess.on('close', (code) => {
        conversionProcess = null
        if (isCancelled) {
          reject(new Error('?????'))
        } else if (code === 0) {
          resolve()
        } else {
          reject(new Error(`????????????: ${code}`))
        }
      })

      conversionProcess.on('error', (err) => {
        conversionProcess = null
        const message = err.message.includes('ENOENT')
          ? `????????: ${exePath}????????`
          : `????????: ${err.message}`
        reject(new Error(message))
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      reject(new Error(`??????: ${message}`))
    }
  })
}

export async function runHeadlessMergeUpdate(
  params: HeadlessMergeUpdateParams,
): Promise<HeadlessMergeUpdateResult> {
  if (!params.inputDir?.trim()) return { success: false, error: 'inputDir 不能为空' }

  let preparedDirs: PreparedInputDirs | null = null
  try {
    preparedDirs = await prepareInputDirs(params)
    const inputDir = preparedDirs.inputDir
    const inputConfig = params.config ?? {}
    const outputDir = params.outputDir && params.outputDir.trim()
      ? params.outputDir
      : getDefaultOutputDir(inputDir)
    const exePath = getHeadlessExePath(params)
    const exeDir = path.dirname(exePath)
    const gdalDataPath = path.join(exeDir, 'gdal_data')

    if (!fs.existsSync(exePath)) {
      return { success: false, error: `转换工具未找到: ${exePath}` }
    }

    isCancelled = false
    const updateDirs = normalizeUpdateDirs(inputDir, preparedDirs.updateDirs)
    const config = prepareConversionConfig(inputConfig, inputDir, updateDirs, params)

    try {
      assertSafeOutputDirectory(inputDir, outputDir, updateDirs)
      clearOutputDirectory(outputDir)
      emitStdout(params, `已清空输出目录: ${outputDir}\n`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      emitStatus(params, 'error')
      return { success: false, error: `清空输出目录失败: ${message}`, outputDir }
    }

    if (updateDirs.length > 0) {
      const tempConversionDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tiles-merge-'))
      const baseConfigObj = buildConversionConfig(config, inputDir)

      emitStatus(params, 'running')
      try {
        emitStdout(params, `开始 3D Tiles 分阶段合并，共 ${updateDirs.length} 个小范围更新目录\n`)

        const baseOutputDir = path.join(tempConversionDir, 'base')
        emitStdout(params, `大范围转换参数: ${JSON.stringify(baseConfigObj)}\n`)
        emitStdout(params, `转换大范围: ${inputDir}\n`)
        await runHeadless3dTileConversion(params, exePath, exeDir, gdalDataPath, inputDir, baseOutputDir, baseConfigObj)

        const baseOrigin = getCoverageOrigin(inputDir, baseConfigObj)
        if (!baseOrigin) {
          throw new Error('无法确定大范围转换原点，不能进行 3D Tiles 合并')
        }

        const convertedUpdates: Array<{ outputDir: string; deltaToBase: CoordinateDelta }> = []
        for (let index = 0; index < updateDirs.length; index++) {
          const updateDir = updateDirs[index]!
          assertCompatibleMetadata(inputDir, updateDir)

          const updateConfigObj = buildConversionConfig(config, updateDir)
          const updateOrigin = getCoverageOrigin(updateDir, updateConfigObj)
          if (!updateOrigin) {
            throw new Error(`无法确定小范围转换原点: ${updateDir}`)
          }

          const updateOutputDir = path.join(tempConversionDir, `update_${index}`)
          emitStdout(params, `小范围转换参数 ${index + 1}/${updateDirs.length}: ${JSON.stringify(updateConfigObj)}\n`)
          emitStdout(params, `转换小范围 ${index + 1}/${updateDirs.length}: ${updateDir}\n`)
          await runHeadless3dTileConversion(params, exePath, exeDir, gdalDataPath, updateDir, updateOutputDir, updateConfigObj)

          convertedUpdates.push({
            outputDir: updateOutputDir,
            deltaToBase: {
              x: updateOrigin.x - baseOrigin.x,
              y: updateOrigin.y - baseOrigin.y,
              z: updateOrigin.z - baseOrigin.z,
            },
          })
        }

        emitStdout(params, '正在 3D Tiles 层裁剪大范围并合并小范围\n')
        const mergeResult = mergeConvertedTilesets(
          baseOutputDir,
          convertedUpdates,
          outputDir,
          config.edge_precision,
        )
        emitStdout(
          params,
          `3D Tiles 合并完成，边缘精细度 ${mergeResult.edgePrecision}%，覆盖细瓦片 ${mergeResult.coverageTileCount} 个，裁剪大范围瓦片节点 ${mergeResult.removedBaseTiles} 个，接入小范围瓦片节点 ${mergeResult.addedUpdateTiles} 个\n`,
        )
        emitStatus(params, 'success')
        return { success: true, outputDir }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        emitStatus(params, isCancelled ? 'cancelled' : 'error')
        return { success: false, error: message, outputDir }
      } finally {
        cleanupMergedOsgbInput(tempConversionDir)
      }
    }

    const configObj = buildConversionConfig(config, inputDir)
    emitStatus(params, 'running')
    try {
      emitStdout(params, `转换参数: ${JSON.stringify(configObj)}\n`)
      await runHeadless3dTileConversion(params, exePath, exeDir, gdalDataPath, inputDir, outputDir, configObj)
      emitStatus(params, 'success')
      return { success: true, outputDir }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      emitStatus(params, isCancelled ? 'cancelled' : 'error')
      return { success: false, error: message, outputDir }
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    emitStatus(params, 'error')
    return { success: false, error: message }
  } finally {
    cleanupMergedOsgbInput(preparedDirs?.cleanupDir ?? null)
  }
}

export function cancelHeadlessMergeUpdate(): boolean {
  if (!conversionProcess) return false
  isCancelled = true
  conversionProcess.kill('SIGTERM')
  return true
}
