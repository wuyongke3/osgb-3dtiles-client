import axios from "@/utils/axios_geology";
const baseUrl_serve = import.meta.env.VITE_APP_BASE_URL_GEOLOGY;

//获取无人家属车辆
export function getDriverlessVehiclesAll(data) {
  console.log(baseUrl_serve + "/biz/driverless/vehicles/all");
  return axios({
    url: baseUrl_serve + "/biz/driverless/vehicles/all",
    method: "post",
    data: data,
  });
}

/** 获取当天的无人驾驶车辆信息 */
export async function getCurrentDateVehiclesAll(data) {
  const res = await axios({
    url: baseUrl_serve + "/biz/find/driver/track",
    method: "post",
    data: data,
  });
  return res.data;
}

//采空区台账列表
export const getGoafs = (data) => {
  return axios({
    url: baseUrl_serve + "/biz/goaf/ledger/all",
    method: "post",
    data: data,
  });
};

//获取一个台账用围栏id
export const getGoafOneByEnclosure = (data) => {
  return axios({
    url: baseUrl_serve + "/biz/enclosure/goaf/ledgers",
    method: "post",
    data: data,
  });
};

//获取电子围栏remarks信息
export const getLineUserRemarks = (data) => {
  return axios({
    url: baseUrl_serve + "/biz/line/user/remarks",
    method: "post",
    data: data,
  });
};

export const getLineUserRemarksAsync = async (data) => {
  let res = await axios({
    url: baseUrl_serve + "/biz/line/user/remarks",
    method: "post",
    data: data,
  });
  return res.data.data;
};

//获取自定义线网
export const getLineUserAll = (data) => {
  return axios({
    url: baseUrl_serve + "/biz/line/user/all",
    method: "post",
    data: data,
  });
};

//获取电子围栏标记
export const getEnclosureRemarks = (data) => {
  return axios({
    url: baseUrl_serve + "/biz/enclosure/remarks",
    method: "post",
    data: data,
  });
};

//获取全部线网表
export const getLinesAll = (data) => {
  return axios({
    url: baseUrl_serve + "/biz/line/all",
    method: "post",
    data: data,
  });
};

/**
 * @description 通过起止点, 获取规划的路线
 */
export async function getRoutePlanningApi(data) {
  const result = await axios({
    url: baseUrl_serve + "/biz/line/route/planning",
    method: "post",
    data: data,
  });
  return result.data;
}

//获取全部电子围栏
export const getEnclosuresAll = (data) => {
  return axios({
    url: baseUrl_serve + "/biz/enclosure/all",
    method: "post",
    data: data,
  });
};

//获取电子围栏数据
export const getEnclosures = (data) => {
  return axios({
    url: baseUrl_serve + "/biz/enclosure/info/all",
    method: "post",
    data: data,
  });
};

//获取覆盖安全层关系层
export const getCoverSafe = (data) => {
  return axios({
    url: baseUrl_serve + "/biz/goaf/ledger/cover/safe",
    method: "post",
    data: data,
  });
};

//获取饼图
export const getStaticChart = (data) => {
  return axios({
    url: baseUrl_serve + "/biz/goaf/ledger/static/chart",
    method: "post",
    data: data,
  });
};

//获取饼图
export const postAlarmSecurityMaterialItemType = (data) => {
  return axios({
    url: baseUrl_serve + "/biz/alarm/security/material/item/type/all",
    method: "post",
    data: data,
  });
};

//获取文件
export const getfiles = (data) => {
  return axios({
    url: baseUrl_serve + "/biz/converter/cloud/file/all",
    method: "post",
    data: data,
  });
};

//下载
export const getfileDownLoad = (id) => {
  return axios({
    responseType: "arraybuffer",
    url: baseUrl_serve + "/biz/converter/cloud/file/download/" + id,
    method: "get",
  });
};

//获取钻孔
export const getDrillings = (data) => {
  return axios({
    url: baseUrl_serve + "/biz/drilling/all",
    method: "post",
    data: data,
  });
};

//获取数字孪生glb列表
export const getDigitalGlbs = (data) => {
  return axios({
    url: baseUrl_serve + "/biz/digital/twin/model/file/all",
    method: "post",
    data: data,
  });
};

//获取glb列表
export const getGlbs = (data) => {
  return axios({
    url: baseUrl_serve + "/biz/mesh/model/file/all",
    method: "post",
    data: data,
  });
};

//获取glb文件地址
export const getGlbFile = (data) => {
  return axios({
    url: baseUrl_serve + "/biz/file/info/all",
    method: "post",
    data: data,
  });
};

//获取块体点阵
export const getBlockPoints = (data) => {
  return axios({
    url: baseUrl_serve + "/biz/block/feature/all",
    method: "post",
    data: data,
  });
};

//获取某个点附近n个点
export const getBlockFeatureNearby = (data) => {
  return axios({
    url: baseUrl_serve + "/biz/block/feature/nearby",
    method: "post",
    data: data,
  });
};

//获取块体颜色
export const getBlockFeatureFields = () => {
  return axios({
    url: baseUrl_serve + "/biz/block/feature/fields",
    method: "get",
  });
};

//获取自定义类型
export const getUserTypeAll = (data) => {
  return axios({
    url: baseUrl_serve + "/biz/geometry/user/type/all",
    method: "post",
    data: data,
  });
};

//获取自定义类型id
export const getUserTypeById = (id) => {
  return axios({
    url: baseUrl_serve + "/biz/geometry/user/type/info/" + id,
    method: "get",
  });
};

/**
 * @description 获取所有的紧急避灾安全区域列表
 *
 * @param {*} data
 */
export async function getAlarmSecurityZoneAll(data) {
  const res = await axios({
    url: baseUrl_serve + "/biz/alarm/security/zone/all",
    method: "POST",
    data,
  });
  return res.data;
}

/**
 * @description 紧急避灾安全区域状态为启用
 *
 * @param {*} data
 */
export async function alarmSecurityZoneEnableStatus(id) {
  const res = await axios({
    url: baseUrl_serve + `/biz/alarm/security/zone/status/enable/${id}`,
    method: "GET",
  });
  return res.data.code;
}

/**
 * @description 紧急避灾安全区域状态为停用
 *
 * @param {*} data
 */
export async function alarmSecurityZoneDisableStatus(id) {
  const res = await axios({
    url: baseUrl_serve + `/biz/alarm/security/zone/status/disable/${id}`,
    method: "GET",
  });
  return res.data.code;
}

/**
 * @description 添加紧急避灾安全区域
 *
 * @param {*} data
 */
export async function alarmSecurityZoneAdd(data) {
  const res = await axios({
    url: baseUrl_serve + `/biz/alarm/security/zone/add`,
    method: "POST",
    data,
  });
  return res.data;
}

/**
 * @description 添加紧急避灾安全区域
 *
 * @param {number} id
 * @param {*} data
 *
 * @returns res.data.code
 */
export async function alarmSecurityZoneEdit(id, data) {
  const res = await axios({
    url: baseUrl_serve + `/biz/alarm/security/zone/modify/part/${id}`,
    method: "POST",
    data,
  });
  return res.data.code;
}

/**
 * @description 添加紧急避灾安全区域
 *
 * @param {string} ids
 *
 * @returns res.data.code
 */
export async function alarmSecurityZoneDelete(ids) {
  const res = await axios({
    url: baseUrl_serve + `/biz/alarm/security/zone/delete/${ids}`,
    method: "DELETE",
  });
  return res.data.code;
}

//专项会议  /biz/conference/all
export const getConferenceAll = (data) => {
  return axios({
    url: baseUrl_serve + "/biz/conference/all",
    method: "post",
    data: data,
  });
};

//根据会议ids 和 是否是会议 查下面的文件
export const getGeometryByConferenceIds = (data) => {
  return axios({
    url: baseUrl_serve + "/biz/geometry/file/all",
    method: "post",
    data: data,
  });
};

//根据会议ids 和 是否是会议 查下面的文件
export const getGeometryByConferenceIdsAsync = async (data) => {
  let res = await axios({
    url: baseUrl_serve + "/biz/geometry/file/all",
    method: "post",
    data: data,
  });

  return res.data.data;
};

//获取转换文件列表
export const getFileConverAll = (data) => {
  return axios({
    url: baseUrl_serve + "/file/convert/all",
    method: "post",
    data: data,
  });
};

//获取转换文件列表异步
export const getFileConverAllAsync = async (data) => {
  let res = await axios({
    url: baseUrl_serve + "/file/convert/all",
    method: "post",
    data: data,
  });
  return res.data.data;
};

//根据用户查自己能看模块
export async function getGisMenuByRoleUserId(id) {
  return axios({
    url: baseUrl_serve + "/biz/gis/role/user/" + id,
    method: "GET",
  });
}

//根据用户查自己能看模块
export async function getGisMenuByRoleUserIdAsync(id) {
  let res = await axios({
    url: baseUrl_serve + "/biz/gis/role/user/" + id,
    method: "GET",
  });
  return res.data.data;
}

//根据模块查询图例接口Async
export async function getGisLegendByMenuIdAsync(id) {
  let res = await axios({
    url: baseUrl_serve + "/biz/gis/default/legend/find/all/" + id,
    method: "GET",
  });
  return res.data.data;
}

//根据不同用户保存模块的选项
export function saveLegendByModelUser(data) {
  return axios({
    url: baseUrl_serve + "/biz/legend/user/add",
    method: "post",
    data: data,
  });
}

//根据用户和模块查选项
export async function getLegendByModelUserAsync(data) {
  let res = await axios({
    url: baseUrl_serve + "/biz/legend/user/find/model",
    method: "post",
    data: data,
  });
  return res.data.data;
}

//根据不同用户保存模块的选项
export function getVoiceCommandBySentence(data) {
  return axios({
    url: baseUrl_serve + "/biz/voice/assistant/session/command",
    method: "post",
    data: data,
  });
}

/** @description 根据客户id获取路线 */
export function getRoutersByCustomId(customId) {
  return axios({
    url: baseUrl_serve + "/biz/customer/route/info/" + customId,
    method: "GET",
  });
}

/** @description 煤制化验 */
export async function getCoalAnalysisAll(data) {
  const res = await axios({
    url: baseUrl_serve + "/biz/coal/analysis/all",
    method: "POST",
    data,
  });

  return res.data;
}

/** @description 煤制化验添加 */
export const addCoalAnalysis = (data) => {
  return axios({
    url: baseUrl_serve + "/biz/coal/analysis/add",
    method: "POST",
    data,
  });
};

/** @description 爆破计划上传3ds转换 */
export const addBlastingPlan3dsFile = (data) => {
  return axios({
    url: baseUrl_serve + "/biz/blasting/plan/drilling/add",
    method: "POST",
    data,
  });
};

/** @description 爆破计划上传3ds删除 */
export async function deleteBlastingPlan3dsFile(_data) {
  const res = await axios({
    url: baseUrl_serve + `/biz/blasting/plan/drilling/delete/${_data?.id}`,
    method: "DELETE",
    data: _data,
  });
  return res.data.code;
}

/** @description 煤制化验 */
export const getCoalAnalysisAllnoAsync = (data) => {
  return axios({
    url: baseUrl_serve + "/biz/coal/analysis/all",
    method: "POST",
    data,
  });
};

/** @description 爆破 */
export const getBurstAll = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/biz/burst/all",
    method: "POST",
    data,
  });
  return res.data;
};

/** @description 爆破附件 */
export const getBurstAttachmentAll = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/biz/burst/attachment/all",
    method: "POST",
    data,
  });
  return res.data;
};

/** @description 爆破附件 */
export const burstStepChange = async (id) => {
  const res = await axios({
    url: baseUrl_serve + "/biz/burst/step/change/" + id,
    method: "POST",
  });
  return res.data;
};

/** @description 钻孔 */
export const getDrillAll = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/biz/drilling/plan/information/all",
    method: "POST",
    data,
  });
  return res.data;
};

/** @description 钻孔 */
export const getDrillInfoAll = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/biz/drilling/plan/information/info/all",
    method: "POST",
    data,
  });
  return res.data;
};

/** @description 爆破人员审批表数据 */
export const getBurstReviewAll = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/biz/burst/review/all",
    method: "POST",
    data,
  });
  return res.data;
};

/** @description 爆破作业人员分工管理 */
export const getBurstWorkers = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/biz/burst/workers/all",
    method: "POST",
    data,
  });
  return res.data;
};

/** @description 爆破作业人员分工管理 */
export const getBrustReviewUserListAll = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/biz/burst/review/all",
    method: "POST",
    data,
  });
  return res.data;
};

/** @description 爆破的全部钻孔孔号 */
export const getDrillingHoleNumberAll = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/biz/drilling/scheme/hole/number/all",
    method: "POST",
    data,
  });
  return res.data;
};

//下载
export const fileDownLoad = (id) => {
  return axios({
    responseType: "arraybuffer",
    url: baseUrl_serve + "/biz/file/download/" + id,
    method: "get",
  });
};

// 下载模型文件
export const fileModelDownLoad = (id) => {
  return axios({
    responseType: "arraybuffer",
    url: baseUrl_serve + "/file/model/download/" + id,
    method: "get",
  });
};

// 删除采矿计划模型文件
export async function deleteMiningPlanGeoFile(ids) {
  const res = await axios({
    url: baseUrl_serve + `/biz/mining/plan/file/geo/delete/${ids}`,
    method: "DELETE",
  });
  return res;
}

/** @description 修改爆破时间 */
export const burstDateChange = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/biz/burst/date/change",
    method: "POST",
    data,
  });
  return res.data;
};

/** @description 修改钻孔时间 */
export const drillPlanDateChange = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/biz/drilling/plan/information/date/change",
    method: "POST",
    data,
  });
  return res.data;
};

/** @description 爆破警戒工作分工 */
export const burstAlertPerson = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/biz/burst/alert/personnel/all",
    method: "POST",
    data,
  });
  return res.data;
};

/** @description 重算增减资源储量统计图数据 */
export const annualRecalculateIncreaseDecreaseChart = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/biz/annual/recalculate/increase/decrease/chart",
    method: "GET",
    data,
  });
  return res.data;
};

/** @description 矿田露天勘探资源量统计图数据 */
export const annualMiningFieldSummaryChart = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/biz/annual/mining/field/summary/chart",
    method: "GET",
    data,
  });
  return res.data;
};

/** @description 矿田露天勘探资源量统计图数据 */
export const annualResourcesChart = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/biz/annual/resources/count/resources",
    method: "POST",
    data,
  });
  return res.data;
};

/** @description 煤层保有资源量统计图数据 */
export const coalRetentionChart = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/biz/annual/coal/seam/retention/count",
    method: "POST",
    data,
  });
  return res.data;
};

/** @description 水平保有资源量统计图数据 */
export const levelOwnershipChart = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/biz/annual/level/ownership/level",
    method: "POST",
    data,
  });
  return res.data;
};

/** @description 钻孔交底回执表管理统计数据 */
export const drillReceiptStatic = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/biz/drill/static",
    method: "POST",
    data,
  });
  return res.data;
};

export async function geoPostList(url, data) {
  const res = await axios({
    url: baseUrl_serve + `/biz/${url}`,
    method: "POST",
    data: data,
  });
  return res.data;
}

export async function geoDeleteList(url) {
  const res = await axios({
    url: baseUrl_serve + `/biz/${url}`,
    method: "DELETE",
  });
  return res.data;
}

/** 获取应急物资库数据 */
export async function getAlarmSecurityMaterial(data) {
  const res = await axios({
    url: baseUrl_serve + `/biz/alarm/security/material/all`,
    method: "POST",
    data,
  });
  return res.data;
}

/** 获取应急救援电话数据 */
export async function getAlarmSecurityTel(data) {
  const res = await axios({
    url: baseUrl_serve + `/biz/alarm/security/tel/all`,
    method: "POST",
    data,
  });
  return res.data;
}

/** 获取应急预案数据 */
export async function getAlarmSecurityPlan(data) {
  const res = await axios({
    url: baseUrl_serve + `/biz/alarm/security/plan/all`,
    method: "POST",
    data,
  });
  return res.data;
}

/** 获取穿爆计划钻孔设计上传3ds */
export async function postBlastingPlan3dsFileAll(data) {
  const res = await axios({
    url: baseUrl_serve + `/biz/blasting/plan/drilling/all`,
    method: "POST",
    data,
  });
  return res.data;
}

/** @description 编辑穿爆计划钻孔设计3ds上传列表 */
export const modifyBlastingPlan3dsFile = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/biz/blasting/plan/drilling/modify/" + data.id,
    method: "POST",
    data,
  });
  return res.data;
};

export const genRoadLine = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/biz/line/intersection",
    method: "POST",
    data,
  });
  return res.data;
};

/** 获取采煤计划留言 */
export async function postMiningPlanCommentAll(data) {
  const res = await axios({
    url: baseUrl_serve + `/biz/conference/comment/all`,
    method: "POST",
    data,
  });
  return res.data;
}

/**
 * @description 添加采煤计划留言
 *
 * @param {*} data
 */
export async function addMiningPlanComment(data) {
  const res = await axios({
    url: baseUrl_serve + `/biz/conference/comment/add`,
    method: "POST",
    data,
  });
  return res.data;
}

/**
 * @description 删除采煤计划留言
 *
 * @param {*} data
 */
export async function deleteMiningPlanComment(ids) {
  const res = await axios({
    url: baseUrl_serve + `/biz/conference/comment/delete/${ids}`,
    method: "DELETE",
  });
  return res.data.code;
}

/**
 * @description 4490 4515 坐标互转
 *
 * @param {*} data
 */
export async function convert449024515(data) {
  const res = await axios({
    url: baseUrl_serve + `/gm/slope/equipment/trans/point`,
    method: "POST",
    data,
  });
  return res.data.code;
}

export function downloadFileModelFile(url) {
  return axios({
    url: baseUrl_serve + `/biz/${url}`,
    method: "GET",
    responseType: "arraybuffer",
  });
}

/** @description 获取采煤计划地理文件 */
export const getMiningPlanGeoFileALL = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/biz/mining/plan/file/geo/all",
    method: "POST",
    data,
  });
  return res.data;
};

/** @description 新增采煤计划地理文件 */
export const addMiningPlanGeoFile = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/biz/mining/plan/file/geo/add",
    method: "POST",
    data,
  });
  return res.data;
};

/** @description 模型文件上传 */
export const uploadModelFile = async (file_id) => {
  const formData = new FormData();
  formData.append("file_id", file_id);

  const res = await axios({
    url: baseUrl_serve + "/file/model/upload/1",
    method: "POST",
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

/** @description 文件转换 */
export const convertFile = async (data) => {
  const res = await axios({
    url: baseUrl_serve + `/file/convert/do/` + data.id,
    method: "POST",
    data,
  });
  return res.data;
};

/** @description 获取自定义煤种名称 */
export const getCoalVarietyConfigUserAll = async (data) => {
  const res = await axios({
    url: baseUrl_serve + "/biz/coal/variety/config/user/all",
    method: "POST",
    data,
  });
  return res.data;
};
