import { getProjectList } from "@/api";
import { OBJDeepClone } from ".";
import { ROUTER } from "@/enums";
import { useGlobalStore } from "@/stores/global";

/**
 * @description 映射模型数据管理的时候的菜单
 * 因为要求项目在菜单上面，并且模型数据管理的菜单以后不变了，
 * 所以这里直接写死项目添加到菜单上面
 *
 * @param menus 模型数据管理菜单
 */
export async function mapModelMenu(menus, path = ROUTER.MODAL_MENU_PATH) {
  return;
  await addMenuToProjectMenu(menus, path);

  // 找到模型数据管理的这一级菜单
  const modalMenu = getModalMenu(menus, path);

  modalMenu.children = [];
}

/**
 * @description 将每一项菜单分别添加到所有的项目菜单下面
 */
async function addMenuToProjectMenu(menus, path = ROUTER.MODAL_MENU_PATH) {
  const modalMenu = OBJDeepClone(getModalMenu(menus, path)?.children) ?? [];

  const project_menu_map = new Map();

  const projectList = await getProjectList({ limit: 9999999 });
  const _projectList = projectList.data.data.list;

  _projectList.forEach((project) => {
    // 注意这里采用深拷贝
    const cloneModalMenu = OBJDeepClone(modalMenu);
    modalMenuSetQueryParam(project.id, cloneModalMenu);

    project_menu_map.set(project.id, cloneModalMenu);
  });
  const globalStore = useGlobalStore();
  globalStore.setModalMenuMap(project_menu_map);
}

/**
 * @description 将每一项的项目下面的菜单路径都添加上参数
 * @param project_menu_path
 * @param modalMenus
 */
function modalMenuSetQueryParam(project_id, modalMenus) {
  modalMenus.forEach((menu) => {
    // name不同是为了添加动态路由，router是以name为条件添加，name重复会被覆盖
    menu.name += project_id;

    // 携带点击时的参数
    menu.url_param = `project_id=${project_id}`;

    // path不同是为了区分跳转的页面
    // 这里采用自定义的分隔符而不是浏览器默认的 ? 分隔符，
    // 是因为用 ？ 的话会有页面刷新后携带的url参数丢失的问题
    menu.path += ROUTER.URL_PARAM_DELIMITER + menu.url_param;
  });
}

/**
 * @description 设置模型数据管理下面的菜单项到底是哪个项目的
 *
 * @param modalMenu
 * @param childrenMenus
 */
export function setModalChildrenMenu(modalMenu, childrenMenus) {
  modalMenu.children = childrenMenus;
}

/**
 * @description 递归获取模型数据管理这一级别的菜单项
 *
 * @param menus
 * @returns
 */
export function getModalMenu(menus, path = ROUTER.MODAL_MENU_PATH) {
  let modalMenu;
  function recursion(menus) {
    menus.forEach((menu) => {
      if (menu.path === path) {
        // 将数据模型管理下面的菜单项保存一下
        return (modalMenu = menu);
        // 删除模型数据管理
        // menus.splice(index, 1);
      }

      if (menu.children?.length) {
        recursion(menu.children);
      }
    });
  }

  recursion(menus);

  // 找到模型数据管理下面的所有菜单项
  return modalMenu;
}
