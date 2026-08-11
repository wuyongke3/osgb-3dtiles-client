import fs from 'node:fs'
import path from 'node:path'

// ??? GLB / B3DM helpers ?????????????????????????????????????????????

function parseB3dm(buf: Buffer): { glb: Buffer } {
  if (buf.length < 28 || buf.toString('ascii', 0, 4) !== 'b3dm') throw new Error('not a b3dm')
  const ftJsonLen = buf.readUInt32LE(12)
  const ftBinLen = buf.readUInt32LE(16)
  const btJsonLen = buf.readUInt32LE(20)
  const btBinLen = buf.readUInt32LE(24)
  const glbOffset = 28 + ftJsonLen + ftBinLen + btJsonLen + btBinLen
  if (glbOffset + 12 > buf.length || buf.toString('ascii', glbOffset, glbOffset + 4) !== 'glTF') throw new Error('no glb inside b3dm')
  return { glb: buf.subarray(glbOffset) }
}

function parseGlb(glb: Buffer): { json: Record<string, any>; bin: Buffer } {
  if (glb.length < 20 || glb.toString('ascii', 0, 4) !== 'glTF') throw new Error('not a glb')
  const version = glb.readUInt32LE(4)
  if (version !== 2) throw new Error('unsupported glb version ' + version)
  const chunks: Array<{ type: number; data: Buffer }> = []
  let off = 12
  while (off + 8 <= glb.length) {
    const len = glb.readUInt32LE(off)
    const type = glb.readUInt32LE(off + 4)
    chunks.push({ type, data: glb.subarray(off + 8, off + 8 + len) })
    off += 8 + len
  }
  const jsonChunk = chunks.find((c) => c.type === 0x4e4f534a)
  const binChunk = chunks.find((c) => c.type === 0x4e4942)
  if (!jsonChunk) throw new Error('no json chunk')
  const json = JSON.parse(jsonChunk.data.toString('utf8').replace(/[\u0000\s]+$/g, ''))
  return { json, bin: binChunk ? binChunk.data : Buffer.alloc(0) }
}

function pad4(buf: Buffer): Buffer {
  const pad = (4 - (buf.length % 4)) % 4
  return pad ? Buffer.concat([buf, Buffer.alloc(pad, 0)]) : buf
}

function padJson(buf: Buffer): Buffer {
  const pad = (4 - (buf.length % 4)) % 4
  return Buffer.concat([buf, Buffer.alloc(pad, 0x20)])
}

function buildGlb(json: Record<string, any>, bin: Buffer): Buffer {
  const jsonBuf = padJson(Buffer.from(JSON.stringify(json), 'utf8'))
  const binBuf = pad4(bin)
  const total = 12 + 8 + jsonBuf.length + 8 + binBuf.length
  const out = Buffer.alloc(total)
  out.write('glTF', 0, 'ascii')
  out.writeUInt32LE(2, 4)
  out.writeUInt32LE(total, 8)
  let o = 12
  out.writeUInt32LE(jsonBuf.length, o); out.writeUInt32LE(0x4e4f534a, o + 4); jsonBuf.copy(out, o + 8); o += 8 + jsonBuf.length
  out.writeUInt32LE(binBuf.length, o); out.writeUInt32LE(0x4e4942, o + 4); binBuf.copy(out, o + 8)
  return out
}

function buildB3dm(glb: Buffer): Buffer {
  // GLB must start at a 4-byte boundary inside the b3dm; pad the feature table
  // JSON with spaces (valid JSON whitespace).
  const ftJson = padJson(Buffer.from('{}', 'utf8'))
  const header = Buffer.alloc(28)
  header.write('b3dm', 0, 'ascii')
  header.writeUInt32LE(1, 4)
  header.writeUInt32LE(28 + ftJson.length + glb.length, 8)
  header.writeUInt32LE(ftJson.length, 12)
  header.writeUInt32LE(0, 16)
  header.writeUInt32LE(0, 20)
  header.writeUInt32LE(0, 24)
  return Buffer.concat([header, ftJson, glb])
}

// ??? Merge GLBs ?????????????????????????????????????????????????????

function mergeGlbs(sources: Array<{ glb: Buffer; transform: number[] | null }>): Buffer {
  const merged: Record<string, any> = {
    asset: { version: '2.0', generator: 'tile-aggregator' },
    scene: 0,
    scenes: [{ nodes: [] }],
    nodes: [],
    meshes: [],
    accessors: [],
    bufferViews: [],
    buffers: [{ byteLength: 0 }],
    materials: [],
    textures: [],
    images: [],
    samplers: [],
    extensionsUsed: [],
    extensionsRequired: [],
    extensions: {},
  }
  const binParts: Buffer[] = []
  let binLen = 0
  const extSet = new Set<string>()
  const addExt = (list: unknown): void => {
    if (Array.isArray(list)) list.forEach((e) => extSet.add(String(e)))
  }

  for (const src of sources) {
    const { json, bin } = parseGlb(src.glb)
    addExt(json.extensionsUsed)
    addExt(json.extensionsRequired)

    const bvOffset = merged.bufferViews.length
    const accOffset = merged.accessors.length
    const matOffset = merged.materials.length
    const texOffset = merged.textures.length
    const imgOffset = merged.images.length
    const sampOffset = merged.samplers.length
    const meshOffset = merged.meshes.length
    const nodeOffset = merged.nodes.length
    const ext = merged.extensions
    const khr = ext.KHR_techniques_webgl || (ext.KHR_techniques_webgl = { programs: [], shaders: [], techniques: [] })
    const progOffset = khr.programs.length
    const shaderOffset = khr.shaders.length
    const techOffset = khr.techniques.length

    const aligned = pad4(bin.length ? bin : Buffer.alloc(0))
    const binStart = binLen
    binParts.push(aligned)
    binLen += aligned.length

    for (const bv of (json.bufferViews || [])) {
      merged.bufferViews.push({
        buffer: 0,
        byteOffset: (bv.byteOffset || 0) + binStart,
        byteLength: bv.byteLength,
        ...(bv.byteStride !== undefined ? { byteStride: bv.byteStride } : {}),
        ...(bv.target !== undefined ? { target: bv.target } : {}),
      })
    }
    for (const a of (json.accessors || [])) {
      const na: Record<string, any> = { bufferView: a.bufferView + bvOffset, componentType: a.componentType, count: a.count, type: a.type }
      if (a.byteOffset !== undefined) na.byteOffset = a.byteOffset
      if (a.normalized !== undefined) na.normalized = a.normalized
      if (a.min !== undefined) na.min = a.min
      if (a.max !== undefined) na.max = a.max
      merged.accessors.push(na)
    }

    const srcKhr = json.extensions && json.extensions.KHR_techniques_webgl
    if (srcKhr) {
      for (const p of (srcKhr.programs || [])) {
        khr.programs.push({
          attributes: p.attributes ? p.attributes.slice() : undefined,
          fragmentShader: p.fragmentShader + shaderOffset,
          vertexShader: p.vertexShader + shaderOffset,
        })
      }
      for (const s of (srcKhr.shaders || [])) {
        khr.shaders.push({ bufferView: s.bufferView + bvOffset, type: s.type })
      }
      for (const t of (srcKhr.techniques || [])) {
        khr.techniques.push({ attributes: t.attributes, program: t.program + progOffset, states: t.states, uniforms: t.uniforms })
      }
    }

    for (const m of (json.materials || [])) {
      const nm: Record<string, any> = { ...m }
      if (m.extensions && m.extensions.KHR_techniques_webgl) {
        nm.extensions = {
          ...m.extensions,
          KHR_techniques_webgl: {
            technique: m.extensions.KHR_techniques_webgl.technique + techOffset,
            values: m.extensions.KHR_techniques_webgl.values,
          },
        }
      }
      merged.materials.push(nm)
    }
    for (const t of (json.textures || [])) {
      const nt: Record<string, any> = {}
      if (t.sampler !== undefined) nt.sampler = t.sampler + sampOffset
      if (t.source !== undefined) nt.source = t.source + imgOffset
      if (t.name !== undefined) nt.name = t.name
      if (t.extensions) nt.extensions = t.extensions
      merged.textures.push(nt)
    }
    for (const img of (json.images || [])) {
      const ni: Record<string, any> = {}
      if (img.bufferView !== undefined) ni.bufferView = img.bufferView + bvOffset
      if (img.mimeType !== undefined) ni.mimeType = img.mimeType
      if (img.uri !== undefined) ni.uri = img.uri
      if (img.name !== undefined) ni.name = img.name
      merged.images.push(ni)
    }
    for (const s of (json.samplers || [])) merged.samplers.push(s)

    for (const mesh of (json.meshes || [])) {
      const nm: Record<string, any> = { primitives: [] }
      for (const prim of mesh.primitives) {
        const np: Record<string, any> = { attributes: {} }
        for (const [k, v] of Object.entries(prim.attributes)) np.attributes[k] = (v as number) + accOffset
        if (prim.indices !== undefined) np.indices = (prim.indices as number) + accOffset
        if (prim.material !== undefined) np.material = (prim.material as number) + matOffset
        if (prim.mode !== undefined) np.mode = prim.mode
        if (prim.targets) np.targets = (prim.targets as any[]).map((t) => {
          const nt: Record<string, any> = {}
          for (const [k, v] of Object.entries(t)) nt[k] = (v as number) + accOffset
          return nt
        })
        if (prim.extensions) np.extensions = prim.extensions
        nm.primitives.push(np)
      }
      if (mesh.weights) nm.weights = mesh.weights
      if (mesh.name !== undefined) nm.name = mesh.name
      merged.meshes.push(nm)
    }

    const srcNodes = json.nodes || []
    const idMap = new Map<number, number>()
    for (let i = 0; i < srcNodes.length; i++) idMap.set(i, nodeOffset + i)
    const topLevel: number[] = (json.scenes && json.scenes[0] && json.scenes[0].nodes) || (srcNodes.length ? [0] : [])
    for (let i = 0; i < srcNodes.length; i++) {
      const n = srcNodes[i]
      const nn: Record<string, any> = {}
      if (n.mesh !== undefined) nn.mesh = (n.mesh as number) + meshOffset
      if (n.children) nn.children = (n.children as number[]).map((c) => idMap.get(c))
      if (n.matrix) nn.matrix = (n.matrix as number[]).slice()
      if (n.translation) nn.translation = (n.translation as number[]).slice()
      if (n.rotation) nn.rotation = (n.rotation as number[]).slice()
      if (n.scale) nn.scale = (n.scale as number[]).slice()
      if (n.name !== undefined) nn.name = n.name
      if (n.extensions) nn.extensions = n.extensions
      merged.nodes.push(nn)
    }
    if (src.transform) {
      const wrapper = merged.nodes.length
      merged.nodes.push({ children: topLevel.map((t) => idMap.get(t)), matrix: (src.transform as number[]).slice() })
      merged.scenes[0].nodes.push(wrapper)
    } else {
      for (const t of topLevel) merged.scenes[0].nodes.push(idMap.get(t))
    }
  }

  merged.buffers[0].byteLength = binLen
  merged.extensionsUsed = Array.from(extSet)
  merged.extensionsRequired = Array.from(extSet)
  return buildGlb(merged, Buffer.concat(binParts, binLen))
}

// ??? Bounds helpers ?????????????????????????????????????????????????

function boxCorners(box: number[]): number[][] {
  const [cx, cy, cz, hxx, hxy, hxz, hyx, hyy, hyz, hzx, hzy, hzz] = box
  const corners: number[][] = []
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
    corners.push([cx + sx * hxx + sy * hyx + sz * hzx, cy + sx * hxy + sy * hyy + sz * hzy, cz + sx * hxz + sy * hyz + sz * hzz])
  }
  return corners
}

function unionBoxes(boxes: Array<number[] | null | undefined>): number[] | null {
  let min = [Infinity, Infinity, Infinity]
  let max = [-Infinity, -Infinity, -Infinity]
  for (const box of boxes) {
    if (!box) continue
    for (const p of boxCorners(box)) {
      for (let i = 0; i < 3; i++) {
        min[i] = Math.min(min[i], p[i])
        max[i] = Math.max(max[i], p[i])
      }
    }
  }
  if (min[0] === Infinity) return null
  return [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2, (max[0] - min[0]) / 2, 0, 0, 0, (max[1] - min[1]) / 2, 0, 0, 0, (max[2] - min[2]) / 2]
}

function boxCenter(box: number[] | null): number[] {
  return box ? [box[0], box[1], box[2]] : [0, 0, 0]
}

function boxExtent(box: number[] | null): number {
  if (!box) return 0
  const corners = boxCorners(box)
  let min = [Infinity, Infinity, Infinity]
  let max = [-Infinity, -Infinity, -Infinity]
  for (const p of corners) for (let i = 0; i < 3; i++) { min[i] = Math.min(min[i], p[i]); max[i] = Math.max(max[i], p[i]) }
  return Math.max(max[0] - min[0], max[1] - min[1], max[2] - min[2])
}

function tileBoxInParent(tile: Record<string, any>): number[] | null {
  const bv = (tile.boundingVolume && tile.boundingVolume.box) || (tile.content && tile.content.boundingVolume && tile.content.boundingVolume.box)
  if (!bv) return null
  const t = tile.transform
  if (!t) return bv
  const corners = boxCorners(bv).map((p) => {
    const x = p[0], y = p[1], z = p[2]
    return [t[0] * x + t[4] * y + t[8] * z + t[12], t[1] * x + t[5] * y + t[9] * z + t[13], t[2] * x + t[6] * y + t[10] * z + t[14]]
  })
  let min = [Infinity, Infinity, Infinity]
  let max = [-Infinity, -Infinity, -Infinity]
  for (const p of corners) for (let i = 0; i < 3; i++) { min[i] = Math.min(min[i], p[i]); max[i] = Math.max(max[i], p[i]) }
  return [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2, (max[0] - min[0]) / 2, 0, 0, 0, (max[1] - min[1]) / 2, 0, 0, 0, (max[2] - min[2]) / 2]
}

// ??? Clustering ?????????????????????????????????????????????????????

interface ClusterItem { tile: Record<string, any>; box: number[] | null; bytes: number; children: Record<string, any>[] }

interface GridItem {
  item: ClusterItem
  cx: number
  cy: number
  bytes: number
  extent: number
}

function gridGroupBytes(g: GridItem[]): number {
  return g.reduce((s, x) => s + x.bytes, 0)
}

function gridGroupCenter(g: GridItem[]): [number, number] {
  let cx = 0
  let cy = 0
  for (const x of g) { cx += x.cx; cy += x.cy }
  return [cx / g.length, cy / g.length]
}

function splitGridGroupByBytes(items: GridItem[], targetBytes: number, maxBytes: number): GridItem[][] {
  const sorted = items.slice().sort((a, b) => (a.cx - b.cx) || (a.cy - b.cy))
  const groups: GridItem[][] = []
  let cur: GridItem[] = []
  let curBytes = 0
  const flush = (): void => { if (cur.length) { groups.push(cur); cur = []; curBytes = 0 } }
  for (const it of sorted) {
    if (it.bytes >= maxBytes) { flush(); groups.push([it]); continue }
    if (cur.length && curBytes + it.bytes > targetBytes) flush()
    cur.push(it)
    curBytes += it.bytes
  }
  flush()
  return groups
}

function mergeSmallGridGroups(groups: GridItem[][], targetBytes: number, maxBytes: number, cellSize: number): GridItem[][] {
  const minBytes = targetBytes * 0.5
  let changed = true
  while (changed) {
    changed = false
    let smallIdx = -1
    let smallBytes = Infinity
    for (let i = 0; i < groups.length; i++) {
      const b = gridGroupBytes(groups[i])
      if (b < minBytes && b < smallBytes) { smallBytes = b; smallIdx = i }
    }
    if (smallIdx < 0) break
    const small = groups[smallIdx]
    const sc = gridGroupCenter(small)
    let bestIdx = -1
    let bestDist = Infinity
    for (let i = 0; i < groups.length; i++) {
      if (i === smallIdx) continue
      const gc = gridGroupCenter(groups[i])
      const d = Math.hypot(gc[0] - sc[0], gc[1] - sc[1])
      if (d < bestDist) { bestDist = d; bestIdx = i }
    }
    if (bestIdx >= 0 && bestDist <= cellSize * 4 && gridGroupBytes(groups[bestIdx]) + smallBytes <= maxBytes) {
      groups[bestIdx].push(...small)
      groups.splice(smallIdx, 1)
      changed = true
    } else {
      break
    }
  }
  return groups
}

function clusterChildren(children: ClusterItem[], targetBytes: number, maxBytes: number): ClusterItem[][] {
  // Spatial grid clustering: hash tiles into a uniform grid sized from the
  // median tile extent so irregularly distributed data (gaps, sparse areas,
  // corridors) still groups nearby tiles together. Oversized cells are split
  // by size; undersized groups merge with their nearest neighbour.
  const items: GridItem[] = children.map((c) => {
    const center = boxCenter(c.box)
    return {
      item: c,
      cx: center[0],
      cy: center[1],
      bytes: c.bytes,
      extent: boxExtent(c.box),
    }
  })
  const extents = items.map((i) => i.extent).filter((e) => e > 0).sort((a, b) => a - b)
  const medianExtent = extents.length ? extents[Math.floor(extents.length / 2)] : 100
  const cellSize = Math.max(medianExtent * 2, 1e-6)

  const cells = new Map<string, GridItem[]>()
  for (const it of items) {
    const key = Math.floor(it.cx / cellSize) + ',' + Math.floor(it.cy / cellSize)
    const list = cells.get(key)
    if (list) list.push(it)
    else cells.set(key, [it])
  }

  let groups: GridItem[][] = []
  for (const cellItems of cells.values()) {
    groups.push(...splitGridGroupByBytes(cellItems, targetBytes, maxBytes))
  }
  groups = mergeSmallGridGroups(groups, targetBytes, maxBytes, cellSize)

  return groups.map((g) => g.map((x) => x.item))
}

// ??? In-place tree aggregation ??????????????????????????????????????

export interface AggregateStats {
  beforeTiles: number
  afterTiles: number
  reduction: number
  mergeGroups: number
  cleanedFiles: number
  cleanedMB: number
}

interface AggCtx {
  rootDir: string
  targetBytes: number
  maxBytes: number
  contentSizeMap: Map<string, number>
  aggCounter: number
  aggDir: string
  groups: number
}

function resolveUri(ctx: AggCtx, uri: string): string {
  return path.isAbsolute(uri) ? uri : path.resolve(ctx.rootDir, uri)
}

function processNode(node: Record<string, any>, ctx: AggCtx): void {
  const children = node.children || []
  if (children.length <= 1) {
    for (const c of children) processNode(c, ctx)
    return
  }
  const childItems: ClusterItem[] = children.map((tile: Record<string, any>) => ({
    tile,
    box: tileBoxInParent(tile),
    bytes: tile.content && tile.content.uri ? (ctx.contentSizeMap.get(resolveUri(ctx, tile.content.uri)) || 0) : 0,
    children: tile.children || [],
  }))
  const groups = clusterChildren(childItems, ctx.targetBytes, ctx.maxBytes)
  const newChildren: Record<string, any>[] = []
  for (const group of groups) {
    if (group.length === 1) {
      processNode(group[0].tile, ctx)
      newChildren.push(group[0].tile)
      continue
    }
    const unionBox = unionBoxes(group.map((g) => g.box))
    const geoErrors = group.map((g) => g.tile.geometricError).filter((v) => typeof v === 'number')
    const geoError = geoErrors.length ? Math.max(...geoErrors) : (node.geometricError || 0)

    const sources: Array<{ glb: Buffer; transform: number[] | null }> = []
    const subChildren: Record<string, any>[] = []
    for (const g of group) {
      const uri = g.tile.content && g.tile.content.uri
      if (uri) {
        const full = resolveUri(ctx, uri)
        if (ctx.contentSizeMap.has(full)) {
          try { sources.push({ glb: parseB3dm(fs.readFileSync(full)).glb, transform: g.tile.transform || null }) } catch { /* skip */ }
        }
      }
      if (g.children.length) subChildren.push(...g.children)
    }
    if (sources.length < 2) {
      for (const g of group) {
        processNode(g.tile, ctx)
        newChildren.push(g.tile)
      }
      continue
    }

    const mergedB3dm = buildB3dm(mergeGlbs(sources))
    const name = 'agg_' + (ctx.aggCounter++) + '.b3dm'
    const relPath = path.join(ctx.aggDir, name)
    const outFull = path.join(ctx.rootDir, relPath)
    fs.mkdirSync(path.dirname(outFull), { recursive: true })
    fs.writeFileSync(outFull, mergedB3dm)
    ctx.groups++

    const newTile: Record<string, any> = {
      boundingVolume: { box: unionBox },
      geometricError: geoError,
      content: { uri: relPath.replace(/\\/g, '/'), boundingVolume: { box: unionBox } },
      children: subChildren,
    }
    processNode(newTile, ctx)
    newChildren.push(newTile)
  }
  node.children = newChildren
}

function expandNestedTilesets(node: Record<string, any>, rootDir: string): void {
  const uri = node.content && node.content.uri
  if (uri && /\.json$/i.test(uri)) {
    const nestedPath = path.resolve(rootDir, uri)
    let nested: Record<string, any>
    try { nested = JSON.parse(fs.readFileSync(nestedPath, 'utf8')) } catch { return }
    const nr = nested.root
    if (!nr) return
    const nestedDir = path.dirname(nestedPath)
    const rewrite = (n: Record<string, any>): void => {
      if (n.content && n.content.uri) {
        n.content.uri = path.relative(rootDir, path.resolve(nestedDir, n.content.uri)).replace(/\\/g, '/')
      }
      if (n.children) n.children.forEach(rewrite)
    }
    rewrite(nr)
    node.content = nr.content
    if (nr.geometricError !== undefined) node.geometricError = nr.geometricError
    if (nr.boundingVolume !== undefined) node.boundingVolume = nr.boundingVolume
    if (nr.transform !== undefined) node.transform = nr.transform
    node.children = (nr.children || []).concat(node.children || [])
  }
  for (const c of (node.children || [])) expandNestedTilesets(c, rootDir)
}

export interface AggregateOptions {
  targetMB?: number
  maxMB?: number
  clean?: boolean
}

export function aggregateTiles(outputDir: string, options?: AggregateOptions): AggregateStats {
  const rootDir = path.resolve(outputDir)
  const tsPath = path.join(rootDir, 'tileset.json')
  const tileset = JSON.parse(fs.readFileSync(tsPath, 'utf8')) as Record<string, any>
  if (!tileset.root) throw new Error('tileset.json ?? root')

  expandNestedTilesets(tileset.root, rootDir)

  const contentSizeMap = new Map<string, number>()
  const walk = (dir: string): void => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name)
      if (e.isDirectory()) walk(full)
      else if (e.name.toLowerCase().endsWith('.b3dm')) contentSizeMap.set(full, fs.statSync(full).size)
    }
  }
  walk(rootDir)

  let beforeTiles = 0
  let beforeBytes = 0
  const count = (t: Record<string, any>): void => {
    if (t.content && t.content.uri) {
      beforeTiles++
      const full = path.resolve(rootDir, t.content.uri)
      if (contentSizeMap.has(full)) beforeBytes += contentSizeMap.get(full)!
    }
    if (t.children) t.children.forEach(count)
  }
  count(tileset.root)

  const ctx: AggCtx = {
    rootDir,
    targetBytes: (options?.targetMB ?? 30) * 1024 * 1024,
    maxBytes: (options?.maxMB ?? 100) * 1024 * 1024,
    contentSizeMap,
    aggCounter: 0,
    aggDir: 'Data/agg',
    groups: 0,
  }
  processNode(tileset.root, ctx)

  let afterTiles = 0
  const count2 = (t: Record<string, any>): void => {
    if (t.content && t.content.uri) afterTiles++
    if (t.children) t.children.forEach(count2)
  }
  count2(tileset.root)

  fs.writeFileSync(tsPath, JSON.stringify(tileset, null, 2), 'utf8')

  let cleanedFiles = 0
  let cleanedBytes = 0
  if (options?.clean !== false) {
    const referenced = new Set<string>()
    const collect = (t: Record<string, any>): void => {
      if (t.content && t.content.uri) referenced.add(path.resolve(rootDir, t.content.uri))
      if (t.children) t.children.forEach(collect)
    }
    collect(tileset.root)
    const cleanWalk = (dir: string): void => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, e.name)
        if (e.isDirectory()) { cleanWalk(full); continue }
        if (!e.name.toLowerCase().endsWith('.b3dm')) continue
        if (referenced.has(path.resolve(full))) continue
        cleanedBytes += fs.statSync(full).size
        fs.unlinkSync(full)
        cleanedFiles++
      }
    }
    cleanWalk(rootDir)
  }

  return {
    beforeTiles,
    afterTiles,
    reduction: beforeTiles / Math.max(afterTiles, 1),
    mergeGroups: ctx.groups,
    cleanedFiles,
    cleanedMB: cleanedBytes / 1048576,
  }
}
