interface IProps {
    treeCardConfig: {
        content: any;
    };
    pageStore: any;
}
declare const _default: import('vue').DefineComponent<import('vue').ExtractPropTypes<__VLS_TypePropsToRuntimeProps<IProps>>, {}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {
    newClick: (...args: any[]) => void;
    editClick: (...args: any[]) => void;
    nodeClick: (...args: any[]) => void;
    infoClick: (...args: any[]) => void;
    btnClick: (...args: any[]) => void;
    headerDeleteClick: (...args: any[]) => void;
}, string, import('vue').PublicProps, Readonly<import('vue').ExtractPropTypes<__VLS_TypePropsToRuntimeProps<IProps>>> & Readonly<{
    onNewClick?: ((...args: any[]) => any) | undefined;
    onEditClick?: ((...args: any[]) => any) | undefined;
    onNodeClick?: ((...args: any[]) => any) | undefined;
    onInfoClick?: ((...args: any[]) => any) | undefined;
    onBtnClick?: ((...args: any[]) => any) | undefined;
    onHeaderDeleteClick?: ((...args: any[]) => any) | undefined;
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
