const fs = require('fs');
const path = require('path');
const load = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const uriOf = t => t.content?.uri ?? t.content?.url ?? null;
function isTransformMatrix(t){ return Array.isArray(t) && t.length>=16; }
function transformPoint(m, pt){ if(!m||m.length<16) return pt; const [x,y,z]=pt; return [m[0]*x+m[4]*y+m[8]*z+m[12], m[1]*x+m[5]*y+m[9]*z+m[13], m[2]*x+m[6]*y+m[10]*z+m[14]]; }
function multiplyTransforms(l, r){ const res=new Array(16).fill(0); for(let c=0;c<4;c++) for(let row=0;row<4;row++) for(let i=0;i<4;i++) res[c*4+row]+=l[i*4+row]*r[c*4+i]; return res; }
function getCombinedTransform(pt, tile){ if(!isTransformMatrix(tile.transform)) return pt; return pt?multiplyTransforms(pt,tile.transform):tile.transform; }
function getMaxTransformScale(t){ if(!isTransformMatrix(t)) return 1; return Math.max(Math.hypot(t[0],t[1],t[2]), Math.hypot(t[4],t[5],t[6]), Math.hypot(t[8],t[9],t[10]), 1e-12); }
function getBoxBounds(box, t){ if(box.length<12) return null; const cx=box[0],cy=box[1],cz=box[2], corners=[]; for(const sx of [-1,1]) for(const sy of [-1,1]) for(const sz of [-1,1]) corners.push(transformPoint(t,[cx+sx*box[3]+sy*box[6]+sz*box[9], cy+sx*box[4]+sy*box[7]+sz*box[10], cz+sx*box[5]+sy*box[8]+sz*box[11]])); const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity]; for(const p of corners) for(let i=0;i<3;i++){ min[i]=Math.min(min[i],p[i]); max[i]=Math.max(max[i],p[i]); } return {minX:min[0],maxX:max[0],minY:min[1],maxY:max[1],minZ:min[2],maxZ:max[2]}; }
function getTileBounds(tile, t){ const v=tile.boundingVolume??tile.content?.boundingVolume; const box=v?.box; if(box) return getBoxBounds(box,t); const s=v?.sphere; if(s&&s.length>=4){ const c=transformPoint(t,[s[0],s[1],s[2]]), r=s[3]*getMaxTransformScale(t); return {minX:c[0]-r,maxX:c[0]+r,minY:c[1]-r,maxY:c[1]+r,minZ:c[2]-r,maxZ:c[2]+r}; } return null; }
function boundsIntersects(c, tg){ const tol=0.001; return !(c.maxX<tg.minX-tol||c.minX>tg.maxX+tol||c.maxY<tg.minY-tol||c.minY>tg.maxY+tol); }
function boundsArea(b){ return Math.max(b.maxX-b.minX,0)*Math.max(b.maxY-b.minY,0); }
function unionIntersectionArea(b, cov){ const inter=cov.filter(c=>boundsIntersects(c,b)).map(c=>({minX:Math.max(b.minX,c.minX),maxX:Math.min(b.maxX,c.maxX),minY:Math.max(b.minY,c.minY),maxY:Math.min(b.maxY,c.maxY)})).filter(r=>r.maxX>r.minX&&r.maxY>r.minY); if(!inter.length) return 0; const xStops=Array.from(new Set(inter.flatMap(r=>[r.minX,r.maxX]))).sort((a,b)=>a-b); let total=0; for(let i=0;i<xStops.length-1;i++){ const minX=xStops[i], maxX=xStops[i+1], width=maxX-minX; if(width<=0) continue; const yRanges=inter.filter(r=>r.minX<maxX&&r.maxX>minX).map(r=>[r.minY,r.maxY]).sort((a,b)=>a[0]-b[0]); let h=0,cm=null,cx=null; for(const [a,b2] of yRanges){ if(cm===null||cx===null){cm=a;cx=b2;} else if(a<=cx){cx=Math.max(cx,b2);} else {h+=cx-cm;cm=a;cx=b2;} } if(cm!==null&&cx!==null) h+=cx-cm; total+=width*h; } return total; }
function coverageRatio(childrenBounds, parentBounds){ const a=boundsArea(parentBounds); return a<=0?1:Math.min(unionIntersectionArea(parentBounds, childrenBounds)/a,1); }

// audit one tileset file (no external recursion), returns {bounds, holes, hasContent}
function auditFile(tilesetPath, parentTransform, skipRoot, depth, report, label){
  const tileset=load(tilesetPath), dir=path.dirname(tilesetPath);
  const walk=(tile, pt, d, skipOwn=false)=>{
    const tt=skipOwn?pt:getCombinedTransform(pt,tile);
    const uri=uriOf(tile); const isExt=!!uri&&uri.toLowerCase().endsWith('tileset.json');
    const bounds=getTileBounds(tile,tt);
    const childRects=[];
    if(isExt&&uri){ const ep=path.resolve(dir,uri); if(fs.existsSync(ep)){ auditFile(ep,tt,false,d+1,report,label); if(bounds) childRects.push(bounds); } }
    if(tile.children){ for(const c of tile.children){ const b=walk(c,tt,d+1,false); if(b) childRects.push(b); } }
    const hasChildren=childRects.length>0;
    const hasContent=!!tile.content && !isExt;
    if(bounds && hasChildren && !hasContent){
      const ratio=coverageRatio(childRects, bounds);
      if(ratio < 0.9999) report.push({label, depth:d, ratio:+ratio.toFixed(4), uri:uri||'(ph)'});
    }
    return bounds;
  };
  if(tileset.root) walk(tileset.root,parentTransform,skipRoot?0:depth,skipRoot);
}

const dir = process.argv[2];
const baseReport=[]; const updateReport=[];
// audit base part: walk root, skip graft child (has transform and no uri)
const root=load(path.join(dir,'tileset.json'));
const walkRoot=(tile, pt, skipOwn)=>{
  const tt=skipOwn?pt:getCombinedTransform(pt,tile);
  const uri=uriOf(tile); const isExt=!!uri&&uri.toLowerCase().endsWith('tileset.json');
  if(isExt&&uri){ const ep=path.resolve(path.dirname(path.join(dir,'tileset.json')),uri); if(fs.existsSync(ep)){ auditFile(ep,tt,false,1,baseReport,'base'); } }
  if(tile.children){ for(const c of tile.children){ const isGraft=!uriOf(c)&&Array.isArray(c.transform); if(isGraft){ auditFile(path.join(dir,'tileset.json'),undefined,true,1,updateReport,'update-root'); continue; } walkRoot(c,tt,false); } }
};
if(root.root) walkRoot(root.root,undefined,true);
console.log('base 部分空洞:', baseReport.length, JSON.stringify(baseReport.slice(0,20)));
console.log('update 部分空洞:', updateReport.length, JSON.stringify(updateReport.slice(0,30)));
// audit raw update source tileset (before merge)
const rawReport=[];
auditFile('test-data/terra_osgbs_3dtiles_update_tiles/tileset.json', undefined, true, 0, rawReport, 'raw-update');
console.log('原始 update tileset 空洞:', rawReport.length, JSON.stringify(rawReport.slice(0,30)));
const rawBaseReport=[];
auditFile('test-data/terra_osgbs_3dtiles_source_tiles/tileset.json', undefined, true, 0, rawBaseReport, 'raw-base');
console.log('原始 base tileset 空洞:', rawBaseReport.length, JSON.stringify(rawBaseReport.slice(0,20)));
