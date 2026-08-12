export declare enum USER {
    ALL_USER = "/gm/user/all",
    NEW_USER = "/gm/user/add",
    EDIT_USER = "/gm/user/modify",
    IMPORT_FILE = "/gm/user/import",
    DELETE_USER = "/gm/user/delete",
    LOGIN_LOG = "/gm/user/login/log",
    LOGIN_LOG_INFO = "/gm/user/login/log/info",
    LOGIN_LOG_MONTH = "/gm/user/login/log/month",
    LIST_BY_IDS = "/gm/user/info/all",
    SET_ASSIGNMENT = "/gm/user/assignment",
    LAST_LOGIN_INFO = "/gm/user/latest/login",
    DOWNLOAD_EXAMPLE_FILE = "/gm/user/example",
    RESET_PASSWORD = "/gm/user/password/reset",
    MODIFY_PASSWORD = "/gm/user/password/modify",
    DEPAREMENT = "/gm/user/department",
    INFO = "/gm/user/info",
    LOGOUT = "/gm/auth/logout",
    ROLE = "/gm/user/role",
    /**
     * @description 获取用户积分
     */
    POINT = "gm/user/point",
    /**
     * @description 统计用户登陆天数
     */
    DAY_COUNT = "gm/user/day/count"
}
