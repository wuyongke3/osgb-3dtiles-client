export declare enum FILE_RELATED {
    _1KB = 1024,
    /**
     * @description 1024 * 1024
     */
    _1MB = 1048576,
    _10MB = 10485760,
    _16MB = 16777216,
    /**
     * @description 1024 * 1024 * 1024
     */
    _1GB = 1073741824,
    _2GB = 2147483648,
    _100GB = 107374182400,
    /**
     * @description 1024 * 1024 * 1024 * 1024
     */
    _1TB = 1099511627776
}
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
    VEHICLE_LOCATION_REPORT = "VehicleLocationReport"
}
export declare enum SOURCE {
    /** 大文件上传在message传递时的来源枚举 */
    _3DM_BIG_FILE_UPLOAD = "_3dm_bil_file_upload"
}
