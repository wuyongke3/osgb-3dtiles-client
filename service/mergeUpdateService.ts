export type MergeUpdateStatus = 'idle' | 'running' | 'success' | 'error' | 'cancelled'

export interface MergeUpdateToolApi {
  startConversion: (params: {
    inputDir: string
    outputDir?: string
    config: {
      x?: number | string
      y?: number | string
      offset?: number
      max_lvl?: number
      edge_precision?: number
      pbr?: boolean
    }
    updateDirs?: string[]
  }) => Promise<MergeUpdateResult>
  cancelConversion: () => Promise<boolean>
  checkTool: () => Promise<{ exists: boolean; path: string }>
  onConversionStdout: (callback: (text: string) => void) => () => void
  onConversionStderr: (callback: (text: string) => void) => () => void
  onConversionStatus: (callback: (status: MergeUpdateStatus) => void) => () => void
}

export interface MergeUpdateParams {
  inputDir: string
  outputDir?: string
  updateDirs?: string[]
  x?: number | string
  y?: number | string
  offset?: number
  maxLvl?: number
  max_lvl?: number
  edgePrecision?: number
  edge_precision?: number
  pbr?: boolean
  onStdout?: (text: string) => void
  onStderr?: (text: string) => void
  onStatus?: (status: MergeUpdateStatus) => void
}

export interface MergeUpdateResult {
  success: boolean
  error?: string
  outputDir?: string
}

export interface MergeUpdateToolCheckResult {
  exists: boolean
  path: string
}

function getDefaultApi(): MergeUpdateToolApi {
  const api = globalThis.window?.electronAPI
  if (!api) {
    throw new Error('electronAPI 不可用，合并更新服务需要在 Electron 渲染进程中调用')
  }
  return api
}

function normalizeUpdateDirs(updateDirs?: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []

  for (const dir of updateDirs ?? []) {
    const value = dir.trim()
    if (!value || seen.has(value)) continue
    seen.add(value)
    result.push(value)
  }

  return result
}

export function buildMergeUpdateConversionParams(params: MergeUpdateParams) {
  if (!params.inputDir?.trim()) {
    throw new Error('inputDir 不能为空')
  }

  const outputDir = params.outputDir?.trim() || undefined
  const maxLevel = params.maxLvl ?? params.max_lvl
  const edgePrecision = params.edgePrecision ?? params.edge_precision

  return {
    inputDir: params.inputDir.trim(),
    outputDir,
    config: {
      x: params.x,
      y: params.y,
      offset: params.offset,
      max_lvl: maxLevel,
      edge_precision: edgePrecision,
      pbr: params.pbr,
    },
    updateDirs: normalizeUpdateDirs(params.updateDirs),
  }
}

export async function runMergeUpdateConversion(
  params: MergeUpdateParams,
  api: MergeUpdateToolApi = getDefaultApi(),
): Promise<MergeUpdateResult> {
  const removers: Array<() => void> = []

  if (params.onStdout) removers.push(api.onConversionStdout(params.onStdout))
  if (params.onStderr) removers.push(api.onConversionStderr(params.onStderr))
  if (params.onStatus) removers.push(api.onConversionStatus(params.onStatus))

  try {
    return await api.startConversion(buildMergeUpdateConversionParams(params))
  } finally {
    removers.forEach((remove) => remove())
  }
}

export async function cancelMergeUpdateConversion(
  api: MergeUpdateToolApi = getDefaultApi(),
): Promise<boolean> {
  return api.cancelConversion()
}

export async function checkMergeUpdateTool(
  api: MergeUpdateToolApi = getDefaultApi(),
): Promise<MergeUpdateToolCheckResult> {
  return api.checkTool()
}
