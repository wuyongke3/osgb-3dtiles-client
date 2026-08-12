export interface Department {
  id: number;
  created_at: string;
  updated_at: string;
  parent_id: number;
  name: string;
  status: number;
  path_info: string;
  node_level: number;
  sort: number;
  remark: string;
}

export interface Department_position {
  id: number;
  created_at: string;
  updated_at: string;
  department_id: number;
  name: string;
  status: number;
  remark: string;
  sort: number;
}

export interface IDepartment {
  id: number;
  created_at: string;
  updated_at: string;
  number: string;
  name: string;
  phone: string;
  email: string;
  password: string;
  status: number;
  avatar: string;
  type: number;
  sex: number;
  sort: number;
  register_time: string;
  remarks: string;
  expired_at?: any;
  login_count: number;
  departments: Department[];
  department_positions: Department_position[];
  value?: number;
  label?: string;
  children?: IDepartment[];
}

export interface ITopDeaprtments {
  id: number;
  created_at: string;
  updated_at: string;
  parent_id: number;
  name: string;
  status: number;
  path_info: string;
  node_level: number;
  sort: number;
  remark: string;
  children: any;
  hasChildren: boolean;
  disabled: boolean;
  position: any;
}
