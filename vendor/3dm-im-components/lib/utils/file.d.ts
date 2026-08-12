import { FILE_RELATED } from '../enums';

/**
 * // 下载文件
 * @param res 返回的ARRAYBUFFER
 * @param _fileName 下载文件名
 */
export declare function downloadFile(res: any, _fileName?: string): void;
export declare function base64Decode(base64: any): string;
/**
 * @description 断点续传说明
 * 1. 协商 negotiation
 * req: 文件名(file_name), 文件大小(size), 切片数量(slice), 文件hash(hash)
 * resp: seq(此次上传序列号), status(1/ok;2/error;), msg(说明信息), data
 * 2. 传输 trans
 * req: seq, slice_id, content, slice_hash
 * resp: seq(此次上传序列号), status(1/ok;2/error;), msg(说明信息), data
 * 3. 结束 finish
 * req: seq, 文件名(file_name), 文件大小(size), 切片数量(slice), 文件hash(hash)
 * resp: seq, (此次上传序列号), status(1/ok;2/error;3/缺少切片;), msg(说明信息), data(缺少的切片数组)

 * message
 * {
 *	"id": "0",
 *	"code": "EventUploadFileSlice",
 *	"data": "{\"seq\": \"xxx1232532dsfsaf\", \"status\":1, \"msg\": \"success\", \"data\": [1,2,3]}",
 *	"error": "",
 * }

 * negotiation, finish ---> req
 * {
 *	"seq": "xxx1232532dsfsaf",
 *	"file_name": "xxx.zip",
 *	"size": 2048,
 *	"hash": "abcdefg",
 * }
 * trans ---> req
 * {
 *	"seq": "xxx1232532dsfsaf",
 *	"slice_id": 1,
 *	"content": [0x23, 0xe4],
 *	"slice_hash": "abcdefg",
 * }
 */
/**
 * @description 生成被分割文件的相关信息
 * @param file
 * @returns
 */
export declare function getCutFileInfo(file: File): {
    fileName: string;
    fileSize: number;
    MAX_SLICE: FILE_RELATED;
    file_length: number;
};
/**
 * @description 将后一个buffer合并到前一个后面
 *
 * @param buffer1 将要被合并到的
 * @param buffer2 被合并的
 */
export declare function appendBuffer(buffer1: ArrayBuffer, buffer2: ArrayBuffer): ArrayBufferLike;
/**
 * @description 获取文件后缀名
 *
 * @param filename 文件名称
 */
export declare function getFileSuffix(filename: string): string;
/**
 * @description 将html元素下载成pdf
 *
 * @param filename 下载文件的名称
 * @param htmlEl 元素el
 * @param bothSidesMargin 左右的页边距，默认40
 */
export declare function htmlToPdf(filename: string, htmlEl: HTMLElement, transverse?: "p" | "l", // 横向或纵向,默认纵向
bothSidesMargin?: number): Promise<void>;
/**
 *
 * @param filename
 * @param htmlEl
 * @param bothSidesMargin
 * @param scale 缩放大小（默认2）
 * @param a4_height
 * @param a4_width
 * @param other_height 额外的高度（有时渲染高度不够）
 * @returns
 */
export declare function htmlToPdfAllinOne(filename: string, htmlEl: HTMLElement, bothSidesMargin?: number, scale?: number, a4_height?: number, a4_width?: number, other_height?: number): Promise<void>;
/** @description 返回文件拓展名 */
export declare function getFileExtension(filename: string): string;
