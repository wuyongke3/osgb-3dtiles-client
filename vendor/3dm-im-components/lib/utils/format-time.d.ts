import { default as dayjs } from 'dayjs';

/** 根据月份生成每月的select天数options */
export declare function generateDayOptions(month: number): {
    value: number;
    label: string;
}[];
export declare function formatUTC(utcString?: string | number | Date | dayjs.Dayjs | null | undefined, format?: string): string;
/**
 * @description 获取指定天数之前的日期
 *
 * @param {*} n 指定的天数
 * @param {Date} specifyDate 指定的基础日期
 * @returns 字符串 ==》2023-08-22
 */
export declare function getBeforeDate(n: number, specifyDate?: Date): string;
/**
 * @description 获取num天之后的日期对象
 *
 * @param num
 * @returns num天之后的日期对象
 */
export declare function getDateObj(num: number): Date;
/**
 * @description 获取上月的今天的时间
 *
 * @returns
 */
export declare function getLastMonth(): Date;
/**
 * @description 获取指定月份的第一天和最后一天
 * @param year
 * @returns {firstDay, lastDay}
 */
export declare function getFirstAndLastDayOfMonth(month?: number): {
    firstDay: Date;
    lastDay: Date;
};
