# 服务接入文档

本文档说明 3DMine(osgb转3dtile工具) 对外提供的服务接入方式，供自动化流程、第三方系统或二次开发集成使用。

---

## 1. 接入方式总览

| 方式 | 形态 | 适用场景 |
|---|---|---|
| HTTP API | 桌面程序内置 HTTP 服务（`127.0.0.1`） | 需要与桌面程序同机交互、远程触发转换、查询状态 |
| 独立命令行工具 | `dist-tools-exe/merge-update-tool.exe` | 无界面服务器/批处理/CI 环境直接执行 OSGB 合并更新 |
| 瓦片聚合工具 | `scripts/aggregate-tiles.cjs`（Node 脚本） | 对已转换的 3D Tiles 做瓦片聚合优化 |

三种方式都支持「大范围 + 小范围更新」合并转换，其中：

- HTTP API / 命令行工具：执行完整转换（OSGB → 3D Tiles，可选小范围更新合并）
- 瓦片聚合工具：对转换输出做后处理（合并碎片 tile、保留 LOD、清理冗余）

---

## 2. HTTP API（桌面程序内置）

桌面程序启动后自动监听本机 HTTP 服务，无需额外启动。

### 2.1 基本信息

| 项 | 值 |
|---|---|
| 监听地址 | `127.0.0.1`（仅本机） |
| 端口 | 环境变量 `MERGE_UPDATE_API_PORT` 指定，默认 `18080` |
| 鉴权 | 环境变量 `MERGE_UPDATE_API_TOKEN` 指定令牌；**未设置时接口开放** |
| 请求体大小 | 最大 1MB |
| 并发 | 单实例：同一时间只能有一个转换任务，重复提交返回错误 |

### 2.2 鉴权方式

设置了 `MERGE_UPDATE_API_TOKEN` 后，每次请求需携带令牌（二选一）：

```http
X-Merge-Update-Token: <token>
```

或

```http
Authorization: Bearer <token>
```

未携带或错误返回 `401 { "success": false, "error": "未授权" }`。

### 2.3 接口列表

#### 2.3.1 健康检查

```
GET /api/merge-update/health
```

响应示例：

```json
{
  "success": true,
  "status": "idle",
  "port": 18080,
  "tool": { "exists": true, "path": "C:\\...\\3dtile.exe" }
}
```

`status` 取值：`idle`（空闲）/ `running`（转换中）。

#### 2.3.2 取消当前转换

```
POST /api/merge-update/cancel
```

响应示例：

```json
{ "success": true }
```

无进行中的任务时返回 `{ "success": false, "error": "当前没有可取消的转换进程" }`。

#### 2.3.3 执行转换

```
POST /api/merge-update
Content-Type: application/json
```

请求体（JSON）：

```json
{
  "inputDir": "D:\\data\\osgb\\大范围",
  "outputDir": "D:\\data\\out\\tiles",
  "updateDirs": ["D:\\data\\osgb\\小范围1", "D:\\data\\osgb\\小范围2"],
  "config": {
    "max_lvl": 20,
    "edge_precision": 85,
    "output_transparency": true,
    "pbr": false,
    "aggregate": true,
    "aggregateTargetMB": 30,
    "aggregateMaxMB": 100
  },
  "includeLogs": true
}
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `inputDir` | string | 是 | 大范围 OSGB 根目录（含 `Data/` 与 `metadata.xml`） |
| `outputDir` | string | 否 | 输出目录；缺省自动生成为 `inputDir_3dtiles` |
| `updateDirs` | string[] | 否 | 小范围更新目录列表（可为空） |
| `config.x` / `config.y` | number/string | 否 | 中心坐标；通常可由 metadata 自动推断 |
| `config.offset` | number | 否 | 高度偏移 |
| `config.max_lvl` | number | 否 | 最大层级，默认 20 |
| `config.edge_precision` | number | 否 | 边缘精细度 50-98，默认 85 |
| `config.output_transparency` | boolean | 否 | 输出后写入透明通道属性（默认不透明） |
| `config.output_opacity` | number | 否 | 显式输出透明度 1-100（<100 时写半透明） |
| `config.pbr` | boolean | 否 | 启用 PBR 纹理 |
| `config.aggregate` | boolean | 否 | 转换完成后自动瓦片聚合 |
| `config.aggregateTargetMB` | number | 否 | 聚合单 tile 目标大小，默认 30 |
| `config.aggregateMaxMB` | number | 否 | 聚合单 tile 上限，默认 100 |
| `includeLogs` | boolean | 否 | `true` 时响应中附带转换日志 `logs` |

响应示例（成功）：

```json
{
  "success": true,
  "outputDir": "D:\\data\\out\\tiles"
}
```

失败时 HTTP 状态码为 `500`，响应：

```json
{ "success": false, "error": "错误信息" }
```

### 2.4 调用示例

curl：

```bash
curl -X POST http://127.0.0.1:18080/api/merge-update \
  -H "Content-Type: application/json" \
  -H "X-Merge-Update-Token: mytoken" \
  -d '{"inputDir":"D:/data/osgb/大范围","updateDirs":["D:/data/osgb/小范围"],"config":{"aggregate":true}}'
```

PowerShell：

```powershell
$body = @{
  inputDir  = "D:\data\osgb\大范围"
  updateDirs = @("D:\data\osgb\小范围")
  config    = @{ aggregate = $true }
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Uri "http://127.0.0.1:18080/api/merge-update" `
  -Method Post -ContentType "application/json" -Body $body
```

---

## 3. 独立命令行工具 merge-update-tool.exe

无界面环境下可直接调用，适合 CI / 批处理 / 服务器部署。

### 3.1 获取与构建

- 产物路径：`dist-tools-exe/merge-update-tool.exe`（自包含单文件，无需安装 Node）
- 重新构建：`npm run build:tool:exe`

### 3.2 使用方式

```bash
# 直接参数
merge-update-tool.exe --original_scope <大范围目录> --new_scope <小范围目录> --outputDir <输出目录>

# 逗号分隔 / 重复参数 / JSON 数组 均可
merge-update-tool.exe --original-scope <目录> --new-scope <目录1,目录2> --level 20 --density 85

# 配置文件
merge-update-tool.exe --config config.json

# 直接 JSON
merge-update-tool.exe --json "{\"inputDir\":\"...\"}"

# 标准输入
type config.json | merge-update-tool.exe --stdin
```

### 3.3 参数说明

| 参数 | 说明 |
|---|---|
| `--original_scope` / `--original-scope` | 大范围 OSGB 根目录 |
| `--new_scope` / `--new-scope` | 小范围更新目录；可重复、逗号分隔或 JSON 数组 |
| `--level` / `--max_lvl` | 最大层级；缺省自动扫描，默认 20 |
| `--outputDir` / `--output-dir` | 输出目录 |
| `--density` / `--edge_precision` | 边缘精细度 50-98，默认 85 |
| `--transparent` | 输出后为每个材质添加 alpha 属性（默认 1 不透明，避免瓦片缝隙；透明由预览控制） |
| `--no-transparent` | 不写入透明通道（默认） |
| `--opacity` / `--output-opacity` | 显式输出透明度 1-100；默认 100 不处理 |
| `--x` / `--y` / `--offset` | 手动中心坐标与高度偏移（通常 metadata 自动推断） |
| `--pbr` | 启用 PBR |
| `--aggregate` | 转换完成后自动瓦片聚合（合并碎片 tile，保留 LOD） |
| `--aggregate-target-mb` | 聚合单 tile 目标大小，默认 30 |
| `--aggregate-max-mb` | 聚合单 tile 上限，默认 100 |
| `--toolDir` / `--tool-dir` | 指定 3dtile 工具目录 |
| `--exePath` / `--exe-path` | 指定 3dtile.exe 完整路径 |
| `--config` | 配置文件路径（JSON） |
| `--json` | 直接传入 JSON 字符串 |
| `--stdin` | 从标准输入读取 JSON |
| `--pretty` | 美化输出 JSON |

### 3.4 输出约定

- 结果 JSON 输出到 **stdout**
- 转换日志输出到 **stderr**
- 成功：`{ "success": true, "outputDir": "..." }`
- 失败：`{ "success": false, "error": "..." }`

### 3.5 配置文件示例

```json
{
  "inputDir": "D:/data/osgb/大范围",
  "outputDir": "D:/data/out/tiles",
  "updateDirs": ["D:/data/osgb/小范围1", "D:/data/osgb/小范围2"],
  "config": {
    "max_lvl": 20,
    "edge_precision": 85,
    "output_transparency": true,
    "pbr": false
  }
}
```

---

## 4. 瓦片聚合工具 aggregate-tiles.cjs

对已转换的 3D Tiles 输出做后处理：按空间合并碎片 b3dm、保留 LOD、重算包围盒/几何误差、清理冗余文件。

### 4.1 运行环境

- Node.js ≥ 18（项目使用 Node 22 验证）
- 无第三方依赖

### 4.2 使用方式

```bash
node scripts/aggregate-tiles.cjs --input <转换输出目录> --output <聚合输出目录> [--target-mb 30] [--max-mb 100] [--clean]
```

### 4.3 参数说明

| 参数 | 默认 | 说明 |
|---|---|---|
| `--input` | - | 转换输出目录（含 `tileset.json`） |
| `--output` | - | 聚合结果输出目录 |
| `--target-mb` | 30 | 单 tile 目标大小（推荐 10-50） |
| `--max-mb` | 100 | 单 tile 上限 |
| `--clean` | 关 | 删除输出中 tileset 不再引用的原 b3dm（省空间） |

### 4.4 输出示例

```json
{
  "beforeTiles": 16346,
  "afterTiles": 321,
  "reduction": "50.92x",
  "beforeMB": "5316.2",
  "afterMB": "5309.9",
  "mergeGroups": 321,
  "skippedGroups": 0,
  "cleanRemovedFiles": 16781,
  "cleanRemovedMB": "6153.3",
  "cleanKept": 321
}
```

---

## 5. 通用转换配置说明

以下参数在 HTTP API、CLI、GUI 中含义一致：

| 参数 | 默认 | 说明 |
|---|---|---|
| `x` / `y` | 自动 | 转换中心坐标（经纬度）；通常由 `metadata.xml` 自动推断 |
| `offset` | 0 | 高度偏移（米） |
| `max_lvl` | 20 | 最大 LOD 层级 |
| `edge_precision` | 85 | 边缘精细度（50-98）：控制小范围更新合并时旧瓦片裁剪比例 |
| `output_transparency` | false | 输出后为每个材质添加 alpha 属性（默认 alpha=1 不透明） |
| `output_opacity` | 100 | 显式输出透明度（1-100，<100 时写入半透明 alpha） |
| `pbr` | false | 启用 PBR 纹理 |
| `aggregate` | false | 转换完成后自动瓦片聚合 |
| `aggregateTargetMB` | 30 | 聚合目标单 tile 大小 |
| `aggregateMaxMB` | 100 | 聚合单 tile 上限 |

### 输入数据要求

- OSGB 根目录需包含 `Data/` 子目录（标准 `Tile_xxx_xxx/Tile_xxx_xxx.osgb` 结构）和 `metadata.xml`
- 小范围更新目录与大范围需满足：
  - 坐标系（SRS）一致
  - 坐标原点（SRSOrigin）不同时自动平移对齐
- 程序会先校验目录结构并解析坐标系信息

---

## 6. 注意事项

| 项 | 说明 |
|---|---|
| 单实例限制 | HTTP API 同一时间只允许一个转换任务；转换中提交新任务返回错误 |
| 端口占用 | 默认 18080 被占用时，通过环境变量 `MERGE_UPDATE_API_PORT` 指定其它端口 |
| 鉴权 | 生产环境务必设置 `MERGE_UPDATE_API_TOKEN` |
| 请求体限制 | HTTP 请求体最大 1MB（含 base64 场景请改用文件路径参数） |
| 聚合耗时 | 聚合是 CPU 密集操作（约 30 秒/5GB 数据），HTTP 请求会等待其完成 |
| 日志 | CLI 日志走 stderr；HTTP 可通过 `includeLogs: true` 获取日志 |
| 取消 | 通过 `POST /api/merge-update/cancel` 或 CLI 进程终止取消 |

---

## 7. 快速开始（最小示例）

```bash
# 1. 启动桌面程序（自动监听 127.0.0.1:18080）

# 2. 健康检查
curl http://127.0.0.1:18080/api/merge-update/health

# 3. 执行带小范围更新 + 聚合的转换
curl -X POST http://127.0.0.1:18080/api/merge-update \
  -H "Content-Type: application/json" \
  -d '{
    "inputDir": "D:/data/osgb/base",
    "outputDir": "D:/data/out/tiles",
    "updateDirs": ["D:/data/osgb/update"],
    "config": { "edge_precision": 85, "aggregate": true }
  }'

# 4. 无 GUI 环境直接用命令行工具
merge-update-tool.exe --original_scope D:/data/osgb/base --new_scope D:/data/osgb/update --outputDir D:/data/out/tiles

# 5. 对已有输出做瓦片聚合
node scripts/aggregate-tiles.cjs --input D:/data/out/tiles --output D:/data/out/tiles-agg --clean
```
