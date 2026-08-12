import { FormItemRule } from 'element-plus';

export declare const RULES: {
    /** 请输入正确格式,由数字和字母组成 */
    ONLY_NUMBER_AND_CHART_RULE: {
        pattern: RegExp;
        message: string;
        trigger: string;
    };
    /** 请输入正确格式,必须为数字 */
    ONLY_NUMBER_RULE: {
        pattern: RegExp;
        message: string;
        trigger: string;
    };
    /** 请输入正确格式,必须为正数（包含0） */
    ONLY_POSITIVE_NUMBER_RULE: {
        pattern: RegExp;
        message: string;
        trigger: string;
    };
    /** 请输入正确格式,必须为负数（包含0） */
    ONLY_NEGATIVE_NUMBER_RULE: {
        pattern: RegExp;
        message: string;
        trigger: string;
    };
    /** 请输入正确格式,必须为正整数（包含0） */
    ONLY_POSITIVE_INTEGER_NUMBER_RULE: {
        pattern: RegExp;
        message: string;
        trigger: string;
    };
    /** 该项必须填写 */
    REQUIRED_WRITE_RULE: {
        required: boolean;
        trigger: string;
        message: string;
    };
};
export declare const PASSWORD_RULE_NOT_CHART_RULE: ({
    required: boolean;
    trigger: string;
    message: string;
} | {
    min: number;
    max: number;
    message: string;
    trigger: string;
})[];
export declare function PASSWORD_RULE(username?: string): FormItemRule[];
export declare const RISK_DISPATCH_MODAL: {
    validator: (_: any, value: any, callback: any) => void;
    trigger: string;
}[];
