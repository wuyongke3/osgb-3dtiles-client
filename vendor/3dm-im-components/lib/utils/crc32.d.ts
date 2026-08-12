/**
 *
 * @param uint8Array
 * @param crc crc计算的开始值
 * @param endIndex uint8Array结束的位数
 * @param isEnd 此次计算是否代表结束，是则通过计算保证是正数
 * @returns
 */
export declare function getCrc32(uint8Array: Uint8Array, Crc?: number, endIndex?: number, isEnd?: boolean): number;
/**
 * @description Uint8Array类型转base64
 */
export declare function uint8ArrayToBase64(uint8Array: Uint8Array): string;
