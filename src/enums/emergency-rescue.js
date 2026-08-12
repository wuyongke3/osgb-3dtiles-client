export const EMERGENCY_RESCUE = {
  /**
   * @description 应急救援报警信息状态
   */
  ALARM_STATUS: [
    { value: 1, label: "报警待确认" },//黄
    { value: 2, label: "确认报警" },//红
    { value: 3, label: "忽略报警" },//灰色
    { value: 4, label: "报警结束" },//绿
  ],
  /**
   * @description 根据状态字段获取应急救援报警信息状态
   * 1：报警待确认；2：确认报警；3：忽略报警；4：报警结束；
   *
   * @param {1|2|3|4} status
   *
   * @returns {string}
   */
  getAlarmStatus(status) {
    return (
      this.ALARM_STATUS.find((item) => {
        return item.value == status;
      })?.label ?? ""
    );
  },

  /**
   * @description 应急救援报警信息状态
   */
  ALARM_TYPE: [
    { value: 1, label: "边坡事故" },
    { value: 2, label: "爆炸事故" },
    { value: 3, label: "采空区事故" },
    { value: 4, label: "火灾事故" },
    { value: 5, label: "水灾事故" },
    { value: 6, label: "车辆运输事故" },
    { value: 7, label: "极端天气事故" },
  ],
  /**
   * @description 根据状态字段获取应急救援报警信息状态
   * 1：边坡事故；2：爆炸事故；3：采空区事故；4：火灾事故；5：水灾事故；6：车辆运输事故；7：极端天气事故；
   *
   * @param {1|2|3|4|5|6|7} type
   *
   * @returns {string}
   */
  getAlarmType(type) {
    return (
      this.ALARM_TYPE.find((item) => {
        return item.value == type;
      })?.label ?? ""
    );
  },
};
