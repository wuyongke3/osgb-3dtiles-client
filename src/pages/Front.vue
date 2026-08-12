<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { navigate } from '../router'
import * as mars3d from 'mars3d'

// ?? 3dmine??? MyNavigate ?? + ????
import MyNavigate from '../common/menu/index.js'
import { cookieCache, mapMenus2Routes } from '../utils'
import { bodyScreenScale } from '../js/public'
import { LOGIN } from '../enums'
import { currentEnv } from '../utils/environment'
import { systemData as fixedSystemData, systemToMap as fixedToMap, defaultProjectList } from '../config/system-menu.js'
import { useGlobalStore, useDialogStore } from '../stores/global'

const globalStore = useGlobalStore()
const dialogStore = useDialogStore()

const systemData = ref<any>()
async function getSystemData() {
  // 仿 bs 端：前后台共用固定菜单，不请求接口
  systemData.value = fixedSystemData
}
const toMap = computed(() => fixedToMap)
const projectList = ref<any>(defaultProjectList)
async function queryMineList() {
  // 仿 bs 端：使用默认矿区列表，不请求接口
  projectList.value = defaultProjectList
}
function activeMenuChangeAction(activeMenu: any, activeMenuChildren: any) {
  // ? 3dmine Index.vue ????
  if (!activeMenuChildren) {
    return
  }
  cookieCache.setCache(LOGIN.CURRENT_CHOOSE_ROLE_ID, activeMenu.id)
}

function collapseChangeAction(collapse: boolean) {
  globalStore.collapseMenu = collapse
}

function goHome() {
  const home = import.meta.env.VITE_HOME_URL
  if (home) {
    window.location.href = home
  } else {
    navigate('/front')
  }
}

const records = ref<any[]>([])
const stats = ref({ total: 0, success: 0, running: 0, tiles: 0 })
const previewError = ref('')
const legendsShow = ref(false)
const currentUser = ref<{ username: string } | null>(
  (() => { try { return JSON.parse(sessionStorage.getItem('bs-user') || 'null') } catch { return null } })(),
)
let mine3d: any = null

async function load() {
  try {
    records.value = (await window.electronAPI.records.list()) as any[]
    stats.value.total = records.value.length
    stats.value.success = records.value.filter(r => r.status === 'success').length
    stats.value.running = records.value.filter(r => r.status === 'running').length
    stats.value.tiles = records.value.reduce((s, r) => s + (r.tile_count || 0), 0)
  } catch {}
}

async function openPreview() {
  previewError.value = ''
  const out = records.value.find(r => r.status === 'success')?.output_dir
  try {
    const res = await window.electronAPI.startPreview({ outputDir: out || undefined })
    if (!res.success) previewError.value = res.error || '预览失败'
  } catch (e: unknown) {
    previewError.value = (e as Error)?.message || '预览失败'
  }
}

function toggleFullscreen() {
  const el = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => void }
  if (document.fullscreenElement) document.exitFullscreen()
  else if (el.requestFullscreen) el.requestFullscreen()
  else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen()
}

function initMap() {
  if (mine3d || !document.getElementById('mars3dContainer')) return
  try {
    mine3d = new mars3d.Map('mars3dContainer', {
      scene: {
        showSun: false, showMoon: false, showSkyBox: false, showSkyAtmosphere: false, fog: false, fxaa: true,
        backgroundColor: '#000',
        globe: { show: false, showGroundAtmosphere: false, enableLighting: false },
        cameraController: { zoomFactor: 3.0, minimumZoomDistance: 1, enableRotate: true, enableZoom: true, constrainedAxis: false },
      },
      control: {
        baseLayerPicker: false, homeButton: false, sceneModePicker: false, navigationHelpButton: false, fullscreenButton: false,
        contextmenu: { hasDefault: true }, compass: false, locationBar: false, clockAnimate: false, timeline: false,
      },
      basemaps: [],
      terrain: { show: false },
    })
  } catch (e) {
    console.error('mars3d init failed:', e)
  }
}

function toggleNav() {
  const nav = document.querySelector('.navigate-system, my-navigate, .my-navigate')
  if (!nav) return
  const hidden = nav.style.display === 'none'
  nav.style.display = hidden ? '' : 'none'
}

onMounted(() => {
  load()
  getSystemData()
  queryMineList()
  setTimeout(() => initMap(), 0)
  bodyScreenScale()
})
</script>

<template>
  <div id="scaleDiv" class="front-page">

    <!-- ?????3dm-im-components ?? MyNavigate??? 3dmine? -->
    <MyNavigate
      class="front-nav"
      style="height: 80%"
      height="100%"
      username="admin"
      navigate-system-max-height="68%"
      :systemData="systemData"
      :toMap="toMap"
      :navigate-style="{
        'z-index': 99999,
        'margin-top': 0,
        transform: 'translateY(10%)',
      }"
      :project-list="projectList"
      @collapse-change="collapseChangeAction"
      @active-menu-change="activeMenuChangeAction"
      @to-mine-list-page="MyNavigate.useToProjectPage(currentEnv())"
      @go-home="goHome"
    />

    <!-- ?? -->
    <div class="topback"></div>
    <div class="top">
      <div class="top_center">
        <div class="logo"></div>
        <div class="title">
          <div class="ch">3DMine · OSGB → 3D Tiles</div>
          <div class="en">Front Display Platform</div>
        </div>
      </div>
      <div class="top_left">
        <div class="tlbtns">
          <div class="tlbtn tlbtn_allscreen" title="全屏" @click="toggleFullscreen"></div>
          <div class="tlbtn tlbtn_person" title="返回后台" @click="navigate('/admin')"></div>
          <div class="tlbtn tlbtn_location" title="复位" @click="initMap"></div>
        </div>
      </div>
      <div class="top_right">
        <div class="tlbtns">
          <div class="tlbtn tlbtn_analysis" title="3D 预览" @click="openPreview"></div>
          <div class="tlbtn tlbtn_earth" title="地球" @click="initMap"></div>
          <div class="tlbtn tlbtn_hideside" title="隐藏侧栏" @click="toggleNav"></div>
          <div class="tlbtn tlbtn_angle" title="用户 {{ currentUser?.username || 'admin' }}" @click="navigate('/admin')"></div>
        </div>
      </div>
    </div>

    <!-- ???? -->
    <div class="panel panel-stats">
      <div class="panel-head">综合统计</div>
      <div class="stats-grid">
        <div class="stat"><div class="num">{{ stats.total }}</div><div class="lbl">记录总数</div></div>
        <div class="stat"><div class="num ok">{{ stats.success }}</div><div class="lbl">成功任务</div></div>
        <div class="stat"><div class="num run">{{ stats.running }}</div><div class="lbl">进行中</div></div>
        <div class="stat"><div class="num tile">{{ stats.tiles }}</div><div class="lbl">总瓦片数</div></div>
      </div>
    </div>

    <!-- ?????? -->
    <div class="panel panel-records">
      <div class="panel-head">最近记录</div>
      <table class="rec-table">
        <thead><tr><th>ID</th><th>状态</th><th>瓦片数</th><th>时间</th></tr></thead>
        <tbody>
          <tr v-for="r in records.slice(0, 6)" :key="r.id">
            <td>{{ r.id }}</td>
            <td><span class="st" :class="'st-' + (r.status || 'idle')">{{ r.status || 'idle' }}</span></td>
            <td>{{ r.tile_count ?? 0 }}</td>
            <td>{{ (r.created_at || '').slice(5, 16) || '-' }}</td>
          </tr>
          <tr v-if="!records.length"><td colspan="4" class="empty">暂无记录</td></tr>
        </tbody>
      </table>
      <button class="preview-btn" @click="openPreview">打开 3D 预览</button>
      <span v-if="previewError" class="err">{{ previewError }}</span>
    </div>

    <!-- ?? -->
    <div class="bottom"></div>
    <div class="legends_bottom" @click="legendsShow = !legendsShow"></div>
    <div v-if="legendsShow" class="legends-pop">
      <div class="legend-title">图例视图</div>
      <div class="legend-item"><i class="dot ok"></i>成功任务</div>
      <div class="legend-item"><i class="dot run"></i>进行中任务</div>
      <div class="legend-item"><i class="dot err"></i>失败任务</div>
    </div>

    <!-- ???? -->
    <nav class="bottom-menu">
      <a class="mu selected" @click="navigate('/front')">前台展示</a>
      <a class="mu" @click="navigate('/admin')">后台管理</a>
      <a class="mu" @click="openPreview">3D 预览</a>
    </nav>
  </div>
  <!-- mars3d cesium 画布容器：保持在 scaleDiv 外，避免缩放画布导致定位不准（同 3dmine） -->
  <div id="mars3dContainer" class="mars3d-container"></div>
</template>

<style scoped>
.front-page { position: relative; width: 100%; height: 100vh; overflow: hidden; background: #000; }

/* 前台菜单项样式与后台保持一致：高度 50px、间距 4px、背景条铺满 */
.front-nav :deep(.navigate-menu .item .item-info) {
  min-height: 50px;
  margin-top: 4px;
}
.front-nav :deep(.navigate-menu .item .item-info .name) {
  min-height: 50px;
  box-sizing: border-box;
  background-size: 100% 100%;
}
.mars3d-container { position: absolute; inset: 0; }

/* ?????? MyNavigate? */
.left-nav {
  position: absolute; left: 10px; top: 50%; transform: translateY(-50%);
  z-index: 50; width: 132px;
  background: rgba(9, 21, 38, 0.88); border: 1px solid rgba(86,141,244,0.4);
  border-radius: 8px; padding: 8px; display: flex; flex-direction: column; gap: 4px;
}
.nav-title { display: flex; align-items: center; gap: 8px; padding: 8px 10px; color: #fff; font-weight: 700; border-bottom: 1px solid rgba(86,141,244,0.3); margin-bottom: 4px; }
.nav-logo { width: 28px; height: 28px; border-radius: 6px; display: grid; place-items: center; font-size: 12px; font-weight: 800; color: #fff; background: linear-gradient(135deg, #4f9ecf, #1360b8); }
.nav-item { padding: 9px 12px; border-radius: 6px; color: #9fc1e8; font-size: 13px; cursor: pointer; border-bottom: 2px solid transparent; }
.nav-item:hover { color: #fff; background: rgba(86,141,244,0.16); }
.nav-item.active { color: #fff; background: linear-gradient(180deg, #2e4863, #1360b8); border-bottom: 2px solid #568df4; }

/* ???3dmine ??? */
.topback { position: absolute; top: 0; left: 0; right: 0; height: 118px; z-index: 10; pointer-events: none; background-image: url('/images/bg-top.png'); background-repeat: repeat-x; background-position: center top; }
.top { position: absolute; top: 0; left: 0; right: 0; height: 70px; z-index: 20; }
.top_center { position: absolute; top: 0; left: 50%; margin-left: -250px; width: 500px; }
.logo { position: absolute; left: 80px; top: 20px; width: 31px; height: 26px; background-image: url('/images/logo.png'); background-repeat: no-repeat; }
.title { position: absolute; top: 5px; height: 54px; width: 340px; right: 50px; background-image: url('/images/title.png'); background-repeat: no-repeat; padding: 4px 10px; box-sizing: border-box; }
.title .ch { color: #fff; font-size: 18px; font-weight: bold; letter-spacing: 2px; line-height: 26px; text-align: center; }
.title .en { color: #9fc1e8; font-size: 11px; letter-spacing: 2px; text-align: center; }
.top_left, .top_right { position: absolute; top: 18px; z-index: 30; }
.top_left { left: 150px; }
.top_right { right: 20px; }
.tlbtns { width: 32px; position: relative; }
.tlbtn { width: 32px; height: 32px; margin-bottom: 10px; background-color: rgba(7,14,22,0.8); border-radius: 4px; cursor: pointer; background-repeat: no-repeat; background-position: center center; }
.tlbtn:hover { background-color: rgba(19,96,184,0.7); }
.tlbtn_allscreen { background-image: url('/images/tools/icon_allscreen.png'); }
.tlbtn_person { background-image: url('/images/tools/icon_person.png'); }
.tlbtn_location { background-image: url('/images/tools/icon_location.png'); }
.tlbtn_analysis { background-image: url('/images/tools/icon_analysis.png'); }
.tlbtn_earth { background-image: url('/images/tools/icon_earth.png'); }
.tlbtn_hideside { background-image: url('/images/tools/icon_hideside.png'); }
.tlbtn_angle { background-image: url('/images/tools/icon_angle.png'); }

/* ?? */
.panel { position: absolute; z-index: 40; background: rgba(9,21,38,0.85); border: 1px solid rgba(86,141,244,0.35); border-radius: 8px; padding: 12px 14px; color: #d9e7f4; }
.panel-head { font-size: 14px; font-weight: 700; color: #eef4f8; margin-bottom: 10px; border-bottom: 1px solid rgba(86,141,244,0.2); padding-bottom: 6px; }
.panel-stats { left: 160px; top: 120px; width: 300px; }
.stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.stat { text-align: center; padding: 10px; background: rgba(19,96,184,0.2); border-radius: 6px; }
.stat .num { font-size: 26px; font-weight: 800; color: #6ab1dc; font-variant-numeric: tabular-nums; }
.stat .num.ok { color: #54b27d; } .stat .num.run { color: #c89b4b; } .stat .num.tile { color: #74b6d8; }
.stat .lbl { margin-top: 4px; font-size: 12px; color: #7d9cc4; }
.panel-records { right: 20px; top: 120px; width: 380px; }
.rec-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.rec-table th, .rec-table td { padding: 6px 8px; text-align: left; border-bottom: 1px solid rgba(86,141,244,0.15); }
.rec-table th { color: #7d9cc4; font-weight: 600; }
.st { padding: 1px 7px; border-radius: 9px; font-size: 11px; }
.st-success { color: #54b27d; background: rgba(84,178,125,0.14); }
.st-running { color: #c89b4b; background: rgba(200,155,75,0.14); }
.st-error { color: #d96c6c; background: rgba(217,108,108,0.14); }
.empty { text-align: center; color: #5b6b7b; }
.preview-btn { width: 100%; margin-top: 10px; padding: 9px; border: 0; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600; color: #fff; background: linear-gradient(135deg, #4f9ecf, #1360b8); }
.err { display: block; margin-top: 6px; color: #d96c6c; font-size: 12px; text-align: center; }

/* ???3dmine ??? */
.bottom { position: absolute; bottom: 0; left: 0; right: 0; height: 82px; z-index: 10; background-image: url('/images/bg-bottom.png'); background-repeat: repeat-x; background-position: center bottom; pointer-events: none; }
.legends_bottom { position: absolute; bottom: 35px; left: 10px; width: 120px; height: 36px; z-index: 20; cursor: pointer; background-image: url('/images/legend.png'); background-repeat: no-repeat; }
.legends-pop { position: absolute; bottom: 80px; left: 10px; z-index: 60; width: 160px; background: rgba(9,21,38,0.92); border: 1px solid rgba(86,141,244,0.4); border-radius: 8px; padding: 10px 12px; }
.legend-title { color: #eef4f8; font-size: 13px; font-weight: 700; margin-bottom: 8px; }
.legend-item { display: flex; align-items: center; gap: 8px; color: #9fc1e8; font-size: 12px; padding: 3px 0; }
.dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
.dot.ok { background: #54b27d; } .dot.run { background: #c89b4b; } .dot.err { background: #d96c6c; }
.bottom-menu { position: absolute; left: 50%; bottom: 18px; transform: translateX(-50%); display: flex; gap: 6px; z-index: 40; }
.mu { width: 110px; height: 32px; border-bottom: 2px solid #568df4; text-align: center; color: #fff; background: linear-gradient(to bottom, #2e4863, #1360b8); font-size: 14px; line-height: 32px; cursor: pointer; border-radius: 6px 6px 0 0; }
.mu:hover, .mu.selected { background: linear-gradient(to bottom, #1360b8, #1360b8); border-bottom: 2px solid #fff; }
</style>
