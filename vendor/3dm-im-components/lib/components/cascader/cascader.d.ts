import { CascaderComponentProps } from 'element-plus';
import { ICascaderOptions, IFormItemCascaderOptions } from '../../types';

export interface IProps {
    options: ICascaderOptions;
    bind: Partial<CascaderComponentProps>;
    dialogVisible?: boolean;
}
declare const _default: import('vue').DefineComponent<import('vue').ExtractPropTypes<{
    modelValue: import('vue').PropType<string | number | Record<string, string> | (() => string | number | Record<string, string>)>;
    options: {
        type: import('vue').PropType<ICascaderOptions>;
        required: true;
    };
    bind: {
        type: import('vue').PropType<Partial<CascaderComponentProps>>;
        required: true;
    };
    dialogVisible: {
        type: import('vue').PropType<boolean>;
    };
}>, {}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {
    change: (val: any, options: IFormItemCascaderOptions[]) => void;
}, string, import('vue').PublicProps, Readonly<import('vue').ExtractPropTypes<{
    modelValue: import('vue').PropType<string | number | Record<string, string> | (() => string | number | Record<string, string>)>;
    options: {
        type: import('vue').PropType<ICascaderOptions>;
        required: true;
    };
    bind: {
        type: import('vue').PropType<Partial<CascaderComponentProps>>;
        required: true;
    };
    dialogVisible: {
        type: import('vue').PropType<boolean>;
    };
}>> & Readonly<{
    onChange?: ((val: any, options: IFormItemCascaderOptions[]) => any) | undefined;
}>, {}, {}, {}, {}, string, import('vue').ComponentProvideOptions, true, {}, any>;
export default _default;
