export declare enum ROUTER {
    /**
     * @description url中自定义的路径与参数之间的分隔符
     */
    URL_PARAM_DELIMITER = "_p_3dmine_p_",
    ROOT_PATH = "/",
    ROOT_NAME = "/",
    LOGIN_PATH = "/login",
    LOGIN_NAME = "login",
    LOGIN_REDIRECT = "/login?redirect=",
    LAYOUT_NAME = "layout",
    LAYOUT_PATH = "/layout",
    PATH_MATCH = "/:pathMatch(.*)",
    /**
     * @description 模型数据管理的项目页面
     */
    PROJECT_PATH = "/layout/model_data/project",
    /**
     * @description 模型数据管理的拷贝模型文件页面
     */
    COPY_MODEL_PATH = "/layout/model_data/copy_model",
    /**
     * @description 模型数据管理的模型文件转换页面
     */
    FILE_CONVERT_PATH = "/layout/model_data/file_convert",
    /**
     * @description 临时跳转的页面路径，什么都不显示
     */
    TRANSIT_PAGE_PATH = "/transit_page",
    TRANSIT_PAGE_NAME = "transit_page",
    /**
     * @description 伊泰伊犁煤矿模型数据的url，用来存放项目
     */
    YI_TAI_YI_LI_PATH = "/layout/yi_tai_yi_li",
    /**
     * @description 模型数据管理这一级别的菜单路径，
     * 用来拿到下面的所有菜单项添加到项目菜单上面
     */
    MODAL_MENU_PATH = "/layout/model_data"
}
export declare const LOGIN_URL = "";
