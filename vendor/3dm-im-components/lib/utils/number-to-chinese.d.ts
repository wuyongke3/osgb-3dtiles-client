/** 将阿拉伯数字转换为中文数字 */
export declare class NumberToChinese {
    private static readonly CHINESE_NUMBERS;
    private static readonly CHINESE_UNITS;
    private static readonly LARGE_UNITS;
    private static readonly FINANCIAL_NUMBERS;
    private static readonly FINANCIAL_UNITS;
    private static readonly FINANCIAL_LARGE_UNITS;
    /**
     * 将阿拉伯数字转换为中文数字
     * @param num 要转换的数字
     * @param useFinancial 是否使用大写数字（金融写法）
     * @returns 中文数字字符串
     */
    static convert(num: number | string, useFinancial?: boolean): string;
    /**
     * 转换整数部分
     */
    private static convertIntegerPart;
    /**
     * 转换4位数节
     */
    private static convertSection;
    /**
     * 转换小数部分
     */
    private static convertDecimalPart;
    /**
     * 转换为人民币大写金额
     */
    static toRMB(amount: number | string): string;
}
