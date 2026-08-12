/**
 * @description 用于多选的时候拼接name
 *
 * @param ids id数组
 * @param map 各个id所对应的name值的map
 * @param delimiter name之间的分隔符，默认是 ,
 * @returns
 */
export declare function joinName(ids: number[], map: Map<number, string>, delimiter?: string): string;
