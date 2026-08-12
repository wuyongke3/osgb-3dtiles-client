interface IProps {
    searchConfig: {
        labelWidth?: string;
        formItems: any[];
    };
    pageStore: any;
}
/**
 * @description 重置form表单数据，以及searchForm数据为undefined
 */
declare function resetField(): void;
declare const _default: __VLS_WithTemplateSlots<import('vue').DefineComponent<import('vue').ExtractPropTypes<__VLS_TypePropsToRuntimeProps<IProps>>, {
    searchForm: any;
    resetField: typeof resetField;
}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {
    queryClick: (...args: any[]) => void;
    resetClick: (...args: any[]) => void;
}, string, import('vue').PublicProps, Readonly<import('vue').ExtractPropTypes<__VLS_TypePropsToRuntimeProps<IProps>>> & Readonly<{
    onQueryClick?: ((...args: any[]) => any) | undefined;
    onResetClick?: ((...args: any[]) => any) | undefined;
}>, {}, {}, {}, {}, string, import('vue').ComponentProvideOptions, true, {}, any>, Partial<Record<any, (_: {
    data: any;
    prop: any;
}) => any>>>;
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
type __VLS_WithTemplateSlots<T, S> = T & {
    new (): {
        $slots: S;
    };
};
