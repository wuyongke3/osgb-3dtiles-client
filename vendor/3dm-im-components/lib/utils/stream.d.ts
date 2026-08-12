/**
 * @description 流处理助手
 *
 * @param reader reader的io流
 * @param totalSize 文件的总大小
 * @param maxBufferSize buffer大小
 */
export declare class StreamHelper {
    reader: ReadableStreamDefaultReader<Uint8Array>;
    fileSize: number;
    /** @description 切片总数 */
    totalSlice: number;
    /** @description 当前处理的切片索引 */
    courseSlice: number;
    /** @description 当前需要的切片索引 */
    needleSlice: number;
    /** @description 每个切片大小，默认16MB */
    maxBufferSize: number;
    /** @description 存放每个切片的buffer */
    buffer: Uint8Array;
    /** @description 读取文件的偏移量 */
    offset: number;
    /** @description 读取的文件总字节数 */
    course: number;
    constructor(reader: ReadableStreamDefaultReader<Uint8Array>, fileSize: number, maxBufferSize?: number);
    processBuffer: (result: ReadableStreamReadResult<Uint8Array>) => boolean;
    readBuffer: () => Promise<SliceBufferResult>;
    ReadSlice: (slice: number) => Promise<SliceBufferResult>;
    ReadSlices: (slices: number[], fn?: SliceHandle) => Promise<void>;
    ReadAll: (fn?: SliceHandle) => Promise<void>;
    _defaultSliceHhandler: (result: SliceBufferResult) => void;
    _resetBuffer: () => void;
}
export type SliceBufferResult = {
    buffer: ArrayBuffer | null;
    offset: number;
    bytesReceived: number;
    slice: number;
};
export type SliceHandle = (result: SliceBufferResult) => void;
export declare function ReadAll(reader: ReadableStreamDefaultReader<Uint8Array>, fileSize: number, fn?: SliceHandle, maxBufferSize?: number): void;
export declare function ReadSlices(reader: ReadableStreamDefaultReader<Uint8Array>, fileSize: number, slices: number[], fn?: SliceHandle, maxBufferSize?: number): void;
export declare function ReadSlice(reader: ReadableStreamDefaultReader<Uint8Array>, fileSize: number, slice: number, maxBufferSize?: number): Promise<SliceBufferResult>;
