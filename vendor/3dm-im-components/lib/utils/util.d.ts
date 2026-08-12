export declare function omit<T extends object, K extends keyof T>(obj: T, keys: K | K[], deepClone?: boolean): Omit<T, K>;
/** 随机生成一个符合ts和golang命名规范的字符串 */
export declare function randomIdentifier(length?: number): string;
/** 映射汉字的星期几 */
export declare function chineseWeekMap(week: 1 | 2 | 3 | 4 | 5 | 6 | 7): "一" | "二" | "三" | "四" | "五" | "六" | "日" | undefined;
/** 空函数 */
export declare function emptyFn(): void;
/** @description 将 kebab-case 字符串转换为 camelCase */
export declare function kebabToCamel(str: string): string;
/** @description 检测一个名称是否是横线连接 */
export declare function isKebabCase(name: string): boolean;
/**
 * @description 检查给定的 IP 地址是否匹配以 `192.168.18` 开头的格式。
 * @param ip - 要检查的 IP 地址
 * @returns 如果 IP 地址匹配，则返回 true；否则返回 false。
 */
export declare function isValidIp(ip: string): boolean;
/**
 * @description 递归合并多个对象，后面的对象覆盖前面的
 *
 * @param objects 对象
 *
 * @returns
 */
export declare function mergeObjects(...objects: any[]): any;
/**
 * @description 获取当前页面中所有元素最大的那个z-index
 *
 * @returns 最大的z-index
 */
export declare function getCurrentPageMaxZIndex(): number;
/**
 * @description 全屏
 *
 * @param element 全屏的元素
 */
export declare function fullScreen(element: Element, options?: FullscreenOptions | undefined): void;
/**
 * @description 判断函数是否异步
 */
export declare function isAsyncFunction(func: Function): boolean;
/**
 * @description 合并两个数组，同时根据某个字段过滤
 *
 * @param arr1
 * @param arr2
 * @param field 根据这个字段名称过滤
 * @returns 合并后的数组
 */
export declare function mergeAndFilterArr(arr1: any[], arr2: any[], field: string): any[];
/**
 * @description 专门用来格式化饼图图例名称
 * @param name
 * @param data 饼图的series里面的data
 * @param total 总数
 * @returns
 */
export declare function formatterPieLegend(name: string, data: any[]): string;
/**
 * @description 深拷贝
 * 支持拷贝的类型有：数组、日期、普通对象、基本类型
 *
 * @param value 要拷贝的对象
 * @returns 拷贝后的对象
 */
export declare function OBJDeepClone<T = any>(value: T): T;
/**
 * @description 传递一个url，从url中获取这个url携带的所有参数
 *
 * @param url
 * @param delimiter_symbol 路径与参数之间的分隔符，默认是 _p_3dmine_p_
 */
export declare function getParamOnURL(url: string, delimiter_symbol?: string): Map<string, {
    [index: string]: string | number;
}>;
/**
 * @description 返回格式化好的url上面携带的参数，循环传递的map
 *
 * @param paramMap 通过getParamOnURL()获取的urlMap
 *
 * @example 返回的数据project_id=1&project_layer_id=2
 */
export declare function formatUrlParam(paramMap: Map<string, {
    [index: string]: string | number;
}>): string;
/**
 * 修复版防抖函数 - 自动执行
 */
export declare function debounce<T extends (...args: any[]) => any>(fn: T, delay: number, immediate?: boolean): {
    (this: any, ...args: Parameters<T>): ReturnType<T> | undefined;
    cancel(): void;
};
/**
 * 时间选择器选择数据后，格式化一下传给后端的数据
 *
 * @param time_field 筛选的日期字段
 * @param val 时间选择器改变的数据
 * @param data listQuery要传的数据：
 * { time_field: "created_at", start_time: 0, end_time: 0 }
 */
export declare function datePickerChange(time_field: string, val: any, data: any[]): void;
/**
 * @description 视频文件的拓展名
 *
 * @returns "AVI", "RM", "MOV", "RMVB", "RM", "FLV", "MP4", "3GP", "WEBM"
 */
export declare function getVideoTag(): string[];
/**
 *
 * @param {*} ext 视频名称
 * @returns 是否为视频，通过文件后缀判断
 */
export declare function isVideo(ext: string): boolean;
/**
 * @description 图片文件的拓展名
 *
 * @returns "BMP", "JPG", "JPEG", "PNG", "GIF"
 */
export declare function getImageTag(): string[];
/**
 *
 * @param {*} ext 图片名称
 * @returns 是否为图片，通过文件后缀判断
 */
export declare function isImage(ext: string): boolean;
/**
 * @description 音频文件的拓展名
 *
 * @returns  "AVI", "WMV", "MPG", "MPEG", "MOV", "RM", "RAM",
    "SWF", "FLV", "MP4", "MP3", "WMA", "AVI", "RM", "RMVB",
    "FLV", "MPG", "MKV", "WAV",
 */
export declare function getAudioTag(): string[];
/**
 *
 * @param {*} ext 音频名称
 * @returns 是否为音频，通过文件后缀判断
 */
export declare function isAudio(ext: string): boolean;
/**
 * 格式化文件大小
 * @param fileSize 文件的size
 * @returns
 */
export declare function fileSizeFormat(fileSize: number): string;
/**
 * @description 将一个树形结构转换成一维的map
 *
 * @param treeData 一个树形的数据
 * @param optionsProp 树形里面的字段名称，默认是id和children
 */
export declare function TreeDataToMap<T = any>(treeData?: T[], optionsProp?: {
    id: string;
    children: string;
}): Map<number, T>;
/**
 * @description 获取图片的宽高
 *
 * @param base64DataURL base64路径
 * @returns
 */
export declare function getImageInfoByBase64DataURL(base64DataURL: string): Promise<ImageData>;
/**
 * @description 开发模式根据报错信息代开csdn
 * @param error
 */
export declare function openHelpCsdnOnDev(error: any): void;
export declare function isUndefined<T>(val: T): boolean;
