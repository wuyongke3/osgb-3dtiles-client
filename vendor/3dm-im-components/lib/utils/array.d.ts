/** 根据数组的某一字段去重，返回一个新数组 */
export declare function uniqueBy<T, K extends keyof T>(arr: T[], key: K): T[];
