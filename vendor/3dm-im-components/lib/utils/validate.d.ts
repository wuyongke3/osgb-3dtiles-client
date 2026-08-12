/**
 * @description 匹配网址以 "http" 或 "https" 开头，
 * 或者以 "mailto" 或 "tel" 开头的邮箱地址
 *
 * @param {string} path
 * @returns {Boolean}
 */
export declare function isExternal(path: string): boolean;
