function getBaseUrl() {
  let urllocal = import.meta.env.VITE_APP_URL;
  const env = import.meta.env.VITE_APP_ENV;
  const port = import.meta.env.VITE_APP_PORT;
  if (env == "pro") {
    urllocal =
      window.location.protocol + "//" + window.location.hostname + port;
  }
  return urllocal + "/api/v1";
}

/** @description 获取文件的url */
export const ATTACHMENT_DOWNLOAD = getBaseUrl() + "/attachment/download/";
export const ATTACHMENT_UPLOAD = getBaseUrl() + "/attachment/upload";


