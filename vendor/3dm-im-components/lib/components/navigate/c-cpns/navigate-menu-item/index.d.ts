import { IMapMenu, MaybeExist } from '../../../../types';

interface IProps {
    isCollapse: boolean;
    menuData: IMapMenu[];
    /** @description 跳转的url */
    to: string;
    systemDataItemId: number;
}
declare const _default: import('vue').DefineComponent<import('vue').ExtractPropTypes<__VLS_TypePropsToRuntimeProps<IProps>>, {}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {
    activeMenuChange: (to: MaybeExist<string>, systemDataItemId: MaybeExist<number>) => void;
}, string, import('vue').PublicProps, Readonly<import('vue').ExtractPropTypes<__VLS_TypePropsToRuntimeProps<IProps>>> & Readonly<{
    onActiveMenuChange?: ((to: MaybeExist<string>, systemDataItemId: MaybeExist<number>) => any) | undefined;
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
