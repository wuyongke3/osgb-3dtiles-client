import { defineStore } from "pinia";
import { PAGE_CONFIG } from "@/config";
import { localCache, sessionCache } from "@/utils";
import { SETTING } from "@/enums";

export const useCommandStore = defineStore("command", {
  state: () => {
    const data = {
      menuClick: null,
      fullScreen: null,
      backScreen: null,
    };
    return data;
  },
});

export const useDialogStore = defineStore("dialog", {
  state: () => {
    const data = {
      dialogTripsShow: false,
      viewsEdit: false,
      viewsInput: false,
      viewsList: [],

      dialogShowVideoTitle: "",
      dialogShowVideo: false,
      dialogShowVideoObj: null,
      dialogShowVideoElment: false,

      /** 防灭火页面弹窗 */
      dialogShowVideoTitle_fmh: "",
      dialogShowVideo_fmh: false,
      dialogShowVideoObj_fmh: null,
      dialogShowVideoElment_fmh: false,

      //设置显示
      dialogConfigFormShow: false,
      dialogConfigFixedsMenus: [],
      dialogConfigUploadMenus: [],
      dialogConfig3dsToLMenus: [],

      // 煤质入口弹窗显示
      dialogCoalEntrance: false,

      dialogConfigLegends: {
        fixeds: [],
        upload: [],
        sdsToL: [],
      },

      currentMenuNow: null,

      activeMu: "生产调度",
      activeMuu: "生产态势",

      dialogVoiceHelperShow: false,
      //全局命令
      menuClick: null,

      startLoadingDrill: false,
      startLoadingBlock: false,

      dialogOrderDetail: false,
      dialogOrderDetailFullscreen: false,
      dialogTaskDetail: false,
      dialogTaskDetailFullscreen: false,
      //云台
      dialogGimbal: false,
      //聚合列表
      dialogClusters: false,
      clustersList: [],
    };
    return data;
  },
  actions: {
    setDialogGimbal(flag) {
      this.dialogGimbal = flag;
    },
    getDialogGimbal() {
      return this.dialogGimbal;
    },
  },
});

export const useFileStore = defineStore("files", {
  state: () => {
    const data = {
      modelsList: [],
      dataTree: [],
      modelTreeRef: null,
    };
    return data;
  },
});

export const useGlobalStore = defineStore("global", {
  state: () => {
    const data = {
      /** 风险预警弹窗等级配置 */
      warnSetting: localCache.getCache("warnSetting")
        ? JSON.parse(localCache.getCache("warnSetting"))
        : [],
      alarmSetting: localCache.getCache("alarmSetting")
        ? JSON.parse(localCache.getCache("alarmSetting"))
        : [],
      currentUser: {},
      /** 天气情况 */
      weather: {},
      /** 三防车辆列表 */
      vehicleBeaconTowerList: [],
      /** 围栏报警中进入区域的人员信息 */
      fenceAlarmPerson: [],
      /** @description 根据菜单展开收起控制侧边栏是否隐藏 */
      collapseMenu: true,
      modalMenuMap: new Map(),
      /** @description 是否是真实车辆 */
      // isRealTruck: sessionCache.getCache(SETTING.REAL_TRUCKS_OPEN_KEY),
      isRealTruck: 1,
      /** @description 是否不再更新车辆位置 */
      isRealTruckStatic: false,
      /** @description 当前应急救援弹窗是否在展示 */
      isEmergencyRescueDialogStatus: false,
      currentBottomIndex: "",
      vehicles: [],
      vehiclesTianQin: [],
      vehiclesDriverLess: [],
      reSaveShow: false,
      legendsShow: true,
      dialogDrill: {
        show: false,
        data: null,
      },

      layerShows: new Map(),
      camerasData: [], //重点视频列表
      camerasDataLeft: [],
      camerasMap: new Map(), //控制视频列表
      videosMap: new Map(), //首页视频列表

      // 防灭火左侧（红外）视频监控
      hwCams: [],
      hwCamsHW: [], // 红外摄像头视频流
      hwCamsHWMap: new Map(), // 红外摄像头对应的原画视频流

      //配置项
      configs: {
        version: 20240911,
        underground: {},
        videos: [],
        legends: {},
      },

      //钻孔数据
      totalDrills: 0,
      drillList: [],
      drillListNoZeros: [],
      drillPageList: [],
      pageConditionDrill: [4, 5, 6, 7],
      startLoadingDrill: false,
      showAllDrills: false,
      //块体
      totalBlocks: 0,
      blockList: [],
      blockListNoZeros: [],
      blockPageList: [],
      pageConditionBlock: [4, 5, 6, 7],
      startLoadingBlock: false,
      showAllBlocks: false,
      /** 统计人车数据 */
      countTotal: {},
    };
    PAGE_CONFIG.forEach((item) => {
      data.layerShows.set(item.key, false);

      //配置图例显示管理
      data[`layerBtnsData_${item.key}`] = [];
      data[`layerBtnsData_${item.key}_sliders`] = [];
    });

    return data;
  },
  getters: {
    gdouble: (state) => state.count * 2,
    currentUserId() {
      return this.currentUser.id;
    },

    getHwCameraList() {
      return this.camerasDataLeft;
    },
  },
  actions: {
    vehiclesDelt() {
      this.vehicles.length = 0;
    },

    /** @description 设置模型数据管理下拉框选择需要的对应map */
    setModalMenuMap(modalMenuMap) {
      this.modalMenuMap = modalMenuMap;
    },
  },
});
