import axios, { service1 } from "@/utils/axios";
import axios_video_service from "@/utils/axios_video";

export * from "./geology";
export * from "./local";

const baseUrl_serve = import.meta.env.VITE_APP_BASE_URL;

export function login(data) {
  return axios({
    url: baseUrl_serve + "/biz/auth/login/cloud",
    method: "post",
    data: data,
  });
}

export function registerUser(data) {
  return axios({
    url: baseUrl_serve + "/biz/auth/register",
    method: "post",
    data: data,
  });
}

export function getUserInfo() {
  return axios({
    url: baseUrl_serve + "/biz/user/info",
    method: "get",
  });
}

export async function getUserInfoAsync() {
  let res = await axios({
    url: baseUrl_serve + "/biz/user/info",
    method: "get",
  });
  return res.data.data;
}

export function getUserInfoAll(data) {
  return axios({
    url: baseUrl_serve + "/biz/user/info/all",
    method: "post",
    data: data,
  });
}

export async function getUserInfoAllAsync(data) {
  let res = await axios({
    url: baseUrl_serve + "/biz/user/info/all",
    method: "post",
    data: data,
  });
  return res.data.data.list;
}

export function getUserInfoById(id) {
  return axios({
    url: baseUrl_serve + "/biz/user/" + id,
    method: "get",
  });
}

//添加用户群组
export const addUserGroup = (data) => {
  return axios({
    url: baseUrl_serve + "/biz/user/group/add",
    method: "post",
    data: data,
  });
};

//编辑用户群组
export const editUserGroup = (data) => {
  return axios({
    url: baseUrl_serve + "/biz/user/group/modify/" + data.id,
    method: "post",
    data: data,
  });
};

//删除用户群组
export const delUserGroup = (ids) => {
  return axios({
    url: baseUrl_serve + "/biz/user/group/delete/" + ids,
    method: "delete",
  });
};

//查询用户群组
export const getUserGroups = (data) => {
  return axios({
    url: baseUrl_serve + "/biz/user/group/all",
    method: "post",
  });
};

export function captchaImage() {
  return axios({
    url: baseUrl_serve + "captchaImage",
    method: "get",
  });
}

export function getCaptcha() {
  return axios({
    url: baseUrl_serve + "/auth/captcha1",
    method: "post",
  });
}

export function getClassNameList() {
  return axios({
    url: baseUrl_serve + "seaElements/classNameList",
    method: "get",
  });
}

export function getByClass(data) {
  return axios({
    url: baseUrl_serve + "seaElements/getByClass",
    method: "get",
    params: data,
  });
}

export function getRightClass(data) {
  return axios({
    url: baseUrl_serve + "oceanplan/my_oceanplan/getPlanCategory",
    method: "get",
    params: data,
  });
}

//获取所有树
export function getLayerTopAll(data) {
  return axios({
    url: baseUrl_serve + "/biz/project/layer/top/all",
    method: "post",
    data: data,
  });
}

//添加树形
export function addTreeList(data) {
  return axios({
    url: baseUrl_serve + "/biz/project/layer/add",
    method: "post",
    data: data,
  });
}

//删除树节点
export function deltTreeList(ids) {
  return axios({
    url: baseUrl_serve + "/biz/project/layer/delete/" + ids,
    method: "DELETE",
  });
}

//编辑树节点
export function editTreeList(data) {
  return axios({
    url: baseUrl_serve + "/biz/project/layer/modify/" + data.id,
    method: "post",
    data: data,
  });
}

//添加图形
export function addDraw(data) {
  return axios({
    url: baseUrl_serve + "/biz/draw/add",
    method: "post",
    data: data,
  });
}

//查所有图形
export function allDraw() {
  return axios({
    url: baseUrl_serve + "/biz/draw/all",
    method: "post",
  });
}

//查所有图形
export function allDrawTree(data) {
  return axios({
    url: baseUrl_serve + "/biz/draw/tree",
    method: "post",
    data: data,
  });
}

//删除图形
export function deltDraw(ids) {
  return axios({
    url: baseUrl_serve + "/biz/draw/delete/" + ids,
    method: "DELETE",
  });
}

//编辑图形
export function editDraw(data) {
  return axios({
    url: baseUrl_serve + "/biz/draw/modify/" + data.id,
    method: "POST",
    data: data,
  });
}

//获取摄像头分类
export function getCameraClassify(data) {
  return axios({
    url: baseUrl_serve + "/biz/device/camera/classify/all",
    method: "POST",
    data: data,
  });
}

//获取摄像头列表
export function getCameraList(data) {
  return axios({
    url: baseUrl_serve + "/biz/device/camera/all",
    method: "POST",
    data: data,
  });
}

// 获取入库设备列表
export function getWarehousingStorageAll(data) {
  return axios({
    url: baseUrl_serve + "/biz/warehousing/storage/all",
    method: "POST",
    data: data,
  });
}

// 获取设备绑定的摄像头列表
export function getBindCameraByEquipmentAll(data) {
  return axios({
    url: baseUrl_serve + "/biz/device/camera/bind/equipment/all",
    method: "POST",
    data: data,
  });
}

//编辑摄像头
export function editCamera(data) {
  return axios({
    url: baseUrl_serve + "/biz/device/camera/modify/" + data.id,
    method: "POST",
    data: data,
  });
}

//编辑摄像头信息
export function editCameraInfo(data) {
  return axios({
    url: baseUrl_serve + "/biz/device/camera/edit/info",
    method: "POST",
    data: data,
  });
}

//编辑摄像头状态
export function statusCamera(data) {
  return axios({
    url: baseUrl_serve + "/biz/device/camera/status",
    method: "POST",
    data: data,
  });
}

//编辑摄像头观察者
export function editCameraView(data) {
  return axios({
    url: baseUrl_serve + "/biz/device/camera/viewer/position/" + data.id,
    method: "POST",
    data: data,
  });
}

//获取摄像头地址
export function getCameraAddress(data) {
  return axios({
    url: baseUrl_serve + "/biz/device/camera/live/address",
    method: "get",
    params: data,
  });
}

//获取摄像头token
export function getCameraToken() {
  return axios({
    url: baseUrl_serve + "/biz/device/camera/access/token",
    method: "get",
  });
}

//移动云台
export function moveCameraGimbal(data) {
  return axios({
    url: "/camera" + baseUrl_serve + "/biz/device/camera/move",
    method: "POST",
    data: data,
  });
}

export function formatBaseUrl(data) {
  // 处理 host：如果包含 :// 则去掉，确保是纯净的 host
  let host = data.config?.host || "";
  if (host.includes("://")) {
    host = host.split("://")[1];
  }

  // 处理 protocol：去掉末尾的冒号（http: -> http）
  let protocol = data.config?.protocol || "http";
  if (protocol.endsWith(":")) {
    protocol = protocol.slice(0, -1);
  }

  const baseURL = `${protocol}://${host}`;
  return baseURL;
}

//抓图
export function snapCamera(data) {
  const baseURL = formatBaseUrl(data);

  return axios_video_service({
    baseURL,
    url: "/api/v1/Snapshot",
    method: "GET",
    params: {
      token: data?.config?.token,
      session: data?.config?.session,
    },
  });
}

//录像开启
export function recordCamera(data) {
  // 处理 host：如果包含 :// 则去掉，确保是纯净的 host
  let host = data.config?.host || "";
  if (host.includes("://")) {
    host = host.split("://")[1];
  }

  // 处理 protocol：去掉末尾的冒号（http: -> http）
  let protocol = data.config?.protocol || "http";
  if (protocol.endsWith(":")) {
    protocol = protocol.slice(0, -1);
  }

  const baseURL = `${protocol}://${host}`;

  return axios_video_service({
    baseURL,
    url: "/api/v1/ManualRecordStart",
    method: "GET",
    params: {
      token: data?.config?.token,
      session: data?.config?.session,
    },
  });
}

//录像停止
export function stopRecordCamera(data) {
  // 处理 host：如果包含 :// 则去掉，确保是纯净的 host
  let host = data.config?.host || "";
  if (host.includes("://")) {
    host = host.split("://")[1];
  }

  // 处理 protocol：去掉末尾的冒号（http: -> http）
  let protocol = data.config?.protocol || "http";
  if (protocol.endsWith(":")) {
    protocol = protocol.slice(0, -1);
  }

  const baseURL = `${protocol}://${host}`;

  return axios_video_service({
    baseURL,
    url: "/api/v1/ManualRecordStop",
    method: "GET",
    params: {
      token: data?.config?.token,
      session: data?.config?.session,
    },
  });
}

//记录录像 测试
export function recordCameraImageVideo1(data) {
  return service1({
    baseURL: "https://3dmineim.3dmine-cn.com:10065",
    withCredentials: false,
    headers: {
      Authorization:
        "Bearer " +
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InJvb3QiLCJhY2Nlc3NfdG9rZW4iOiIzZWRhY2FkZWNjZDkyODlhOWIzODFlNzhhZWMyNTg5YyIsImV4cGlyZXNfYXQiOjE3ODcxOTI5MDQsImlhdCI6MTc4NDYwMDkwNCwiaXNzIjoiMSIsIm5iZiI6MTc4NDYwMDYwNH0.lgOr4geAXDAFoW3QeS-EwAsGszLtwlTizwrM2FHgetU",
    },
    url: baseUrl_serve + "/biz/camera/images/videos/add",
    method: "POST",
    data: data,
  });
}

//记录录像
export function recordCameraImageVideo(data) {
  return axios({
    url: baseUrl_serve + "/biz/camera/images/videos/add",
    method: "POST",
    data: data,
  });
}

//记录录像记录
export function postRecordCameraImageVideoAll(data) {
  return axios({
    url: baseUrl_serve + "/biz/camera/images/videos/all",
    method: "POST",
    data: data,
  });
}

//记录录像记录
export function postRecordCameraImageVideoAll1(data) {
  return service1({
    baseURL: "https://3dmineim.3dmine-cn.com:10065",
    withCredentials: false,
    headers: {
      Authorization:
        "Bearer " +
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InJvb3QiLCJhY2Nlc3NfdG9rZW4iOiIzZWRhY2FkZWNjZDkyODlhOWIzODFlNzhhZWMyNTg5YyIsImV4cGlyZXNfYXQiOjE3ODcxOTI5MDQsImlhdCI6MTc4NDYwMDkwNCwiaXNzIjoiMSIsIm5iZiI6MTc4NDYwMDYwNH0.lgOr4geAXDAFoW3QeS-EwAsGszLtwlTizwrM2FHgetU",
    },
    url: baseUrl_serve + "/biz/camera/images/videos/all",
    method: "POST",
    data: data,
  });
}

//移动云台 v2
export function moveCameraGimbalV2(data) {
  const actionMap = {
    1: "left",
    2: "right",
    3: "up",
    4: "down",
    5: "upleft",
    6: "downleft",
    7: "upright",
    8: "downright",
  };

  // 处理 host：如果包含 :// 则去掉，确保是纯净的 host
  let host = data.config?.host || "";
  if (host.includes("://")) {
    host = host.split("://")[1];
  }

  // 处理 protocol：去掉末尾的冒号（http: -> http）
  let protocol = data.config?.protocol || "http";
  if (protocol.endsWith(":")) {
    protocol = protocol.slice(0, -1);
  }

  const baseURL = `${protocol}://${host}`;

  return axios_video_service({
    baseURL,
    url: "/api/v1/Ptz",
    method: "GET",
    params: {
      token: data?.config?.token,
      action: actionMap[data?.op],
      speed: data?.speed,
      session: data?.config?.session,
    },
  });
}

//缩放云台
export function zoomCameraGimbal(data) {
  return axios({
    url: "/camera" + baseUrl_serve + "/biz/device/camera/zoom",
    method: "POST",
    data: data,
  });
}
//缩放云台 v2
export function zoomCameraGimbalV2(data) {
  const actionMap = {
    1: "zoomout",

    3: "zoomin",
  };

  // 处理 host：如果包含 :// 则去掉，确保是纯净的 host
  let host = data.config?.host || "";
  if (host.includes("://")) {
    host = host.split("://")[1];
  }

  // 处理 protocol：去掉末尾的冒号（http: -> http）
  let protocol = data.config?.protocol || "http";
  if (protocol.endsWith(":")) {
    protocol = protocol.slice(0, -1);
  }

  const baseURL = `${protocol}://${host}`;

  return axios_video_service({
    baseURL,
    url: "/api/v1/Ptz",
    method: "GET",
    params: {
      token: data?.config?.token,
      action: actionMap[data?.op],
      speed: data?.speed,
      session: data?.config?.session,
    },
  });
}

//聚焦云台
export function focusCameraGimbal(data) {
  return axios({
    url: "/camera" + baseUrl_serve + "/biz/device/camera/focus",
    method: "POST",
    data: data,
  });
}
//聚焦云台 V2
export function focusCameraGimbalV2(data) {
  const actionMap = {
    1: "focusout",

    3: "focusin",
  };

  // 处理 host：如果包含 :// 则去掉，确保是纯净的 host
  let host = data.config?.host || "";
  if (host.includes("://")) {
    host = host.split("://")[1];
  }

  // 处理 protocol：去掉末尾的冒号（http: -> http）
  let protocol = data.config?.protocol || "http";
  if (protocol.endsWith(":")) {
    protocol = protocol.slice(0, -1);
  }

  const baseURL = `${protocol}://${host}`;

  return axios_video_service({
    baseURL,
    url: "/api/v1/Ptz",
    method: "GET",
    params: {
      token: data?.config?.token,
      action: actionMap[data?.op],
      speed: data?.speed,
      session: data?.config?.session,
    },
  });
}

//停止 V2
export function stopCameraGimbalV2(data) {
  // 处理 host：如果包含 :// 则去掉，确保是纯净的 host
  let host = data.config?.host || "";
  if (host.includes("://")) {
    host = host.split("://")[1];
  }

  // 处理 protocol：去掉末尾的冒号（http: -> http）
  let protocol = data.config?.protocol || "http";
  if (protocol.endsWith(":")) {
    protocol = protocol.slice(0, -1);
  }

  const baseURL = `${protocol}://${host}`;

  return axios_video_service({
    baseURL,
    url: "/api/v1/Ptz",
    method: "GET",
    params: {
      token: data?.config?.token,
      action: "stop",
      session: data?.config?.session,
    },
  });
}

//车辆人员信息配置表
export function getVehiclePersonnelInformation() {
  return axios({
    url: baseUrl_serve + "/biz/vehicle/personnel/information/all",
    method: "post",
  });
}

//获取人车分离 车辆
export function getVehiclePersonnelByInformation(id) {
  return axios({
    url: baseUrl_serve + "/biz/vehicle/by/information/" + id,
    method: "get",
  });
}

//获取人车分离 人员  /biz/information/user/by/{id}
export function getInformationUserBy(id) {
  return axios({
    url: baseUrl_serve + "/biz/information/user/by/" + id,
    method: "get",
  });
}

//获取真实车辆列表
export function getVehicles() {
  return axios({
    url: baseUrl_serve + "/biz/vehicle/all",
    method: "post",
  });
}

//获取车辆轨迹列表
export function getVehicleTrips(data) {
  return axios({
    url: baseUrl_serve + "/biz/vehicle/trip/all",
    method: "post",
    data: data,
  });
}

//获取车辆轨迹详情
export function getVehicleTripDetail(data) {
  return axios({
    url: baseUrl_serve + "/biz/vehicle/trip/detail",
    method: "post",
    data: data,
  });
}

//获取天琴车辆
export function getVehicleTianQinAll(data) {
  return axios({
    url: baseUrl_serve + "/biz/vehicle/tianqin/all",
    method: "post",
    data: data,
  });
}

//添加配置
export function addConfig(data) {
  return axios({
    url: baseUrl_serve + "/biz/gis/config/add",
    method: "post",
    data: data,
  });
}

//查询配置
export function getConfig(data) {
  return axios({
    url: baseUrl_serve + "/biz/gis/config/findKey",
    method: "post",
    data: data,
  });
}

//编辑配置
export function editConfig(data) {
  return axios({
    url: baseUrl_serve + "/biz/gis/config/modify",
    method: "POST",
    data: data,
  });
}

//shangchuan
export function uploadFile(data) {
  return axios({
    url: baseUrl_serve + "/attachment/upload",
    method: "POST",
    data: data,
  });
}

export function getImg(id) {
  return axios({
    responseType: "arraybuffer",
    url: baseUrl_serve + "/attachment/download/" + id,
    method: "get",
  });
}

//添加视图位置
export function addViewPosition(data) {
  return axios({
    url: baseUrl_serve + "/biz/gis/view/add",
    method: "POST",
    data: data,
  });
}

//查询视图位置
export function allViewPositions(data) {
  return axios({
    url: baseUrl_serve + "/biz/gis/view/all",
    method: "POST",
    data: data,
  });
}

//删除视图位置
export function deltViewPosition(id) {
  return axios({
    url: baseUrl_serve + "/biz/gis/view/delete/" + id,
    method: "DELETE",
    data: {
      id: id,
    },
  });
}

//工单状态统计
export function orderStatus(data, type) {
  return axios({
    url: baseUrl_serve + "/biz/static/work/order/status/" + type,
    method: "POST",
    data: data,
  });
}

//最近七天
export function orderStatusSeven() {
  return axios({
    url: baseUrl_serve + "/biz/static/work/order/gis/status",
    method: "POST",
  });
}

//严重等级
export function getPiePriority(data) {
  return axios({
    url: baseUrl_serve + "/biz/static/work/order/gis/priority",
    method: "POST",
    data: data,
  });
}

//责任占比
export function getPieDepartment(data) {
  return axios({
    url: baseUrl_serve + "/biz/static/work/order/gis/department",
    method: "POST",
    data: data,
  });
}

//来源
export function getPieSource(data) {
  return axios({
    url: baseUrl_serve + "/biz/static/work/order/gis/source",
    method: "POST",
    data: data,
  });
}

//字典表
export function getDictionary() {
  return axios({
    url: baseUrl_serve + "/biz/work/order/dictionary",
    method: "GET",
  });
}

//所有任务
export function getTaskOrders(type, data) {
  return axios({
    url: baseUrl_serve + "/biz/task/work/order/findList/" + type,
    method: "POST",
    data: data,
  });
}

//任务详情
export function getTaskInfo(id) {
  return axios({
    url: baseUrl_serve + "/biz/task/work/order/info/" + id,
    method: "GET",
  });
}

//所有工单
export function getOrders(type, data) {
  return axios({
    url: baseUrl_serve + "/biz/work/order/all/" + type,
    method: "POST",
    data: data,
  });
}

//工单详情
export function getOrderInfo(id, type) {
  return axios({
    url: baseUrl_serve + "/biz/work/order/info/" + id + "/2",
    method: "GET",
  });
}

//工单验收结果
export function getOrderResult(id, type) {
  return axios({
    url: baseUrl_serve + "/biz/work/order/result/" + id + "/2",
    method: "GET",
  });
}

//工单主题
export function getOrderSubjectAll() {
  return axios({
    url: baseUrl_serve + "/biz/work/order/subject/all",
    method: "POST",
  });
}

//隐患专业
export function getOrderSpecialityAll() {
  return axios({
    url: baseUrl_serve + "/biz/work/order/speciality/all",
    method: "POST",
  });
}

//获取项目列表
export function getProjectList(data) {
  return axios({
    url: baseUrl_serve + "/biz/project/all",
    method: "POST",
    data: data,
  });
}

//模型文件表
export function getModelByProject(data) {
  console.log("getModelByProject");
  return axios({
    url: baseUrl_serve + "/biz/file/convert/findByProject",
    method: "POST",
    data: data,
  });
}

//模型文件表所有 带 用户信息
export function getModels(data) {
  return axios({
    url: baseUrl_serve + "/biz/file/convert/all",
    method: "POST",
    data: data,
  });
}

//异步 模型文件表所有 带 用户信息
export async function getModelsAsync(data) {
  let res = await axios({
    url: baseUrl_serve + "/biz/file/convert/all",
    method: "POST",
    data: data,
  });
  return res.data.data;
}

//带班查询
export function getTeamSwitch(data) {
  return axios({
    url: baseUrl_serve + "/biz/team/switch/all",
    method: "POST",
    data: data,
  });
}

//风险活动 查询正在进行中的活动
export function getDispatch() {
  return axios({
    url: baseUrl_serve + "/biz/risk/dispatch/status",
    method: "POST",
  });
}

export async function getRiskStaticLevel(data) {
  const res = await axios({
    url: baseUrl_serve + "/biz/risk/static/level",
    method: "POST",
    data,
  });
  return res.data;
}

/** 风险四色图列表 */
export async function getRiskAreaAll(data) {
  const res = await axios({
    url: baseUrl_serve + "/biz/risk/area/all",
    method: "POST",
    data,
  });
  return res.data;
}

/** 删除风险四色图 */
export async function deleteRiskAreaByIds(ids) {
  const res = await axios({
    url: baseUrl_serve + "/biz/risk/area/delete/" + ids,
    method: "DELETE",
  });
  return res.data;
}

/** 获取风险类型表 */
export async function getRiskTypeAll(data) {
  const res = await axios({
    url: baseUrl_serve + "/biz/risk/type/all",
    method: "POST",
    data,
  });
  return res.data;
}

/** 获取报警信息表 */
export async function getWarning(data) {
  const res = await axios({
    url: baseUrl_serve + "/biz/warning/all",
    method: "POST",
    data,
  });
  return res.data;
}

/** 获取报警人员信息表 */
export async function getWarningUserAll(data) {
  const res = await axios({
    url: baseUrl_serve + "/biz/warning/user/all",
    method: "POST",
    data,
  });
  return res.data;
}

/** 获取报警统计总计接口
 * @param {(1 | 2 | 3 | 4 | 5 | 6)[]} static_type 状态统计:1/status;2/type;3/level;4/up_level;5/category;6/kind;
 */
export async function getWarningStaticAll(static_type, time_condition) {
  const res = await axios({
    url: baseUrl_serve + "/biz/warning/static/all",
    method: "POST",
    data: {
      static_type,
      time_condition,
    },
  });
  return res.data;
}

/** 获取报警统计总计接口 */
export async function getWarningStaticLevelGroupDate(level, time_condition) {
  const res = await axios({
    url: baseUrl_serve + "/biz/warning/static/level/group/date",
    method: "POST",
    data: { level, time_condition },
  });
  return res.data;
}

/** 修改报警状态接口 */
export async function warningUpdateStatus(data) {
  const res = await axios({
    url: baseUrl_serve + "/biz/warning/update/status",
    method: "POST",
    data,
  });
  return res.data;
}

/** 修改报警状态接口 */
export async function warningGroupUpdateStatus(data) {
  const res = await axios({
    url: baseUrl_serve + "/biz/warning/update/all/status",
    method: "POST",
    data,
  });
  return res.data;
}

/** 获取这条详情 */
export async function warningInfoById(id) {
  const res = await axios({
    url: baseUrl_serve + "/biz/warning/info/" + id,
    method: "GET",
  });
  return res.data;
}

/** 获取报警反馈信息表 */
export async function getWarningContentAll(data) {
  const res = await axios({
    url: baseUrl_serve + "/biz/warning/content/all",
    method: "POST",
    data,
  });
  return res.data;
}

/** 添加风险四色图 */
export async function addRiskArea(data) {
  const res = await axios({
    url: baseUrl_serve + "/biz/risk/area/add",
    method: "POST",
    data,
  });
  return res.data;
}

/** 获取全部风险 */
export async function getRiskAll(data) {
  const res = await axios({
    url: baseUrl_serve + "/biz/risk/find",
    method: "POST",
    data,
  });
  return res.data;
}

/** 获取全部风险点 */
export async function getRiskPositionAll(data) {
  const res = await axios({
    url: baseUrl_serve + "/biz/risk/position/all",
    method: "POST",
    data,
  });
  return res.data;
}

//专项治理
export function getActivityStatus() {
  return axios({
    url: baseUrl_serve + "/biz/safety/inspection/active/activityStatus",
    method: "GET",
  });
}

//专项数据详情
export function getActivityStatusById(id) {
  return axios({
    url: baseUrl_serve + "/biz/safety/inspection/activity/status/" + id,
    method: "GET",
  });
}

//客户列表
export function getCustomers() {
  return axios({
    url: baseUrl_serve + "/biz/customer/all",
    method: "POST",
  });
}
//客户列表
export function getCustomeProduct(data) {
  return axios({
    url: baseUrl_serve + "/biz/customer/product/all",
    method: "POST",
    data: data,
  });
}
//客户煤种
export function getCustomerProduction() {
  return axios({
    url: baseUrl_serve + "/biz/customer/all",
    method: "POST",
  });
}
export function getCustomersData(data) {
  return axios({
    url: baseUrl_serve + "/biz/customer/all",
    data: data,
    method: "POST",
  });
}

//客户等级占比
export function getCustomerGrade() {
  return axios({
    url: baseUrl_serve + "/biz/customer/info/grade/proportion",
    method: "GET",
  });
}

//客户等级占比
export function getCustomerSales() {
  return axios({
    url: baseUrl_serve + "/biz/order/form/sales/proportion",
    method: "GET",
  });
}

//客户历史三
export function getCustomerSalesThree() {
  return axios({
    url: baseUrl_serve + "/biz/order/form/info/three",
    method: "GET",
  });
}

//单客户
export function getCustomeSales(data) {
  return axios({
    url: baseUrl_serve + "/biz/order/form/month/" + data.id,
    method: "POST",
    data: data,
  });
}

//获取部门
export function getDepartments(data) {
  return axios({
    url: baseUrl_serve + "/biz/department/all",
    method: "POST",
    data: data,
  });
}

//获取部门下的人
export function getDepartmentsUser(data) {
  return axios({
    url: baseUrl_serve + "/biz/department/user/" + data,
    method: "POST",
    data: data,
  });
}

//获取职位
export function getPositions(data) {
  return axios({
    url: baseUrl_serve + "/biz/department/position/all",
    method: "GET",
    params: data,
  });
}

//获取人员
export function getUserAll(data) {
  return axios({
    url: baseUrl_serve + "/biz/user/all",
    method: "POST",
    data: data,
  });
}

//获取专家
export function getExpertAll(data) {
  return axios({
    url: baseUrl_serve + "/biz/visiting/user/information/all",
    method: "POST",
    data: data,
  });
}

//获取临时人员
export function getTemporaryAll(data) {
  return axios({
    url: baseUrl_serve + "/biz/temporary/personnel/all",
    method: "POST",
    data: data,
  });
}

//获取来访人员
export function getVisitingUserAll(data) {
  return axios({
    url: baseUrl_serve + "/biz/visiting/user/information/all",
    method: "POST",
    data: data,
  });
}

//
export function getOrderSpeciality(data) {
  return axios({
    url: baseUrl_serve + "/biz/work/order/count/speciality",
    method: "POST",
    data: data,
  });
}

//管理要素
export function getOrderSubject(data) {
  return axios({
    url: baseUrl_serve + "/biz/work/order/count/subject",
    method: "POST",
    data: data,
  });
}

//获取阿里Token(speech)
export async function getAliyunTokenSpeeck() {
  let res = await axios({
    url: baseUrl_serve + "/biz/aliyun/access/token/speech",
    method: "GET",
  });
  return res.data.data.Token.Id;
}

//获取阿里AppKey(speech)
export async function getAliyunAppKeySpeeck() {
  let res = await axios({
    url: baseUrl_serve + "/biz/aliyun/app_key/speech",
    method: "GET",
  });
  return res.data.data;
}

/**
 * @description 忽略报警信息
 *
 * @param {{id:number,reason:string}} data
 */
export async function AlarmIgnore(data) {
  const res = await axios({
    url: baseUrl_serve + "/biz/alarm/information/ignore",
    method: "POST",
    data,
  });
  return res.data;
}

/**
 * @description 确认报警信息
 *
 * @param {number} id
 */
export async function AlarmConfirm(id) {
  const res = await axios({
    url: baseUrl_serve + "/biz/alarm/information/info/update/status",
    method: "POST",
    data: { id, status: 2 },
  });
  return res.data;
}

/**
 * @description 获取所有报警信息
 *
 * @param {*} data
 */
export async function getAlarmAll(data) {
  const res = await axios({
    url: baseUrl_serve + "/biz/alarm/information/all",
    method: "POST",
    data,
  });
  return res.data;
}

/**
 * @description 获取七天人员定位所有报警信息
 *
 * @param {*} data
 */
export async function getRydwAlarmAll(data) {
  const res = await axios({
    url: baseUrl_serve + "/biz/personnel/police/find/alert",
    method: "GET",
    data,
  });
  return res.data;
}

/**
 * @description 人员定位报警列表
 */
export async function postRydwAlarmListAll(data) {
  const res = await axios({
    url: baseUrl_serve + "/biz/personnel/police/all",
    method: "POST",
    data,
  });
  return res.data;
}

/**
 * @description 通过用户id数组获取用户信息
 *
 * @param {number[]} ids
 */
export async function getUserByIds(ids) {
  const res = await axios({
    url: baseUrl_serve + "/biz/user/info/all",
    method: "POST",
    data: { ids },
  });
  return res;
}

/**
 * @description 结束报警信息
 *
 * @param {number} id
 */
export async function alarmFinished(id) {
  const res = await axios({
    url: baseUrl_serve + "/biz/alarm/information/finished/" + id,
    method: "GET",
  });
  return res;
}

/** @description 获取用户角色信息 */
export async function getUserRole() {
  const res = await axios({
    url: baseUrl_serve + "/biz/user/role",
    method: "GET",
  });
  return res;
}

/** @description 获取所有的角色菜单角色信息 */
export async function getAllRolesMenus(role_ids) {
  const res = await axios({
    url: baseUrl_serve + "/biz/role/menu/all",
    method: "POST",
    data: { role_ids },
  });
  return res;
}

//保存埋点和错误
export const traceErrorAndAction = (data) => {
  return axios({
    url: baseUrl_serve + "/biz/trace/cloud/platform/add",
    method: "POST",
    data: data,
  });
};

/////////////////////////首页右上角信息/////////////////////////////

//带班领导
export function getTeamSwitchLeaderPhone() {
  return axios({
    url: baseUrl_serve + "/biz/team/switch/leader/phone",
    method: "GET",
  });
}

//值班领导
export function getSchedulingDutyUser() {
  return axios({
    url: baseUrl_serve + "/biz/scheduling/on/duty/find/user",
    method: "GET",
  });
}

//调度值班
export function getSchedulingDutyLeader() {
  return axios({
    url: baseUrl_serve + "/biz/scheduling/on/duty/find/leader",
    method: "GET",
  });
}

//采空区值班人
export function getGoafDutyFindUser() {
  return axios({
    url: baseUrl_serve + "/biz/goaf/duty/find/user",
    method: "GET",
  });
}

//现场管理  中心值班人
export function getDutyManagementCenterFindLeader() {
  return axios({
    url: baseUrl_serve + "/biz/duty/management/center/find/leader",
    method: "GET",
  });
}

//一队值班人
export function getOneTeamOnDutyFindUser() {
  return axios({
    url: baseUrl_serve + "/biz/one/team/on/duty/find/user",
    method: "GET",
  });
}

//二队值班人
export function getSecondTeamOnDutyFindUser() {
  return axios({
    url: baseUrl_serve + "/biz/second/team/on/duty/find/user",
    method: "GET",
  });
}

//磅房值班表
export function getBrokenRoomScheduleFindUser() {
  return axios({
    url: baseUrl_serve + "/biz/broken/room/schedule/find/user",
    method: "GET",
  });
}

//新带班值班接口
export function getDutyManagementCenterFindTeamSwitch() {
  return axios({
    url: baseUrl_serve + "/biz/duty/management/center/find/team/switch",
    method: "GET",
  });
}

//获取采区选煤出勤信息
export function getMiningAreaHotCoalByDate(data) {
  return axios({
    url: baseUrl_serve + "/biz/mining/area/hot/coal/by/date",
    method: "POST",
    data: data,
  });
}

/** 获取应急物资库数据 */
export async function getWarningCenter(data) {
  const res = await axios({
    url: baseUrl_serve + `/biz/warning/center/all`,
    method: "POST",
    data,
  });
  return res.data;
}

/** 获取帖子信息 */
export async function getPostCommentDate(data) {
  const res = await axios({
    url: baseUrl_serve + "/biz/post/comment/all",
    method: "POST",
    data: data,
  });
  return res.data;
}

/** 结束任务工单 */
export async function taskOrderYesToPass(data) {
  const res = await axios({
    url: baseUrl_serve + "/biz/task/work/order/yesToPass",
    method: "POST",
    data: data,
  });
  return res.data;
}

export async function postList(url, data) {
  const res = await axios({
    url: baseUrl_serve + `/biz/${url}`,
    method: "POST",
    data: data,
  });
  return res.data;
}

export async function getList(url) {
  const res = await axios({
    url: baseUrl_serve + `/biz/${url}`,
    method: "GET",
  });
  return res.data;
}

export function downloadExampleFile(url) {
  return axios({
    url: baseUrl_serve + `/biz/${url}`,
    method: "GET",
    responseType: "arraybuffer",
  });
}
export async function deleteList(url) {
  const res = await axios({
    url: baseUrl_serve + `/biz/${url}`,
    method: "DELETE",
  });
  return res.data;
}

/////////////////////////首页右上角信息/////////////////////////////

// 。:
// /biz/goaf/duty/find/user
// 采空区值班人

// 。:
// /biz/duty/management/center/find/leader
// 现场管理中心值班人

// 。:
// /biz/one/team/on/duty/find/user
// 一队值班人

// 。:
// /biz/second/team/on/duty/find/user
// 二队值班人

// 。:
// /biz/broken/room/schedule/find/user
// 磅房值班表

/** @description 查询人员定位行程 */
export async function postPersonnelPositioningItineraryAll(data) {
  const res = await axios({
    url: baseUrl_serve + `/biz/personnel/positioning/itinerary/all`,
    method: "POST",
    data: data,
  });
  return res.data;
}

/** @description 查询人员定位行程轨迹 */
export async function postUserBindingLogAll(data) {
  const res = await axios({
    url: baseUrl_serve + `/biz/user/binding/log/all`,
    method: "POST",
    data: data,
  });
  return res.data;
}

/** @description 获取电子围栏 */
export async function postElectronFenceAll(data) {
  const res = await axios({
    url: baseUrl_serve + "/biz/personnel/electronic/fence/send/all",
    method: "GET",
    data: data,
  });
  return res.data;
}

/** @description 增加电子围栏 */
export async function addElectronFence(data) {
  const res = await axios({
    url: baseUrl_serve + "/biz/personnel/electronic/fence/model/add",
    method: "POST",
    data: data,
  });
  return res.data;
}

/** @description 修改电子围栏 */
export async function editElectronFence(data) {
  const res = await axios({
    url: baseUrl_serve + "/biz/personnel/electronic/fence/model/edit",
    method: "POST",
    data: data,
  });
  return res.data;
}

/** @description 删除电子围栏 */
export async function deleteElectronFence(data) {
  const res = await axios({
    url: baseUrl_serve + "/biz/personnel/electronic/fence/model/delete",
    method: "DELETE",
    data: data,
  });
  return res.data;
}

/** 获取调度日志单个记录详细信息 */
export async function getSchedulingInfo(data) {
  const res = await axios({
    url: baseUrl_serve + "/biz/scheduling/logs/matters/all/logs",
    method: "POST",
    data,
  });
  return res.data;
}

/** 保存调度日志单个记录详细信息 */
export async function schedulingSave(data) {
  const res = await axios({
    url: baseUrl_serve + "/biz/scheduling/logs/matters/save/logs",
    method: "POST",
    data,
  });
  return res.data;
}

/** 调度日志人员确定 */
export async function schedulingUpdateStatus(data) {
  const res = await axios({
    url: baseUrl_serve + "/biz/scheduling/logs/find/update/status",
    method: "POST",
    data,
  });
  return res.data;
}

/** 获取边坡设备列表 */
export async function postSlopeEquipment(data) {
  const res = await axios({
    url: baseUrl_serve + "/gm/slope/equipment/all",
    method: "POST",
    data,
  });
  return res.data;
}

/** 获取签章信息 */
export async function getSignatureByUserId(user_id) {
  const res = await axios({
    url: baseUrl_serve + "/biz/signature/user/" + user_id,
    method: "GET",
  });
  return res.data;
}

/** 获取锦沃token */
export async function getGenvoToken() {
  const res = await axios({
    url: baseUrl_serve + "/biz/personnel/electronic/fence/token",
    method: "GET",
  });
  return res.data.data;
}

/** 发送人员消息 */
export async function postPersonnelBoradcast(_data) {
  const res = await axios({
    url: baseUrl_serve + "/biz/personnel/broadcast",
    method: "POST",
    data: _data,
  });
  return res.data;
}

/** @description 爆破计划 */
export const getBlastingPlanAll = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/biz/blasting/plan/all",
    method: "POST",
    data,
  });
  return res.data;
};
/** @description 爆破计划 */
export const addBlastingPlan = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/biz/blasting/plan/add",
    method: "POST",
    data,
  });
  return res.data;
};
/** @description 爆破计划 */
export const editBlastingPlan = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/biz/blasting/plan/modify/" + data.id,
    method: "POST",
    data,
  });
  return res.data;
};

/** @description 爆破附件 */
export const getBlatingPlanAttachmentAll = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/biz/blasting/plan/attachment/all",
    method: "POST",
    data,
  });
  return res.data;
};

/** @description 绑定爆破附件 */
export const bindBlastingFile = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/biz/blasting/plan/attachment/modify/" + data.id,
    method: "POST",
    data,
  });
  return res.data;
};

/** @description 删除爆破资料 */
export async function deleteBlastingPlanFile(data) {
  const res = await axios({
    url: baseUrl_serve + "/biz/blasting/plan/attachment/delete/" + data?.id,
    method: "DELETE",
    data: data,
  });
  return res.data;
}

/** @description 编辑爆破资料 */
export async function modifyBlastingPlanFile(data) {
  const res = await axios({
    url: baseUrl_serve + "/biz/blasting/plan/attachment/modify/" + data?.id,
    method: "POST",
    data: data,
  });
  return res.data;
}

/** @description 爆破计划审核编辑 */
export const blastingPlanReviewModify = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/biz/blasting/plan/review/modify/" + data.id,
    method: "POST",
    data,
  });
  return res.data;
};

/** @description 新增爆破附件 */
export const addBlastingMessage = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/biz/blasting/plan/message/add",
    method: "POST",
    data,
  });
  return res.data;
};

/** @description 新增爆破附件 */
export const addBlastingFile = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/biz/blasting/plan/attachment/add",
    method: "POST",
    data,
  });
  return res.data;
};

/** @description 平整度分析列表 */
export const postBlastingPlanEvennessAll = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/biz/blasting/plan/evenness/all",
    method: "POST",
    data,
  });
  return res.data;
};

/** @description 爆破计划留言板列表 */
export const postBlastingPlanMessageAll = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/biz/blasting/plan/message/all",
    method: "POST",
    data,
  });
  return res.data;
};

/** @description 新建度分析列表 */
export const addBlastingPlanEvennessAnalysis = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/biz/blasting/plan/evenness/analysis",
    method: "POST",
    data,
  });
  return res.data;
};

/** @description 编辑3ds围栏上传列表 */
export const modifyBlastingPlan3dsFence = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/biz/blasting/plan/3ds/modify/" + data.id,
    method: "POST",
    data,
  });
  return res.data;
};

/** @description 新建3ds围栏上传列表 */
export const addBlastingPlan3dsFenceAdd = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/biz/blasting/plan/3ds/add",
    method: "POST",
    data,
  });
  return res.data;
};

/** @description 查询3ds上传列表 */
export const postBlastingPlan3dsFenceAll = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/biz/blasting/plan/3ds/all",
    method: "POST",
    data,
  });
  return res.data;
};

/** @description 删除电子围栏 */
export async function deleteBlastingPlanEvenness(data) {
  const res = await axios({
    url: baseUrl_serve + "/biz/blasting/plan/evenness/delete/" + data?.ids,
    method: "DELETE",
    data: data,
  });
  return res.data;
}

/** @description 删除电子围栏 */
export async function deleteBlastingPlanMessage(data) {
  const res = await axios({
    url: baseUrl_serve + "/biz/blasting/plan/message/delete/" + data?.id,
    method: "DELETE",
    data: data,
  });
  return res.data;
}

/** @description 爆破计划状态 */
export const blastingPlanStepChange = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/biz/blasting/plan/update/full/status",
    method: "POST",
    data,
  });
  return res.data;
};

export function getBlastingPlanInfo(id) {
  return axios({
    url: baseUrl_serve + "/biz/blasting/plan/info/" + id,
    method: "get",
  });
}

export async function getBlastingPlan3ds(id) {
  const res = await axios({
    url: baseUrl_serve + "/biz/blasting/plan/3ds/coordinate/info/" + id,
    method: "get",
  });

  return res.data;
}

/** @description 爆破作业人员分工管理 */
export const postBlastingPlanReviewUserListAll = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/biz/blasting/plan/review/all",
    method: "POST",
    data,
  });
  return res.data;
};

/** @description 爆破作业人员分工管理 */
export const postBlastingPlanWorkers = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/biz/blasting/plan/user/all",
    method: "POST",
    data,
  });
  return res.data;
};
/** @description 新增爆破计划爆破负责人 */
export const addBlastingPlanBurstWorker = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/biz/blasting/plan/user/add",
    method: "POST",
    data,
  });
  return res.data;
};
/** @description 编辑爆破计划爆破负责人 */
export const modifyBlastingPlanBurstWorker = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/biz/blasting/plan/user/modify/" + data.id,
    // url: baseUrl_serve + "/biz/blasting/plan/evaluate/modify/" + data.id,
    method: "POST",
    data,
  });
  return res.data;
};
/** @description 编辑爆破计划爆破负责人 */
export const deleteBlastingUser = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/biz/blasting/plan/user/delete/" + data.id,
    method: "DELETE",
    data,
  });
  return res.data;
};

//下载
export const baseFileDownLoad = (id) => {
  return axios({
    responseType: "arraybuffer",
    url: baseUrl_serve + "/attachment/download/" + id,
    method: "get",
  });
};

export const baseFileDownLoad9522 = (id) => {
  return axios({
    responseType: "arraybuffer",
    url: baseUrl_serve + "/biz/file/download/" + id,
    method: "get",
  });
};

/** @description 爆破计划评价编辑 */
export const editBlastingPlanEvaluate = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/biz/blasting/plan/update/remark",
    method: "POST",
    data,
  });
  return res.data;
};
/** @description 爆破计划评价查询 */
export const postBlastingPlanEvaluateAll = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/biz/blasting/plan/evaluate/all",
    method: "POST",
    data,
  });
  return res.data;
};

/** @description 获取巡监机器人位置 */
export const getRobotPositions = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/biz/patrol/inspection/equipment/all",
    method: "POST",
    data,
  });
  return res.data;
};

/** @description 获取钻孔设备表管理列表 */
export const getBlastingDrillingEquipment = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/biz/blasting/drilling/equipment/all",
    method: "POST",
    data,
  });
  return res.data;
};

/** @description 获取钻孔设备任务管理列表 */
export const getBlastingPlanTask = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/biz/blasting/plan/task/all",
    method: "POST",
    data,
  });
  return res.data;
};

/** @description 删除钻孔任务表管理列表 */
export const deleteBlastingPlanTask = async (id) => {
  const res = await axios({
    url: baseUrl_serve + "/biz/blasting/plan/task/delete" + "/" + id,
    method: "DELETE",
  });
  return res.data;
};

/** @description 添加钻孔设备表 */
export const addBlastingPlanTask = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/biz/blasting/plan/task/add",
    method: "POST",
    data,
  });
  return res.data;
};

/** @description 获取穿爆钻孔参数表管理表 */
export const getBlastingPlanDrillingParameter = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/biz/blasting/plan/drilling/parameter/all",
    method: "POST",
    data,
  });
  return res.data;
};

/** @description 钻孔数据下发钻机 */
export const getBlastingPlanDrillingParameterDispatchBore = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/biz/blasting/plan/drilling/parameter/dispatch/bore",
    method: "POST",
    data,
  });
  return res.data;
};

/** @description 钻孔数据下发验孔机器 */
export const getBlastingPlanDrillingParameterDispatchVerify = async (data) => {
  const res = await axios({
    url:
      baseUrl_serve + "/biz/blasting/plan/drilling/parameter/dispatch/verify",
    method: "POST",
    data,
  });
  return res.data;
};

/** @description 获取爆破钻孔钻车工况表管理 */
export const getBlastingPlanDrillingMachineState = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/biz/blasting/plan/drilling/machine/state/all",
    method: "POST",
    data,
  });
  return res.data;
};

/** @description 获取变电站控制台开关表管理 */
export const getSubstationControlAll = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/biz/substation/control/all",
    method: "POST",
    data,
  });
  return res.data;
};

/** @description 编辑变电站控制台开关表管理 */
export const editSubstationControl = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/biz/substation/control/edit",
    method: "POST",
    data,
  });
  return res.data;
};

/** @description 获取采煤计划 */
export const getMiningPlanALL = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/biz/mining/plan/all",
    method: "POST",
    data,
  });
  return res.data;
};

/** @description 获取采煤计划重点 */
export const getMiningPlanReviewFocus = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/biz/mining/plan/review/focus/all",
    method: "POST",
    data,
  });
  return res.data;
};

/** @description 新增采煤计划重点 */
export const addMiningPlanReviewFocus = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/biz/mining/plan/review/focus/add",
    method: "POST",
    data,
  });
  return res.data;
};

/** @description 删除采煤计划重点 */
export function deleteMiningPlanReviewFocus(id) {
  return axios({
    url: baseUrl_serve + "/biz/mining/plan/review/focus/delete/" + id,
    method: "DELETE",
    data: {
      id: id,
    },
  });
}

/** @description 获取采煤计划文件 */
export const getMiningPlanFileALL = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/biz/mining/plan/file/all",
    method: "POST",
    data,
  });
  return res.data;
};

/** @description 删除采煤计划文件 */
export function deleteMiningPlanFile(id) {
  return axios({
    url: baseUrl_serve + "/biz/mining/plan/file/delete/" + id,
    method: "DELETE",
    data: {
      id: id,
    },
  });
}

/** @description 新增采煤计划文件 */
export const addMiningPlanFile = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/biz/mining/plan/file/add",
    method: "POST",
    data,
  });
  return res.data;
};

/** @description 获取采煤计划审核人 */
export const getMiningPlanReviewALL = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/biz/mining/plan/review/all",
    method: "POST",
    data,
  });
  return res.data;
};

/** @description 编辑采煤计划 */
export const editMiningPlanReview = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/biz/mining/plan/review/modify/" + data.id,
    method: "POST",
    data,
  });
  return res.data;
};

/** @description 获取采煤计划参与人 */
export const getMiningPlanUserALL = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/biz/mining/plan/user/all",
    method: "POST",
    data,
  });
  return res.data;
};

/** @description 编辑采煤计划 */
export const editMiningPlan = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/biz/mining/plan/modify/" + data.id,
    method: "POST",
    data,
  });
  return res.data;
};

/** @description 编辑采煤计划 */
export const addMiningPlan = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/biz/mining/plan/add",
    method: "POST",
    data,
  });
  return res.data;
};

/** @description 获取单条采煤计划 */
export function getMiningPlanInfoById(id) {
  return axios({
    url: baseUrl_serve + "/biz/mining/plan/info/" + id,
    method: "GET",
  });
}

//获取人员
export function getTempUserAll(data) {
  return axios({
    url: baseUrl_serve + "/biz/temporary/personnel/all",
    method: "POST",
    data: data,
  });
}

export async function convert449024515(data) {
  const res = await axios({
    url: baseUrl_serve + `/gm/slope/equipment/trans/point`,
    method: "POST",
    data,
  });
  return res.data;
}

export async function getTruckTotalAction() {
  const res = await axios({
    url: baseUrl_serve + `/biz/vehicle/user/count/order`,
    method: "GET",
  });
  return res.data;
}
/** 获取智慧水务设备列表 */
export async function getWaterMeterEquipmentList(data) {
  const res = await axios({
    url: baseUrl_serve + `/biz/water/meter/equipment/all`,
    method: "POST",
    data,
  });
  return res.data;
}

/** 获取供电审批列表 */
export async function getIntelligentPowerTransmissionApprovalList(data) {
  const res = await axios({
    url: baseUrl_serve + `/biz/power/supply/approval/all`,
    method: "POST",
    data,
  });
  return res.data;
}

/** 新增供电审批列表 */
export async function addIntelligentPowerTransmissionApproval(data) {
  const res = await axios({
    url: baseUrl_serve + `/biz/power/supply/approval/add`,
    method: "POST",
    data,
  });
  return res.data.code;
}

/** 编辑供电审批列表 */
export async function modifyIntelligentPowerTransmissionApprova(data) {
  const res = await axios({
    url: baseUrl_serve + `/biz/power/supply/approval/modify/` + data.id,
    method: "POST",
    data,
  });
  return res.data.code;
}
/** @description 获取图层列表 */
export const getProjectLayerAll = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/biz/project/layer/all",
    method: "POST",
    data,
  });
  return res.data;
};

/** @description 获取报警提醒列表 */
export const getMentionAll = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/biz/mention/all",
    method: "POST",
    data,
  });
  return res.data;
};

/** @description 新增煤量销售对比原因 */
export const addCoalSalesComparisonReason = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/biz/coal/sales/comparison/add",
    method: "POST",
    data,
  });
  return res.data;
};

/** @description 查询煤量销售对比原因列表 */
export const getCoalSalesComparisonReasons = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/biz/coal/sales/comparison/all",
    method: "POST",
    data,
  });
  return res.data;
};

/** @description 编辑煤量销售对比原因 */
export const editCoalSalesComparisonReason = async (data) => {
  const res = await axios({
    url: baseUrl_serve + `/biz/coal/sales/comparison/modify/${data.id}`,
    method: "POST",
    data,
  });
  return res.data;
};

// ============ 销售/生产计划 ============

/** 获取计划列表 */
export const getPlanList = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/gm/sales/plan/all",
    method: "post",
    data,
  });
  return res.data;
};

/** 获取计划详情 */
export const getPlanInfo = async (id) => {
  const res = await axios({
    url: baseUrl_serve + "/gm/sales/plan/info/" + id,
    method: "get",
  });
  return res.data;
};

/** 新增计划 */
export const addPlan = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/gm/sales/plan/add",
    method: "post",
    data,
  });
  return res.data;
};

/** 修改计划 */
export const editPlan = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/gm/sales/plan/modify/" + data.id,
    method: "post",
    data,
  });
  return res.data;
};

/** 删除计划 */
export const deletePlan = async (id) => {
  const res = await axios({
    url: baseUrl_serve + "/gm/sales/plan/delete/" + id,
    method: "delete",
  });
  return res.data;
};

// ============ 月计划完成情况 ============

/** 获取月计划列表 */
export const getMonthPlanList = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/gm/sales/plan/month/all",
    method: "post",
    data,
  });
  return res.data;
};

/** 新增月计划 */
export const addMonthPlan = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/gm/sales/plan/month/add",
    method: "post",
    data,
  });
  return res.data;
};

/** 修改月计划 */
export const editMonthPlan = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/gm/sales/plan/month/modify/" + data.id,
    method: "post",
    data,
  });
  return res.data;
};

/** 删除月计划 */
export const deleteMonthPlan = async (id) => {
  const res = await axios({
    url: baseUrl_serve + "/gm/sales/plan/month/delete/" + id,
    method: "delete",
  });
  return res.data;
};

// ============ 日计划 ============

/** 获取日计划列表 */
export const getDailyPlanList = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/gm/sales/plan/day/all",
    method: "post",
    data,
  });
  return res.data;
};

/** 新增日计划 */
export const addDailyPlan = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/gm/sales/plan/day/add",
    method: "post",
    data,
  });
  return res.data;
};

/** 修改日计划 */
export const editDailyPlan = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/gm/sales/plan/day/modify/" + data.id,
    method: "post",
    data,
  });
  return res.data;
};

/** 删除日计划 */
export const deleteDailyPlan = async (id) => {
  const res = await axios({
    url: baseUrl_serve + "/gm/sales/plan/day/delete/" + id,
    method: "delete",
  });
  return res.data;
};
