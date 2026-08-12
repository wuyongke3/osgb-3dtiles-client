import { mergeConvertedTilesets } from './dist-tools/service/mergeUpdateHeadless.js';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const merged = JSON.parse(fs.readFileSync('test-data/terra_osgbs_3dtiles/tileset.json','utf8'));
let delta = null;
for (const c of (merged.root?.children||[])) { if (!(c.content?.uri||c.content?.url) && Array.isArray(c.transform)) delta = { x: c.transform[12], y: c.transform[13], z: c.transform[14] }; }
if (!delta) { console.error('delta not found'); process.exit(1); }
const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'merge-new-'));
const result = mergeConvertedTilesets(
  'test-data/terra_osgbs_3dtiles_source_tiles',
  [{ outputDir: 'test-data/terra_osgbs_3dtiles_update_tiles', deltaToBase: delta }],
  outDir,
  85,
);
console.log('merge result:', JSON.stringify(result));
console.log('output dir:', outDir);
