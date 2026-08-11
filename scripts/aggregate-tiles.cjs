const fs = require('fs');
const path = require('path');

// ============ GLB / B3DM helpers ============

function parseB3dm(buf) {
  if (buf.length < 28 || buf.toString('ascii', 0, 4) !== 'b3dm') throw new Error('not a b3dm');
  const ftJsonLen = buf.readUInt32LE(12);
  const ftBinLen = buf.readUInt32LE(16);
  const btJsonLen = buf.readUInt32LE(20);
  const btBinLen = buf.readUInt32LE(24);
  const glbOffset = 28 + ftJsonLen + ftBinLen + btJsonLen + btBinLen;
  if (glbOffset + 12 > buf.length || buf.toString('ascii', glbOffset, glbOffset + 4) !== 'glTF') throw new Error('no glb inside b3dm');
  return { glb: buf.subarray(glbOffset) };
}

function parseGlb(glb) {
  if (glb.length < 20 || glb.toString('ascii', 0, 4) !== 'glTF') throw new Error('not a glb');
  const version = glb.readUInt32LE(4);
  if (version !== 2) throw new Error('unsupported glb version ' + version);
  const chunks = [];
  let off = 12;
  while (off + 8 <= glb.length) {
    const len = glb.readUInt32LE(off);
    const type = glb.readUInt32LE(off + 4);
    chunks.push({ type, data: glb.subarray(off + 8, off + 8 + len) });
    off += 8 + len;
  }
  const jsonChunk = chunks.find(c => c.type === 0x4E4F534A);
  const binChunk = chunks.find(c => c.type === 0x4E4942);
  if (!jsonChunk) throw new Error('no json chunk');
  const json = JSON.parse(jsonChunk.data.toString('utf8').replace(/[\u0000\s]+$/g, ''));
  return { json, bin: binChunk ? binChunk.data : Buffer.alloc(0) };
}

function pad4(buf) {
  const pad = (4 - (buf.length % 4)) % 4;
  return pad ? Buffer.concat([buf, Buffer.alloc(pad, 0)]) : buf;
}

function padJson(buf) {
  const pad = (4 - (buf.length % 4)) % 4;
  return Buffer.concat([buf, Buffer.alloc(pad, 0x20)]);
}

function buildGlb(json, bin) {
  const jsonBuf = padJson(Buffer.from(JSON.stringify(json), 'utf8'));
  const binBuf = pad4(bin);
  const total = 12 + 8 + jsonBuf.length + 8 + binBuf.length;
  const out = Buffer.alloc(total);
  out.write('glTF', 0, 'ascii');
  out.writeUInt32LE(2, 4);
  out.writeUInt32LE(total, 8);
  let o = 12;
  out.writeUInt32LE(jsonBuf.length, o); out.writeUInt32LE(0x4E4F534A, o + 4); jsonBuf.copy(out, o + 8); o += 8 + jsonBuf.length;
  out.writeUInt32LE(binBuf.length, o); out.writeUInt32LE(0x4E4942, o + 4); binBuf.copy(out, o + 8);
  return out;
}

function buildB3dm(glb) {
  // The GLB must start at a 4-byte boundary inside the b3dm, so the feature
  // table JSON is padded with spaces (valid JSON whitespace).
  const ftJson = padJson(Buffer.from('{}', 'utf8'));
  const header = Buffer.alloc(28);
  header.write('b3dm', 0, 'ascii');
  header.writeUInt32LE(1, 4);
  header.writeUInt32LE(28 + ftJson.length + glb.length, 8);
  header.writeUInt32LE(ftJson.length, 12);
  header.writeUInt32LE(0, 16);
  header.writeUInt32LE(0, 20);
  header.writeUInt32LE(0, 24);
  return Buffer.concat([header, ftJson, glb]);
}

function mergeGlbs(sources) {
  const merged = {
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
  };
  const binParts = [];
  let binLen = 0;
  const extSet = new Set();
  const addExt = (list) => { if (Array.isArray(list)) list.forEach(e => extSet.add(e)); };

  for (const src of sources) {
    const { json, bin } = parseGlb(src.glb);
    addExt(json.extensionsUsed);
    addExt(json.extensionsRequired);

    const bvOffset = merged.bufferViews.length;
    const accOffset = merged.accessors.length;
    const matOffset = merged.materials.length;
    const texOffset = merged.textures.length;
    const imgOffset = merged.images.length;
    const sampOffset = merged.samplers.length;
    const meshOffset = merged.meshes.length;
    const nodeOffset = merged.nodes.length;
    const ext = merged.extensions;
    const khr = ext.KHR_techniques_webgl || (ext.KHR_techniques_webgl = { programs: [], shaders: [], techniques: [] });
    const progOffset = khr.programs.length;
    const shaderOffset = khr.shaders.length;
    const techOffset = khr.techniques.length;

    const aligned = pad4(bin.length ? bin : Buffer.alloc(0));
    const binStart = binLen;
    binParts.push(aligned);
    binLen += aligned.length;

    for (const bv of (json.bufferViews || [])) {
      const nbv = { buffer: 0, byteOffset: (bv.byteOffset || 0) + binStart, byteLength: bv.byteLength };
      if (bv.byteStride !== undefined) nbv.byteStride = bv.byteStride;
      if (bv.target !== undefined) nbv.target = bv.target;
      merged.bufferViews.push(nbv);
    }
    for (const a of (json.accessors || [])) {
      const na = { bufferView: a.bufferView + bvOffset, componentType: a.componentType, count: a.count, type: a.type };
      if (a.byteOffset !== undefined) na.byteOffset = a.byteOffset;
      if (a.normalized !== undefined) na.normalized = a.normalized;
      if (a.min !== undefined) na.min = a.min;
      if (a.max !== undefined) na.max = a.max;
      merged.accessors.push(na);
    }
    // merge KHR_techniques_webgl extension data (indexes must be remapped)
    const srcKhr = json.extensions && json.extensions.KHR_techniques_webgl;
    if (srcKhr) {
      for (const p of (srcKhr.programs || [])) {
        khr.programs.push({
          attributes: p.attributes ? p.attributes.slice() : undefined,
          fragmentShader: p.fragmentShader + shaderOffset,
          vertexShader: p.vertexShader + shaderOffset,
        });
      }
      for (const s of (srcKhr.shaders || [])) {
        khr.shaders.push({ bufferView: s.bufferView + bvOffset, type: s.type });
      }
      for (const t of (srcKhr.techniques || [])) {
        khr.techniques.push({
          attributes: t.attributes,
          program: t.program + progOffset,
          states: t.states,
          uniforms: t.uniforms,
        });
      }
    }

    for (const m of (json.materials || [])) {
      const nm = Object.assign({}, m);
      if (m.extensions && m.extensions.KHR_techniques_webgl) {
        nm.extensions = Object.assign({}, m.extensions, {
          KHR_techniques_webgl: {
            technique: m.extensions.KHR_techniques_webgl.technique + techOffset,
            values: m.extensions.KHR_techniques_webgl.values,
          },
        });
      }
      merged.materials.push(nm);
    }
    for (const t of (json.textures || [])) {
      const nt = {};
      if (t.sampler !== undefined) nt.sampler = t.sampler + sampOffset;
      if (t.source !== undefined) nt.source = t.source + imgOffset;
      if (t.name !== undefined) nt.name = t.name;
      if (t.extensions) nt.extensions = t.extensions;
      merged.textures.push(nt);
    }
    for (const img of (json.images || [])) {
      const ni = {};
      if (img.bufferView !== undefined) ni.bufferView = img.bufferView + bvOffset;
      if (img.mimeType !== undefined) ni.mimeType = img.mimeType;
      if (img.uri !== undefined) ni.uri = img.uri;
      if (img.name !== undefined) ni.name = img.name;
      merged.images.push(ni);
    }
    for (const s of (json.samplers || [])) merged.samplers.push(s);

    for (const mesh of (json.meshes || [])) {
      const nm = { primitives: [] };
      for (const prim of mesh.primitives) {
        const np = { attributes: {} };
        for (const [k, v] of Object.entries(prim.attributes)) np.attributes[k] = v + accOffset;
        if (prim.indices !== undefined) np.indices = prim.indices + accOffset;
        if (prim.material !== undefined) np.material = prim.material + matOffset;
        if (prim.mode !== undefined) np.mode = prim.mode;
        if (prim.targets) np.targets = prim.targets.map(t => { const nt = {}; for (const [k, v] of Object.entries(t)) nt[k] = v + accOffset; return nt; });
        if (prim.extensions) np.extensions = prim.extensions;
        nm.primitives.push(np);
      }
      if (mesh.weights) nm.weights = mesh.weights;
      if (mesh.name !== undefined) nm.name = mesh.name;
      merged.meshes.push(nm);
    }

    const srcNodes = json.nodes || [];
    const idMap = new Map();
    for (let i = 0; i < srcNodes.length; i++) idMap.set(i, nodeOffset + i);
    const topLevel = (json.scenes && json.scenes[0] && json.scenes[0].nodes) || (srcNodes.length ? [0] : []);
    for (let i = 0; i < srcNodes.length; i++) {
      const n = srcNodes[i];
      const nn = {};
      if (n.mesh !== undefined) nn.mesh = n.mesh + meshOffset;
      if (n.children) nn.children = n.children.map(c => idMap.get(c));
      if (n.matrix) nn.matrix = n.matrix.slice();
      if (n.translation) nn.translation = n.translation.slice();
      if (n.rotation) nn.rotation = n.rotation.slice();
      if (n.scale) nn.scale = n.scale.slice();
      if (n.name !== undefined) nn.name = n.name;
      if (n.extensions) nn.extensions = n.extensions;
      merged.nodes.push(nn);
    }
    if (src.transform) {
      const wrapper = merged.nodes.length;
      merged.nodes.push({ children: topLevel.map(t => idMap.get(t)), matrix: src.transform.slice() });
      merged.scenes[0].nodes.push(wrapper);
    } else {
      for (const t of topLevel) merged.scenes[0].nodes.push(idMap.get(t));
    }
  }

  merged.buffers[0].byteLength = binLen;
  merged.extensionsUsed = Array.from(extSet);
  merged.extensionsRequired = Array.from(extSet);
  return buildGlb(merged, Buffer.concat(binParts, binLen));
}

// ============ Bounds helpers (axis-aligned box: center + half-axes) ============

function boxCorners(box) {
  const [cx, cy, cz, hxx, hxy, hxz, hyx, hyy, hyz, hzx, hzy, hzz] = box;
  const corners = [];
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
    corners.push([
      cx + sx * hxx + sy * hyx + sz * hzx,
      cy + sx * hxy + sy * hyy + sz * hzy,
      cz + sx * hxz + sy * hyz + sz * hzz,
    ]);
  }
  return corners;
}

function unionBoxes(boxes) {
  let min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (const box of boxes) {
    if (!box) continue;
    for (const p of boxCorners(box)) {
      for (let i = 0; i < 3; i++) {
        min[i] = Math.min(min[i], p[i]);
        max[i] = Math.max(max[i], p[i]);
      }
    }
  }
  if (min[0] === Infinity) return null;
  const c = [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2];
  const hx = (max[0] - min[0]) / 2, hy = (max[1] - min[1]) / 2, hz = (max[2] - min[2]) / 2;
  return [c[0], c[1], c[2], hx, 0, 0, 0, hy, 0, 0, 0, hz];
}

function boxCenter(box) {
  return box ? [box[0], box[1], box[2]] : null;
}

function boxExtent(box) {
  if (!box) return 0;
  const corners = boxCorners(box);
  let min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (const p of corners) for (let i = 0; i < 3; i++) { min[i] = Math.min(min[i], p[i]); max[i] = Math.max(max[i], p[i]); }
  return Math.max(max[0] - min[0], max[1] - min[1], max[2] - min[2]);
}

function tileBoxInParent(tile) {
  const bv = (tile.boundingVolume && tile.boundingVolume.box) || (tile.content && tile.content.boundingVolume && tile.content.boundingVolume.box);
  if (!bv) return null;
  const t = tile.transform;
  if (!t) return bv;
  const corners = boxCorners(bv).map(p => {
    const x = p[0], y = p[1], z = p[2];
    return [
      t[0] * x + t[4] * y + t[8] * z + t[12],
      t[1] * x + t[5] * y + t[9] * z + t[13],
      t[2] * x + t[6] * y + t[10] * z + t[14],
    ];
  });
  let min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (const p of corners) for (let i = 0; i < 3; i++) { min[i] = Math.min(min[i], p[i]); max[i] = Math.max(max[i], p[i]); }
  const c = [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2];
  return [c[0], c[1], c[2], (max[0] - min[0]) / 2, 0, 0, 0, (max[1] - min[1]) / 2, 0, 0, 0, (max[2] - min[2]) / 2];
}

function multiplyMatrices(a, b) {
  const out = new Array(16).fill(0);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      let v = 0;
      for (let k = 0; k < 4; k++) v += a[row * 4 + k] * b[k * 4 + col];
      out[row * 4 + col] = v;
    }
  }
  return out;
}

// ============ Clustering ============

function clusterChildren(children, targetBytes, maxBytes) {
  // Spatial grid clustering: tiles are hashed into a uniform grid sized from
  // the median tile extent, so irregularly distributed data (gaps, sparse
  // areas, corridors) still groups nearby tiles together. Oversized cells are
  // split by size; undersized groups are merged with their nearest neighbour.
  const items = children.map((c) => {
    const box = c.box;
    const center = boxCenter(box) || [0, 0, 0];
    return {
      item: c,
      cx: center[0],
      cy: center[1],
      bytes: c.bytes,
      extent: boxExtent(box),
    };
  });
  const extents = items.map((i) => i.extent).filter((e) => e > 0).sort((a, b) => a - b);
  const medianExtent = extents.length ? extents[Math.floor(extents.length / 2)] : 100;
  const cellSize = Math.max(medianExtent * 2, 1e-6);

  const cells = new Map();
  for (const it of items) {
    const key = Math.floor(it.cx / cellSize) + ',' + Math.floor(it.cy / cellSize);
    if (!cells.has(key)) cells.set(key, []);
    cells.get(key).push(it);
  }

  let groups = [];
  for (const cellItems of cells.values()) {
    groups.push(...splitGroupByBytes(cellItems, targetBytes, maxBytes));
  }
  groups = mergeSmallGroups(groups, targetBytes, maxBytes, cellSize);

  return groups.map((g) => g.map((x) => x.item));
}

function groupBytes(g) {
  return g.reduce((s, x) => s + x.bytes, 0);
}

function splitGroupByBytes(items, targetBytes, maxBytes) {
  const sorted = items.slice().sort((a, b) => (a.cx - b.cx) || (a.cy - b.cy));
  const groups = [];
  let cur = [];
  let curBytes = 0;
  const flush = () => { if (cur.length) { groups.push(cur); cur = []; curBytes = 0; } };
  for (const it of sorted) {
    if (it.bytes >= maxBytes) { flush(); groups.push([it]); continue; }
    if (cur.length && curBytes + it.bytes > targetBytes) flush();
    cur.push(it);
    curBytes += it.bytes;
  }
  flush();
  return groups;
}

function groupCenter(g) {
  let cx = 0, cy = 0;
  for (const x of g) { cx += x.cx; cy += x.cy; }
  return [cx / g.length, cy / g.length];
}

function mergeSmallGroups(groups, targetBytes, maxBytes, cellSize) {
  const minBytes = targetBytes * 0.5;
  let changed = true;
  while (changed) {
    changed = false;
    let smallIdx = -1;
    let smallBytes = Infinity;
    for (let i = 0; i < groups.length; i++) {
      const b = groupBytes(groups[i]);
      if (b < minBytes && b < smallBytes) { smallBytes = b; smallIdx = i; }
    }
    if (smallIdx < 0) break;
    const small = groups[smallIdx];
    const sc = groupCenter(small);
    let bestIdx = -1;
    let bestDist = Infinity;
    for (let i = 0; i < groups.length; i++) {
      if (i === smallIdx) continue;
      const gc = groupCenter(groups[i]);
      const d = Math.hypot(gc[0] - sc[0], gc[1] - sc[1]);
      if (d < bestDist) { bestDist = d; bestIdx = i; }
    }
    if (bestIdx >= 0 && bestDist <= cellSize * 4 && groupBytes(groups[bestIdx]) + smallBytes <= maxBytes) {
      groups[bestIdx].push(...small);
      groups.splice(smallIdx, 1);
      changed = true;
    } else {
      break;
    }
  }
  return groups;
}

// ============ Nested tileset expansion ============

// 3D Tiles allows tile content to be another tileset.json (external tileset).
// Expand those containers so every content-bearing tile points to a b3dm with a
// root-relative URI.
function expandNestedTilesets(node, inputDir) {
  const uri = node.content && node.content.uri;
  if (uri && /\.json$/i.test(uri)) {
    const nestedPath = path.resolve(inputDir, uri);
    let nested;
    try { nested = JSON.parse(fs.readFileSync(nestedPath, 'utf8')); } catch (e) { return; }
    const nr = nested.root;
    if (!nr) return;
    const nestedDir = path.dirname(nestedPath);
    (function rewrite(n) {
      if (n.content && n.content.uri) {
        const full = path.resolve(nestedDir, n.content.uri);
        n.content.uri = path.relative(inputDir, full).replace(/\\/g, '/');
      }
      if (n.children) n.children.forEach(rewrite);
    })(nr);
    // replace the container with the nested root content/subtree
    node.content = nr.content;
    if (nr.geometricError !== undefined) node.geometricError = nr.geometricError;
    if (nr.boundingVolume !== undefined) node.boundingVolume = nr.boundingVolume;
    if (nr.transform !== undefined) node.transform = nr.transform;
    node.children = (nr.children || []).concat(node.children || []);
  }
  for (const c of (node.children || [])) expandNestedTilesets(c, inputDir);
}

// ============ Tile tree processing ============

let stats = { beforeTiles: 0, afterTiles: 0, beforeBytes: 0, afterBytes: 0, groups: 0, skipped: 0 };

function processNode(node, ctx) {
  const children = node.children || [];
  if (children.length <= 1) {
    // keep chain as-is; recurse into single child
    for (const c of children) processNode(c, ctx);
    return;
  }

  const targetBytes = ctx.targetMB * 1024 * 1024;
  const maxBytes = ctx.maxMB * 1024 * 1024;
  const childItems = children.map(tile => ({
    tile,
    box: tileBoxInParent(tile),
    bytes: tile.content && tile.content.uri ? (ctx.contentSizeMap.get(resolveUri(ctx, tile.content.uri)) || 0) : 0,
    children: tile.children || [],
  }));

  const groups = clusterChildren(childItems, targetBytes, maxBytes);
  const newChildren = [];
  for (const group of groups) {
    if (group.length === 1) {
      const item = group[0];
      processNode(item.tile, ctx);
      newChildren.push(item.tile);
      continue;
    }
    // Merge this group into one aggregated tile
    const boxes = group.map(g => g.box).filter(Boolean);
    const unionBox = unionBoxes(boxes);
    const geoErrors = group.map(g => g.tile.geometricError).filter(v => typeof v === 'number');
    const geoError = geoErrors.length ? Math.max(...geoErrors) : (node.geometricError || 0);

    // collect source content files
    const sources = [];
    const subChildren = [];
    for (const g of group) {
      const uri = g.tile.content && g.tile.content.uri;
      if (uri) {
        const full = resolveUri(ctx, uri);
        if (ctx.contentSizeMap.has(full)) {
          let glb;
          try { glb = parseB3dm(fs.readFileSync(full)).glb; } catch (e) { continue; }
          sources.push({ glb, transform: g.tile.transform || null });
        }
      }
      if (g.children.length) subChildren.push(...g.children);
    }
    if (sources.length < 2) {
      // not enough mergeable content; keep original children
      for (const g of group) {
        processNode(g.tile, ctx);
        newChildren.push(g.tile);
      }
      ctx.stats.skipped++;
      continue;
    }

    const mergedGlb = mergeGlbs(sources);
    const mergedB3dm = buildB3dm(mergedGlb);
    const name = `agg_${ctx.aggCounter++}.b3dm`;
    const relPath = path.join(ctx.aggRelDir, name);
    const outFull = path.join(ctx.outputDir, relPath);
    fs.mkdirSync(path.dirname(outFull), { recursive: true });
    fs.writeFileSync(outFull, mergedB3dm);
    ctx.stats.afterBytes += mergedB3dm.length;
    ctx.stats.groups++;

    const newTile = {
      boundingVolume: { box: unionBox },
      geometricError: geoError,
      content: { uri: relPath.replace(/\\/g, '/'), boundingVolume: { box: unionBox } },
      children: subChildren,
    };
    // recurse into deeper children to keep aggregating small tiles
    processNode(newTile, ctx);
    newChildren.push(newTile);
  }
  node.children = newChildren;
}

function resolveUri(ctx, uri) {
  if (path.isAbsolute(uri)) return uri;
  return path.resolve(ctx.inputDir, uri);
}

// ============ Main ============

function main() {
  const args = process.argv.slice(2);
  const opt = { input: null, output: null, targetMB: 30, maxMB: 100, clean: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--input') opt.input = args[++i];
    else if (args[i] === '--output') opt.output = args[++i];
    else if (args[i] === '--target-mb') opt.targetMB = Number(args[++i]);
    else if (args[i] === '--max-mb') opt.maxMB = Number(args[++i]);
    else if (args[i] === '--clean') opt.clean = true;
    else if (args[i] === '--help') { console.log('Usage: node scripts/aggregate-tiles.cjs --input <dir> --output <outdir> [--target-mb 30] [--max-mb 100] [--clean]'); process.exit(0); }
  }
  if (!opt.input || !opt.output) { console.error('--input and --output required'); process.exit(1); }
  opt.inputDir = path.resolve(opt.input);
  opt.outputDir = path.resolve(opt.output);
  const tsPath = path.join(opt.inputDir, 'tileset.json');
  const tileset = JSON.parse(fs.readFileSync(tsPath, 'utf8'));
  if (!tileset.root) throw new Error('no root');

  // expand nested (external) tilesets so every content tile is a b3dm
  expandNestedTilesets(tileset.root, opt.inputDir);

  // copy whole input tree to output first (so non-merged content stays valid)
  fs.cpSync(opt.inputDir, opt.outputDir, { recursive: true });

  // build content size map
  opt.contentSizeMap = new Map();
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.name.toLowerCase().endsWith('.b3dm')) opt.contentSizeMap.set(full, fs.statSync(full).size);
    }
  })(opt.inputDir);

  // count original content tiles
  let before = 0, beforeBytes = 0;
  (function count(t) {
    if (t.content && t.content.uri) { before++; const f = path.resolve(opt.inputDir, t.content.uri); if (opt.contentSizeMap.has(f)) beforeBytes += opt.contentSizeMap.get(f); }
    if (t.children) t.children.forEach(count);
  })(tileset.root);

  opt.stats = { beforeTiles: before, afterTiles: 0, beforeBytes, afterBytes: 0, groups: 0, skipped: 0 };
  opt.aggCounter = 0;
  opt.aggRelDir = 'Data/agg';
  processNode(tileset.root, opt);

  // count after
  (function count(t) {
    if (t.content && t.content.uri) opt.stats.afterTiles++;
    if (t.children) t.children.forEach(count);
  })(tileset.root);

  fs.writeFileSync(path.join(opt.outputDir, 'tileset.json'), JSON.stringify(tileset, null, 2), 'utf8');

  if (opt.clean) {
    // Remove b3dm files in the output that are no longer referenced by the tileset.
    const referenced = new Set();
    (function collect(t) {
      if (t.content && t.content.uri) referenced.add(path.resolve(opt.outputDir, t.content.uri));
      if (t.children) t.children.forEach(collect);
    })(tileset.root);
    let removed = 0, removedBytes = 0, kept = 0;
    (function walk(dir) {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) { walk(full); continue; }
        if (!e.name.toLowerCase().endsWith('.b3dm')) continue;
        if (referenced.has(path.resolve(full))) { kept++; continue; }
        const sz = fs.statSync(full).size;
        fs.unlinkSync(full);
        removed++; removedBytes += sz;
      }
    })(opt.outputDir);
    console.log(JSON.stringify({ cleanRemovedFiles: removed, cleanRemovedMB: (removedBytes / 1048576).toFixed(1), cleanKept: kept }, null, 2));
  }

  const s = opt.stats;
  console.log(JSON.stringify({
    beforeTiles: s.beforeTiles,
    afterTiles: s.afterTiles,
    reduction: (s.beforeTiles / Math.max(s.afterTiles, 1)).toFixed(2) + 'x',
    beforeMB: (s.beforeBytes / 1048576).toFixed(1),
    afterMB: (s.afterBytes / 1048576).toFixed(1),
    mergeGroups: s.groups,
    skippedGroups: s.skipped,
  }, null, 2));
}

if (require.main === module) main();
module.exports = { parseB3dm, parseGlb, mergeGlbs, buildB3dm, buildGlb, processNode, clusterChildren, unionBoxes, boxCorners, boxCenter, boxExtent };
