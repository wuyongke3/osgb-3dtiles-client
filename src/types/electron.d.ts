export {}

type CallbackRemover = () => void

interface MetadataInfo {
  srs: string | null
  srsOrigin: { x: number; y: number; z: number } | null
  version: string | null
}

interface MetadataResult {
  found: boolean
  path?: string
  data: MetadataInfo | null
}

interface ValidateResult {
  valid: boolean
  message: string
}

interface ConversionConfig {
  x?: number | string
  y?: number | string
  offset?: number
  max_lvl?: number
  edge_precision?: number
  pbr?: boolean
}

interface ConversionParams {
  inputDir: string
  outputDir?: string
  config: ConversionConfig
  updateDirs?: string[]
}

interface ConversionResult {
  success: boolean
  error?: string
  outputDir?: string
}

interface ToolCheckResult {
  exists: boolean
  path: string
}

interface PreviewParams {
  outputDir?: string
  centerX?: number
  centerY?: number
  offset?: number
}

interface PreviewResult {
  success: boolean
  error?: string
  port?: number
  url?: string
}

type ConversionStatus = 'idle' | 'running' | 'success' | 'error' | 'cancelled'

interface ElectronAPI {
  selectOsgbDir: () => Promise<string | null>
  selectOutputDir: () => Promise<string | null>
  readMetadata: (dirPath: string) => Promise<MetadataResult>
  validateOsgbStructure: (dirPath: string) => Promise<ValidateResult>
  getDefaultConfig: () => Promise<ConversionConfig>
  startConversion: (params: ConversionParams) => Promise<ConversionResult>
  cancelConversion: () => Promise<boolean>
  checkTool: () => Promise<ToolCheckResult>
  openOutputDir: (dirPath: string) => Promise<void>
  startPreview: (params?: PreviewParams) => Promise<PreviewResult>
  stopPreview: () => Promise<boolean>
  onConversionStdout: (callback: (text: string) => void) => CallbackRemover
  onConversionStderr: (callback: (text: string) => void) => CallbackRemover
  onConversionStatus: (callback: (status: ConversionStatus) => void) => CallbackRemover
  on: (channel: string, callback: (...args: unknown[]) => void) => CallbackRemover
  send: (channel: string, ...args: unknown[]) => void
  invoke: (channel: string, ...args: unknown[]) => Promise<unknown>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
