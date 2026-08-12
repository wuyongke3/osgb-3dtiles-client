import { defineStore } from 'pinia'

export interface LocalPageHandler {
  /** 返回全量数据（不做分页/过滤，由 store 统一处理） */
  list?: (query: Record<string, unknown>) => unknown[] | Promise<unknown[]>
  add?: (data: Record<string, unknown>) => Promise<{ success: boolean; id?: number; error?: string }>
  update?: (id: number, data: Record<string, unknown>) => Promise<{ success: boolean; error?: string }>
  remove?: (ids: number[]) => Promise<{ success: boolean; error?: string }>
}

// 本地数据源注册表：url 形如 local:<key>
const localHandlers = new Map<string, LocalPageHandler>()

export function registerLocalPageHandler(key: string, handler: LocalPageHandler): void {
  localHandlers.set(key, handler)
}

function parseLocalUrl(url: string): string | null {
  if (typeof url !== 'string') return null
  const [tag, key] = url.split(':')
  return tag === 'local' && key ? key : null
}

function matchValue(row: Record<string, unknown>, key: string, expect: unknown): boolean {
  const actual = row[key]
  if (expect === undefined || expect === null || expect === '') return true
  if (Array.isArray(expect)) {
    return expect.some((v) => matchValue(row, key, v))
  }
  if (Array.isArray(actual)) {
    return actual.some((v) => matchValue({ [key]: v }, key, expect))
  }
  if (typeof expect === 'number') {
    return Number(actual) === expect
  }
  return String(actual ?? '').toLowerCase().includes(String(expect).toLowerCase())
}

const usePageStore = defineStore('page', {
  state: () => ({
    list: [] as unknown[],
    total: 0,
    tempList: [] as unknown[],
    listByIds: [] as unknown[],
  }),
  actions: {
    saveTempVariable() {
      this.tempList = this.list
    },
    /**
     * 兼容 MyPageContent 的数据请求约定：
     * url 为 local:<key> 时从本地注册表取数，并统一做搜索过滤 + 分页
     */
    async postPageListAction(url: string, queryInfo?: Record<string, unknown>) {
      const key = parseLocalUrl(url)
      if (key) {
        const handler = localHandlers.get(key)
        if (handler?.list) {
          const all = (await handler.list(queryInfo ?? {})) ?? []
          const q = queryInfo ?? {}
          const filtered = all.filter((row) => {
            const r = row as Record<string, unknown>
            return Object.entries(q).every(([k, v]) => {
              if (k === 'page' || k === 'limit' || k === 'sort' || k === 'time_condition') return true
              return matchValue(r, k, v)
            })
          })
          const total = filtered.length
          const page = Number(q.page ?? 1) || 1
          const limit = Number(q.limit ?? 20) || 20
          const lists = filtered.slice((page - 1) * limit, page * limit)
          this.saveTempVariable()
          this.list = lists
          this.total = total
          return { lists, totals: total }
        }
      }
      return { lists: [], totals: 0 }
    },
    async deletePageByIdsAction(url: string, ids: string | number[]) {
      const key = parseLocalUrl(url)
      if (key) {
        const handler = localHandlers.get(key)
        if (handler?.remove) {
          const idArr = Array.isArray(ids) ? ids.map(Number) : String(ids).split(',').map(Number)
          const res = await handler.remove(idArr)
          if (res.success) return { code: 200, data: null }
          return { code: 0, data: { err: res.error || '删除失败' } }
        }
      }
      return { code: 0, data: null }
    },
    async newPageDataAction(url: string, infoData: Record<string, unknown>) {
      const key = parseLocalUrl(url)
      if (key) {
        const handler = localHandlers.get(key)
        if (handler?.add) {
          const res = await handler.add(infoData)
          return res.success ? 200 : 0
        }
      }
      return 0
    },
    async editPageDataAction(url: string, id: number, infoData: Record<string, unknown>) {
      const key = parseLocalUrl(url)
      if (key) {
        const handler = localHandlers.get(key)
        if (handler?.update) {
          const res = await handler.update(id, infoData)
          return res.success ? 200 : 0
        }
      }
      return 0
    },
  },
})

export default usePageStore