import type {
  CascaderComponentProps,
  FormItemProps,
  FormItemRule,
  InputNumberProps,
  InputProps,
  SelectProps,
  ModelValueType,
  TimePickerDefaultProps,
  UploadFile,
  UploadFiles,
  UploadProps,
  UploadUserFile,
} from "element-plus";
import type {
  ICascaderOptions,
  IFormItemCascaderOptions,
  IFormItemOptions,
  IPX,
  ISelectOptions,
} from "./common";
import type { CSSProperties, Ref } from "vue";
import type { IResponse } from "../response";
import { IBigFileUploadFinishResult, IBigFileUploadProps } from "../file";

export interface IPageModal<U, O extends object> {
  /** 弹窗按钮文字 */
  btnText?: {
    /**
     * 弹窗确认按钮文字
     * @default 确定
     */
    confirm: string;
    /**
     * 弹窗取消按钮文字
     * @default 取消
     */
    cancel: string;
  };
  url: IModalUrl<U>;
  header: IHeader;
  formItems: IFormItem<O>[];
}

export interface IModalUrl<U> {
  listUrl: U;
  editUrl: U;
  newUrl: U;
}

export interface IHeader {
  newTitle: string;
  editTitle: string;
  labelWidth?: IPX;
}

export type IFormItem<O> =
  | IFormItemInput<O>
  | IFormItemTimer<O>
  | IFormItemCustom<O>
  | IFormItemNumber<O>
  | IFormItemSelect<O>
  | IFormItemNumberString<O>
  | IFormItemRender<O>
  | IFormItemUpload<O>
  | IFormItemBigFileUpload<O>
  | IFormItemCascader<O>;

export interface IFormItemInput<O> extends IFormItemBase<O> {
  type: "input";
  componentBind: Partial<InputProps>;
  /** 初始值 */
  initialValue?: string | number | (() => string | number);
}
export interface IFormItemNumberString<O> extends IFormItemInput<O> {
  type: "number_string";
}

export interface IFormItemNumber<O> extends IFormItemBase<O> {
  type: "number";
  componentBind: Partial<InputNumberProps>;
  /** 初始值 */
  initialValue?: number | (() => number);
  suffix?: string;
  prefix?: string;
}

export interface IFormItemSelect<O> extends IFormItemBase<O> {
  type: "select";
  componentBind: Partial<SelectProps & StyleSheet>;
  change?: (val: any, options: IFormItemOptions[], formData: O) => void;
  options: ISelectOptions;
  /** 初始值 */
  initialValue?:
    | string
    | number
    | Record<string, string>
    | (() => string | number | Record<string, string>);
}

export interface IFormItemCascader<O> extends IFormItemBase<O> {
  type: "cascader";
  componentBind: Partial<CascaderComponentProps>;
  change?: (val: any, options: IFormItemCascaderOptions[], formData: O) => void;
  options: ICascaderOptions;
  /** 初始值 */
  initialValue?:
    | string
    | number
    | Record<string, string>
    | (() => string | number | Record<string, string>);
}

export interface IFormItemCustom<O> extends IFormItemBase<O> {
  type: "custom";
  slotName: `${keyof O}`;
  /** 初始值 */
  initialValue?: any | (() => any);
}

export interface IFormItemTimer<O> extends IFormItemBase<O> {
  type: "timer";
  componentBind: Partial<TimePickerDefaultProps>;
  /** 初始值 */
  initialValue?: ModelValueType | (() => ModelValueType);
  valueFormat?: string;
}

export interface IFormItemRender<O> extends IFormItemBase<O> {
  type: "render";
  /** 渲染函数 */
  render: IRender<O>;
  /** 初始值 */
  initialValue?: any | (() => any);
}

export type IRender<O> = (
  props: { formData: O } & IFormItemRender<O>,
) => JSX.Element;
export interface IFormItemRenderSlotsParam<O, P> {
  render: IRender<O>;
  prop: P;
  formData: O;
}

export interface IFormItemUpload<O> extends IFormItemBase<O> {
  type: "upload";
  componentBind: Omit<
    Partial<UploadProps>,
    "onSuccess" | "action" | "onRemove" | "fileList"
  > & {
    action: UploadProps["action"];
    fileList?: (formData: O) => UploadUserFile[];
    onSuccess: (
      formData: O,
      response: IResponse,
      uploadFile: UploadFile,
      uploadFiles: UploadFiles,
    ) => void;
    onRemove?: (
      formData: O,
      uploadFile: UploadFile,
      uploadFiles: UploadFiles,
    ) => void;
  };
  /** 插槽 */
  slots?: Partial<{
    /** 自定义默认内容的插槽 */
    default: (params: IFormItemRenderSlotsParam<O, any>) => JSX.Element;
    /** 触发文件选择框的内容的插槽 */
    trigger: (params: IFormItemRenderSlotsParam<O, any>) => JSX.Element;
    /** 提示说明文字的插槽 */
    tip: (params: IFormItemRenderSlotsParam<O, any>) => JSX.Element;
    /** 	缩略图模板的内容的插槽 */
    file: (
      params: IFormItemRenderSlotsParam<O, { file: UploadFile; index: number }>,
    ) => JSX.Element;
  }>;
}

export interface IFormItemBigFileUpload<O> extends IFormItemBase<O> {
  type: "big_file_upload";
  componentBind: IBigFileUploadProps;
  uploadSuccess: (data: IBigFileUploadFinishResult, formData: O) => void;
  showDialog: Ref<boolean>;
}

export interface IFormItemBase<O> {
  formItemBind: IFormItemBind<O> & Partial<FormItemProps>;
  /** 规定在编辑或者新建页面展示 */
  showType?: "edit" | "new";
  /** 是否需要校验 */
  isHasValidate?: boolean;
  /** 校验的类型 */
  formItemValidate?: FormItemRule[];
  /**
   * 是否显示
   * @param formData 编辑的数据对象
   */
  isShow?: (formData: O) => boolean;
}

/** "input"|"number"|"number_string"|"timer"|"custom"|"select"|"render"|"upload" */
export type IFormItemType =
  | "input"
  | "number"
  | "number_string"
  | "timer"
  | "custom"
  | "select"
  | "render"
  | "upload"
  | "big_file_upload"
  | "cascader";

export interface IFormItemBind<O> {
  prop: keyof O;
  label: string;
  style?: Partial<CSSProperties>;
}
