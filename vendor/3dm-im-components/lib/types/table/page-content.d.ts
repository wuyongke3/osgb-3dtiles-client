import type { ButtonProps, TableColumnCtx } from "element-plus";
import type { IPX } from "./common";
import { GetObjectValueType } from "../utils";

export interface IPageContent<U, O extends object> {
  key: string;
  url: IContentUrl<U>;
  titleBtn: ITitleBtn;
  propsList: IPropsList<O>;
}

export interface IContentUrl<U> {
  listUrl: U;
  deleteUrl: U;
}

export interface ITitleBtnItem {
  event: `handle${string}Click`;
  bind: Partial<ButtonProps>;
  label: string;
}

export interface ITitleBtn {
  left?: ITitleBtnBtn[];
  right?: ITitleBtnBtn[];
}

/** 第一列的勾选框列 */
export interface IPropsListSelection {
  type: "selection";
  label: string;
  width?: IPX;
}

/** 普通格式列 */
export interface IPropsListNormal<O> extends IPropsListBase<O> {
  type: "normal";
  prop: keyof O extends string ? keyof O : never;
}

/** 时间格式列 */
export interface IPropsListTimer<O> extends IPropsListBase<O> {
  type: "timer";
  prop: keyof O extends string ? keyof O : never;
  /** 时间的类型话的规定格式 */
  format?: string;
}

/** 自定义插槽列 */
export interface IPropsListCustom<O> extends IPropsListBase<O> {
  type: "custom";
  prop: keyof O extends string ? keyof O : never;
  /** 插槽类型的插槽名称 */
  slotName: `${keyof O}`;
}

/** render函数渲染列 */
export interface IPropsListRender<O> extends IPropsListBase<O> {
  type: "render";
  prop: keyof O extends string ? keyof O : never;
  /** 渲染函数 */
  render: IRender<O>;
}

/** 操作列 */
export interface IPropsListHandler<O> extends IPropsListBase<O> {
  type: "handler";
  /** 操作列的操作按钮 */
  options: IPropsListHandlerOptions<O>[];
}

/** 自定义操作列 */
export interface IPropsListComHandler<O> extends IPropsListHandler<O> {
  type: "com-handler";
}

/** 多级表头 */
export interface IPropsListMuiltLevel<O> extends IPropsListBase<O> {
  type: "muilt-level";
  prop: string;
  /** 多级表头下的子表头 */
  muiltLevelChildrens: IPropsList<O>;
}

/** 展开行 */
export interface IPropsListExpand<O> extends IPropsListBase<O> {
  type: "expand";
  prop: keyof O extends string ? keyof O : never;
  expandSlot: IRender<O>;
}

export interface IPropsListBase<O> {
  label: string;
  /** 表格中列的宽度 */
  width?: IPX;
  /** 列的空数据默认显示值 */
  columnEmpty?: GetObjectValueType<O, keyof O>;
  isShow?: boolean;
}

export type IRender<O> = (props: { row: O; prop: keyof O }) => JSX.Element;

/** "selection"|"timer"|"handler"|"com-handler"|"custom"|"render"|"normal"|"muilt-level"|"expand" */
export type IPropsListType =
  | "selection"
  | "timer"
  | "handler"
  | "com-handler"
  | "custom"
  | "render"
  | "normal"
  | "muilt-level"
  | "expand";

export type ITitleBtnBtn = ITitleBtnItem & { isShow?: () => bolean };

export type IPropsListHandlerOptions<O> = ITitleBtnItem & {
  /** 这个按钮是否有权限展示 */
  isHasShowPermission?: (row: O) => boolean;
};

export type IPropsList<O> = (IPropsListItem<O> &
  Partial<Exclude<TableColumnCtx<O>, keyof IPropsListItem<O>>>)[];

export type IPropsListItem<O> =
  | IPropsListSelection
  | IPropsListNormal<O>
  | IPropsListTimer<O>
  | IPropsListCustom<O>
  | IPropsListRender<O>
  | IPropsListHandler<O>
  | IPropsListComHandler<O>
  | IPropsListMuiltLevel<O>
  | IPropsListExpand<O>;
