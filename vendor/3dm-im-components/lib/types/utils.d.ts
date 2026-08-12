/** @description 存在时返回，不存在时返回 undefined */
export type MaybeExist<T> = T | undefined;
/** @description 存在时返回，不存在时返回 null */
export type MaybeNull<T> = T | null;

/** @description 将 props 和事件合并，避免编辑器在使用具名函数的tsx组件时，检查自定义事件报错 */
export type NameFunProps<
  Props extends Record<string, any>,
  Events extends Record<string, Function>,
> = Props & {
  [K in keyof Events as `on${Capitalize<string & K>}`]?: Events[K];
};

/** 获取对象的值的类型 */
export type GetObjectValueType<O, K extends keyof O> = O[K];

/** 空函数的类型，返回值为void，传参也为空 */
export type EmptyFn = () => void;

/** 给一个类型的所有 key 加上前缀 */
export type WithPrefix<T, P extends string> = {
  [K in keyof T as `${P}${Capitalize<string & K>}`]: T[K];
};
