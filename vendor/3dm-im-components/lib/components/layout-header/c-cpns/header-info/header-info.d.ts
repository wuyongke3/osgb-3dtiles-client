import { RESPONSE_CODE } from '../../../../enums';
import { IUserModifyPassword, IUser, modalPropsType } from '../../../../types';

interface IProps {
    userBgUrl: string;
    userInfo: IUser;
}
declare const _default: import('vue').DefineComponent<import('vue').ExtractPropTypes<__VLS_TypePropsToRuntimeProps<IProps>>, {}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {
    resetPassword: (val: IUserModifyPassword) => void;
    logout: () => void;
    handleClick: (infoData: any, props: modalPropsType, callBack: (code: RESPONSE_CODE) => void) => void;
    switchRole: () => void;
}, string, import('vue').PublicProps, Readonly<import('vue').ExtractPropTypes<__VLS_TypePropsToRuntimeProps<IProps>>> & Readonly<{
    onResetPassword?: ((val: IUserModifyPassword) => any) | undefined;
    onLogout?: (() => any) | undefined;
    onHandleClick?: ((infoData: any, props: modalPropsType, callBack: (code: RESPONSE_CODE) => void) => any) | undefined;
    onSwitchRole?: (() => any) | undefined;
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
