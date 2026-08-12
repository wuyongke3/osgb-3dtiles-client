import { IMapMenu, IMenu, INavigateRole, ISystemDatas } from '../../../types';

/**
 * 获取systemData的辅助函数
 * @param data 菜单项
 * @param mapMenu 映射真正的菜单
 */
export declare function useSystemData(data: INavigateRole, mapMenu: (menu: IMenu[]) => IMapMenu[]): ISystemDatas;
/** 菜单请求来后第一层按照角色处理，二级及以后按照菜单处理。当一个用户有多个角色时，菜单会重复，所以这个函数用来展开菜单，并去重 */
export declare function useUniqueArrayConver(data: INavigateRole): IMenu[];
