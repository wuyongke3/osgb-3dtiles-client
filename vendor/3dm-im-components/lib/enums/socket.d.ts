export declare enum SOCKET_CODE {
    /**
     * @description 协商
     */
    EVENT_UPLOAD_FILE_SLICE_NEGOTIATION = "EventUploadFileSliceNegotiation",
    /**
     * @description 传输
     */
    EVENT_UPLOAD_FILE_SLICE_TRANS = "EventUploadFileSliceTrans",
    /**
     * @description 结束
     */
    EVENT_UPLOAD_FILE_SLICE_FINISH = "EventUploadFileSliceFinish",
    /**
     * @description 验证token通过
     */
    AUTH = "Auth",
    /**
     * @description 心跳
     */
    HEARTBEAT = "Heartbeat",
    /**
     * @description 分组
     */
    GROUP_SEND = "GroupSend",
    /**
     * @description 接收信息提示
     */
    MESSAGE_ALERT = "MessageAlert",
    /**
     * @description 应急救援弹窗
     */
    MESSAGE_ALARM = "MessageAlarm",
    /**
     * @description 应急救援弹窗点击了确定后
     */
    MESSAGE_ALARM_VEHICLE = "MessageAlarmVehicle",
    /**
     * @description 车辆
     */
    VEHICLE_LOCATION_REPORT = "VehicleLocationReport",
    /** 无人驾驶 */
    VEHICLE_LOCATION_AUTO_REPORT = "VehicleLocationAutoReport",
    /** 烽火台车辆位置 */
    VEHICLE_LOCATION_BEACON_TOWER = "VehicleLocationBeaconTower",
    /** 烽火台车辆报警信息 */
    VEHICLE_LOCATION_BEACON_TOWER_ALERT = "VehicleLocationBeaconTowerAlert",
    /** 风险报警预警 */
    MESSAGE_ALARM_WARNING = "MessageAlarmWarning",
    /** 停产撤人 */
    MESSAGE_ALARM_EMERGENCY_WARNING = "MessageAlarmDiscontinuedWarning",
    /** 远程挖机 */
    VEHICLE_LOCATION_REMOTE_DIGGER = "VehicleLocationRemoteDigger",
    /** 人员定位 */
    USER_GPS = "user_gps"
}
/** @description socket的响应状态 */
export declare enum SOCKET_RESPONSE_STATUS {
    /** @description 成功 */
    SUCCESS = 1,
    /** @description 错误 */
    ERROR = 2,
    /** @description 缺少切片 */
    MISSING = 3,
    /** @description 文件已存在 */
    EXIST = 4
}
/** @description 二进制类型消息体 */
export declare enum SOCKET_BINARY_KEYFRAMES {
    /** @description 二进制类型消息体的magic第一位 */
    MAGIC_0X3D = 61,
    /** @description 二进制类型消息体的magic第二位 */
    MAGIC_0X00 = 0,
    /** @description 二进制类型消息体的verson */
    VERSION = 1
}
/** 状态:1/待发送;2/已发送; */
export declare enum SOCKET_MESSAGE_STATUS {
    /** 待发送 */
    READY = 1,
    /** 已发送 */
    SEND = 2
}
/**  通知类型:1/业务通知;2/广播;3/静默; */
export declare enum SOCKET_MESSAGE_TYPE {
    /** 业务通知 */
    BIZ = 1,
    /** 广播 */
    BROADCAST = 2,
    /** 静默 */
    SILENCE = 3
}
/** 通知模块 */
export declare enum SOCKET_MESSAGE_MODULE {
    /** 日常工单 */
    WORK_ORDER = 1,
    /** 专项检查 */
    SAFETY_INSPECTION = 2,
    /** 带班管理 */
    SWITCH_TEAM = 3,
    /** 风险管控 */
    RISK = 4,
    /** 任务工单 */
    TASK_WORK_ORDER = 5,
    COMMENT = 6,
    VISITING = 7,
    SCHEDULING = 8,
    /** 会议 */
    CONFERENCE = 9
}
/** 通知分类 */
export declare enum SOCKET_MESSAGE_CATEGORY {
    WORK_ORDER_CREATE = 1,
    WORK_ORDER_PROCESSING = 2,
    WORK_ORDER_PROCESSED = 3,
    WORK_ORDER_INSPECTED = 4,
    WORK_ORDER_TRANSFER = 5,
    WORK_ORDER_DELAY = 6,
    WORK_ORDER_DELAY_INSPECTED = 7,
    SAFETY_INSPECTION_ACTIVITY_DISPATCH = 8,
    TEAM_SWITCH_SHIFT = 9,
    TEAM_SWITCH_EXCHANGE = 10,
    TEAM_SWITCH_EXCHANGE_CONFIRM = 11,
    RISK_MEASURE_AUDIT = 12,
    RISK_MEASURE_AUDIT_CONFIRM = 13,
    RISK_MEASURE_DISPATCH = 14,
    RISK_MEASURE_DISPATCH_ACCEPT = 15,
    RISK_MEASURE_DISPATCH_REPORT = 16,
    WORK_ORDER_TRANSFER_CONFIRM = 17,
    WORK_ORDER_TIMEOUT = 18,
    SAFETY_INSPECTION_ACTIVITY_ACCEPT = 19,
    TASK_WORK_ORDER_CREATE = 20,
    TASK_WORK_ORDER_PROCESSING = 21,
    TASK_WORK_ORDER_PROCESSED = 22,
    TASK_WORK_ORDER_INSPECTED = 23,
    TASK_WORK_ORDER_TRANSFER = 24,
    TASK_WORK_ORDER_DELAY = 25,
    TASK_WORK_ORDER_DELAY_INSPECTED = 26,
    TASK_WORK_ORDER_TRANSFER_CONFIRM = 27,
    TASK_WORK_ORDER_TIMEOUT = 28,
    TASK_WORK_ORDER_URGE = 29,
    TASK_WORK_ORDER_COMPLETE = 30,
    WORK_ORDER_PENALTY = 31,
    WORK_ORDER_PENALTY_PUNISH = 32,
    COMMENT_WORKORDER = 33,
    COMMENT_TASK_WORK_ORDER = 34,
    TEAM_SWITCH_GO_TO_WORK = 35,
    TEAM_SWITCH_WRITE_WORK_LOG = 36,
    TASK_WORK_ORDER_ACHIEVEMENTS = 37,
    TASK_WORK_ORDER_CREATE_USER = 38,
    TASK_WORK_ORDER_CREATE_JOINT_REVIEW = 39,
    TASK_WORK_ORDER_CREATE_MEETING = 40,
    COMMENT_VISITING = 41,
    COMMENT_VISITING_UPDATE = 43,
    COMMENT_VISITING_TRIP = 42,
    COMMENT_VISITING_TRIP_UPDATE = 44,
    COMMENT_VISITING_TRIP_DELETE = 45,
    TASK_WORK_ORDER_CREATE_NEW_USER = 46,
    WORK_ORDER_CREATE_NEW_USER = 47,
    SCHEDULING_DEPARTMENT = 48,
    SCHEDULING_TURNDOWN = 49,
    CONFERENCE_ADD = 60,
    CONFERENCE_MODIFY = 61,
    CONFERENCE_DEL = 62,
    CONFERENCE_SIGN = 63,
    CONFERENCE_REPLACE_SIGN = 64
}
