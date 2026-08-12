// 前后台共用的固定菜单（仿 bs 端，不请求接口）
// 结构对齐 3dm-im-components 的 ISystemDataItem
export const systemData = [
  {
    id: 1,
    name: "批次管理",
    hasChildren: false,
    port: "batch",
    icon: "",
    to: "",
    children: [],
  },
  {
    id: 2,
    name: "矿山云平台",
    hasChildren: false,
    port: "mine",
    icon: "",
    to: "",
    children: [],
  },
];

// MyNavigate 菜单点击映射：key 为一级菜单 port，value 为跳转地址
export const systemToMap = new Map([
  ["batch", "#/admin"],
  ["mine", "#/front"],
]);

// 默认项目（矿区）
export const defaultProjectList = [
  { id: 1, name: "北京三地曼", logo_url: "#", checked: false },
];
