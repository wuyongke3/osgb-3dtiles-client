import { Awaitable } from 'element-plus/lib/utils/index.js';

type IUploadData = Record<string, any> | Awaitable<Record<string, any>>;
type IDefaultHeaders = Headers | Record<string, any>;
type IRequiredHeaders = {
    "X-Platform-From": string;
};
interface uploadPropsType {
    url: string;
    uploadData?: IUploadData;
    headers?: IDefaultHeaders & IRequiredHeaders;
}
declare function showDialog(): void;
declare const _default: __VLS_WithTemplateSlots<import('vue').DefineComponent<import('vue').ExtractPropTypes<__VLS_WithDefaults<__VLS_TypePropsToRuntimeProps<uploadPropsType>, {
    url: string;
}>>, {
    showDialog: typeof showDialog;
}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {
    uploadSuccess: (...args: any[]) => void;
    uploadError: (...args: any[]) => void;
}, string, import('vue').PublicProps, Readonly<import('vue').ExtractPropTypes<__VLS_WithDefaults<__VLS_TypePropsToRuntimeProps<uploadPropsType>, {
    url: string;
}>>> & Readonly<{
    onUploadSuccess?: ((...args: any[]) => any) | undefined;
    onUploadError?: ((...args: any[]) => any) | undefined;
}>, {
    url: string;
}, {}, {}, {}, string, import('vue').ComponentProvideOptions, true, {}, any>, Partial<Record<NonNullable<string | number>, (_: any) => any>>>;
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
