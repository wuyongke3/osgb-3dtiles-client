import axios from "axios";
import { ElMessage } from "element-plus";
import { getToken, removeToken } from "@/utils/auth";
import router from "@/router";
import { goLoginPage } from "./environment";
import { SETTINGS } from "@/enums";

let urllocal = import.meta.env.VITE_APP_URL;
const env = import.meta.env.VITE_APP_ENV;
const port = import.meta.env.VITE_APP_PORT;
if (env == "pro") {
  urllocal = window.location.protocol + "//" + window.location.hostname + port;
}
//全局路由
let service = axios.create({
  baseURL: urllocal,
  timeout: 100000,
});

//全局路由
export let service1 = axios.create({
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
    config.headers["X-Platform-From"] = SETTINGS.X_PLATFORM_FROM_ADMIN;
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
      goLoginPage();
    }
    return response;
  },
  (error) => {
    //  console.log("error", error);
    if (error.response.status == 401) {
      goLoginPage();
    }
    return Promise.reject(error);
  },
);

export default service;
