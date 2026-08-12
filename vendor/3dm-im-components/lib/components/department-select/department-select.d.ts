declare function reset(): void;
declare const _default: import('vue').DefineComponent<import('vue').ExtractPropTypes<__VLS_TypePropsToRuntimeProps<{
    modelValue: number | number[] | undefined;
    multiple: boolean;
    disabled?: boolean | undefined;
    isHasChildren?: boolean | undefined;
    customName?: string | undefined;
    departmentStore: {
        postDeaprtmentListAction: (obj: any) => Promise<any>;
    };
}>>, {
    reset: typeof reset;
    setMultiple: (isMultiple: boolean) => void;
}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {
    "update:modelValue": (value: number | number[] | undefined) => void;
    change: (value: number | number[] | undefined) => void;
}, string, import('vue').PublicProps, Readonly<import('vue').ExtractPropTypes<__VLS_TypePropsToRuntimeProps<{
    modelValue: number | number[] | undefined;
    multiple: boolean;
    disabled?: boolean | undefined;
    isHasChildren?: boolean | undefined;
    customName?: string | undefined;
    departmentStore: {
        postDeaprtmentListAction: (obj: any) => Promise<any>;
    };
}>>> & Readonly<{
    onChange?: ((value: number | number[] | undefined) => any) | undefined;
    "onUpdate:modelValue"?: ((value: number | number[] | undefined) => any) | undefined;
}>, {}, {}, {}, {}, string, import('vue').ComponentProvideOptions, true, {}, any>;
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
