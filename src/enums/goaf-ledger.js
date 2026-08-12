export const GOAF_LEDGER = {
  /**
   * @description 类型
   */
  TYPE: [
    { value: 1, label: "一般采空" },
    { value: 2, label: "已处理采空" },
    { value: 3, label: "重点关注" },
    { value: 4, label: "极度危险" },
  ],
  /**
   * @description 根据状态字段获取类型
   *
   * @param {1|2|3|4} type 1：一般采空;2：已处理采空;3：重点关注;4：极度危险;
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
