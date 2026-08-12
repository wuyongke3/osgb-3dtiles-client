import type { CSSProperties } from "vue";
import { Awaitable } from "element-plus/es/utils/typescript.mjs";
import { IMapMenu, MaybeExist, IProjectItem, IMenu } from "~/types";

export type IProps = {
  /** @default 249 */
  width?: number;
  /** @default 80% */
  height?: string;
  systemData: ISystemDatas;
  username: string;
  /** @description 是否只保持一个子菜单的展开 */
  uniqueOpened?: boolean;
  /** @description navigate容器的style */
  navigateStyle?: CSSProperties;
  /** @description 菜单跳转的映射表，其中key为菜单的name，value为跳转的url */
  toMap: Map<string, string>;
  /** @default 75% */
  navigateSystemMaxHeight?: string;
  /** @description 矿区列表 */
  projectList?: IProjectItem[];
  /** @description 回到首页的按钮图标路径 */
  goHomeBgUrl?: string;
};

export type IEvents = {
  /** @description 菜单展开或收起时的回调 */
  collapseChange(collapse: boolean): void;
  /** @description 当前活跃菜单项变化的change */
  activeMenuChange(
    activeMenu: ISystemDataItem,
    activeMenuChildren: MaybeExist<IMapMenu[]>,
  ): void;
  /** @description 点击矿区时的操作 */
  projectChange(project: IProjectItem): void;
  /** @description 点击跳转到矿区列表时的操作 */
  toMineListPage(project: MaybeExist<IProjectItem>): void;
  /** @description 点击回到首页 */
  goHome(argv: any): void;
};
export type IEnv = "dev" | "65" | "pro";

export interface IProjectItem {
  checked: any;
  id: number;
  name: string;
  logo_url: string;
}

export type IToMapKey =
  | "10165"
  | "10065"
  | "10186"
  | "custom"
  | "equipment"
  | "conference"
  | "vehicle"
  | "system"
  | "production-backend";
export type IToMap = Map<IToMapKey, string>;
export type IGetChildren = (data: ISystemDataItem) => Awaitable<IMapMenu[]>;
export type IExpose = {
  /**
   * @description 获取toMap的辅助函数
   *
   * @param env 当前的运行环境
   */
  useToMap(env: IEnv): IToMap;
  /** @description 获取dev环境的toMap的辅助函数 */

  /** @description 获取CloudPlatform数据的辅助函数 */
  /** @description 获取最外部系统的icon图标 */
  useIcon(key: IToMapKey): string;

  /**
   * 获取systemData的辅助函数
   * @param data 菜单项
   * @param mapMenu 映射真正的菜单
   */
  useSystemData: (
    data: {
      [index: number]: IMenu[];
    },
    mapMenu: (menu: IMenu[]) => IMapMenu[],
  ) => ISystemDatas;
  useToProjectPage(env: IEnv): void;
  /** @description 设置菜单是否收起的默认值 */
  setCollapse(_collapse: boolean): void;
  /** @description 关闭所有激活的菜单项 */
  closeAllCollapse(): void;
  resetIsFirstOpend(): void;
  /** 菜单请求来后第一层按照角色处理，二级及以后按照菜单处理。当一个用户有多个角色时，菜单会重复，所以这个函数用来展开菜单，并去重 */
  useUniqueArrayConver(data: INavigateRole): IMenu[];
};

export type ISystemDatas = ISystemDataItem[];

export interface ISystemDataItem {
  id: number;
  name: string;
  /** @description 跳转的域名 */
  to?: string;
  /** @description 获取子项数据的方法 */
  // getChildren?: IGetChildren;
  /** @description 是否有子项 */
  hasChildren: boolean;
  /** @description 需要唯一 */
  port: string;
  /** @description 图标 */
  icon: string;
  /** @description 菜单项 */
  children: IMapMenu[];
}

/** 用户所拥有的角色id对应的菜单 */
export type INavigateRole = { [index: number]: IMenu[] };
