import { CheckboxValueType } from 'element-plus';
import { IPropsListItem, IPX } from '../../../../types';

interface IProps {
    width?: string | number | IPX;
    columnEmpty: string;
    item: IPropsListItem<any>;
    tableColumns: Record<string, CheckboxValueType>;
    tableColWidth: Record<string, number>;
    isComponent?: boolean;
    /**
     * @description 是否需要自定义的操作行
     */
    isHasComHandleRow?: boolean;
}
declare const _default: __VLS_WithTemplateSlots<import('vue').DefineComponent<import('vue').ExtractPropTypes<__VLS_TypePropsToRuntimeProps<IProps>>, {}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {
    handleEvent: (event: string, itemData: any) => void;
}, string, import('vue').PublicProps, Readonly<import('vue').ExtractPropTypes<__VLS_TypePropsToRuntimeProps<IProps>>> & Readonly<{
    onHandleEvent?: ((event: string, itemData: any) => any) | undefined;
}>, {}, {}, {}, {}, string, import('vue').ComponentProvideOptions, true, {}, any>, Partial<Record<string, (_: any) => any>> & {
    customBtn?(_: any): any;
    comCustomBtn?(_: any): any;
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
type __VLS_WithTemplateSlots<T, S> = T & {
    new (): {
        $slots: S;
    };
};
