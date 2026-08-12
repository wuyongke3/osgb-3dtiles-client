import { UploadStatus } from 'element-plus';
import { RESPONSE_CODE } from '../../enums';

interface modalPropsType {
    inlineStyle?: boolean;
    bigFormStyle?: boolean;
    modalConfig: {
        btnText?: {
            confirm: string;
            cancel: string;
        };
        url: {
            newUrl: string;
            editUrl: string;
            listUrl: string;
        };
        header: {
            newTitle: string;
            editTitle: string;
            labelWidth?: string;
        };
        formItems: any[];
        columns?: string[];
    };
    otherInfo?: any;
    queryInfo?: any;
    newFun?: (infoData: any) => Promise<RESPONSE_CODE>;
    appendToBody?: boolean;
}
/**
 * @description 设置dialog的基础属性
 *
 * @param isNew 是否是新建，默认true
 * @param itemData 编辑时候的回显数据
 * @param isSee 是否是查看
 */
declare function setModal(isNew?: boolean, itemData?: any, isSee?: boolean): void;
/**
 * 清空所有upload 组件中的已上传文件列表
 *
 * @param prop 如果传入prop，则只清空指定upload组件中的已上传文件列表，否则清空所有upload组件中的已上传文件列表
 */
declare function clearFiles(prop?: string, states?: UploadStatus[]): void;
declare const _default: __VLS_WithTemplateSlots<import('vue').DefineComponent<import('vue').ExtractPropTypes<__VLS_WithDefaults<__VLS_TypePropsToRuntimeProps<modalPropsType>, {
    otherInfo: {};
    appendToBody: boolean;
    bigFormStyle: boolean;
    inlineStyle: boolean;
}>>, {
    setModal: typeof setModal;
    dialogVisible: import('vue').Ref<boolean, boolean>;
    formData: any;
    isNewRef: import('vue').Ref<boolean, boolean>;
    editData: import('vue').Ref<any, any>;
    clearFiles: typeof clearFiles;
    isOnlyCheck: import('vue').Ref<boolean, boolean>;
    setIsOnlyCheck: (data: boolean) => void;
}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {
    handleClick: (...args: any[]) => void;
    postAfter: (...args: any[]) => void;
}, string, import('vue').PublicProps, Readonly<import('vue').ExtractPropTypes<__VLS_WithDefaults<__VLS_TypePropsToRuntimeProps<modalPropsType>, {
    otherInfo: {};
    appendToBody: boolean;
    bigFormStyle: boolean;
    inlineStyle: boolean;
}>>> & Readonly<{
    onHandleClick?: ((...args: any[]) => any) | undefined;
    onPostAfter?: ((...args: any[]) => any) | undefined;
}>, {
    appendToBody: boolean;
    inlineStyle: boolean;
    bigFormStyle: boolean;
    otherInfo: any;
}, {}, {}, {}, string, import('vue').ComponentProvideOptions, true, {}, any>, Partial<Record<any, (_: {
    data: any;
    isNew: boolean;
}) => any>> & {
    freeContent?(_: {
        isNew: boolean;
        data: any;
    }): any;
}>;
export default _default;
type __VLS_NonUndefinedable<T> = T extends undefined ? never : T;
type __VLS_TypePropsToRuntimeProps<T> = {
    [K in keyof T]-?: {} extends Pick<T, K> ? {
        type: import('vue').PropType<__VLS_NonUndefinedable<T[K]>>;
    } : {
        type: import('vue').PropType<T[K]>;
        required: true;
    };
};
type __VLS_WithDefaults<P, D> = {
    [K in keyof Pick<P, keyof P>]: K extends keyof D ? __VLS_Prettify<P[K] & {
        default: D[K];
    }> : P[K];
};
type __VLS_Prettify<T> = {
    [K in keyof T]: T[K];
} & {};
type __VLS_WithTemplateSlots<T, S> = T & {
    new (): {
        $slots: S;
    };
};
