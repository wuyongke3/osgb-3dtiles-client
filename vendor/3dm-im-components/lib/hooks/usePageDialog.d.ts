/**
 * @description 弹窗
 * @param showDialogBefore 打开弹窗之前的钩子
 * @param showDialogAfter 打开弹窗之后的钩子
 * @param hiddenDialogBefore 关闭弹窗之前的钩子
 * @param hiddenDialogAfter 关闭弹窗之后的钩子
 * @returns
 */
export declare function usePageDialog<T = any>(showDialogBefore?: Function, showDialogAfter?: Function, hiddenDialogBefore?: Function, hiddenDialogAfter?: Function): {
    isShowDialog: import('vue').Ref<boolean, boolean>;
    dialogInfo: import('vue').Ref<T | undefined, T | undefined>;
    setQuery: (row?: T) => void;
    hiddenDialog: () => void;
};
