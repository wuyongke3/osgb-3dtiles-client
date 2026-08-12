import { SOCKET_CODE } from '../enums';
import { ISocketResult } from '../types';

interface SocketOptions {
    /**
     * @description 心跳的时间
     */
    heartbeatInterval?: number;
    /**
     * @description 重新连接的时间
     */
    reconnectInterval?: number;
    /**
     * @description 最大重连数
     */
    maxReconnectAttempts?: number;
}
export type ISocketLinstenerFn = (data: ISocketResult) => void | Promise<void>;
export interface ISocketOnOptions {
    /** 这个event的on是否订阅页面 */
    isSubscribe: boolean;
    /** 订阅的页面 */
    page: string[];
}
declare class Socket {
    private url;
    private ws;
    private opts;
    private reconnectAttempts;
    private listeners;
    private subscribes;
    private subscribesEvent;
    private heartbeatInterval;
    private token;
    /** @description 二进制类型消息体的magic */
    private MAGIC;
    /** @description 二进制类型消息体的verson */
    private VERSION;
    private status;
    /** 当前的页面 */
    private currentPage;
    /** 是否是手动关闭,默认是由于未知原因关闭 */
    private isClose;
    constructor(url: string, opts: SocketOptions | undefined, token: string);
    private init;
    onOpen(event: Event): void;
    onMessage(event: MessageEvent): void;
    onError(event: Event): void;
    onClose(event: CloseEvent): void;
    startHeartbeat(): void;
    stopHeartbeat(): void;
    send(data: string): void;
    on(event: string, callback: ISocketLinstenerFn, options?: ISocketOnOptions): void;
    off(event: string): void;
    offAll(): void;
    close(): void;
    updatePage(page: string): void;
    private emit;
    /**
     * @description 获取二进制消息体
     * @param content 发送的消息内容
     * @param seq 消息的序列号
     * @param code 消息类型
     * @todo 帧头     帧尾      消息体的长度     序列号      时间戳      消息类型     消息体       签名
     * @todo magic		version		length		     seq		    ts		      code		   data		     sign
     * @todo 2byte		byte		  8byte		       8byte	    8byte	      byte		   n-byte		   remainder-byte
     */
    getBufferContent(content: string, seq: number, code: SOCKET_CODE): Uint8Array;
    /**
     * @description 将内容转换为buffer，用来发送socket的消息体
     *
     * @param content 转换为buffer数组的内容
     * @param byteLength buffer的长度
     * @returns
     */
    private getBuffer;
}
export interface IUseSocket {
    socket: Socket;
    send: (data: string) => void;
    on: (event: string, callback: ISocketLinstenerFn, option?: ISocketOnOptions) => void;
    off: (event: string) => void;
    close: () => void;
}
export declare function useSocket(url: string, token: string, opts?: SocketOptions): IUseSocket;
export {};
