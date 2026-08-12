import { Ref, WatchOptions } from 'vue';

export declare function useTsxProps<T>(props: T): T;
/**
 * @description 在tsx中，解决异步函数调用导致组件数据更新引起的重复调用方法的问题
 *
 * @param watchData 监听的数据
 * @param asyncFn 异步方法
 * @param args 剩余参数, 如若传递options，则必须为第一个参数，除options外，额外参数传递给asyncFn
 *
 * @returns 返回执行函数对应的记录销毁方法
 */
export declare function useTsxWatchAsync<T, Args extends any[]>(watchData: T, asyncFn: (newval: T, ...args: Args) => Promise<void>, ...args: [...options: [WatchOptions<true>] | [], ...args: Args]): {
    destory: () => void;
    watchResult: Map<(newval: any, ...args: any) => Promise<void>, boolean>;
};
/**
 * @description 定义一个响应式对象，同时提供一个reset函数，重置这个响应式对象的值为初始值
 *
 * @param initValue 初始状态值或返回初始状态值的函数
 * @param options [options={ isRef: true }] - 配置项，默认 `isRef` 为 true
 * @returns 一个元组，包含响应式状态和重置函数
 */
export declare function useTsxState<I>(initialState: I | (() => I)): readonly [Ref<I, I>, () => void];
