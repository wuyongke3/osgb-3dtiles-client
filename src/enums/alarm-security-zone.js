export const ALARM_SECURITY_ZONE = {
  /**
   * @description 使用状态
   */
  STATUS: [
    { value: 1, label: "启用" },
    { value: 2, label: "停用" },
  ],
  /**
   * @description 根据状态字段获取使用状态
   * 1：启用；2：停用；
   *
   * @param {1|2} status
   *
   * @returns {string}
   */
  getStatus(status) {
    return (
      this.STATUS.find((item) => {
        return item.value == status;
      })?.label ?? ""
    );
  },

  /**
   * @description 使用类型
   */
  TYPE: [
    { value: 1, label: "默认" },
    { value: 2, label: "消防" },
    { value: 2, label: "医疗" },
  ],
  /**
   * @description 根据状态字段获取使用类型
   * 1/默认;2/消防;3/医疗;
   *
   * @param {1|2} type
   *
   * @returns {string}
   */
  getType(type) {
    return (
      this.TYPE.find((item) => {
        return item.value == type;
      })?.label ?? ""
    );
  },
};
