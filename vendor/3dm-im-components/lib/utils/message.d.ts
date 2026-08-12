import { App, VNode, Directive, EmitsToProps, VNodeProps } from 'vue';
import { NUMBER, TYPE } from '../enums';
import { RESPONSE_CODE } from '../enums/response';
import { ElMessageBoxOptions, IElMessageBox, LoadingOptions, Message, NotificationParams, Notify, DialogEmits, DialogProps } from 'element-plus';
import { LoadingInstance } from 'element-plus/es/components/loading/src/loading.mjs';
import { SFCInstallWithContext, SFCWithInstall } from 'element-plus/es/utils/index.mjs';
import { ElementLoading, LoadingBinding } from 'element-plus/es/components/loading/src/directive.mjs';
import { EmptyFn, MaybeNull } from '../types';

type RawProps = VNodeProps & {
    __v_isVNode?: never;
    [Symbol.iterator]?: never;
} & Record<string, any>;
export interface DialogReturns {
    destroy: MaybeNull<EmptyFn>;
}
declare class MyMessage {
    message: SFCInstallWithContext<Message>;
    elLoading: {
        service: any;
        install?: (app: App<any>) => void;
        directive?: Directive<ElementLoading, LoadingBinding>;
    };
    elMessageBox: SFCWithInstall<IElMessageBox>;
    elNotification: SFCInstallWithContext<Notify>;
    constructor();
    /**
     * 调用ElMessage
     * @param message 回显的文字信息
     * @param type message的类型  'success' | 'warning' | 'info' | 'error'
     * @param fn 关闭后回调的函数
     * @param duration 弹窗显示时间，为0时需要手动关闭
     */
    openMessage(message: string, type: TYPE, fn?: Function, duration?: NUMBER): void;
    /**
     * 消息确认提示框
     * @param message 提示回显消息
     * @param type 消息类型 'success' | 'warning' | 'info' | 'error'
     * @param successFn 点击确认后的回调
     * @param errorFn 点击取消后的回调
     * @param options 其他的配置项参数options
     */
    openMessageBox(message: string | VNode | (() => VNode), type: TYPE, successFn?: Function, errorFn?: Function, options?: ElMessageBoxOptions): void;
    /**
     * @description 调用ElLoading
     *
     * @param text loading的时候显示的文字
     *
     * @param target Loading 需要覆盖的 DOM 节点。
     * 若传入字符串，则会将其作为参数传入 document.querySelector以获取到对应 DOM 节点
     * @param options el-loading其他的配置项参数options
     *
     * @returns loading的实例
     */
    openLoading(text: string, target?: string | HTMLElement, options?: LoadingOptions): LoadingInstance;
    /**
     * @description 根据状态码信息，判断显示的内容
     *
     * @param code 接口返回状态码
     * @param successText 成功显示的文字信息
     * @param failText 失败显示的文字信息
     * @param successFn 成功的函数回调，可选
     * @param failFn 失败的函数回调，可选
     */
    openMessageByCode(code: RESPONSE_CODE, successText: string, failText: string, successFn?: Function, failFn?: Function): void;
    /**
     * 调用elNotification
     *
     * @param title 标题
     * @param message 通知栏正文内容
     * @param type 通知的类型
     * @param dangerouslyUseHTMLString 是否将 message 属性作为 HTML 片段处理
     * @param fn 关闭时的回调函数
     * @param args 剩余的其他配置项
     */
    openNotification(title: string, message: string, type: TYPE, dangerouslyUseHTMLString?: boolean, duration?: NUMBER, fn?: Function, ...args: NotificationParams[]): void;
    /** 函数式调用一个弹窗
     * @param props 弹窗default插槽组件用的props
     * @param dialogProps 传递给弹窗的props
     * @param slots 弹窗的所有插槽
     */
    openDialog(props: RawProps, dialogProps: Partial<DialogProps & EmitsToProps<DialogEmits>>, slots: {
        default: () => VNode;
        footer?: () => VNode;
        header?: () => VNode;
    }): DialogReturns;
    /** 函数式调用一个弹窗
     * @param props 弹窗default插槽组件用的props
     * @param dialogProps 传递给弹窗的props
     * @param slots 直接作用在弹窗的default插槽
     */
    openDialog(props: RawProps, dialogProps: Partial<DialogProps & EmitsToProps<DialogEmits>>, defaultSlots: VNode): DialogReturns;
}
export declare const message: MyMessage;
export {};
