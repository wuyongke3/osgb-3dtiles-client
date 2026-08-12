export interface IPosition {
  id: number;
  created_at: string;
  updated_at: string;
  department_id: number;
  department_name?: string;
  name: string;
  status: number;
  remark: string;
  sort: number;
}
