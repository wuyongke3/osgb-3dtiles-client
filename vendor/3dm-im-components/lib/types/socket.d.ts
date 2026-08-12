import type {
  SOCKET_MESSAGE_CATEGORY,
  SOCKET_MESSAGE_MODULE,
  SOCKET_MESSAGE_STATUS,
  SOCKET_MESSAGE_TYPE,
} from "~/enums";

export interface ISocketResult {
  id: string;
  code: string;
  error: string;
  seq: string;
  ts: number;
  data: string;
}

/** ISocketResult中data的json类型 */
export interface ISocketResultData {
  id: number;
  created_at: string;
  updated_at: string;
  /**  通知类型:1/业务通知;2/广播;3/静默; */
  type: SOCKET_MESSAGE_TYPE;
  /** 通知模块 */
  module: SOCKET_MESSAGE_MODULE;
  /** 通知分类 */
  category: SOCKET_MESSAGE_CATEGORY;
  /** 标题 */
  title: string;
  /** 副标题 */
  subtitle: string;
  /** 类型关联参数 */
  params: string;
  /** 状态:1/待发送;2/已发送; */
  status: SOCKET_MESSAGE_STATUS;
}
