<script setup lang="ts">
import {
  computed,
  h,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
} from "vue";

type ConversionStatus = "idle" | "running" | "success" | "error" | "cancelled";
type Theme = "dark" | "light";
type LogType = "out" | "err" | "info";
type IconName =
  | "alert"
  | "box"
  | "check"
  | "clear"
  | "external"
  | "file"
  | "folder"
  | "folderOpen"
  | "moon"
  | "play"
  | "settings"
  | "square"
  | "sun"
  | "terminal"
  | "x";

interface Config {
  x: string;
  y: string;
  offset: number;
  max_lvl: number;
  pbr: boolean;
}

const iconPaths: Record<IconName, string[]> = {
  alert: [
    "M10.3 3.9 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z",
    "M12 8v5",
    "M12 17h.01",
  ],
  box: [
    "M21 8.5 12 3 3 8.5",
    "M21 8.5v7L12 21l-9-5.5v-7",
    "M12 21v-9",
    "M3 8.5l9 5.5 9-5.5",
  ],
  check: ["M20 6 9 17l-5-5"],
  clear: ["M3 6h18", "M8 6V4h8v2", "M19 6l-1 14H6L5 6", "M10 11v5", "M14 11v5"],
  external: [
    "M14 3h7v7",
    "M10 14 21 3",
    "M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5",
  ],
  file: [
    "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z",
    "M14 2v6h6",
    "M8 13h8",
    "M8 17h5",
  ],
  folder: [
    "M3 6.5A2.5 2.5 0 0 1 5.5 4H10l2 2h6.5A2.5 2.5 0 0 1 21 8.5v8A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5Z",
  ],
  folderOpen: [
    "M3 7.5A2.5 2.5 0 0 1 5.5 5H10l2 2h6.5A2.5 2.5 0 0 1 21 9.5V11",
    "M3 11h18l-2 7H5Z",
  ],
  moon: ["M21 14.5A8.5 8.5 0 0 1 9.5 3a7 7 0 1 0 11.5 11.5Z"],
  play: ["M7 4v16l13-8Z"],
  settings: [
    "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z",
    "M19.4 15a1.8 1.8 0 0 0 .36 1.98l.05.05a2.1 2.1 0 1 1-2.98 2.98l-.05-.05A1.8 1.8 0 0 0 14.8 19.6a1.8 1.8 0 0 0-1.08 1.65V21.4a2.1 2.1 0 1 1-4.2 0v-.15A1.8 1.8 0 0 0 8.4 19.6a1.8 1.8 0 0 0-1.98.36l-.05.05a2.1 2.1 0 1 1-2.98-2.98l.05-.05A1.8 1.8 0 0 0 3.8 15a1.8 1.8 0 0 0-1.65-1.08H2a2.1 2.1 0 1 1 0-4.2h.15A1.8 1.8 0 0 0 3.8 8.6a1.8 1.8 0 0 0-.36-1.98l-.05-.05a2.1 2.1 0 1 1 2.98-2.98l.05.05A1.8 1.8 0 0 0 8.4 4a1.8 1.8 0 0 0 1.08-1.65V2.2a2.1 2.1 0 1 1 4.2 0v.15A1.8 1.8 0 0 0 14.8 4a1.8 1.8 0 0 0 1.98-.36l.05-.05a2.1 2.1 0 1 1 2.98 2.98l-.05.05A1.8 1.8 0 0 0 19.4 8.6a1.8 1.8 0 0 0 1.65 1.08h.15a2.1 2.1 0 1 1 0 4.2h-.15A1.8 1.8 0 0 0 19.4 15Z",
  ],
  square: ["M6 6h12v12H6Z"],
  sun: [
    "M12 4V2",
    "M12 22v-2",
    "M4.93 4.93 3.51 3.51",
    "M20.49 20.49l-1.42-1.42",
    "M4 12H2",
    "M22 12h-2",
    "M4.93 19.07l-1.42 1.42",
    "M20.49 3.51l-1.42 1.42",
    "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z",
  ],
  terminal: ["M4 17h16", "M5 7l5 5-5 5", "M12 12h7"],
  x: ["M18 6 6 18", "M6 6l12 12"],
};

const Icon = (props: { name: IconName; size?: number }) =>
  h(
    "svg",
    {
      class: "line-icon",
      width: props.size ?? 18,
      height: props.size ?? 18,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "1.8",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "aria-hidden": "true",
    },
    iconPaths[props.name].map((d) => h("path", { d })),
  );

const inputDir = ref("");
const outputDir = ref("");
const updateDirs = ref<string[]>([]);
const status = ref<ConversionStatus>("idle");
const statusMessage = ref("");
const toolExists = ref(false);
const toolPath = ref("");
const theme = ref<Theme>("dark");

const config = reactive<Config>({
  x: "",
  y: "",
  offset: 0,
  max_lvl: 20,
  pbr: false,
});

const metadataMessage = ref("");
const metadataDetail = ref("");
const validationMessage = ref("");
const validationValid = ref<boolean | null>(null);
const logLines = ref<string[]>([]);
const logContainer = ref<HTMLElement | null>(null);
let cleanupFns: (() => void)[] = [];

const themeLabel = computed(() =>
  theme.value === "dark" ? "切换浅色" : "切换暗黑",
);
const themeIcon = computed<IconName>(() =>
  theme.value === "dark" ? "sun" : "moon",
);

function applyTheme(nextTheme: Theme) {
  theme.value = nextTheme;
  document.documentElement.dataset.theme = nextTheme;
  document.documentElement.style.colorScheme = nextTheme;
  localStorage.setItem("osgb-converter-theme", nextTheme);
}

function toggleTheme() {
  applyTheme(theme.value === "dark" ? "light" : "dark");
}

function appendLog(text: string, type: LogType = "out") {
  const prefix =
    type === "err" ? "[stderr] " : type === "info" ? "[info] " : "";
  const lines = (prefix + text).split("\n").filter((line) => line.trim());
  logLines.value.push(...lines);
  if (logLines.value.length > 2000) {
    logLines.value = logLines.value.slice(-2000);
  }
  nextTick(() => {
    if (logContainer.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight;
    }
  });
}

function getStatusColor() {
  switch (status.value) {
    case "running":
      return "var(--color-primary)";
    case "success":
      return "var(--color-success)";
    case "error":
      return "var(--color-error)";
    case "cancelled":
      return "var(--color-warning)";
    default:
      return "var(--color-text-dim)";
  }
}

function getStatusText() {
  switch (status.value) {
    case "idle":
      return "就绪";
    case "running":
      return "转换中";
    case "success":
      return "转换完成";
    case "error":
      return "转换失败";
    case "cancelled":
      return "已取消";
    default:
      return "未知";
  }
}

async function selectInputDir() {
  const dir = await window.electronAPI.selectOsgbDir();
  if (dir) {
    inputDir.value = dir;
    await validateInput();
    await loadMetadata();
  }
}

async function selectOutputDir() {
  const dir = await window.electronAPI.selectOutputDir();
  if (dir) {
    outputDir.value = dir;
  }
}

async function addUpdateDir() {
  const dir = await window.electronAPI.selectOsgbDir();
  if (!dir) return;

  if (dir === inputDir.value) {
    appendLog("小范围更新目录不能和大范围输入目录相同", "err");
    return;
  }

  if (updateDirs.value.includes(dir)) {
    appendLog("该小范围更新目录已添加", "info");
    return;
  }

  const result = await window.electronAPI.validateOsgbStructure(dir);
  if (!result.valid) {
    appendLog(`小范围更新目录无效: ${result.message}`, "err");
    return;
  }

  updateDirs.value.push(dir);
  appendLog(`已添加小范围更新目录: ${dir}`, "info");
}

function removeUpdateDir(index: number) {
  updateDirs.value.splice(index, 1);
}

async function validateInput() {
  if (!inputDir.value) return;
  const result = await window.electronAPI.validateOsgbStructure(inputDir.value);
  validationValid.value = result.valid;
  validationMessage.value = result.message;
}

async function loadMetadata() {
  if (!inputDir.value) return;
  const result = await window.electronAPI.readMetadata(inputDir.value);
  if (result.found && result.data) {
    const data = result.data;
    const parts: string[] = [];
    if (data.srs) parts.push(`SRS: ${data.srs}`);
    if (data.version) parts.push(`版本: ${data.version}`);
    if (data.srsOrigin) {
      parts.push(
        `原点: (${data.srsOrigin.x}, ${data.srsOrigin.y}, ${data.srsOrigin.z})`,
      );
      if (!config.x) config.x = String(data.srsOrigin.x);
      if (!config.y) config.y = String(data.srsOrigin.y);
    }
    metadataMessage.value = "已检测到 metadata.xml";
    metadataDetail.value = parts.join(" | ");
  } else {
    metadataMessage.value = "未检测到 metadata.xml，请手动填写中心坐标";
    metadataDetail.value = "";
  }
}

async function startConversion() {
  if (!inputDir.value || !outputDir.value) {
    appendLog("请先选择输入目录和输出目录", "err");
    return;
  }

  status.value = "running";
  statusMessage.value = "";
  logLines.value = [];

  cleanupFns.push(
    window.electronAPI.onConversionStdout((text) => appendLog(text, "out")),
    window.electronAPI.onConversionStderr((text) => appendLog(text, "err")),
    window.electronAPI.onConversionStatus((nextStatus) => {
      status.value = nextStatus;
      if (nextStatus === "success") {
        appendLog("转换成功完成", "info");
      } else if (nextStatus === "error") {
        appendLog("转换失败", "err");
      } else if (nextStatus === "cancelled") {
        appendLog("转换已取消", "info");
      }
    }),
  );

  appendLog(`启动转换: ${inputDir.value} -> ${outputDir.value}`, "info");
  appendLog(
    `配置: x=${config.x || "auto"}, y=${config.y || "auto"}, offset=${config.offset}, max_lvl=${config.max_lvl}, pbr=${config.pbr}`,
    "info",
  );
  if (updateDirs.value.length > 0) {
    appendLog(`小范围更新目录: ${updateDirs.value.length} 个`, "info");
  }
  appendLog("-".repeat(60), "info");

  try {
    const result = await window.electronAPI.startConversion({
      inputDir: inputDir.value,
      outputDir: outputDir.value,
      config: {
        x: config.x,
        y: config.y,
        offset: config.offset,
        max_lvl: config.max_lvl,
        pbr: config.pbr,
      },
      updateDirs: [...updateDirs.value],
    });

    if (!result.success) {
      statusMessage.value = result.error || "转换失败";
    }
  } catch (err: unknown) {
    status.value = "error";
    statusMessage.value = err instanceof Error ? err.message : String(err);
    appendLog(`错误: ${statusMessage.value}`, "err");
  }

  cleanupFns.forEach((fn) => fn());
  cleanupFns = [];
}

async function cancelConversion() {
  await window.electronAPI.cancelConversion();
}

function clearLog() {
  logLines.value = [];
}

async function openOutput() {
  if (outputDir.value) {
    await window.electronAPI.openOutputDir(outputDir.value);
  }
}

async function startPreview() {
  appendLog("正在启动 Cesium 预览", "info");
  try {
    const centerX = config.x ? Number(config.x) : undefined;
    const centerY = config.y ? Number(config.y) : undefined;
    const result = await window.electronAPI.startPreview({
      outputDir: outputDir.value,
      centerX,
      centerY,
      offset: config.offset,
    });

    if (!result.success) {
      appendLog(`预览启动失败: ${result.error}`, "err");
    } else {
      appendLog(`预览已启动: http://localhost:${result.port}`, "info");
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    appendLog(`预览错误: ${message}`, "err");
  }
}

onMounted(async () => {
  const savedTheme = localStorage.getItem("osgb-converter-theme");
  const prefersDark =
    window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? true;
  applyTheme(
    savedTheme === "dark" || savedTheme === "light"
      ? savedTheme
      : prefersDark
        ? "dark"
        : "light",
  );

  const result = await window.electronAPI.checkTool();
  toolExists.value = result.exists;
  toolPath.value = result.path;
  if (!result.exists) {
    appendLog(`警告: 转换工具未找到 (${result.path})`, "err");
  } else {
    appendLog(`转换工具已就绪: ${result.path}`, "info");
  }
});

onBeforeUnmount(() => {
  cleanupFns.forEach((fn) => fn());
});
</script>

<template>
  <div class="app-shell" :class="`theme-${theme}`">
    <header class="app-header">
      <div class="brand-block">
        <div class="brand-mark">
          <Icon name="box" :size="22" />
        </div>
        <div>
          <h1 class="app-title">3DMine(osgb转3dtile工具)</h1>
        </div>
      </div>

      <div class="header-actions">
        <div class="header-status">
          <span
            class="status-dot"
            :style="{ backgroundColor: getStatusColor() }"
          ></span>
          <span class="status-text">{{ getStatusText() }}</span>
          <span v-if="!toolExists" class="tool-warning" title="转换工具未找到">
            <Icon name="alert" :size="16" />
            工具缺失
          </span>
        </div>
        <button
          class="icon-button"
          type="button"
          :title="themeLabel"
          @click="toggleTheme"
        >
          <Icon :name="themeIcon" :size="18" />
        </button>
      </div>
    </header>

    <div class="app-body">
      <aside class="config-panel">
        <section class="config-section">
          <div class="section-heading">
            <Icon name="folder" :size="18" />
            <h2 class="section-title">输入目录</h2>
          </div>
          <div class="dir-row">
            <input
              type="text"
              :value="inputDir"
              readonly
              placeholder="选择 OSGB 数据根目录"
              class="dir-input"
              @click="selectInputDir"
            />
            <button
              class="btn-outline btn-sm button-with-icon"
              type="button"
              @click="selectInputDir"
            >
              <Icon name="folderOpen" :size="16" />
              浏览
            </button>
          </div>
          <div
            v-if="validationMessage"
            class="validation-msg"
            :class="{
              'is-valid': validationValid === true,
              'is-warn': validationValid === false,
            }"
          >
            <Icon :name="validationValid ? 'check' : 'alert'" :size="16" />
            <span>{{ validationMessage }}</span>
          </div>
          <div v-if="metadataMessage" class="metadata-msg">
            <Icon name="file" :size="16" />
            <span>{{ metadataMessage }}</span>
          </div>
          <div v-if="metadataDetail" class="metadata-detail">
            {{ metadataDetail }}
          </div>
        </section>

        <section class="config-section">
          <div class="section-heading">
            <Icon name="folderOpen" :size="18" />
            <h2 class="section-title">小范围更新目录</h2>
          </div>
          <div class="update-actions">
            <button
              class="btn-outline btn-sm button-with-icon"
              type="button"
              :disabled="status === 'running'"
              @click="addUpdateDir"
            >
              <Icon name="folderOpen" :size="16" />
              新增
            </button>
          </div>
          <div v-if="updateDirs.length === 0" class="update-empty">
            未添加小范围更新目录
          </div>
          <div v-else class="update-list">
            <div
              v-for="(dir, index) in updateDirs"
              :key="dir"
              class="update-item"
            >
              <span class="update-path" :title="dir">{{ dir }}</span>
              <button
                class="icon-button update-remove"
                type="button"
                title="移除"
                :disabled="status === 'running'"
                @click="removeUpdateDir(index)"
              >
                <Icon name="x" :size="15" />
              </button>
            </div>
          </div>
        </section>

        <section class="config-section">
          <div class="section-heading">
            <Icon name="folderOpen" :size="18" />
            <h2 class="section-title">输出目录</h2>
          </div>
          <div class="dir-row">
            <input
              type="text"
              :value="outputDir"
              readonly
              placeholder="选择 3D Tiles 输出目录"
              class="dir-input"
              @click="selectOutputDir"
            />
            <button
              class="btn-outline btn-sm button-with-icon"
              type="button"
              @click="selectOutputDir"
            >
              <Icon name="folderOpen" :size="16" />
              浏览
            </button>
          </div>
        </section>

        <section class="config-section">
          <div class="section-heading">
            <Icon name="settings" :size="18" />
            <h2 class="section-title">转换参数</h2>
          </div>

          <div class="param-grid">
            <div class="param-item">
              <label for="cfg-x">中心经度 X</label>
              <input
                id="cfg-x"
                v-model="config.x"
                type="text"
                placeholder="例如 116.391"
              />
            </div>
            <div class="param-item">
              <label for="cfg-y">中心纬度 Y</label>
              <input
                id="cfg-y"
                v-model="config.y"
                type="text"
                placeholder="例如 39.904"
              />
            </div>
            <div class="param-item">
              <label for="cfg-offset">高度偏移</label>
              <input
                id="cfg-offset"
                v-model.number="config.offset"
                type="number"
                step="0.1"
              />
            </div>
            <div class="param-item">
              <label for="cfg-lvl">最大层级</label>
              <input
                id="cfg-lvl"
                v-model.number="config.max_lvl"
                type="number"
                min="1"
                max="100"
              />
            </div>
          </div>

          <div class="toggle-wrapper pbr-toggle">
            <input id="cfg-pbr" v-model="config.pbr" type="checkbox" />
            <label for="cfg-pbr">启用 PBR 纹理</label>
          </div>
        </section>

        <section class="config-section config-actions">
          <button
            class="btn-primary btn-start button-with-icon"
            type="button"
            :disabled="status === 'running' || !inputDir || !outputDir"
            @click="startConversion"
          >
            <Icon name="play" :size="18" />
            开始转换
          </button>
          <button
            class="btn-danger button-with-icon"
            type="button"
            :disabled="status !== 'running'"
            @click="cancelConversion"
          >
            <Icon name="square" :size="17" />
            取消转换
          </button>
        </section>

        <section v-if="outputDir" class="config-section preview-section">
          <button
            class="btn-primary btn-preview button-with-icon"
            type="button"
            @click="startPreview"
          >
            <Icon name="external" :size="18" />
            Cesium 预览
          </button>
        </section>
      </aside>

      <main class="log-panel">
        <div class="log-header">
          <div class="section-heading">
            <Icon name="terminal" :size="18" />
            <h2 class="section-title">转换日志</h2>
          </div>
          <div class="log-actions">
            <button
              class="btn-outline btn-sm button-with-icon"
              type="button"
              @click="clearLog"
              :disabled="logLines.length === 0"
            >
              <Icon name="clear" :size="15" />
              清空
            </button>
            <button
              class="btn-outline btn-sm button-with-icon"
              type="button"
              @click="openOutput"
              :disabled="!outputDir"
            >
              <Icon name="external" :size="15" />
              打开输出
            </button>
          </div>
        </div>

        <div ref="logContainer" class="log-body">
          <div v-if="logLines.length === 0" class="log-placeholder">
            转换日志将在这里实时显示
          </div>
          <div
            v-for="(line, i) in logLines"
            :key="i"
            class="log-line"
            :class="{
              'is-err': line.startsWith('[stderr]'),
              'is-info': line.startsWith('[info]'),
            }"
          >
            {{ line }}
          </div>
        </div>

        <div
          v-if="statusMessage && status !== 'running'"
          class="log-error-banner"
        >
          <Icon name="alert" :size="17" />
          <span>{{ statusMessage }}</span>
        </div>
      </main>
    </div>

    <footer class="app-footer">
      <span>&copy;3dmine-cn@2026</span>
    </footer>
  </div>
</template>

<style scoped>
.app-shell {
  --color-bg: #0b1117;
  --color-surface: #111a23;
  --color-surface-raised: #16212c;
  --color-surface-hover: #1c2a37;
  --color-border: #263646;
  --color-border-strong: #375066;
  --color-border-focus: #4f9ecf;
  --color-text: #c8d3dc;
  --color-text-dim: #7d8d9d;
  --color-text-bright: #eef4f8;
  --color-primary: #4f9ecf;
  --color-primary-hover: #6ab1dc;
  --color-success: #54b27d;
  --color-warning: #c89b4b;
  --color-error: #d96c6c;
  --color-accent: #74b6d8;
  --panel-shadow: 0 16px 48px rgba(0, 0, 0, 0.24);

  display: flex;
  flex-direction: column;
  height: 100vh;
  min-width: 960px;
  background: var(--color-bg);
  color: var(--color-text);
}

.app-shell.theme-light {
  --color-bg: #eef2f5;
  --color-surface: #f8fafb;
  --color-surface-raised: #ffffff;
  --color-surface-hover: #e8eef3;
  --color-border: #ccd7e0;
  --color-border-strong: #9fb0bf;
  --color-border-focus: #2077a8;
  --color-text: #33424f;
  --color-text-dim: #667684;
  --color-text-bright: #111b24;
  --color-primary: #2077a8;
  --color-primary-hover: #145f87;
  --color-success: #2f8b57;
  --color-warning: #9b6f1e;
  --color-error: #b94848;
  --color-accent: #2d83aa;
  --panel-shadow: 0 16px 42px rgba(27, 43, 56, 0.12);
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 72px;
  padding: 14px 24px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.brand-block,
.header-actions,
.header-status,
.section-heading,
.button-with-icon,
.validation-msg,
.metadata-msg,
.log-error-banner {
  display: flex;
  align-items: center;
}

.brand-block {
  gap: 14px;
  min-width: 0;
}

.brand-mark {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  color: var(--color-primary);
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border-strong);
  border-radius: 7px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.03);
}

.app-title {
  margin: 0;
  font-size: 22px;
  line-height: 1.2;
  font-weight: 700;
  letter-spacing: 0;
  color: var(--color-text-bright);
}

.app-subtitle {
  margin-top: 4px;
  font-size: 13px;
  line-height: 1.3;
  color: var(--color-text-dim);
}

.header-actions {
  gap: 12px;
}

.header-status {
  gap: 9px;
  min-height: 36px;
  padding: 0 12px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-surface-raised);
}

.status-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  display: inline-block;
}

.status-text {
  font-size: 14px;
  color: var(--color-text-bright);
  font-weight: 600;
}

.tool-warning {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--color-warning);
  font-size: 13px;
  cursor: help;
}

.icon-button {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  padding: 0;
  color: var(--color-text);
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: 6px;
}

.icon-button:hover:not(:disabled) {
  color: var(--color-text-bright);
  border-color: var(--color-border-focus);
  background: var(--color-surface-hover);
}

.app-body {
  display: flex;
  flex: 1;
  overflow: hidden;
  background: var(--color-bg);
}

.config-panel {
  width: 400px;
  min-width: 360px;
  padding: 22px;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.config-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 0 22px;
  border-bottom: 1px solid var(--color-border);
}

.config-section:last-child {
  border-bottom: 0;
}

.section-heading {
  gap: 8px;
  color: var(--color-primary);
}

.section-title {
  margin: 0;
  font-size: 15px;
  line-height: 1.35;
  font-weight: 700;
  color: var(--color-text-bright);
}

.dir-row {
  display: flex;
  gap: 8px;
}

.dir-input {
  flex: 1;
  min-width: 0;
  cursor: pointer;
  font-size: 14px;
}

.dir-input:hover {
  border-color: var(--color-border-strong);
}

.update-actions {
  display: flex;
}

.update-empty {
  min-height: 36px;
  padding: 9px 10px;
  color: var(--color-text-dim);
  background: var(--color-surface-raised);
  border: 1px dashed var(--color-border);
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.35;
}

.update-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.update-item {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 7px 8px 7px 10px;
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: 6px;
}

.update-path {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--color-text);
  font-family: var(--font-mono);
  font-size: 12px;
}

.update-remove {
  width: 28px;
  height: 28px;
  border-radius: 5px;
  flex-shrink: 0;
}

.validation-msg {
  gap: 8px;
  min-height: 36px;
  padding: 8px 10px;
  border-radius: 6px;
  background: var(--color-surface-raised);
  color: var(--color-text-dim);
  border: 1px solid var(--color-border);
  font-size: 13px;
  line-height: 1.35;
}

.validation-msg.is-valid {
  color: var(--color-success);
  border-color: color-mix(
    in srgb,
    var(--color-success) 45%,
    var(--color-border)
  );
}

.validation-msg.is-warn {
  color: var(--color-warning);
  border-color: color-mix(
    in srgb,
    var(--color-warning) 45%,
    var(--color-border)
  );
}

.metadata-msg {
  gap: 8px;
  color: var(--color-success);
  font-size: 13px;
  line-height: 1.35;
}

.metadata-detail {
  padding: 10px 12px;
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  color: var(--color-text-dim);
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 1.6;
  word-break: break-all;
}

.param-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 12px;
}

.param-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.param-item input {
  font-size: 14px;
}

.pbr-toggle {
  min-height: 36px;
  padding: 8px 10px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-surface-raised);
}

.config-actions {
  flex-direction: row;
  gap: 10px;
  padding-bottom: 0;
}

.config-actions .btn-primary,
.config-actions .btn-danger {
  flex: 1;
}

.button-with-icon {
  justify-content: center;
  gap: 7px;
  white-space: nowrap;
}

.btn-start,
.btn-preview {
  min-height: 42px;
}

.preview-section {
  padding-top: 0;
  padding-bottom: 0;
  border-bottom: 0;
}

.btn-preview {
  width: 100%;
}

.log-panel {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
}

.log-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 62px;
  padding: 14px 22px;
  background: var(--color-surface-raised);
  border-bottom: 1px solid var(--color-border);
}

.log-actions {
  display: flex;
  gap: 8px;
}

.log-body {
  flex: 1;
  margin: 18px;
  padding: 16px 18px;
  overflow-y: auto;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 7px;
  box-shadow: var(--panel-shadow);
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-all;
  cursor: text;
  user-select: text;
}

.log-placeholder {
  height: 100%;
  min-height: 240px;
  display: grid;
  place-items: center;
  color: var(--color-text-dim);
  font-style: normal;
  text-align: center;
}

.log-line {
  color: var(--color-text);
  user-select: text;
}

.log-line.is-err {
  color: var(--color-error);
}

.log-line.is-info {
  color: var(--color-accent);
  font-weight: 600;
}

.log-error-banner {
  gap: 8px;
  margin: 0 18px 18px;
  padding: 12px 14px;
  color: var(--color-error);
  background: var(--color-surface);
  border: 1px solid
    color-mix(in srgb, var(--color-error) 45%, var(--color-border));
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
}

.app-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 34px;
  padding: 7px 18px;
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
  color: var(--color-text-dim);
  font-size: 12px;
  flex-shrink: 0;
}

.footer-sep {
  color: var(--color-border-strong);
}

.footer-ok {
  color: var(--color-success);
}

.footer-err {
  color: var(--color-error);
}

.tool-path {
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.line-icon {
  flex: 0 0 auto;
}

@media (max-width: 1080px) {
  .app-shell {
    min-width: 0;
  }

  .app-body {
    flex-direction: column;
    overflow: auto;
  }

  .config-panel {
    width: 100%;
    min-width: 0;
    border-right: 0;
    border-bottom: 1px solid var(--color-border);
  }

  .log-panel {
    min-height: 420px;
  }
}

@media (max-width: 720px) {
  .app-header,
  .log-header,
  .config-actions,
  .dir-row {
    align-items: stretch;
    flex-direction: column;
  }

  .header-actions,
  .header-status,
  .log-actions {
    width: 100%;
  }

  .header-status,
  .log-actions > button,
  .dir-row > button {
    justify-content: center;
  }

  .param-grid {
    grid-template-columns: 1fr;
  }
}
</style>
