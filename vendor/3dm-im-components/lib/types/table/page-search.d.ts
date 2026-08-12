import type {
  CascaderComponentProps,
  ColSize,
  DatePickerProps,
  FormItemProps,
  InputNumberProps,
  InputProps,
  ISelectProps,
} from "element-plus";
import { IFormItemCascaderOptions, IPX, ISelectOptions } from "./common";
import { ITimeConditions } from "../request";

export interface IPageSearch<O extends object> {
  labelWidth?: IPX;
  formItems: IFormItem<O>[];
}

export type IFormItem<O> =
  | IFormItemInput<O>
  | IFormItemTimer<O>
  | IFormItemCustom<O>
  | IFormItemNumber<O>
  | IFormItemSelect<O>
  | IFormItemNumberString<O>
  | IFormItemCascader<O>;

export interface IFormItemInput<O> extends IFormItemBase<O> {
  type: "input";
  /** 初始值 */
  initialValue?: string;
  componentBind: Partial<InputProps>;
}

export interface IFormItemNumberString<O> extends IFormItemInput<O> {
  type: "number_string";
}

export interface IFormItemNumber<O> extends IFormItemBase<O> {
  type: "number";
  /** 初始值 */
  initialValue?: number;
  componentBind: Partial<InputNumberProps>;
}

export interface IFormItemSelect<O> extends IFormItemBase<O> {
  type: "select";
  componentBind: Partial<ISelectProps>;
  options: ISelectOptions;
  /** 初始值 */
  initialValue?: string | number | Record<string, string>;
}

export interface IFormItemCascader<O> extends IFormItemBase<O> {
  type: "cascader";
  componentBind: Partial<CascaderComponentProps>;
  options: ICascaderOptions;
  /** 初始值 */
  initialValue?: string | number | Record<string, string>;
  change?: (
    val: any,
    options: IFormItemCascaderOptions[],
    searchForm: O,
  ) => void;
}

export interface IFormItemCustom<O> extends IFormItemBase<O> {
  type: "custom";
  /** 初始值 */
  initialValue?: any;
  slotName: `${keyof O}`;
}

export interface IFormItemTimer<O> extends IFormItemBase<O> {
  type: "date-picker";
  componentBind: Partial<DatePickerProps & { teleported: boolean }>;
  /** 初始值 */
  initialValue?: ITimeConditions;
}

export interface IFormItemBase<O> {
  /** el-col的span属性 */
  span?: number;
  formItemBind: IFormItemBind<O> & Partial<FormItemProps>;
  /** el-col的xs属性 */
  xs?: ColSize;
  /** el-col的sm属性 */
  sm?: ColSize;
  /** el-col的md属性 */
  md?: ColSize;
  /** el-col的lg属性 */
  lg?: ColSize;
  /** 是否展示 */
  isShow?: (searchForm: Record<string, any>) => boolean;
}

/** "input"|"number"|"number_string"|"date-picker"|"select"|"custom" */
export type IFormItemType =
  | "input"
  | "number"
  | "number_string"
  | "date-picker"
  | "select"
  | "custom"
  | "cascader";

export interface IFormItemBind<O> {
  prop: keyof O;
  label: string;
}
