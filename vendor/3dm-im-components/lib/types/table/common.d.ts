export type IPX = `${number}px`;

export interface IFormItemOptions {
  label: string;
  value: Array | String | Number | Boolean | Object;
}

export type ISelectOptions =
  | IFormItemOptions[]
  | (() => IFormItemOptions[])
  | (() => Promise<IFormItemOptions[]>);

export interface IFormItemCascaderOptions extends IFormItemOptions {
  children: IFormItemOptions[];
}

export type ICascaderOptions =
  | IFormItemCascaderOptions[]
  | (() => IFormItemCascaderOptions[])
  | (() => Promise<IFormItemCascaderOptions[]>);
