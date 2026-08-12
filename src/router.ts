import { reactive } from 'vue'

export type AppRoute = '/login' | '/admin' | '/front'

function currentPath(): AppRoute {
  const h = window.location.hash.replace(/^#/, '')
  if (h === '/admin' || h === '/front' || h === '/login') return h as AppRoute
  return '/login'
}

export const route = reactive<{ path: AppRoute }>({ path: currentPath() })

export function navigate(path: AppRoute): void {
  window.location.hash = path
}

export function isLoggedIn(): boolean {
  try {
    return !!sessionStorage.getItem('bs-user')
  } catch {
    return false
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => {
    route.path = currentPath()
  })
}

/** @description ?? 3dmine ?? utils/axios ? import router from "@/router" */
export default {
  push(path: string) {
    navigate((path.startsWith('/') ? path : '/' + path) as AppRoute)
  },
  currentRoute: { value: { path: '/' } },
}
