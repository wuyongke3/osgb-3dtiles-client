/**
 * @description 是否开发环境
 *
 * @returns boolean
 */
export declare function isDev(): boolean;
/**
 * @description 判断是否是3dmineim.3dmine-cn.com域名的网址
 * @returns
 */
export declare function is3dmineimURL(): boolean;
/**
 * @description 是否生产（线上）环境
 *
 * @returns boolean
 */
export declare function isProd(): boolean;
/**
 * @description 获取当前网址域名
 *
 * @example https://3dmineim.3dmine-cn.com:10065
 */
export declare function getCurrentDomainName(): string;
/**
 * @description 最基础的url
 *
 * @example https://3dmineim.3dmine-cn.com:10065/api/v1
 */
export declare function getBaseUrl(): string;
/**
 * @description 文件模型的url
 *
 * @example https://3dmineim.3dmine-cn.com:10065/convertor/api/v1
 */
export declare function getFileModelBaseUrl(): string;
/**
 * @description swagger的url
 */
export declare function getSwaggerUrl(): string;
/**
 * @description websocket的url
 *
 * @example wss://3dmineim.3dmine-cn.com:10065/api/v1
 */
export declare function getSocketBaseUrl(): string;
/**
 * @description websocket中converter项目的url
 *
 * @example wss://3dmineim.3dmine-cn.com:10065/api/v1
 */
export declare function getSocketConverterBaseUrl(): string;
