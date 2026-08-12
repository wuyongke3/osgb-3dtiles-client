import { SelectProps } from 'element-plus';
import { IFormItemOptions, ISelectOptions } from '../../types';

export interface IProps {
    options: ISelectOptions;
    bind: Partial<SelectProps>;
    dialogVisible?: boolean;
}
declare const _default: import('vue').DefineComponent<import('vue').ExtractPropTypes<{
    modelValue: import('vue').PropType<string | number | Record<string, string> | (() => string | number | Record<string, string>)>;
    options: {
        type: import('vue').PropType<ISelectOptions>;
        required: true;
    };
    bind: {
        type: import('vue').PropType<Partial<SelectProps>>;
        required: true;
    };
    dialogVisible: {
        type: import('vue').PropType<boolean>;
    };
}>, {}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {
    change: (val: any, options: IFormItemOptions[]) => void;
}, string, import('vue').PublicProps, Readonly<import('vue').ExtractPropTypes<{
    modelValue: import('vue').PropType<string | number | Record<string, string> | (() => string | number | Record<string, string>)>;
    options: {
        type: import('vue').PropType<ISelectOptions>;
        required: true;
    };
    bind: {
        type: import('vue').PropType<Partial<SelectProps>>;
        required: true;
    };
    dialogVisible: {
        type: import('vue').PropType<boolean>;
    };
}>> & Readonly<{
    onChange?: ((val: any, options: IFormItemOptions[]) => any) | undefined;
}>, {}, {}, {}, {}, string, import('vue').ComponentProvideOptions, true, {}, any>;
export default _default;
