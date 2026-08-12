<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { navigate } from "../router";
import * as mars3d from "mars3d";
import * as Cesium from "mars3d-cesium";

// ?? 3dmine??? MyNavigate ?? + ????
import MyNavigate from "../common/menu/index.js";
import { cookieCache, mapMenus2Routes } from "../utils";
import { bodyScreenScale } from "../js/public";
import { LOGIN } from "../enums";
import { currentEnv } from "../utils/environment";
import {
  systemData as fixedSystemData,
  systemToMap as fixedToMap,
  defaultProjectList,
} from "../config/system-menu.js";
import { useGlobalStore, useDialogStore } from "../stores/global";

const globalStore = useGlobalStore();
const dialogStore = useDialogStore();

const systemData = ref<any>();
async function getSystemData() {
  // 仿 bs 端：前后台共用固定菜单，不请求接口
  systemData.value = fixedSystemData;
}
const toMap = computed(() => fixedToMap);
const projectList = ref<any>(defaultProjectList);
async function queryMineList() {
  // 仿 bs 端：使用默认矿区列表，不请求接口
  projectList.value = defaultProjectList;
}
function activeMenuChangeAction(activeMenu: any, activeMenuChildren: any) {
  // ? 3dmine Index.vue ????
  if (!activeMenuChildren) {
    return;
  }
  cookieCache.setCache(LOGIN.CURRENT_CHOOSE_ROLE_ID, activeMenu.id);
}

function collapseChangeAction(collapse: boolean) {
  globalStore.collapseMenu = collapse;
}

function goHome() {
  const home = import.meta.env.VITE_HOME_URL;
  if (home) {
    window.location.href = home;
  } else {
    navigate("/front");
  }
}

const batches = ref<any[]>([]);
const currentBatch = ref<any>(null);
const currentRecord = ref<any>(null);
const previewError = ref("");
const previewLoading = ref(false);
const opacity = ref(100);
// 当前显示的范围类型：merged 合并后 / source 大范围 / update 小范围
const displayMode = ref<"merged" | "source" | "update">("merged");
const currentUser = ref<{ username: string } | null>(
  (() => {
    try {
      return JSON.parse(sessionStorage.getItem("bs-user") || "null");
    } catch {
      return null;
    }
  })(),
);
let mine3d: any = null;
let currentTileset: any = null;
let previewUrl = "";
// 已加载瓦片模型列表：透明度通过 model.color.alpha 控制（与独立预览一致，非 shader）
const loadedTileModels = new Set<any>();

function formatBatchDate(v?: string) {
  if (!v) return "";
  return String(v).slice(0, 10);
}

async function loadBatches() {
  try {
    batches.value = (await window.electronAPI.batches.list()) as any[];
    if (!currentBatch.value && batches.value.length) {
      await selectBatch(batches.value[0]);
    }
  } catch {}
}

async function selectBatch(batch: any) {
  currentBatch.value = batch;
  currentRecord.value = null;
  previewError.value = "";
  if (!mine3d) {
    setTimeout(() => {
      if (currentBatch.value?.id === batch.id) selectBatch(batch);
    }, 400);
    return;
  }
  try {
    const list = (await window.electronAPI.records.listByBatch(
      batch.id,
    )) as any[];
    const done = list
      .filter((r) => r.status === "success")
      .sort((a, b) => (b.id || 0) - (a.id || 0));
    if (!done.length) {
      disposeTileset();
      previewError.value = "该批次暂无已完成的转换成果";
      return;
    }
    await loadRecord(done[0]);
  } catch (e: unknown) {
    previewError.value = (e as Error)?.message || "加载批次记录失败";
  }
}

async function loadRecord(
  record: any,
  mode: "merged" | "source" | "update" = "merged",
) {
  currentRecord.value = record;
  displayMode.value = mode;
  previewError.value = "";
  previewLoading.value = true;
  let outDir = "";
  if (mode === "merged") outDir = record.merged_path || record.output_dir || "";
  else if (mode === "source") outDir = record.source_tiles_path || "";
  else outDir = record.update_tiles_path || "";
  if (!outDir) {
    previewLoading.value = false;
    disposeTileset();
    if (mode === "source")
      previewError.value = "该批次未保留大范围单独转换成果，请重新转换";
    else if (mode === "update")
      previewError.value = "该批次未保留小范围单独转换成果，请重新转换";
    else previewError.value = "缺少合并成果路径";
    return;
  }
  try {
    const res = await window.electronAPI.servePreview(outDir);
    if (!res.success || !res.url) {
      previewError.value = res.error || "预览服务启动失败";
      return;
    }
    previewUrl = res.url;
    await loadTileset(res.url);
  } catch (e: unknown) {
    previewError.value = (e as Error)?.message || "加载 3D Tiles 失败";
  } finally {
    previewLoading.value = false;
  }
}

// 切换显示大范围 / 小范围 / 合并后范围
async function switchDisplay(mode: "merged" | "source" | "update") {
  if (!currentRecord.value || displayMode.value === mode) return;
  await loadRecord(currentRecord.value, mode);
}

async function loadTileset(url: string) {
  if (!mine3d) return;
  disposeTileset();
  try {
    const tileset = await Cesium.Cesium3DTileset.fromUrl(url, {
      maximumScreenSpaceError: 8,
    });
    mine3d.scene.primitives.add(tileset);
    currentTileset = tileset;
    // 透明度：通过每个瓦片 model.color.alpha 控制（与独立预览窗口一致，非 shader）
    tileset.tileLoad.addEventListener((tile: any) => {
      const model = tile?.content?._model;
      if (model && !loadedTileModels.has(model)) {
        loadedTileModels.add(model);
        if (opacity.value !== 100)
          applyTileModelAlpha(model, opacity.value / 100);
      }
    });
    tileset.tileUnload.addEventListener((tile: any) => {
      const model = tile?.content?._model;
      if (model) loadedTileModels.delete(model);
    });
    const bs = tileset.boundingSphere;
    if (bs) {
      mine3d.camera.flyToBoundingSphere(bs, {
        offset: new Cesium.HeadingPitchRange(
          Cesium.Math.toRadians(0),
          Cesium.Math.toRadians(-35),
          Math.max(bs.radius * 2.2, 200),
        ),
        duration: 1.5,
      });
    }
  } catch (e: unknown) {
    previewError.value = (e as Error)?.message || "加载 3D Tiles 失败";
  }
}

function disposeTileset() {
  loadedTileModels.clear();
  if (currentTileset) {
    try {
      mine3d?.scene.primitives.remove(currentTileset);
    } catch {}
    currentTileset = null;
  }
}

function applyTileModelAlpha(model: any, alpha: number) {
  if (!model) return;
  try {
    const color = model.color;
    if (!color) {
      model.color = new Cesium.Color(1, 1, 1, alpha);
    } else {
      color.alpha = alpha;
      model.color = color;
    }
  } catch {}
}

function applyTileAlpha() {
  const alpha = opacity.value / 100;
  loadedTileModels.forEach((model) => applyTileModelAlpha(model, alpha));
}

function onOpacityInput(event: Event) {
  const value = Number((event.target as HTMLInputElement).value);
  opacity.value = Math.min(100, Math.max(1, Math.round(value)));
  applyTileAlpha();
}

function resetOpacity() {
  opacity.value = 100;
  applyTileAlpha();
}

async function refreshPreview() {
  if (currentBatch.value) await selectBatch(currentBatch.value);
  else await loadBatches();
}

function flyToCurrent() {
  const bs = currentTileset?.boundingSphere;
  if (bs) {
    mine3d?.camera.flyToBoundingSphere(bs, {
      offset: new Cesium.HeadingPitchRange(
        Cesium.Math.toRadians(0),
        Cesium.Math.toRadians(-35),
        Math.max(bs.radius * 2.2, 200),
      ),
      duration: 1,
    });
  }
}
function toggleFullscreen() {
  const el = document.documentElement as HTMLElement & {
    webkitRequestFullscreen?: () => void;
  };
  if (document.fullscreenElement) document.exitFullscreen();
  else if (el.requestFullscreen) el.requestFullscreen();
  else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
}

function initMap() {
  if (mine3d || !document.getElementById("mars3dContainer")) return;
  try {
    mine3d = new mars3d.Map("mars3dContainer", {
      scene: {
        showSun: false,
        showMoon: false,
        showSkyBox: false,
        showSkyAtmosphere: false,
        fog: false,
        fxaa: true,
        backgroundColor: "#000",
        globe: {
          show: false,
          showGroundAtmosphere: false,
          enableLighting: false,
        },
        cameraController: {
          zoomFactor: 3.0,
          minimumZoomDistance: 1,
          enableRotate: true,
          enableZoom: true,
          constrainedAxis: false,
        },
      },
      control: {
        baseLayerPicker: false,
        homeButton: false,
        sceneModePicker: false,
        navigationHelpButton: false,
        fullscreenButton: false,
        contextmenu: { hasDefault: true },
        compass: false,
        locationBar: false,
        clockAnimate: false,
        timeline: false,
      },
      basemaps: [],
      terrain: { show: false },
    });
  } catch (e) {
    console.error("mars3d init failed:", e);
  }
}

function toggleNav() {
  const nav = document.querySelector(
    ".navigate-system, my-navigate, .my-navigate",
  );
  if (!nav) return;
  const hidden = nav.style.display === "none";
  nav.style.display = hidden ? "" : "none";
}

onMounted(() => {
  getSystemData();
  queryMineList();
  setTimeout(() => initMap(), 0);
  setTimeout(() => loadBatches(), 200);
  bodyScreenScale();
});

onBeforeUnmount(() => {
  disposeTileset();
  try {
    window.electronAPI?.stopPreview?.();
  } catch {}
});
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
        <!-- <div class="logo"></div> -->
      </div>
      <!-- <div class="top_left">
        <div class="tlbtns">
          <div class="tlbtn tlbtn_allscreen" title="全屏" @click="toggleFullscreen"></div>
          <div class="tlbtn tlbtn_person" title="返回后台" @click="navigate('/admin')"></div>
          <div class="tlbtn tlbtn_location" title="复位" @click="initMap"></div>
        </div>
      </div>
      <div class="top_right">
        <div class="tlbtns">
          <div class="tlbtn tlbtn_analysis" title="刷新数据" @click="refreshPreview"></div>
          <div class="tlbtn tlbtn_earth" title="地球" @click="initMap"></div>
          <div class="tlbtn tlbtn_hideside" title="隐藏侧栏" @click="toggleNav"></div>
          <div class="tlbtn tlbtn_angle" title="用户 {{ currentUser?.username || 'admin' }}" @click="navigate('/admin')"></div>
        </div>
      </div> -->
    </div>

    <!-- ???? -->
    <!-- 更新批次列表（左侧） -->
    <div class="panel panel-batches">
      <div class="panel-head">更新批次</div>
      <div class="batch-group">全部批次</div>
      <div v-if="!batches.length" class="batch-empty">
        暂无批次，请先在后台创建
      </div>
      <div
        v-for="b in batches"
        :key="b.id"
        class="batch-item"
        :class="{ active: currentBatch?.id === b.id }"
        @click="selectBatch(b)"
      >
        <span class="batch-name" :title="b.name">{{ b.name }}</span>
        <span class="batch-date">{{ formatBatchDate(b.created_at) }}</span>
      </div>
    </div>

    <!-- 当前批次信息（右上）：点击切换显示大范围 / 小范围 / 合并后范围 -->
    <div class="panel panel-info">
      <div class="panel-head">
        当前显示：{{ currentBatch?.name || "未选择批次" }}
      </div>
      <div
        class="info-row info-select"
        :class="{ active: displayMode === 'source' }"
        @click="switchDisplay('source')"
      >
        <span class="info-label">大范围</span>
        <span class="info-value">{{
          currentRecord?.source_name || "未生成"
        }}</span>
      </div>
      <div
        class="info-row info-select"
        :class="{
          active: displayMode === 'update',
          disabled:
            !currentRecord?.update_name && !currentRecord?.update_tiles_path,
        }"
        @click="switchDisplay('update')"
      >
        <span class="info-label">小范围</span>
        <span class="info-value">{{
          currentRecord?.update_name || "无更新"
        }}</span>
      </div>
      <div
        class="info-row info-select"
        :class="{ active: displayMode === 'merged' }"
        @click="switchDisplay('merged')"
      >
        <span class="info-label">合并后范围</span>
        <span class="info-value">{{
          currentRecord?.merged_name || "未生成"
        }}</span>
      </div>
    </div>

    <!-- 影像透明度调节（右下） -->
    <div class="panel panel-opacity">
      <div class="panel-head">
        当前影像：{{ currentRecord?.source_name || "未加载" }}
      </div>
      <div class="opacity-row">
        <label for="preview-opacity">透明度</label>
        <span class="opacity-value">{{ opacity }}%</span>
      </div>
      <div class="opacity-control">
        <input
          id="preview-opacity"
          type="range"
          min="1"
          max="100"
          step="1"
          :value="opacity"
          :disabled="!currentTileset"
          @input="onOpacityInput"
        />
        <input
          type="number"
          min="1"
          max="100"
          step="1"
          :value="opacity"
          :disabled="!currentTileset"
          @input="onOpacityInput"
        />
      </div>
      <button
        class="opacity-reset"
        :disabled="!currentTileset"
        @click="resetOpacity"
      >
        恢复默认
      </button>
      <span v-if="previewLoading" class="preview-loading"
        >正在加载 3D Tiles ...</span
      >
      <span v-if="previewError" class="err">{{ previewError }}</span>
    </div>

    <!-- ?? -->
    <div class="bottom"></div>

    <!-- ???? -->
    <!-- <nav class="bottom-menu">
      <a class="mu selected" @click="navigate('/front')">前台展示</a>
      <a class="mu" @click="navigate('/admin')">后台管理</a>
      <a class="mu" @click="flyToCurrent">视角复位</a>
    </nav> -->
  </div>
  <!-- mars3d cesium 画布容器：保持在 scaleDiv 外，避免缩放画布导致定位不准（同 3dmine） -->
  <div id="mars3dContainer" class="mars3d-container"></div>
</template>

<style scoped>
.front-page {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  background: #000;
}

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
.mars3d-container {
  position: absolute;
  inset: 0;
}

/* ?????? MyNavigate? */
.left-nav {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 50;
  width: 132px;
  background: rgba(9, 21, 38, 0.88);
  border: 1px solid rgba(86, 141, 244, 0.4);
  border-radius: 8px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.nav-title {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  color: #fff;
  font-weight: 700;
  border-bottom: 1px solid rgba(86, 141, 244, 0.3);
  margin-bottom: 4px;
}
.nav-logo {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: grid;
  place-items: center;
  font-size: 12px;
  font-weight: 800;
  color: #fff;
  background: linear-gradient(135deg, #4f9ecf, #1360b8);
}
.nav-item {
  padding: 9px 12px;
  border-radius: 6px;
  color: #9fc1e8;
  font-size: 13px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
}
.nav-item:hover {
  color: #fff;
  background: rgba(86, 141, 244, 0.16);
}
.nav-item.active {
  color: #fff;
  background: linear-gradient(180deg, #2e4863, #1360b8);
  border-bottom: 2px solid #568df4;
}

/* ???3dmine ??? */
.topback {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 118px;
  z-index: 10;
  pointer-events: none;
  background-image: url("/images/bg-top.png");
  background-repeat: repeat-x;
  background-position: center top;
}
.top {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 70px;
  z-index: 20;
}
.top_center {
  position: absolute;
  top: 0;
  left: 50%;
  margin-left: -250px;
  width: 500px;
}
.logo {
  position: absolute;
  left: 80px;
  top: 20px;
  width: 31px;
  height: 26px;
  background-image: url("/images/logo.png");
  background-repeat: no-repeat;
}
.top_left,
.top_right {
  position: absolute;
  top: 18px;
  z-index: 30;
}
.top_left {
  left: 150px;
}
.top_right {
  right: 20px;
}
.tlbtns {
  width: 32px;
  position: relative;
}
.tlbtn {
  width: 32px;
  height: 32px;
  margin-bottom: 10px;
  background-color: rgba(7, 14, 22, 0.8);
  border-radius: 4px;
  cursor: pointer;
  background-repeat: no-repeat;
  background-position: center center;
}
.tlbtn:hover {
  background-color: rgba(19, 96, 184, 0.7);
}
.tlbtn_allscreen {
  background-image: url("/images/tools/icon_allscreen.png");
}
.tlbtn_person {
  background-image: url("/images/tools/icon_person.png");
}
.tlbtn_location {
  background-image: url("/images/tools/icon_location.png");
}
.tlbtn_analysis {
  background-image: url("/images/tools/icon_analysis.png");
}
.tlbtn_earth {
  background-image: url("/images/tools/icon_earth.png");
}
.tlbtn_hideside {
  background-image: url("/images/tools/icon_hideside.png");
}
.tlbtn_angle {
  background-image: url("/images/tools/icon_angle.png");
}

/* ?? */
.panel {
  position: absolute;
  z-index: 40;
  background: rgba(9, 21, 38, 0.85);
  border: 1px solid rgba(86, 141, 244, 0.35);
  border-radius: 8px;
  padding: 12px 14px;
  color: #d9e7f4;
}
.panel-head {
  font-size: 14px;
  font-weight: 700;
  color: #eef4f8;
  margin-bottom: 10px;
  border-bottom: 1px solid rgba(86, 141, 244, 0.2);
  padding-bottom: 6px;
}
/* 更新批次列表（左侧） */
.panel-batches {
  left: 260px;
  top: 120px;
  width: 230px;
  max-height: calc(100% - 280px);
  overflow-y: auto;
}
.batch-group {
  font-size: 12px;
  color: #7d9cc4;
  margin-bottom: 6px;
}
.batch-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 9px 10px;
  margin-bottom: 4px;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid transparent;
  color: #9fc1e8;
  font-size: 13px;
}
.batch-item:hover {
  background: rgba(86, 141, 244, 0.14);
  color: #fff;
}
.batch-item.active {
  background: linear-gradient(180deg, #2e4863, #1360b8);
  border-color: #568df4;
  color: #fff;
}
.batch-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.batch-date {
  flex: 0 0 auto;
  font-size: 11px;
  color: #7d9cc4;
}
.batch-empty {
  color: #5b6b7b;
  font-size: 12px;
  text-align: center;
  padding: 10px 0;
}

/* 当前批次信息（右上） */
.panel-info {
  right: 20px;
  top: 120px;
  width: 340px;
}
.info-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 7px 0;
  border-bottom: 1px solid rgba(86, 141, 244, 0.12);
  font-size: 13px;
}
.info-row:last-child {
  border-bottom: 0;
}
.info-label {
  flex: 0 0 auto;
  color: #7d9cc4;
}
.info-value {
  color: #eef4f8;
  text-align: right;
  word-break: break-all;
}
.info-select {
  cursor: pointer;
  border-radius: 4px;
  padding: 7px 8px;
  margin: 2px -8px;
  transition:
    background 0.15s,
    border-color 0.15s;
  border: 1px solid transparent;
}
.info-select:hover {
  background: rgba(86, 141, 244, 0.14);
}
.info-select.active {
  background: linear-gradient(180deg, #2e4863, #1360b8);
  border-color: #568df4;
}
.info-select.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 影像透明度调节（右下） */
.panel-opacity {
  right: 20px;
  bottom: 120px;
  width: 300px;
}
.opacity-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 13px;
  margin-bottom: 8px;
}
.opacity-value {
  color: #8ca2b8;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
.opacity-control {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 68px;
  gap: 10px;
  align-items: center;
}
.opacity-control input[type="range"] {
  width: 100%;
  accent-color: #4a90d9;
}
.opacity-control input[type="number"] {
  width: 68px;
  border: 1px solid rgba(121, 148, 178, 0.32);
  border-radius: 6px;
  background: rgba(5, 8, 12, 0.72);
  color: #f2f7fc;
  padding: 7px 8px;
  font-size: 13px;
  outline: none;
}
.opacity-control input:focus {
  border-color: #4a90d9;
}
.opacity-reset {
  margin-top: 10px;
  padding: 5px 10px;
  border: 1px solid rgba(121, 148, 178, 0.36);
  border-radius: 6px;
  background: rgba(16, 25, 35, 0.72);
  color: #d8e6f3;
  font-size: 12px;
  cursor: pointer;
}
.opacity-reset:hover {
  background: rgba(35, 53, 72, 0.82);
}
.opacity-reset:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.preview-loading {
  display: block;
  margin-top: 8px;
  color: #5da0e8;
  font-size: 12px;
}
.err {
  display: block;
  margin-top: 6px;
  color: #d96c6c;
  font-size: 12px;
}

/* ???3dmine ??? */
.bottom {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 82px;
  z-index: 10;
  background-image: url("/images/bg-bottom.png");
  background-repeat: repeat-x;
  background-position: center bottom;
  pointer-events: none;
}
.bottom-menu {
  position: absolute;
  left: 50%;
  bottom: 18px;
  transform: translateX(-50%);
  display: flex;
  gap: 6px;
  z-index: 40;
}
.mu {
  width: 110px;
  height: 32px;
  border-bottom: 2px solid #568df4;
  text-align: center;
  color: #fff;
  background: linear-gradient(to bottom, #2e4863, #1360b8);
  font-size: 14px;
  line-height: 32px;
  cursor: pointer;
  border-radius: 6px 6px 0 0;
}
.mu:hover,
.mu.selected {
  background: linear-gradient(to bottom, #1360b8, #1360b8);
  border-bottom: 2px solid #fff;
}
</style>
