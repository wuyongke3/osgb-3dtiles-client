import { ipcRenderer, contextBridge } from 'electron'

// ─── Type definitions for the exposed API ─────────────────────────────

export interface MetadataInfo {
  srs: string | null
  srsOrigin: { x: number; y: number; z: number } | null
  version: string | null
}

export interface MetadataResult {
  found: boolean
  path?: string
  data: MetadataInfo | null
}

export interface ValidateResult {
  valid: boolean
  message: string
}

export interface ConversionConfig {
  x?: number | string
  y?: number | string
  offset?: number
  max_lvl?: number
  edge_precision?: number
  pbr?: boolean
}

export interface ConversionParams {
  inputDir: string
  outputDir?: string
  config: ConversionConfig
  updateDirs?: string[]
}

export interface ConversionResult {
  success: boolean
  error?: string
  outputDir?: string
}

export interface ToolCheckResult {
  exists: boolean
  path: string
}

export type ConversionStatus = 'idle' | 'running' | 'success' | 'error' | 'cancelled'

// ─── Expose API to renderer process ───────────────────────────────────

contextBridge.exposeInMainWorld('electronAPI', {
  // ── Directory selection ──
  selectOsgbDir: (): Promise<string | null> =>
    ipcRenderer.invoke('select-osgb-dir'),

  selectOutputDir: (): Promise<string | null> =>
    ipcRenderer.invoke('select-output-dir'),

  // ── Metadata ──
  readMetadata: (dirPath: string): Promise<MetadataResult> =>
    ipcRenderer.invoke('read-metadata', dirPath),

  // ── Validation ──
  validateOsgbStructure: (dirPath: string): Promise<ValidateResult> =>
    ipcRenderer.invoke('validate-osgb-structure', dirPath),

  // ── Config ──
  getDefaultConfig: (): Promise<ConversionConfig> =>
    ipcRenderer.invoke('get-default-config'),

  // ── Conversion ──
  startConversion: (params: ConversionParams): Promise<ConversionResult> =>
    ipcRenderer.invoke('start-conversion', params),

  cancelConversion: (): Promise<boolean> =>
    ipcRenderer.invoke('cancel-conversion'),

  // ── Tool check ──
  checkTool: (): Promise<ToolCheckResult> =>
    ipcRenderer.invoke('check-tool'),

  // ── File system ──
  openOutputDir: (dirPath: string): Promise<void> =>
    ipcRenderer.invoke('open-output-dir', dirPath),

  // ── Preview ──
  startPreview: (params?: { outputDir?: string; centerX?: number; centerY?: number; offset?: number }): Promise<{ success: boolean; error?: string; port?: number; url?: string }> =>
    ipcRenderer.invoke('start-preview', params),

  stopPreview: (): Promise<boolean> =>
    ipcRenderer.invoke('stop-preview'),

  // ── Event listeners for conversion output ──
  onConversionStdout: (callback: (text: string) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, text: string) => callback(text)
    ipcRenderer.on('conversion-stdout', handler)
    return () => ipcRenderer.removeListener('conversion-stdout', handler)
  },

  onConversionStderr: (callback: (text: string) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, text: string) => callback(text)
    ipcRenderer.on('conversion-stderr', handler)
    return () => ipcRenderer.removeListener('conversion-stderr', handler)
  },

  onConversionStatus: (callback: (status: ConversionStatus) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, status: ConversionStatus) => callback(status)
    ipcRenderer.on('conversion-status', handler)
    return () => ipcRenderer.removeListener('conversion-status', handler)
  },

  // ── Generic IPC (for compatibility) ──
  on: (channel: string, callback: (...args: unknown[]) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, ...args: unknown[]) => callback(...args)
    ipcRenderer.on(channel, handler)
    return () => ipcRenderer.removeListener(channel, handler)
  },
  send: (channel: string, ...args: unknown[]) => {
    ipcRenderer.send(channel, ...args)
  },
  invoke: (channel: string, ...args: unknown[]) => {
    return ipcRenderer.invoke(channel, ...args)
  },
})

// ─── Loading screen ────────────────────────────────────────────────────
function domReady(condition: DocumentReadyState[] = ['complete', 'interactive']) {
  return new Promise((resolve) => {
    if (condition.includes(document.readyState)) {
      resolve(true)
    } else {
      document.addEventListener('readystatechange', () => {
        if (condition.includes(document.readyState)) {
          resolve(true)
        }
      })
    }
  })
}

const safeDOM = {
  append(parent: HTMLElement, child: HTMLElement) {
    if (!Array.from(parent.children).find(e => e === child)) {
      return parent.appendChild(child)
    }
  },
  remove(parent: HTMLElement, child: HTMLElement) {
    if (Array.from(parent.children).find(e => e === child)) {
      return parent.removeChild(child)
    }
  },
}

function useLoading() {
  const styleContent = `
    @keyframes square-spin {
      25% { transform: perspective(100px) rotateX(180deg) rotateY(0); }
      50% { transform: perspective(100px) rotateX(180deg) rotateY(180deg); }
      75% { transform: perspective(100px) rotateX(0) rotateY(180deg); }
      100% { transform: perspective(100px) rotateX(0) rotateY(0); }
    }
    .loaders-css__square-spin > div {
      animation-fill-mode: both;
      width: 50px;
      height: 50px;
      background: #4a90d9;
      animation: square-spin 3s 0s cubic-bezier(0.09, 0.57, 0.49, 0.9) infinite;
    }
    .app-loading-wrap {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #1a1d23;
      z-index: 9999;
    }
  `
  const oStyle = document.createElement('style')
  const oDiv = document.createElement('div')

  oStyle.id = 'app-loading-style'
  oStyle.innerHTML = styleContent
  oDiv.className = 'app-loading-wrap'
  oDiv.innerHTML = `<div class="loaders-css__square-spin"><div></div></div>`

  return {
    appendLoading() {
      safeDOM.append(document.head, oStyle)
      safeDOM.append(document.body, oDiv)
    },
    removeLoading() {
      safeDOM.remove(document.head, oStyle)
      safeDOM.remove(document.body, oDiv)
    },
  }
}

const { appendLoading, removeLoading } = useLoading()
domReady().then(appendLoading)

window.onmessage = (ev) => {
  ev.data.payload === 'removeLoading' && removeLoading()
}

setTimeout(removeLoading, 4999)
