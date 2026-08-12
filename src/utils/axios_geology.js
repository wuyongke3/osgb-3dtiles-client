import axios from "axios";
import { ElMessage } from "element-plus";
import { getToken, removeToken } from "@/utils/auth";
import { isLocal } from "@/utils";
import router from "@/router";
import { SETTINGS } from "@/enums";

let urllocal = import.meta.env.VITE_APP_URL_GEOLOGY;
const env = import.meta.env.VITE_APP_ENV;
const port = import.meta.env.VITE_APP_PORT_GEOLOGY;
if (env == "pro") {
  urllocal = window.location.protocol + "//" + window.location.hostname + port;
}

if (isLocal()) {
  urllocal = import.meta.env.VITE_APP_GEOLOGY;
}

//全局路由
let service = axios.create({
  baseURL: urllocal,
  timeout: 100000,
});

// request拦截器
service.interceptors.request.use(
  (config) => {
    var token = getToken("token");
    if (token) {
      config.headers["Authorization"] = "Bearer " + token;
    } else {
    }
    // config.headers["X-Platform-From"] = "screen";
    config.headers["X-Platform-From"] = SETTINGS.X_PLATFORM_FROM_CONVERTER;
    return config;
  },
  (error) => {
    console.log(error);
    Promise.reject(error);
  },
);

// respone拦截器
service.interceptors.response.use(
  (response) => {
    if (response.data.code == 401) {
      // router.push('/')
    }
    return response;
  },
  (error) => {
    console.log("error", error);
    if (error.response.status == 401) {
      //  router.push('/');
    }
    return Promise.reject(error);
  },
);

export default service;
