<script setup lang="ts">

import {
  computed,
  h,
  nextTick,
  onMounted,
  reactive,
  ref,
} from "vue";
import {
  cancelMergeUpdateConversion,
  checkMergeUpdateTool,
  runMergeUpdateConversion,
} from "../../service";
import { ElMessage, ElMessageBox } from "element-plus";
import PageSearch from "../components/page-search";
import PageContent from "../components/page-content";
import PageModal from "../components/page-modal";
import usePageStore, { registerLocalPageHandler } from "../stores/page/page";
import usePageContent from "../hooks/usePageContent";
import usePageModal from "../hooks/usePageModal";
import { systemData as adminSystemData, systemToMap as adminToMap } from "../config/system-menu.js";
import searchConfig from "../views/admin/batch/config/search.config";
import contentConfig from "../views/admin/batch/config/content.config";
import modalConfig from "../views/admin/batch/config/modal.config";


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
  edge_precision: number;
  output_transparency: boolean;
  pbr: boolean;
  aggregate: boolean;
  aggregateTargetMB: number;
  aggregateMaxMB: number;
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
  edge_precision: 85,
  output_transparency: false,
  pbr: false,
  aggregate: false,
  aggregateTargetMB: 30,
  aggregateMaxMB: 100,
});

const metadataMessage = ref("");
const metadataDetail = ref("");
const validationMessage = ref("");
const validationValid = ref<boolean | null>(null);
const logLines = ref<string[]>([]);
const logContainer = ref<HTMLElement | null>(null);

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
  if (!inputDir.value) {
    appendLog("请先选择输入目录和输出目录", "err");
    return;
  }

  status.value = "running";
  statusMessage.value = "";
  logLines.value = [];

  appendLog(`启动转换: ${inputDir.value} -> ${outputDir.value || "auto"}`, "info");
  appendLog(
    `配置: x=${config.x || "auto"}, y=${config.y || "auto"}, offset=${config.offset}, max_lvl=${config.max_lvl}, edge_precision=${config.edge_precision}, output_transparency=${config.output_transparency}, pbr=${config.pbr}, aggregate=${config.aggregate}`,
    "info",
  );
  if (updateDirs.value.length > 0) {
    appendLog(`小范围更新目录: ${updateDirs.value.length} 个`, "info");
  }
  appendLog("-".repeat(60), "info");

  try {
    const result = await runMergeUpdateConversion({
      inputDir: inputDir.value,
      outputDir: outputDir.value,
      updateDirs: [...updateDirs.value],
      x: config.x,
      y: config.y,
      offset: config.offset,
      max_lvl: config.max_lvl,
      edge_precision: config.edge_precision,
      output_transparency: config.output_transparency,
      pbr: config.pbr,
      aggregate: config.aggregate,
      aggregateTargetMB: config.aggregateTargetMB,
      aggregateMaxMB: config.aggregateMaxMB,
      onStdout: (text) => appendLog(text, "out"),
      onStderr: (text) => appendLog(text, "err"),
      onStatus: (nextStatus) => {
        status.value = nextStatus;
        if (nextStatus === "success") {
          appendLog("转换成功完成", "info");
        } else if (nextStatus === "error") {
          appendLog("转换失败", "err");
        } else if (nextStatus === "cancelled") {
          appendLog("转换已取消", "info");
        }
      },
    });

    if (result.outputDir) {
      outputDir.value = result.outputDir;
    }

    if (!result.success) {
      statusMessage.value = result.error || "转换失败";
    }
  } catch (err: unknown) {
    status.value = "error";
    statusMessage.value = err instanceof Error ? err.message : String(err);
    appendLog(`错误: ${statusMessage.value}`, "err");
  }

}

async function cancelConversion() {
  await cancelMergeUpdateConversion();
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

  const result = await checkMergeUpdateTool();
  toolExists.value = result.exists;
  toolPath.value = result.path;
  if (!result.exists) {
    appendLog(`警告: 转换工具未找到 (${result.path})`, "err");
  } else {
    appendLog(`转换工具已就绪: ${result.path}`, "info");
  }
  await loadBatches();
});



// 面包屑：批次管理 / 高级转换 / 记录管理
const activeMenu = ref<"batch" | "convert" | "records">("batch");
const currentUser = ref<{ username: string; role: string } | null>(
  (() => { try { return JSON.parse(sessionStorage.getItem("bs-user") || "null"); } catch { return null; } })(),
);
// ===== 批次管理（日更批次表 + 日更转化表） =====
interface BatchItem { id: number; name: string; description?: string; created_at?: string }
interface RecordItem {
  id: number; batch_id?: number; name?: string; input_dir?: string; output_dir?: string;
  status?: string; tile_count?: number; duration_sec?: number;
  source_name?: string; source_path?: string; update_name?: string; update_path?: string;
  merged_name?: string; merged_path?: string; transparent?: number; edge_precision?: number; aggregate?: number;
  created_at?: string
}

const batches = ref<BatchItem[]>([]);
const currentBatchId = ref<number | null>(null);
const currentBatchRecords = ref<RecordItem[]>([]);
const currentBatchName = computed(() => {
  const b = batches.value.find((x) => x.id === currentBatchId.value);
  return b ? b.name : "批次记录";
});

const batchDialogVisible = ref(false);
const batchName = ref("");
const batchSaving = ref(false);

const configDialogVisible = ref(false);
const recordSaving = ref(false);
const recordForm = reactive({
  source_path: "",
  source_name: "",
  update_path: "",
  update_name: "",
  transparent: 2,
  edge_precision: 85,
  aggregate: 2,
});

const convertDialogVisible = ref(false);
const convertingRecord = ref<RecordItem | null>(null);
const convertStatus = ref<ConversionStatus>("idle");
const convertLogs = ref<string[]>([]);
const convertLogContainer = ref<HTMLElement | null>(null);

function dirName(dir: string) { return dir.split(/[\\/]/).filter(Boolean).pop() || dir; }
function recordStatusText(st?: string) {
  switch (st) {
    case "running": return "转换中";
    case "success": return "成功";
    case "error": return "失败";
    case "cancelled": return "已取消";
    default: return "待转换";
  }
}

async function loadBatches() {
  batches.value = (await window.electronAPI.batches.list()) as BatchItem[];
  if (!currentBatchId.value && batches.value.length) {
    currentBatchId.value = batches.value[0].id;
  } else if (
    currentBatchId.value &&
    batches.value.length &&
    !batches.value.some((b) => b.id === currentBatchId.value)
  ) {
    // 刷新后当前选中批次已不存在时，自动切回第一个批次
    currentBatchId.value = batches.value[0].id;
  }
  await loadBatchRecords();
}
// 刷新左侧批次列表（同时会重新请求当前选中批次的记录）
async function refreshBatches() {
  await loadBatches();
}
async function loadBatchRecords() {
  await nextTick();
  contentRef.value?.featchPageListData();
}
async function openAddBatch() { batchName.value = ""; batchDialogVisible.value = true; }
async function saveBatch() {
  const name = batchName.value.trim();
  if (!name) { ElMessage.warning("请输入批次名称"); return; }
  batchSaving.value = true;
  try {
    const res = await window.electronAPI.batches.add({ name });
    if (res.success) {
      ElMessage.success("批次创建成功");
      batchDialogVisible.value = false;
      await loadBatches();
      if (res.id) { currentBatchId.value = res.id; await loadBatchRecords(); }
    } else {
      ElMessage.error(res.error || "创建失败");
    }
  } finally { batchSaving.value = false; }
}
async function selectBatch(id: number) {
  currentBatchId.value = id;
  await loadBatchRecords();
}
async function deleteBatch(batch: BatchItem) {
  try {
    await ElMessageBox.confirm("删除批次「" + batch.name + "」将同时删除该批次下所有转换记录，确定删除吗？", "删除批次", { type: "warning", confirmButtonText: "删除", cancelButtonText: "取消" });
  } catch { return; }
  await window.electronAPI.batches.delete(batch.id);
  if (currentBatchId.value === batch.id) currentBatchId.value = null;
  await loadBatches();
}

// ---- page-search / page-content / page-modal 联动（参照 yitai hooks） ----
const pageStore = usePageStore();
const { searchRef, contentRef, handleQueryClick, handleResetClick } = usePageContent();
const { modalRef, handleClick } = usePageModal();

// 本地数据源注册：url 约定 local:batch-records / local:batches
registerLocalPageHandler("batch-records", {
  list: async () => {
    if (!currentBatchId.value) return [];
    return (await window.electronAPI.records.listByBatch(currentBatchId.value)) as RecordItem[];
  },
  add: async (data) => {
    const res = await window.electronAPI.records.add({
      batch_id: currentBatchId.value,
      name: String(data.source_name || "转换记录"),
      input_dir: String(data.source_path || ""),
      source_name: String(data.source_name || ""),
      source_path: String(data.source_path || ""),
      update_name: String(data.update_name || ""),
      update_path: String(data.update_path || ""),
      transparent: Number(data.transparent ?? 2),
      edge_precision: Number(data.edge_precision ?? 85),
      aggregate: Number(data.aggregate ?? 2),
      status: "idle",
    });
    return res;
  },
  update: async (id, data) => window.electronAPI.records.update(id, data),
  remove: async (ids) => {
    for (const id of ids) await window.electronAPI.records.delete(id);
    return { success: true };
  },
});
registerLocalPageHandler("batches", {
  list: async () => (await window.electronAPI.batches.list()) as BatchItem[],
  add: async (data) => window.electronAPI.batches.add({ name: String(data.name || "") }),
  update: async () => ({ success: false, error: "不支持编辑批次" }),
  remove: async () => ({ success: false, error: "不支持批量删除批次" }),
});

// page-content 顶部按钮事件
function handleTitleEvent(event: string) {
  if (event === "handleNewBatchClick") openAddBatch();
  else if (event === "handleUploadClick") openUploadRecord();
  else if (event === "handleRefreshClick") contentRef.value?.featchPageListData();
}
// page-content 行内按钮事件
function handleRowEvent(event: string, row: RecordItem) {
  if (event === "convert") openConvertDialog(row);
  else if (event === "remove") removeBatchRecord(row);
}

async function openUploadRecord() {
  if (!currentBatchId.value) { openAddBatch(); return; }
  modalRef.value?.setModal();
}
async function handleSelectSourceDir(formData: any) {
  const dir = await window.electronAPI.selectOsgbDir();
  if (dir) { formData.source_path = dir; formData.source_name = dirName(dir); }
}
async function handleSelectUpdateDir(formData: any) {
  const dir = await window.electronAPI.selectOsgbDir();
  if (dir) { formData.update_path = dir; formData.update_name = dirName(dir); }
}
async function removeBatchRecord(record: RecordItem) {
  try {
    await ElMessageBox.confirm("确定删除该转换记录吗？", "删除记录", { type: "warning", confirmButtonText: "删除", cancelButtonText: "取消" });
  } catch { return; }
  await window.electronAPI.records.delete(record.id);
  await loadBatchRecords();
}
function openConvertDialog(record: RecordItem) {
  convertingRecord.value = record;
  convertStatus.value = "idle";
  convertLogs.value = [];
  convertDialogVisible.value = true;
}
function appendConvertLog(text: string, type: LogType = "out") {
  const prefix = type === "err" ? "[stderr] " : type === "info" ? "[info] " : "";
  const lines = (prefix + text).split("\n").filter((l) => l.trim());
  convertLogs.value.push(...lines);
  if (convertLogs.value.length > 2000) convertLogs.value = convertLogs.value.slice(-2000);
  nextTick(() => {
    if (convertLogContainer.value) convertLogContainer.value.scrollTop = convertLogContainer.value.scrollHeight;
  });
}
async function startRecordConversion() {
  const record = convertingRecord.value;
  if (!record || !record.source_path) { ElMessage.warning("记录缺少原数据路径"); return; }
  convertStatus.value = "running";
  convertLogs.value = [];
  appendConvertLog("启动转换: " + record.source_path, "info");
  if (record.update_path) appendConvertLog("更新数据: " + record.update_path, "info");
  appendConvertLog("是否透明: " + (record.transparent === 1 ? "是" : "否") + ", 边缘精细度: " + (record.edge_precision ?? 85) + ", 瓦片聚合: " + (record.aggregate === 1 ? "是" : "否"), "info");
  try {
    const result = await runMergeUpdateConversion({
      inputDir: record.source_path,
      outputDir: record.output_dir || undefined,
      updateDirs: record.update_path ? [record.update_path] : [],
      edge_precision: record.edge_precision ?? 85,
      output_transparency: record.transparent === 1,
      aggregate: record.aggregate === 1,
      aggregateTargetMB: 30,
      aggregateMaxMB: 100,
      recordId: record.id,
      onStdout: (t) => appendConvertLog(t, "out"),
      onStderr: (t) => appendConvertLog(t, "err"),
      onStatus: (st) => { convertStatus.value = st as ConversionStatus; },
    });
    if (result.success) {
      appendConvertLog("转换成功完成", "info");
      convertStatus.value = "success";
    } else {
      appendConvertLog("转换失败: " + (result.error || ""), "err");
      convertStatus.value = "error";
    }
    await loadBatchRecords();
  } catch (err: unknown) {
    convertStatus.value = "error";
    appendConvertLog("错误: " + (err instanceof Error ? err.message : String(err)), "err");
  }
}
async function cancelRecordConversion() {
  await cancelMergeUpdateConversion();
  convertStatus.value = "idle";
}

const records = ref<any[]>([]);
const recordsLoading = ref(false);

async function loadRecords() {
  recordsLoading.value = true;
  try {
    records.value = (await window.electronAPI.records.list()) as any[];
  } finally {
    recordsLoading.value = false;
  }
}
async function removeRecord(id: number) {
  await window.electronAPI.records.delete(id);
  await loadRecords();
}
function logout() {
  sessionStorage.removeItem("bs-user");
  window.location.hash = "#/login";
}
function goFront() {
  window.location.hash = "#/front";
}


import MyNavigate from '../common/menu/index.js'

const searchKeyword = ref('')
const filteredRecords = computed(() => {
  const kw = searchKeyword.value.trim().toLowerCase()
  if (!kw) return records.value
  return records.value.filter((r) =>
    String(r.name || '').toLowerCase().includes(kw) ||
    String(r.input_dir || '').toLowerCase().includes(kw) ||
    String(r.output_dir || '').toLowerCase().includes(kw) ||
    String(r.status || '').toLowerCase().includes(kw),
  )
})

// ===== 后台侧栏：与前台共用同一套固定菜单（src/config/system-menu.js） =====
function onAdminNavActive() {
  // hash route switch is handled by App.vue
}

</script>

<template>
  <div class="layout app">
    <el-container class="main-content">
      <el-aside width="249px" class="admin-aside">
        <div class="menu">
          <div class="admin-nav">
            <MyNavigate
              height="100%"
              width="249"
              username="admin"
              navigate-system-max-height="100%"
              :systemData="adminSystemData"
              :toMap="adminToMap"
              @active-menu-change="onAdminNavActive"
              @go-home="goFront"
            />
          </div>
        </div>
      </el-aside>
      <el-container>
        <el-header height="50px" class="headerBg">
          <div class="layout-header">
            <div class="content">
              <div class="breadcrumb">
                <span class="bc-title" :class="{ active: activeMenu === 'batch' }" @click="activeMenu = 'batch'">批次管理</span>
                <span class="bc-sep">/</span>
                <span class="bc-title" :class="{ active: activeMenu === 'convert' }" @click="activeMenu = 'convert'">高级转换</span>
                <span class="bc-sep">/</span>
                <span class="bc-title" :class="{ active: activeMenu === 'records' }" @click="activeMenu = 'records'">记录管理</span>
              </div>
              <div class="info">
                <el-dropdown>
                  <span class="user-name">
                    <el-icon><User /></el-icon>
                    <span class="uname">{{ currentUser?.username || 'admin' }}</span>
                    <el-icon><ArrowDown /></el-icon>
                  </span>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item @click="goFront">前台展示</el-dropdown-item>
                      <el-dropdown-item divided @click="logout">退出登录</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
          </div>
        </el-header>
        <el-main>
          <section v-if="activeMenu === 'batch'" class="page-wrap page-batch">
            <div class="page-container">
              <div class="batch-layout">
                <aside class="batch-side">
                  <div class="batch-side-head">
                    <el-button class="batch-refresh" size="small" title="刷新批次" @click="refreshBatches">
                      <el-icon><Refresh /></el-icon>
                    </el-button>
                    <el-button type="primary" size="small" @click="openAddBatch">新增</el-button>
                  </div>
                  <div class="batch-list">
                    <div
                      v-for="b in batches"
                      :key="b.id"
                      class="batch-item"
                      :class="{ active: currentBatchId === b.id }"
                      @click="selectBatch(b.id)"
                    >
                      <div class="batch-item-main">
                        <div class="batch-name">{{ b.name }}</div>
                        <div class="batch-time">{{ (b.created_at || '').slice(5, 16) || '-' }}</div>
                      </div>
                      <el-icon class="batch-del" title="删除批次" @click.stop="deleteBatch(b)"><Delete /></el-icon>
                    </div>
                    <div v-if="!batches.length" class="batch-empty">暂无批次，请点击「新增」</div>
                  </div>
                </aside>
                <div class="batch-main">
                  <page-search
                    ref="searchRef"
                    :page-store="pageStore"
                    :search-config="searchConfig"
                    @query-click="handleQueryClick"
                    @reset-click="handleResetClick"
                  />
                  <page-content
                    ref="contentRef"
                    :page-store="pageStore"
                    :content-config="contentConfig"
                    is-has-table-column
                    @title-event="handleTitleEvent"
                    @handle-event="handleRowEvent"
                  />
                </div>
              </div>
              <page-modal ref="modalRef" :modal-config="modalConfig" @handle-click="handleClick">
                <template #source_dir="scope">
                  <div class="upload-row">
                    <el-input :model-value="scope.data.source_path" placeholder="请上传原始主范围 osgb 数据" readonly />
                    <el-button @click="handleSelectSourceDir(scope.data)">上传</el-button>
                  </div>
                  <div v-if="scope.data.source_name" class="upload-name">原数据名称：{{ scope.data.source_name }}</div>
                </template>
                <template #update_dir="scope">
                  <div class="upload-row">
                    <el-input :model-value="scope.data.update_path" placeholder="请上传需要更新替换的 osgb 数据（可选）" readonly />
                    <el-button @click="handleSelectUpdateDir(scope.data)">上传</el-button>
                  </div>
                  <div v-if="scope.data.update_name" class="upload-name">更新数据名称：{{ scope.data.update_name }}</div>
                </template>
              </page-modal>
            </div>
          </section>
                    <section v-if="activeMenu === 'convert'" class="page-wrap page-convert">
            <div class="app-shell" :class="`theme-${theme}`">
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
                                    <div class="param-item">
                                      <label for="cfg-edge">边缘精细度 %</label>
                                      <input
                                        id="cfg-edge"
                                        v-model.number="config.edge_precision"
                                        type="number"
                                        min="50"
                                        max="98"
                                        step="1"
                                      />
                                    </div>
                                  </div>

                                  <div class="toggle-wrapper">
                                    <input
                                      id="cfg-output-transparency"
                                      v-model="config.output_transparency"
                                      type="checkbox"
                                    />
                                    <label for="cfg-output-transparency">输出后写入透明通道</label>
                                  </div>

                                  <div class="toggle-wrapper pbr-toggle">
                                    <input id="cfg-pbr" v-model="config.pbr" type="checkbox" />
                                    <label for="cfg-pbr">启用 PBR 纹理</label>
                                  </div>

                                  <div class="toggle-wrapper pbr-toggle">
                                    <input id="cfg-aggregate" v-model="config.aggregate" type="checkbox" />
                                    <label for="cfg-aggregate">转换后瓦片聚合（合并碎片 tile，减少数量）</label>
                                  </div>
                                </section>

                                <section class="config-section config-actions">
                                  <button
                                    class="btn-primary btn-start button-with-icon"
                                    type="button"
                                    :disabled="status === 'running' || !inputDir"
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
          
            </div></section>
          <section v-else-if="activeMenu === 'records'" class="page-wrap page-records">
            <div class="records-toolbar">
              <h3>记录管理</h3>
              <div class="records-actions">
                <el-input v-model="searchKeyword" placeholder="搜索名称/目录/状态" clearable style="width: 260px" />
                <el-button type="primary" size="small" @click="loadRecords()">刷新</el-button>
              </div>
            </div>
            <el-table :data="filteredRecords" v-loading="recordsLoading" border stripe style="width: 100%">
              <el-table-column prop="id" label="ID" width="70" />
              <el-table-column prop="name" label="名称" min-width="180" show-overflow-tooltip />
              <el-table-column prop="input_dir" label="输入目录" min-width="220" show-overflow-tooltip />
              <el-table-column prop="output_dir" label="输出目录" min-width="220" show-overflow-tooltip />
              <el-table-column prop="status" label="状态" width="110">
                <template #default="{ row }">
                  <el-tag :type="row.status === 'success' ? 'success' : (row.status === 'error' ? 'danger' : 'info')">{{ row.status || 'idle' }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="tile_count" label="瓦片数" width="100" />
              <el-table-column prop="created_at" label="创建时间" width="180" />
              <el-table-column label="操作" width="100" fixed="right">
                <template #default="{ row }">
                  <el-button type="danger" size="small" @click="removeRecord(row.id)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </section>
        </el-main>
        <el-footer height="50px" class="footer">© 2026 3DMine · OSGB → 3D Tiles</el-footer>
      </el-container>
    </el-container>
  </div>

    <!-- 新增批次 -->
    <el-dialog v-model="batchDialogVisible" title="新增批次" width="420px">
      <el-form label-width="90px">
        <el-form-item label="批次名称" required>
          <el-input v-model="batchName" placeholder="请输入批次名称" maxlength="60" @keyup.enter="saveBatch" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="batchSaving" @click="saveBatch">保存</el-button>
      </template>
    </el-dialog>



    <!-- 转换任务 -->
    <el-dialog v-model="convertDialogVisible" title="转换任务" width="720px" :close-on-click-modal="false">
      <div v-if="convertingRecord" class="convert-info">
        <span>原数据：{{ convertingRecord.source_name || convertingRecord.source_path }}</span>
        <span v-if="convertingRecord.update_name">｜更新：{{ convertingRecord.update_name }}</span>
      </div>
      <div class="convert-log" ref="convertLogContainer">
        <div v-for="(line, i) in convertLogs" :key="i" class="log-line">{{ line }}</div>
        <div v-if="!convertLogs.length" class="log-empty">等待启动转换...</div>
      </div>
      <template #footer>
        <el-button v-if="convertStatus === 'running'" @click="cancelRecordConversion">取消</el-button>
        <el-button v-else type="primary" :disabled="!convertingRecord" @click="startRecordConversion">开始转换</el-button>
        <el-button @click="convertDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

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




/* ===== 后台整体布局：完整照抄 yitai src/views/layout/layout.less ===== */
.layout { position: fixed; top: 0; left: 0; width: 100%; height: 100%; }
.main-content { height: 100%; }
/* yitai.css 的 .dark .el-container 会把内层容器也强制成 row，这里恢复纵向布局（否则 header/main/footer 横排错位） */
.main-content > .el-container {
  flex-direction: column !important;
}
.main-content .footer { line-height: 50px; text-align: center; }
.main-content .el-header { display: flex; color: #333; text-align: center; align-items: center; }
.main-content .el-aside {
  overflow: hidden;
  text-align: left;
  cursor: pointer;
  background-color: #3575d4;
  background-image: url("@/assets/img/menuBg.png");
  background-size: cover;
  background-repeat: no-repeat;
  transition: width 0.3s linear;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.main-content .el-aside::-webkit-scrollbar { display: none; }
.main-content .el-main {
  --el-main-padding: 10px;
  color: #333;
  background-color: #f0f2f5;
  overflow: auto;
}
.headerBg {
  background-image: url("@/assets/img/logo.svg");
}
.layout-header { display: flex; align-items: center; width: 100%; }
.layout-header .content { flex: 1; display: flex; align-items: center; justify-content: space-between; margin-left: 23px; }
.breadcrumb .bc-title { font-size: 14px; color: #ffffff; font-weight: 600; cursor: pointer; }
.breadcrumb .bc-title:hover { opacity: 0.8; }
.breadcrumb .bc-title.active { color: #ffffff; border-bottom: 2px solid #ffffff; padding-bottom: 2px; }
.breadcrumb .bc-sep { margin: 0 8px; color: rgba(255, 255, 255, 0.65); }
.info { display: flex; align-items: center; }
.user-name { display: flex; align-items: center; gap: 6px; cursor: pointer; color: #333; font-size: 14px; outline: none; }
.menu { display: flex; flex-direction: column; height: 100%; }

/* ===== 后台侧栏：仅做布局适配，视觉保持 MyNavigate 默认样式（与前台一致） ===== */
.admin-aside {
  background: transparent;
}
.admin-nav {
  flex: 1;
  min-height: 0;
  position: relative;
  overflow: hidden;
}
.admin-nav :deep(> div) {
  height: 100%;
}
.admin-nav :deep(.my-navigate) {
  width: 100% !important;
  height: 100% !important;
  margin-top: 0 !important;
  transform: none !important;
  border: none !important;
  border-radius: 0 !important;
  opacity: 1 !important;
}
.admin-nav :deep(.navigate-menu) {
  position: static !important;
  top: auto !important;
  right: auto !important;
  margin-top: 0 !important;
  width: 100% !important;
  max-height: none !important;
  height: calc(100% - 118px) !important;
  overflow-y: auto;
}

/* 菜单项高度校准：无图标时高度会塌陷成 20px，这里统一撑高到 50px，背景条铺满 */
.admin-nav :deep(.navigate-menu .item .item-info) {
  min-height: 50px;
  margin-top: 4px;
}
.admin-nav :deep(.navigate-menu .item .item-info .name) {
  min-height: 50px;
  box-sizing: border-box;
  background-size: 100% 100%;
}

/* ===== 批次管理页（yitai 深色科技风，配合 src/assets/yitai.css 的 body.dark 全覆盖） ===== */
.page-batch {
  padding: 20px;
  min-height: calc(100vh - 110px);
}
.page-batch .page-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}
.page-batch .page-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #e3f8ff;
}
.page-batch .page-header-sub {
  font-size: 13px;
  color: #7ce0f7;
}
.page-batch .batch-layout {
  display: flex;
  align-items: stretch;
  gap: 16px;
}
.page-batch .batch-side {
  width: 260px;
  flex-shrink: 0;
  background: transparent;
  border: 1px solid #3d82d3;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  color: #c8e7f2;
  overflow: hidden;
}
.page-batch .batch-side-head {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(0, 188, 241, 0.2);
}
.page-batch .batch-side-head .batch-refresh {
  width: 28px;
  height: 28px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid rgba(0, 188, 241, 0.2);
  border-radius: 4px;
}
.page-batch .batch-side-head .batch-refresh:hover {
  background: rgba(77, 155, 255, 0.2);
}
.page-batch .batch-side-title {
  font-size: 15px;
  font-weight: 600;
  color: #e3f8ff;
}
.page-batch .batch-list {
  padding: 8px;
  max-height: calc(100vh - 300px);
  overflow-y: auto;
}
.page-batch .batch-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 4px;
  cursor: pointer;
  color: #c8e7f2;
}
.page-batch .batch-item:hover {
  background: rgba(77, 155, 255, 0.15);
}
.page-batch .batch-item.active {
  background: #122640;
  color: #fff;
}
.page-batch .batch-item-main {
  flex: 1;
  min-width: 0;
}
.page-batch .batch-name {
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.page-batch .batch-time {
  font-size: 12px;
  color: #7ce0f7;
  margin-top: 2px;
  opacity: 0.75;
}
.page-batch .batch-del {
  cursor: pointer;
  color: #7ce0f7;
  flex-shrink: 0;
}
.page-batch .batch-del:hover {
  color: #f56c6c;
}
.page-batch .batch-empty {
  padding: 24px 12px;
  text-align: center;
  color: #7ce0f7;
  font-size: 13px;
}
/* 去掉 page-search 深色背景，露出 batch-main 卡片背景（提高特异性覆盖 yitai.css） */
.page-batch .batch-main :deep(.page-search) {
  background-color: transparent !important;
}
.page-batch .batch-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  background: transparent;
  border: 1px solid rgba(0, 188, 241, 0.2);
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}
.page-batch .upload-row {
  display: flex;
  gap: 8px;
  width: 100%;
}
.page-batch .upload-name {
  margin-top: 6px;
  font-size: 12px;
  color: #7ce0f7;
}
.page-batch .st {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 2px;
  font-size: 12px;
}
.page-batch .st-idle { color: #c8d3dc; background: rgba(125, 141, 157, 0.2); }
.page-batch .st-running { color: #f0c674; background: rgba(200, 155, 75, 0.2); }
.page-batch .st-success { color: #7fd6a2; background: rgba(84, 178, 125, 0.2); }
.page-batch .st-error { color: #f08b8b; background: rgba(217, 108, 108, 0.2); }
.page-batch .st-cancelled { color: #c8d3dc; background: rgba(125, 141, 157, 0.2); }

/* ===== 页面布局（误删恢复） ===== */
.footer { line-height: 50px; text-align: center; color: #666; }
.page-wrap { min-height: 100%; }
.page-convert { height: calc(100vh - 110px); }
.page-convert .app-shell { height: 100%; min-width: 0; border-radius: 8px; box-shadow: 0 2px 12px rgba(0,0,0,0.12); }
.page-convert .app-shell .app-body { flex: 1; }
.page-records { padding: 10px; background: #fff; border-radius: 8px; }
.records-toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.records-toolbar h3 { margin: 0; font-size: 16px; color: #333; }
.records-actions { display: flex; align-items: center; gap: 8px; }

</style>
