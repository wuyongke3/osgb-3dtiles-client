import $ from "jquery";
let urllocal = import.meta.env.VITE_APP_URL;
const env = import.meta.env.VITE_APP_ENV;
const port = import.meta.env.VITE_APP_PORT;
if (env == "pro") {
  urllocal = window.location.protocol + "//" + window.location.hostname + port;
}

//获取本地文件
export function getGdmToObj(urlstr, callback) {
  $.ajax({
    type: "get",
    url: urlstr,
    success: function (res) {
      callback(JSON.parse(res));
    },
  });
}

export function getGeojsonToObj(urlstr, callback) {
  $.ajax({
    type: "get",
    url: urlstr,
    success: function (res) {
      callback(res);
    },
  });
}

export function getPersons(callback) {
  $.ajax({
    url: urllocal + "/api/v1/biz/user/inspector",
    success: function (res) {
      callback(res);
    },
  });
}

//紧急工单列表
export function getEmergency(callback) {
  $.ajax({
    url: urllocal + "/api/v1/biz/work/order/emergency",
    success: function (res) {
      callback(res);
    },
  });
}

//最新工单top10
export function getRealtimeYh(callback) {
  $.ajax({
    url: urllocal + "/api/v1/biz/work/order/realtime",
    success: function (res) {
      callback(res);
    },
  });
}

//每个主题下的总数
export function getStaticSubject(callback) {
  $.ajax({
    url: urllocal + "/api/v1/biz/work/order/static/subject",
    success: function (res) {
      callback(res);
    },
  });
}

//获取所有主题
export function getAllSubject(callback) {
  $.ajax({
    url: urllocal + "/api/v1/biz/work/order/subject/top/all",
    success: function (res) {
      callback(res);
    },
  });
}
