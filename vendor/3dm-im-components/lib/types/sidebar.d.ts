export interface IMapMenu {
  name: string;
  path: string;
  component: any;
  meta: any;
  children: IMapMenu[];
  redirect: string;
  sort: number;
  disabled: boolean;
  hasChildren: boolean;
  url_param?: string;
}

export interface ISidebar {
  opened: boolean;
  withoutAnimation: boolean;
}
