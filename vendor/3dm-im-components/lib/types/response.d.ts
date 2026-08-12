import type { RESPONSE_CODE } from "@/enums/response";

export interface IResponseData<T = any> {
  list: T[];
  total: number;
}
export interface IDownFileResponseData<T = any> {
  res: ArrayBuffer;
}

export interface IResponse<T = any> {
  code: RESPONSE_CODE;
  msg: string;
  data: T;
}

export interface IModalDataErrorResponseData {
  delete: number[];
  err: { id: number; msg: string }[];
}
