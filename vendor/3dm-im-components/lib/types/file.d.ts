import { DialogProps } from "element-plus";

export interface ICutFileInfo {
  // fileHash: number;
  /**
   * @description 每片的最大大小
   * 16MB
   */
  MAX_SLICE: number;
  /**
   * @description 文件分割数量
   */
  file_length: number;
  fileName: string;
  fileSize: number;
}

export interface ISocketMessageData {
  id: number;
  code: string | number;
  data: string;
  error: string;
}

export interface ISocketCutFileResp {
  /**
   * @description 此次上传序列号
   */
  seq: string;

  status: ISocketCutFileRespStatus;
  /**
   * @description 说明信息
   */
  msg: string;
  /**
   * @description 缺少的切片数组
   */
  data: any;
}

/**
 * @description 1/ok;2/error;3/缺少切片;4/文件以存在
 */
type ISocketCutFileRespStatus = 1 | 2 | 3 | 4;
/** 位置:1/w0;2/l0; */
type ISocketFileLocation = 1 | 2;

export interface IBigFileUploadFinishResult {
  id: number;
  created_at: string;
  updated_at: string;
  name: string;
  hash: string;
  path: string;
  /**
   * @description 切片数量
   */
  slice_total: number;
  /**
   * @description 是否完成:1/处理中;2/完成;3/失败;
   */
  finish: 1 | 2 | 3;
  /**
   * @description 序列号
   */
  seq: string;
  size: number;
  /**
   * @description 上传用户id
   */
  user_id: number;

  file_original_id: number;
  location: ISocketFileLocation;
}

export interface IQueryInfo {
  file_name: string;
  size: number;
  slice: number;
  hash: number;
  /** 位置:1/w0;2/l0; */
  location: ISocketFileLocation;
}

export interface IBigFileUploadProps extends Partial<DialogProps> {
  /** @description 用户的token */
  token: string;
  /** @description socket的url */
  socketUrl: string;
  /** @description 允许上传的文件的后缀名数组 */
  allowSuffix?: string[];
  /** @description ElUpload组件的props */
  uploadProps?: Partial<UploadProps>;
  showDialog?: boolean;
  /** 9522/go项目;9443/convert项目 */
  socketType?: "9522" | "9443";
}
