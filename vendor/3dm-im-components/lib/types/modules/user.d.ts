import type { Department } from "./department";
import type { IPosition } from "./position";

export interface IMenu {
  id: number;
  created_at: string;
  updated_at: string;
  name: string;
  url: string;
  icon: string;
  vue_component: string;
  redirect: string;
  /**
   * @description 1：启动/2：停用
   */
  status: 1 | 2;
  sort: number;
  description: string;
  children: IMenu[];
  hasChildren?: boolean;
  disabled: boolean;
  value?: number;
  label?: string;
}

export interface IUser {
  id: number;
  leader: 1 | 2;
  created_at: string;
  updated_at: string;
  number: string;
  name: string;
  phone: string;
  email: string;
  password: string;
  status: number;
  avatar: string;
  /**
   * @description 1:admin;2:user;3:访客
   */
  type: 1 | 2 | 3;
  sex: number;
  sort: number;
  register_time: string;
  remarks: string;
  expired_at?: any;
  login_count: number;
  menus?: IMenu[];
  role_ids: number[];
}

export interface IUserList extends IUser {
  permission_ids: any;
  menu_ids: any;
  role_ids: any;
  departments: Department[];
  department_id: number;
  department_positions: IPosition[];
  department_position_id: number;
  points?: IPoints;
  points_free?: number;
}

export interface IResetPassword {
  password: string;
  confirm_password: string;
}
export interface IUserModifyPassword {
  new_password: string;
  old_password: string;
  confirm_password: string;
}
export interface ILoginLog {
  id: number;
  created_at: string;
  updated_at: string;
  user_id: number;
  ip: string;
  login_time: string;
  name?: string;
  longitude: number;
  latitude: number;
  is_in_range: -1 | 0 | 1 | 2;
  is_in_range_name: "未知" | "矿内" | "矿外";
}

export interface IRoleMap {
  label: string;
  value: number;
  menus: {
    label: string;
    value: number;
    children: IMenu[];
    parent_id: number;
  }[];
  permissions: {
    label: string;
    value: number;
    children: IPermission[];
    parent_id: number;
  }[];
}

export interface IUserRole {
  id: number;
  created_at: string;
  updated_at: string;
  name: string;
  display_name: string;
  description: string;
  status: 1 | 2;
  sort: number;
  card_bg_url: string;
  port: string;
}

export interface IPoints {
  id: number;
  created_at: string;
  updated_at: string;
  user_id: number;
  total: number;
  used: number;
  free: number;
  status: 1 | 2;
}

export interface ILoginLogMonth {
  /**
   * @description 登录次数
   */
  login_num: number;
  /**
   * @description 矿内次数
   */
  in_range_num: number;
  /**
   * @description 矿外次数
   */
  out_range_num: number;
}
