#!/usr/bin/env node
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import * as sea from 'node:sea'
import { fileURLToPath } from 'node:url'
import { runHeadlessMergeUpdate, type HeadlessMergeUpdateParams } from './mergeUpdateHeadless.js'

interface CliOptions {
  configPath?: string
  jsonText?: string
  pretty: boolean
  directParams: Record<string, unknown>
  hasDirectParams: boolean
}

function printUsage(): void {
  process.stderr.write([
    'Usage:',
    '  merge-update-tool --original_scope <dir> --new_scope <dir> --new_scope <dir> --outputDir <dir>',
    '  merge-update-tool --original-scope <dir> --new-scope <dir1,dir2> --level 20 --density 85',
    '  merge-update-tool --config <config.json>',
    "  merge-update-tool --json '{\"inputDir\":\"...\"}'",
    '  type config.json | merge-update-tool --stdin',
    '',
    'Direct options:',
    '  --original_scope, --original-scope  大范围 OSGB 根目录',
    '  --new_scope, --new-scope          小范围更新目录，可重复、逗号分隔或 JSON 数组',
    '  --level                          最大层级；不传时自动扫描 OSGB，扫描不到默认 20',
    '  --outputDir, --output-dir         输出目录',
    '  --density                        边缘清晰度/精细度，建议 50-98，默认 85',
'  --transparent                     输出后为每个材质添加 alpha 属性 (默认 1 不透明，避免瓦片缝隙；透明由预览控制)',
    '  --no-transparent                  不写入透明通道（默认）',
    '  --opacity, --output-opacity       兼容旧参数：输出透明度百分比，1-100；默认 100 不处理',
    '  --x --y --offset                 手动中心坐标和高度偏移；通常 metadata 可自动推断',
    '  --pbr                            启用 PBR',
    '  --aggregate                       转换完成后自动瓦片聚合（合并碎片 tile）',
    '  --aggregate-target-mb              聚合单 tile 目标大小，默认 30',
    '  --aggregate-max-mb                 聚合单 tile 上限，默认 100',
    '',
    'Result JSON is written to stdout. Conversion logs are written to stderr.',
    '',
  ].join('\n'))
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = { pretty: false, directParams: {}, hasDirectParams: false }

  const readValue = (index: number, name: string): string => {
    const value = argv[index + 1]
    if (!value || value.startsWith('--')) throw new Error(`${name} 需要参数值`)
    return value
  }

  const appendUpdateDirs = (value: string): void => {
    const current = Array.isArray(options.directParams.updateDirs)
      ? options.directParams.updateDirs as string[]
      : []
    const trimmed = value.trim()
    if (!trimmed) return

    if (trimmed.startsWith('[')) {
      const parsed = JSON.parse(trimmed)
      if (!Array.isArray(parsed)) throw new Error('--new_scope JSON 必须是数组')
      current.push(...parsed.filter((item): item is string => typeof item === 'string'))
    } else {
      current.push(...trimmed.split(',').map((item) => item.trim()).filter(Boolean))
    }

    options.directParams.updateDirs = current
    options.hasDirectParams = true
  }

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index]
    if (arg === '--help' || arg === '-h') {
      printUsage()
      process.exit(0)
    }
    if (arg === '--pretty') {
      options.pretty = true
      continue
    }
    if (arg === '--original_scope' || arg === '--original-scope' || arg === '--inputDir' || arg === '--input-dir') {
      options.directParams.inputDir = readValue(index, arg)
      options.hasDirectParams = true
      index++
      continue
    }
    if (arg === '--new_scope' || arg === '--new-scope' || arg === '--updateDir' || arg === '--update-dir') {
      appendUpdateDirs(readValue(index, arg))
      index++
      continue
    }
    if (arg === '--level' || arg === '--max_lvl' || arg === '--max-lvl') {
      options.directParams.max_lvl = Number(readValue(index, arg))
      options.hasDirectParams = true
      index++
      continue
    }
    if (arg === '--outputDir' || arg === '--output-dir') {
      options.directParams.outputDir = readValue(index, arg)
      options.hasDirectParams = true
      index++
      continue
    }
    if (arg === '--density' || arg === '--edge_precision' || arg === '--edge-precision') {
      options.directParams.edge_precision = Number(readValue(index, arg))
      options.hasDirectParams = true
      index++
      continue
    }
    if (arg === '--opacity' || arg === '--output-opacity' || arg === '--output_opacity') {
      options.directParams.output_opacity = Number(readValue(index, arg))
      options.hasDirectParams = true
      index++
      continue
    }
    if (arg === '--transparent' || arg === '--output-transparency' || arg === '--output_transparency') {
      options.directParams.output_transparency = true
      options.hasDirectParams = true
      continue
    }
    if (arg === '--no-transparent' || arg === '--no-output-transparency' || arg === '--no_output_transparency') {
      options.directParams.output_transparency = false
      options.hasDirectParams = true
      continue
    }
    if (arg === '--x' || arg === '--y' || arg === '--offset') {
      options.directParams[arg.slice(2)] = Number(readValue(index, arg))
      options.hasDirectParams = true
      index++
      continue
    }
    if (arg === '--pbr') {
      options.directParams.pbr = true
      options.hasDirectParams = true
      continue
    }
    if (arg === '--aggregate') {
      options.directParams.aggregate = true
      options.hasDirectParams = true
      continue
    }
    if (arg === '--aggregate-target-mb' || arg === '--aggregateTargetMB') {
      options.directParams.aggregateTargetMB = Number(readValue(index, arg))
      options.hasDirectParams = true
      index++
      continue
    }
    if (arg === '--aggregate-max-mb' || arg === '--aggregateMaxMB') {
      options.directParams.aggregateMaxMB = Number(readValue(index, arg))
      options.hasDirectParams = true
      index++
      continue
    }
    if (arg === '--toolDir' || arg === '--tool-dir') {
      options.directParams.toolDir = readValue(index, arg)
      options.hasDirectParams = true
      index++
      continue
    }
    if (arg === '--exePath' || arg === '--exe-path') {
      options.directParams.exePath = readValue(index, arg)
      options.hasDirectParams = true
      index++
      continue
    }
    if (arg === '--stdin') {
      options.jsonText = fs.readFileSync(0, 'utf-8')
      continue
    }
    if (arg === '--config') {
      const value = argv[++index]
      if (!value) throw new Error('--config 需要文件路径')
      options.configPath = value
      continue
    }
    if (arg === '--json') {
      const value = argv[++index]
      if (!value) throw new Error('--json 需要 JSON 字符串')
      options.jsonText = value
      continue
    }
    throw new Error(`未知参数: ${arg}`)
  }

  return options
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function normalizeParams(raw: unknown): HeadlessMergeUpdateParams {
  const source = asRecord(raw)
  const config = asRecord(source.config)
  const toolDir = typeof source.toolDir === 'string'
    ? source.toolDir
    : defaultToolDir()

  return {
    inputDir: typeof source.inputDir === 'string' ? source.inputDir : '',
    outputDir: typeof source.outputDir === 'string' ? source.outputDir : undefined,
    updateDirs: Array.isArray(source.updateDirs)
      ? source.updateDirs.filter((item): item is string => typeof item === 'string')
      : undefined,
    toolDir,
    exePath: typeof source.exePath === 'string' ? source.exePath : undefined,
    config: {
      x: (config.x ?? source.x) as number | string | undefined,
      y: (config.y ?? source.y) as number | string | undefined,
      offset: (config.offset ?? source.offset) as number | undefined,
      max_lvl: (config.max_lvl ?? source.max_lvl ?? source.maxLvl) as number | undefined,
      edge_precision: (config.edge_precision ?? source.edge_precision ?? source.edgePrecision) as number | undefined,
      output_transparency: (config.output_transparency ?? source.output_transparency ?? source.outputTransparency) as boolean | undefined,
      output_opacity: (config.output_opacity ?? source.output_opacity ?? source.outputOpacity) as number | undefined,
      pbr: (config.pbr ?? source.pbr) as boolean | undefined,
      aggregate: (config.aggregate ?? source.aggregate) as boolean | undefined,
      aggregateTargetMB: (config.aggregateTargetMB ?? source.aggregateTargetMB) as number | undefined,
      aggregateMaxMB: (config.aggregateMaxMB ?? source.aggregateMaxMB) as number | undefined,
    },
  }
}

function defaultToolDir(): string {
  const embeddedToolDir = extractEmbeddedToolDir()
  if (embeddedToolDir) return embeddedToolDir

  const currentFile = fileURLToPath(import.meta.url)
  const distToolsDir = path.resolve(path.dirname(currentFile), '..')
  const projectToolDir = path.resolve(distToolsDir, '..', 'public', '3dtile')
  return projectToolDir
}

function extractEmbeddedToolDir(): string | null {
  if (!sea.isSea()) return null

  const assetKeys = sea.getAssetKeys().filter((key) => key.startsWith('3dtile/'))
  if (assetKeys.length === 0) return null

  const targetDir = path.join(os.tmpdir(), 'merge-update-tool-embedded-3dtile')
  fs.mkdirSync(targetDir, { recursive: true })

  for (const key of assetKeys) {
    const relativePath = key.slice('3dtile/'.length)
    if (!relativePath) continue

    const outputPath = path.join(targetDir, ...relativePath.split('/'))
    fs.mkdirSync(path.dirname(outputPath), { recursive: true })

    const asset = sea.getRawAsset(key)
    const bytes = Buffer.from(asset)
    if (fs.existsSync(outputPath) && fs.statSync(outputPath).size === bytes.byteLength) {
      continue
    }
    fs.writeFileSync(outputPath, bytes)
  }

  return targetDir
}

function loadConfig(options: CliOptions): unknown {
  if (options.configPath) {
    return JSON.parse(fs.readFileSync(options.configPath, 'utf-8'))
  }
  if (options.jsonText) {
    return JSON.parse(options.jsonText)
  }
  if (options.hasDirectParams) {
    const source = { ...options.directParams }
    if (source.edge_precision === undefined) source.edge_precision = 85
    return source
  }
  throw new Error('请通过 --config、--json 或 --stdin 传入参数')
}

async function main(): Promise<number> {
  try {
    const options = parseArgs(process.argv.slice(2))
    const params = normalizeParams(loadConfig(options))
    const result = await runHeadlessMergeUpdate({
      ...params,
      onStdout: (text) => process.stderr.write(text),
      onStderr: (text) => process.stderr.write(text),
      onStatus: (status) => process.stderr.write(`[status] ${status}\n`),
    })

    process.stdout.write(JSON.stringify(result, null, options.pretty ? 2 : 0))
    process.stdout.write('\n')
    return result.success ? 0 : 1
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    process.stdout.write(JSON.stringify({ success: false, error: message }))
    process.stdout.write('\n')
    return 1
  }
}

main().then((code) => {
  process.exitCode = code
})
