import { IUser } from '../../types';

interface IProps {
    breadcrumbs: any[];
    userBgUrl: string;
    userInfo: IUser;
}
declare const _default: import('vue').DefineComponent<import('vue').ExtractPropTypes<__VLS_WithDefaults<__VLS_TypePropsToRuntimeProps<IProps>, {
    userBgUrl: any;
}>>, {}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {
    resetPassword: (...args: any[]) => void;
    logout: (...args: any[]) => void;
    handleClick: (...args: any[]) => void;
    switchRole: (...args: any[]) => void;
    collapseChange: (...args: any[]) => void;
}, string, import('vue').PublicProps, Readonly<import('vue').ExtractPropTypes<__VLS_WithDefaults<__VLS_TypePropsToRuntimeProps<IProps>, {
    userBgUrl: any;
}>>> & Readonly<{
    onResetPassword?: ((...args: any[]) => any) | undefined;
    onLogout?: ((...args: any[]) => any) | undefined;
    onHandleClick?: ((...args: any[]) => any) | undefined;
    onSwitchRole?: ((...args: any[]) => any) | undefined;
    onCollapseChange?: ((...args: any[]) => any) | undefined;
}>, {
    userBgUrl: string;
}, {}, {}, {}, string, import('vue').ComponentProvideOptions, true, {}, any>;
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
