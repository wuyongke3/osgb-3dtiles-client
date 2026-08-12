declare enum CacheType {
    Local = 0,
    Session = 1
}
declare class CookieCache {
    storage: any;
    constructor();
    setCache(key: string, value: any): any;
    getCache(key: string, isObj?: boolean): any;
    removeCache(key: string): void;
}
declare class Cache {
    storage: Storage;
    constructor(type: CacheType);
    setCache(key: string, value: any): void;
    getCache(key: string): any;
    removeCache(key: string): void;
    clear(): void;
}
declare const cookieCache: CookieCache;
declare const localCache: Cache;
declare const sessionCache: Cache;
export { cookieCache, localCache, sessionCache };
