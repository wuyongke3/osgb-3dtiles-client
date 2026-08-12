import { IUser, IChooseRoleData } from '../../types';

interface IProps {
    userBgUrl: string;
    userInfo: IUser;
}
/** @description 设置data的值 */
declare function setData(roles: IChooseRoleData[]): void;
/** @description 设置n x n布局 */
declare function setLayout(group?: number, row?: number): void;
declare const _default: __VLS_WithTemplateSlots<import('vue').DefineComponent<import('vue').ExtractPropTypes<__VLS_WithDefaults<__VLS_TypePropsToRuntimeProps<IProps>, {
    userBgUrl: any;
}>>, {
    setLayout: typeof setLayout;
    setData: typeof setData;
    data: import('vue').Ref<IChooseRoleData[] | undefined, IChooseRoleData[] | undefined>;
}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {}, string, import('vue').PublicProps, Readonly<import('vue').ExtractPropTypes<__VLS_WithDefaults<__VLS_TypePropsToRuntimeProps<IProps>, {
    userBgUrl: any;
}>>> & Readonly<{}>, {
    userBgUrl: string;
}, {}, {}, {}, string, import('vue').ComponentProvideOptions, true, {}, any>, {
    weather?(_: {}): any;
    login?(_: {}): any;
    footer?(_: {}): any;
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
