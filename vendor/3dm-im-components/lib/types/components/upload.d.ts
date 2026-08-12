export type IUploadData = Record<string, any> | Awaitable<Record<string, any>>;
export type IDefaultHeaders = Headers | Record<string, any>;
export type IRequiredHeaders = {
  "X-Platform-From": string;
};

export interface uploadPropsType {
  url: string;
  uploadData?: IUploadData;
  headers: IDefaultHeaders & IRequiredHeaders;
}
