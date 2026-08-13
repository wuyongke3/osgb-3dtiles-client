import { mergeConvertedTilesets } from './dist-tools/service/mergeUpdateHeadless.js';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// 计算小范围相对大范围的本地坐标偏移(需考虑大范围 root transform 的旋转)
function computeDeltaToBase(baseTilesetPath, updateTilesetPath) {
  const baseT = JSON.parse(fs.readFileSync(baseTilesetPath, 'utf8')).root.transform;
  const updT = JSON.parse(fs.readFileSync(updateTilesetPath, 'utf8')).root.transform;
  const Rt = [baseT[0], baseT[3], baseT[6], baseT[1], baseT[4], baseT[7], baseT[2], baseT[5], baseT[8]];
  const d = [updT[12] - baseT[12], updT[13] - baseT[13], updT[14] - baseT[14]];
  return {
    x: Rt[0] * d[0] + Rt[1] * d[1] + Rt[2] * d[2],
    y: Rt[3] * d[0] + Rt[4] * d[1] + Rt[5] * d[2],
    z: Rt[6] * d[0] + Rt[7] * d[1] + Rt[8] * d[2],
  };
}

const delta = computeDeltaToBase(
  'test-data/terra_osgbs_3dtiles_source_tiles/tileset.json',
  'test-data/terra_osgbs_3dtiles_update_tiles/tileset.json',
);
const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'merge-e2e-'));
const result = mergeConvertedTilesets(
  'test-data/terra_osgbs_3dtiles_source_tiles',
  [{ outputDir: 'test-data/terra_osgbs_3dtiles_update_tiles', deltaToBase: delta }],
  outDir,
  85,
);
console.log('merge result:', JSON.stringify(result));
console.log('output dir:', outDir);
