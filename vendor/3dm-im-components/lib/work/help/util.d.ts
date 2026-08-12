/**
 * @param uint8Array
 * @param crc crc计算的开始值
 * @param endIndex uint8Array结束的位数
 * @param isEnd 此次计算是否代表结束，是则通过计算保证是正数
 * @returns
 */
export declare function getCrc32(uint8Array: Uint8Array, Crc?: number, endIndex?: number, isEnd?: boolean): number;
/**
 * @description 将后一个buffer合并到前一个后面
 *
 * @param buffer1 将要被合并到的
 * @param buffer2 被合并的
 */
export declare function appendBuffer(buffer1: ArrayBuffer, buffer2: ArrayBuffer): ArrayBufferLike;
/**
 * @description 读取文件流，获取切片，每个切片最大为16MB
 *
 * @param reader reader的io流
 * @param bytesReceived 读取的文件字节大小综合
 * @param fileSize 文件的总大小
 */
export declare function getChunk(reader: ReadableStreamDefaultReader<Uint8Array>, bytesReceived: number, fileSize: number): Promise<{
    buffer: ArrayBuffer;
    offset: number;
    bytesReceivedTemp: number;
}>;
/**
 * @description Uint8Array类型转base64
 */
export declare function uint8ArrayToBase64(uint8Array: Uint8Array): string;
