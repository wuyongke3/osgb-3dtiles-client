/** @description 当前运行环境是否是local */
export function isLocal() {
  return import.meta.env.VITE_APP_ENV == "local";
}

/** @description 当前运行环境是否是dev */
export function isDev() {
  return import.meta.env.VITE_APP_ENV == "dev";
}

/** @description 是否是新疆正式环境 */
export function isPro() {
  return import.meta.env.VITE_APP_ENV == "pro";
}

/** @description 获取当前环境 */
export function currentEnv() {
  return import.meta.env.VITE_CURRENT_DEV;
}

export function goLoginPage() {
  const { protocol, hostname } = window.location;
  const port = isLocal() || isDev() ? "5173" : "10065";
  window.location.href = `${protocol}//${hostname}:${port}/#/login`;
}
