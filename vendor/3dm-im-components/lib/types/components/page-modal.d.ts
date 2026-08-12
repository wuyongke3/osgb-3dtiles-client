export interface modalPropsType {
  modalConfig: {
    btnText?: {
      confirm: string;
      cancel: string;
    };
    url: {
      newUrl: string;
      editUrl: string;
      listUrl: string;
    };
    header: {
      newTitle: string;
      editTitle: string;
      labelWidth?: string;
    };
    formItems: any[];
    columns?: string[];
  };
  otherInfo?: any;
  queryInfo?: any;
  newFun?: (infoData: any) => Promise<RESPONSE_CODE>;
}
