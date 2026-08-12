import { default as MyLayoutHeader } from './layout-header';
import { default as MySvgIcon } from './svg-icon';
import { default as MyModifyPassword } from './modify-password';
import { default as MyPageModal } from './page-modal';
import { default as MyPageModalDialog } from './page-modal-dialog';
import { default as MyPageSearch } from './page-search';
import { default as MyPageContent } from './page-content';
import { default as MyBigFileUpload } from './big-file-upload';
import { default as Myprogress } from './progress';
import { default as MyNotFound } from './not-found';
import { default as MyUpload } from './upload';
import { default as MyPageTreeCard } from './page-tree-card';
import { VideoCom as MyVideoCom, ImageCom as MyImageCom, AudioCom as MyAudioCom } from './attchment';
import { default as MyCarousel } from './carousel';
import { default as MyMediumCarousel } from './medium-carousel';
import { default as MySearchTimer } from './search-timer';
import { default as MyEnableOrDisableBtn } from './enable-or-disable-btn';
import { default as MyNavigate } from './navigate';
import { default as MyChooseRole } from './choose-role';
import { default as UserinfoDrop } from './userinfo-drop';
import { default as MyAudioPlayer } from './audio-player';
import { default as MyDepartmentSelect } from './department-select';
import { default as MyUserSelect } from './user-select';

declare const _default: (import('vue').DefineComponent<import('vue').ExtractPropTypes<{
    url: {
        type: import('vue').PropType<string>;
        required: true;
    };
    width: {
        type: import('vue').PropType<string>;
        required: true;
        default: string;
    };
}>, {}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {}, string, import('vue').PublicProps, Readonly<import('vue').ExtractPropTypes<{
    url: {
        type: import('vue').PropType<string>;
        required: true;
    };
    width: {
        type: import('vue').PropType<string>;
        required: true;
        default: string;
    };
}>> & Readonly<{}>, {
    width: string;
}, {}, {}, {}, string, import('vue').ComponentProvideOptions, true, {}, any> | import('vue').DefineComponent<import('vue').ExtractPropTypes<{
    width: {
        type: import('vue').PropType<string>;
        default: string;
    };
    urlArr: {
        type: import('vue').PropType<string[]>;
    };
    height: {
        type: import('vue').PropType<string>;
        default: string;
    };
    maxHeight: {
        type: import('vue').PropType<string>;
        default: string;
    };
    fit: {
        type: import('vue').PropType<any>;
        default: string;
    };
}>, {}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {}, string, import('vue').PublicProps, Readonly<import('vue').ExtractPropTypes<{
    width: {
        type: import('vue').PropType<string>;
        default: string;
    };
    urlArr: {
        type: import('vue').PropType<string[]>;
    };
    height: {
        type: import('vue').PropType<string>;
        default: string;
    };
    maxHeight: {
        type: import('vue').PropType<string>;
        default: string;
    };
    fit: {
        type: import('vue').PropType<any>;
        default: string;
    };
}>> & Readonly<{}>, {
    width: string;
    height: string;
    maxHeight: string;
    fit: any;
}, {}, {}, {}, string, import('vue').ComponentProvideOptions, true, {}, any> | import('vue').DefineComponent<import('vue').ExtractPropTypes<{
    url: {
        type: import('vue').PropType<string>;
    };
    width: {
        type: import('vue').PropType<string>;
        default: string;
    };
    height: {
        type: import('vue').PropType<string>;
        default: string;
    };
    maxHeight: {
        type: import('vue').PropType<string>;
        default: string;
    };
}>, {}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {}, string, import('vue').PublicProps, Readonly<import('vue').ExtractPropTypes<{
    url: {
        type: import('vue').PropType<string>;
    };
    width: {
        type: import('vue').PropType<string>;
        default: string;
    };
    height: {
        type: import('vue').PropType<string>;
        default: string;
    };
    maxHeight: {
        type: import('vue').PropType<string>;
        default: string;
    };
}>> & Readonly<{}>, {
    width: string;
    height: string;
    maxHeight: string;
}, {}, {}, {}, string, import('vue').ComponentProvideOptions, true, {}, any> | import('vue').DefineComponent<import('vue').ExtractPropTypes<{
    src: {
        type: import('vue').PropType<string>;
        required: true;
    };
}>, {}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {}, string, import('vue').PublicProps, Readonly<import('vue').ExtractPropTypes<{
    src: {
        type: import('vue').PropType<string>;
        required: true;
    };
}>> & Readonly<{}>, {}, {}, {}, {}, string, import('vue').ComponentProvideOptions, true, {}, any> | ({
    new (...args: any[]): import('vue').CreateComponentPublicInstanceWithMixins<Readonly<import('vue').ExtractPropTypes<{
        data: {
            type: import('vue').PropType<any>;
            required: true;
        };
    }>> & Readonly<{}>, {}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {}, import('vue').PublicProps, {}, true, {}, {}, import('vue').GlobalComponents, import('vue').GlobalDirectives, string, {}, any, import('vue').ComponentProvideOptions, {
        P: {};
        B: {};
        D: {};
        C: {};
        M: {};
        Defaults: {};
    }, Readonly<import('vue').ExtractPropTypes<{
        data: {
            type: import('vue').PropType<any>;
            required: true;
        };
    }>> & Readonly<{}>, {}, {}, {}, {}, {}>;
    __isFragment?: undefined;
    __isTeleport?: undefined;
    __isSuspense?: undefined;
} & import('vue').ComponentOptionsBase<Readonly<import('vue').ExtractPropTypes<{
    data: {
        type: import('vue').PropType<any>;
        required: true;
    };
}>> & Readonly<{}>, {}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {}, string, {}, {}, string, {}, import('vue').GlobalComponents, import('vue').GlobalDirectives, string, import('vue').ComponentProvideOptions> & import('vue').VNodeProps & import('vue').AllowedComponentProps & import('vue').ComponentCustomProps & (new () => {
    $slots: {
        "handle-info"?(_: {
            click: (urlArr: string[]) => void;
            data: any;
        }): any;
        default?(_: {
            data: any;
        }): any;
    };
})) | import('vue').DefineComponent<import('vue').ExtractPropTypes<{
    username: {
        type: import('vue').PropType<string>;
        required: true;
    };
}>, {
    showDialog: () => void;
}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {
    resetPassword: (formData: import('../types').IUserModifyPassword) => void;
}, string, import('vue').PublicProps, Readonly<import('vue').ExtractPropTypes<{
    username: {
        type: import('vue').PropType<string>;
        required: true;
    };
}>> & Readonly<{
    onResetPassword?: ((formData: import('../types').IUserModifyPassword) => any) | undefined;
}>, {}, {}, {}, {}, string, import('vue').ComponentProvideOptions, true, {}, any> | import('vue').DefineComponent<import('vue').ExtractPropTypes<{
    userBgUrl: {
        type: import('vue').PropType<string>;
        default: any;
    };
    userInfo: {
        type: import('vue').PropType<import('../types').IUser>;
        required: true;
    };
}>, {}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {
    resetPassword: (val: import('../types').IUserModifyPassword) => void;
    logout: () => void;
    handleClick: (infoData: any, props: import('..').modalPropsType, callBack: (code: import('../enums').RESPONSE_CODE) => void) => void;
}, string, import('vue').PublicProps, Readonly<import('vue').ExtractPropTypes<{
    userBgUrl: {
        type: import('vue').PropType<string>;
        default: any;
    };
    userInfo: {
        type: import('vue').PropType<import('../types').IUser>;
        required: true;
    };
}>> & Readonly<{
    onResetPassword?: ((val: import('../types').IUserModifyPassword) => any) | undefined;
    onLogout?: (() => any) | undefined;
    onHandleClick?: ((infoData: any, props: import('..').modalPropsType, callBack: (code: import('../enums').RESPONSE_CODE) => void) => any) | undefined;
}>, {
    userBgUrl: string;
}, {}, {}, {}, string, import('vue').ComponentProvideOptions, true, {}, any> | import('vue').DefineComponent<import('vue').ExtractPropTypes<{
    userBgUrl: {
        type: import('vue').PropType<string>;
        required: true;
        default: any;
    };
    userInfo: {
        type: import('vue').PropType<import('../types').IUser>;
        required: true;
    };
    breadcrumbs: {
        type: import('vue').PropType<any[]>;
        required: true;
    };
}>, {}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {
    resetPassword: (...args: any[]) => void;
    logout: (...args: any[]) => void;
    handleClick: (...args: any[]) => void;
    switchRole: (...args: any[]) => void;
    collapseChange: (...args: any[]) => void;
}, string, import('vue').PublicProps, Readonly<import('vue').ExtractPropTypes<{
    userBgUrl: {
        type: import('vue').PropType<string>;
        required: true;
        default: any;
    };
    userInfo: {
        type: import('vue').PropType<import('../types').IUser>;
        required: true;
    };
    breadcrumbs: {
        type: import('vue').PropType<any[]>;
        required: true;
    };
}>> & Readonly<{
    onResetPassword?: ((...args: any[]) => any) | undefined;
    onLogout?: ((...args: any[]) => any) | undefined;
    onHandleClick?: ((...args: any[]) => any) | undefined;
    onSwitchRole?: ((...args: any[]) => any) | undefined;
    onCollapseChange?: ((...args: any[]) => any) | undefined;
}>, {
    userBgUrl: string;
}, {}, {}, {}, string, import('vue').ComponentProvideOptions, true, {}, any> | import('vue').DefineComponent<import('vue').ExtractPropTypes<{
    name: {
        type: StringConstructor;
        required: true;
    };
    width: {
        type: NumberConstructor;
        default: number;
    };
    height: {
        type: NumberConstructor;
        default: number;
    };
    fill: {
        type: StringConstructor;
        default: string;
    };
    title: {
        type: StringConstructor;
        default: string;
    };
}>, {}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {}, string, import('vue').PublicProps, Readonly<import('vue').ExtractPropTypes<{
    name: {
        type: StringConstructor;
        required: true;
    };
    width: {
        type: NumberConstructor;
        default: number;
    };
    height: {
        type: NumberConstructor;
        default: number;
    };
    fill: {
        type: StringConstructor;
        default: string;
    };
    title: {
        type: StringConstructor;
        default: string;
    };
}>> & Readonly<{}>, {
    width: number;
    fill: string;
    title: string;
    height: number;
}, {}, {}, {}, string, import('vue').ComponentProvideOptions, true, {}, any> | import('vue').DefineComponent<import('vue').ExtractPropTypes<{
    timeField: {
        type: import('vue').PropType<string>;
        required: true;
    };
    type: {
        type: import('vue').PropType<import('element-plus/es/utils/vue/props/types.mjs').EpPropMergeType<(new (...args: any[]) => "date" | "month" | "week" | "year" | "months" | "years" | "dates" | "datetime" | "datetimerange" | "daterange" | "monthrange" | "yearrange") | (() => import('element-plus/es/components/date-picker-panel/src/types.mjs').DatePickerType) | ((new (...args: any[]) => "date" | "month" | "week" | "year" | "months" | "years" | "dates" | "datetime" | "datetimerange" | "daterange" | "monthrange" | "yearrange") | (() => import('element-plus/es/components/date-picker-panel/src/types.mjs').DatePickerType) | null)[], unknown, unknown>>;
        required: true;
    };
    datePickerBind: {
        type: import('vue').PropType<import('element-plus/es/components/date-picker/src/props.mjs').DatePickerProps>;
    };
}>, {
    reset: () => void;
}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {
    change: (...args: any[]) => void;
}, string, import('vue').PublicProps, Readonly<import('vue').ExtractPropTypes<{
    timeField: {
        type: import('vue').PropType<string>;
        required: true;
    };
    type: {
        type: import('vue').PropType<import('element-plus/es/utils/vue/props/types.mjs').EpPropMergeType<(new (...args: any[]) => "date" | "month" | "week" | "year" | "months" | "years" | "dates" | "datetime" | "datetimerange" | "daterange" | "monthrange" | "yearrange") | (() => import('element-plus/es/components/date-picker-panel/src/types.mjs').DatePickerType) | ((new (...args: any[]) => "date" | "month" | "week" | "year" | "months" | "years" | "dates" | "datetime" | "datetimerange" | "daterange" | "monthrange" | "yearrange") | (() => import('element-plus/es/components/date-picker-panel/src/types.mjs').DatePickerType) | null)[], unknown, unknown>>;
        required: true;
    };
    datePickerBind: {
        type: import('vue').PropType<import('element-plus/es/components/date-picker/src/props.mjs').DatePickerProps>;
    };
}>> & Readonly<{
    onChange?: ((...args: any[]) => any) | undefined;
}>, {}, {}, {}, {}, string, import('vue').ComponentProvideOptions, true, {}, any> | ({
    new (...args: any[]): import('vue').CreateComponentPublicInstanceWithMixins<Readonly<import('vue').ExtractPropTypes<{
        searchConfig: {
            type: import('vue').PropType<{
                labelWidth?: string | undefined;
                formItems: any[];
            }>;
            required: true;
        };
        pageStore: {
            type: import('vue').PropType<any>;
            required: true;
        };
    }>> & Readonly<{
        onQueryClick?: ((...args: any[]) => any) | undefined;
        onResetClick?: ((...args: any[]) => any) | undefined;
    }>, {
        searchForm: any;
        resetField: () => void;
    }, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {
        queryClick: (...args: any[]) => void;
        resetClick: (...args: any[]) => void;
    }, import('vue').PublicProps, {}, true, {}, {}, import('vue').GlobalComponents, import('vue').GlobalDirectives, string, {}, any, import('vue').ComponentProvideOptions, {
        P: {};
        B: {};
        D: {};
        C: {};
        M: {};
        Defaults: {};
    }, Readonly<import('vue').ExtractPropTypes<{
        searchConfig: {
            type: import('vue').PropType<{
                labelWidth?: string | undefined;
                formItems: any[];
            }>;
            required: true;
        };
        pageStore: {
            type: import('vue').PropType<any>;
            required: true;
        };
    }>> & Readonly<{
        onQueryClick?: ((...args: any[]) => any) | undefined;
        onResetClick?: ((...args: any[]) => any) | undefined;
    }>, {
        searchForm: any;
        resetField: () => void;
    }, {}, {}, {}, {}>;
    __isFragment?: undefined;
    __isTeleport?: undefined;
    __isSuspense?: undefined;
} & import('vue').ComponentOptionsBase<Readonly<import('vue').ExtractPropTypes<{
    searchConfig: {
        type: import('vue').PropType<{
            labelWidth?: string | undefined;
            formItems: any[];
        }>;
        required: true;
    };
    pageStore: {
        type: import('vue').PropType<any>;
        required: true;
    };
}>> & Readonly<{
    onQueryClick?: ((...args: any[]) => any) | undefined;
    onResetClick?: ((...args: any[]) => any) | undefined;
}>, {
    searchForm: any;
    resetField: () => void;
}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {
    queryClick: (...args: any[]) => void;
    resetClick: (...args: any[]) => void;
}, string, {}, {}, string, {}, import('vue').GlobalComponents, import('vue').GlobalDirectives, string, import('vue').ComponentProvideOptions> & import('vue').VNodeProps & import('vue').AllowedComponentProps & import('vue').ComponentCustomProps & (new () => {
    $slots: Partial<Record<any, (_: {
        data: any;
        prop: any;
    }) => any>>;
})) | ({
    new (...args: any[]): import('vue').CreateComponentPublicInstanceWithMixins<Readonly<import('vue').ExtractPropTypes<{
        pageStore: {
            type: import('vue').PropType<any>;
            required: true;
        };
        defaultExpandAll: {
            type: import('vue').PropType<boolean>;
            default: boolean;
        };
        treeData: {
            type: import('vue').PropType<any>;
        };
        treeProps: {
            type: import('vue').PropType<Partial<Omit<import('element-plus/es/components/tree/src/tree.type.mjs').TreeComponentProps, "data" | "defaultExpandAll" | "highlightCurrent">>>;
        };
        columnEmpty: {
            type: import('vue').PropType<any>;
        };
        isComponent: {
            type: import('vue').PropType<boolean>;
        };
        isHasComHandleRow: {
            type: import('vue').PropType<boolean>;
        };
        contentConfig: {
            type: import('vue').PropType<{
                key: string;
                titleBtn: {
                    left?: any[] | undefined;
                    right?: any[] | undefined;
                };
                url: {
                    listUrl: string;
                    deleteUrl?: string | undefined;
                };
                propsList: any[];
                childrenTree?: any;
            }>;
            required: true;
        };
        isMultipleChoice: {
            type: import('vue').PropType<boolean>;
        };
        isHasTree: {
            type: import('vue').PropType<boolean>;
        };
        isHasTableColumn: {
            type: import('vue').PropType<boolean>;
        };
        listQuery: {
            type: import('vue').PropType<any>;
        };
        result: {
            type: import('vue').PropType<{
                lists: any[];
                totals: number;
            }>;
        };
        highestPriorityQueryInfo: {
            type: import('vue').PropType<any>;
        };
        showPagination: {
            type: import('vue').PropType<boolean>;
            default: boolean;
        };
        tableBind: {
            type: import('vue').PropType<Partial<import('element-plus/es/components/table/src/table/defaults.mjs').TableProps<any>>>;
        };
        paginationBind: {
            type: import('vue').PropType<any>;
        };
        delimiterSymbol: {
            type: import('vue').PropType<string>;
            required: true;
            default: import('../enums').ROUTER;
        };
        defaultSort: {
            type: import('vue').PropType<import('element-plus/es/components/table/src/table/defaults.mjs').Sort>;
        };
        isNeedPost: {
            type: import('vue').PropType<boolean>;
            default: boolean;
        };
        paginationLayout: {
            type: import('vue').PropType<string>;
            default: string;
        };
        spanMethods: {
            type: import('vue').PropType<(data: any) => void>;
        };
        deleteMethodsAfter: {
            type: import('vue').PropType<(data: any, code: import('../enums').RESPONSE_CODE) => void>;
        };
    }>> & Readonly<{
        onPostAfter?: ((...args: any[]) => any) | undefined;
        onHandleNodeClick?: ((...args: any[]) => any) | undefined;
        onHandleEvent?: ((...args: any[]) => any) | undefined;
        onNewClick?: ((...args: any[]) => any) | undefined;
        onEditClick?: ((...args: any[]) => any) | undefined;
        onTitleEvent?: ((...args: any[]) => any) | undefined;
        onPageChange?: ((...args: any[]) => any) | undefined;
        onPageRenderAfter?: ((...args: any[]) => any) | undefined;
        onHandleQuery?: ((...args: any[]) => any) | undefined;
    }>, {
        list: import('vue').Ref<any[], any[]>;
        pageInfo: {
            limit: number;
            page: number;
        };
        setTableList: (lists: any[]) => void;
        getTableList: () => any[];
        featchPageListData: (formData?: any, isClearSort?: boolean) => void;
        getSelectionRows: <T = any>() => T[];
        toggleRowSelection: (highLightSelection?: number[], selected?: boolean) => void;
        getCurrent: () => {
            currentPage: number;
            pageSize: number;
        };
        setCurrent: (current_page: any, page_size: any) => void;
    }, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {
        postAfter: (...args: any[]) => void;
        handleNodeClick: (...args: any[]) => void;
        handleEvent: (...args: any[]) => void;
        newClick: (...args: any[]) => void;
        editClick: (...args: any[]) => void;
        titleEvent: (...args: any[]) => void;
        pageChange: (...args: any[]) => void;
        pageRenderAfter: (...args: any[]) => void;
        handleQuery: (...args: any[]) => void;
    }, import('vue').PublicProps, {
        defaultExpandAll: boolean;
        showPagination: boolean;
        delimiterSymbol: string;
        isNeedPost: boolean;
        paginationLayout: string;
    }, true, {}, {}, import('vue').GlobalComponents, import('vue').GlobalDirectives, string, {}, any, import('vue').ComponentProvideOptions, {
        P: {};
        B: {};
        D: {};
        C: {};
        M: {};
        Defaults: {};
    }, Readonly<import('vue').ExtractPropTypes<{
        pageStore: {
            type: import('vue').PropType<any>;
            required: true;
        };
        defaultExpandAll: {
            type: import('vue').PropType<boolean>;
            default: boolean;
        };
        treeData: {
            type: import('vue').PropType<any>;
        };
        treeProps: {
            type: import('vue').PropType<Partial<Omit<import('element-plus/es/components/tree/src/tree.type.mjs').TreeComponentProps, "data" | "defaultExpandAll" | "highlightCurrent">>>;
        };
        columnEmpty: {
            type: import('vue').PropType<any>;
        };
        isComponent: {
            type: import('vue').PropType<boolean>;
        };
        isHasComHandleRow: {
            type: import('vue').PropType<boolean>;
        };
        contentConfig: {
            type: import('vue').PropType<{
                key: string;
                titleBtn: {
                    left?: any[] | undefined;
                    right?: any[] | undefined;
                };
                url: {
                    listUrl: string;
                    deleteUrl?: string | undefined;
                };
                propsList: any[];
                childrenTree?: any;
            }>;
            required: true;
        };
        isMultipleChoice: {
            type: import('vue').PropType<boolean>;
        };
        isHasTree: {
            type: import('vue').PropType<boolean>;
        };
        isHasTableColumn: {
            type: import('vue').PropType<boolean>;
        };
        listQuery: {
            type: import('vue').PropType<any>;
        };
        result: {
            type: import('vue').PropType<{
                lists: any[];
                totals: number;
            }>;
        };
        highestPriorityQueryInfo: {
            type: import('vue').PropType<any>;
        };
        showPagination: {
            type: import('vue').PropType<boolean>;
            default: boolean;
        };
        tableBind: {
            type: import('vue').PropType<Partial<import('element-plus/es/components/table/src/table/defaults.mjs').TableProps<any>>>;
        };
        paginationBind: {
            type: import('vue').PropType<any>;
        };
        delimiterSymbol: {
            type: import('vue').PropType<string>;
            required: true;
            default: import('../enums').ROUTER;
        };
        defaultSort: {
            type: import('vue').PropType<import('element-plus/es/components/table/src/table/defaults.mjs').Sort>;
        };
        isNeedPost: {
            type: import('vue').PropType<boolean>;
            default: boolean;
        };
        paginationLayout: {
            type: import('vue').PropType<string>;
            default: string;
        };
        spanMethods: {
            type: import('vue').PropType<(data: any) => void>;
        };
        deleteMethodsAfter: {
            type: import('vue').PropType<(data: any, code: import('../enums').RESPONSE_CODE) => void>;
        };
    }>> & Readonly<{
        onPostAfter?: ((...args: any[]) => any) | undefined;
        onHandleNodeClick?: ((...args: any[]) => any) | undefined;
        onHandleEvent?: ((...args: any[]) => any) | undefined;
        onNewClick?: ((...args: any[]) => any) | undefined;
        onEditClick?: ((...args: any[]) => any) | undefined;
        onTitleEvent?: ((...args: any[]) => any) | undefined;
        onPageChange?: ((...args: any[]) => any) | undefined;
        onPageRenderAfter?: ((...args: any[]) => any) | undefined;
        onHandleQuery?: ((...args: any[]) => any) | undefined;
    }>, {
        list: import('vue').Ref<any[], any[]>;
        pageInfo: {
            limit: number;
            page: number;
        };
        setTableList: (lists: any[]) => void;
        getTableList: () => any[];
        featchPageListData: (formData?: any, isClearSort?: boolean) => void;
        getSelectionRows: <T = any>() => T[];
        toggleRowSelection: (highLightSelection?: number[], selected?: boolean) => void;
        getCurrent: () => {
            currentPage: number;
            pageSize: number;
        };
        setCurrent: (current_page: any, page_size: any) => void;
    }, {}, {}, {}, {
        defaultExpandAll: boolean;
        showPagination: boolean;
        delimiterSymbol: string;
        isNeedPost: boolean;
        paginationLayout: string;
    }>;
    __isFragment?: undefined;
    __isTeleport?: undefined;
    __isSuspense?: undefined;
} & import('vue').ComponentOptionsBase<Readonly<import('vue').ExtractPropTypes<{
    pageStore: {
        type: import('vue').PropType<any>;
        required: true;
    };
    defaultExpandAll: {
        type: import('vue').PropType<boolean>;
        default: boolean;
    };
    treeData: {
        type: import('vue').PropType<any>;
    };
    treeProps: {
        type: import('vue').PropType<Partial<Omit<import('element-plus/es/components/tree/src/tree.type.mjs').TreeComponentProps, "data" | "defaultExpandAll" | "highlightCurrent">>>;
    };
    columnEmpty: {
        type: import('vue').PropType<any>;
    };
    isComponent: {
        type: import('vue').PropType<boolean>;
    };
    isHasComHandleRow: {
        type: import('vue').PropType<boolean>;
    };
    contentConfig: {
        type: import('vue').PropType<{
            key: string;
            titleBtn: {
                left?: any[] | undefined;
                right?: any[] | undefined;
            };
            url: {
                listUrl: string;
                deleteUrl?: string | undefined;
            };
            propsList: any[];
            childrenTree?: any;
        }>;
        required: true;
    };
    isMultipleChoice: {
        type: import('vue').PropType<boolean>;
    };
    isHasTree: {
        type: import('vue').PropType<boolean>;
    };
    isHasTableColumn: {
        type: import('vue').PropType<boolean>;
    };
    listQuery: {
        type: import('vue').PropType<any>;
    };
    result: {
        type: import('vue').PropType<{
            lists: any[];
            totals: number;
        }>;
    };
    highestPriorityQueryInfo: {
        type: import('vue').PropType<any>;
    };
    showPagination: {
        type: import('vue').PropType<boolean>;
        default: boolean;
    };
    tableBind: {
        type: import('vue').PropType<Partial<import('element-plus/es/components/table/src/table/defaults.mjs').TableProps<any>>>;
    };
    paginationBind: {
        type: import('vue').PropType<any>;
    };
    delimiterSymbol: {
        type: import('vue').PropType<string>;
        required: true;
        default: import('../enums').ROUTER;
    };
    defaultSort: {
        type: import('vue').PropType<import('element-plus/es/components/table/src/table/defaults.mjs').Sort>;
    };
    isNeedPost: {
        type: import('vue').PropType<boolean>;
        default: boolean;
    };
    paginationLayout: {
        type: import('vue').PropType<string>;
        default: string;
    };
    spanMethods: {
        type: import('vue').PropType<(data: any) => void>;
    };
    deleteMethodsAfter: {
        type: import('vue').PropType<(data: any, code: import('../enums').RESPONSE_CODE) => void>;
    };
}>> & Readonly<{
    onPostAfter?: ((...args: any[]) => any) | undefined;
    onHandleNodeClick?: ((...args: any[]) => any) | undefined;
    onHandleEvent?: ((...args: any[]) => any) | undefined;
    onNewClick?: ((...args: any[]) => any) | undefined;
    onEditClick?: ((...args: any[]) => any) | undefined;
    onTitleEvent?: ((...args: any[]) => any) | undefined;
    onPageChange?: ((...args: any[]) => any) | undefined;
    onPageRenderAfter?: ((...args: any[]) => any) | undefined;
    onHandleQuery?: ((...args: any[]) => any) | undefined;
}>, {
    list: import('vue').Ref<any[], any[]>;
    pageInfo: {
        limit: number;
        page: number;
    };
    setTableList: (lists: any[]) => void;
    getTableList: () => any[];
    featchPageListData: (formData?: any, isClearSort?: boolean) => void;
    getSelectionRows: <T = any>() => T[];
    toggleRowSelection: (highLightSelection?: number[], selected?: boolean) => void;
    getCurrent: () => {
        currentPage: number;
        pageSize: number;
    };
    setCurrent: (current_page: any, page_size: any) => void;
}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {
    postAfter: (...args: any[]) => void;
    handleNodeClick: (...args: any[]) => void;
    handleEvent: (...args: any[]) => void;
    newClick: (...args: any[]) => void;
    editClick: (...args: any[]) => void;
    titleEvent: (...args: any[]) => void;
    pageChange: (...args: any[]) => void;
    pageRenderAfter: (...args: any[]) => void;
    handleQuery: (...args: any[]) => void;
}, string, {
    defaultExpandAll: boolean;
    showPagination: boolean;
    delimiterSymbol: string;
    isNeedPost: boolean;
    paginationLayout: string;
}, {}, string, {}, import('vue').GlobalComponents, import('vue').GlobalDirectives, string, import('vue').ComponentProvideOptions> & import('vue').VNodeProps & import('vue').AllowedComponentProps & import('vue').ComponentCustomProps & (new () => {
    $slots: Partial<Record<NonNullable<string | number>, (_: any) => any>> & {
        table?(_: {}): any;
    };
})) | import('vue').DefineComponent<import('vue').ExtractPropTypes<{
    homeUrl: {
        type: import('vue').PropType<string>;
        required: true;
    };
    loginUrl: {
        type: import('vue').PropType<string>;
        required: true;
    };
}>, {}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {}, string, import('vue').PublicProps, Readonly<import('vue').ExtractPropTypes<{
    homeUrl: {
        type: import('vue').PropType<string>;
        required: true;
    };
    loginUrl: {
        type: import('vue').PropType<string>;
        required: true;
    };
}>> & Readonly<{}>, {}, {}, {}, {}, string, import('vue').ComponentProvideOptions, true, {}, any> | ({
    new (...args: any[]): import('vue').CreateComponentPublicInstanceWithMixins<Readonly<import('vue').ExtractPropTypes<{
        url: {
            type: import('vue').PropType<string>;
            required: true;
            default: string;
        };
        headers: {
            type: import('vue').PropType<(Record<string, any> | Headers) & {
                "X-Platform-From": string;
            }>;
        };
        uploadData: {
            type: import('vue').PropType<import('element-plus/lib/utils/typescript.js').Awaitable<Record<string, any>>>;
        };
    }>> & Readonly<{
        onUploadSuccess?: ((...args: any[]) => any) | undefined;
        onUploadError?: ((...args: any[]) => any) | undefined;
    }>, {
        showDialog: () => void;
    }, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {
        uploadSuccess: (...args: any[]) => void;
        uploadError: (...args: any[]) => void;
    }, import('vue').PublicProps, {
        url: string;
    }, true, {}, {}, import('vue').GlobalComponents, import('vue').GlobalDirectives, string, {}, any, import('vue').ComponentProvideOptions, {
        P: {};
        B: {};
        D: {};
        C: {};
        M: {};
        Defaults: {};
    }, Readonly<import('vue').ExtractPropTypes<{
        url: {
            type: import('vue').PropType<string>;
            required: true;
            default: string;
        };
        headers: {
            type: import('vue').PropType<(Record<string, any> | Headers) & {
                "X-Platform-From": string;
            }>;
        };
        uploadData: {
            type: import('vue').PropType<import('element-plus/lib/utils/typescript.js').Awaitable<Record<string, any>>>;
        };
    }>> & Readonly<{
        onUploadSuccess?: ((...args: any[]) => any) | undefined;
        onUploadError?: ((...args: any[]) => any) | undefined;
    }>, {
        showDialog: () => void;
    }, {}, {}, {}, {
        url: string;
    }>;
    __isFragment?: undefined;
    __isTeleport?: undefined;
    __isSuspense?: undefined;
} & import('vue').ComponentOptionsBase<Readonly<import('vue').ExtractPropTypes<{
    url: {
        type: import('vue').PropType<string>;
        required: true;
        default: string;
    };
    headers: {
        type: import('vue').PropType<(Record<string, any> | Headers) & {
            "X-Platform-From": string;
        }>;
    };
    uploadData: {
        type: import('vue').PropType<import('element-plus/lib/utils/typescript.js').Awaitable<Record<string, any>>>;
    };
}>> & Readonly<{
    onUploadSuccess?: ((...args: any[]) => any) | undefined;
    onUploadError?: ((...args: any[]) => any) | undefined;
}>, {
    showDialog: () => void;
}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {
    uploadSuccess: (...args: any[]) => void;
    uploadError: (...args: any[]) => void;
}, string, {
    url: string;
}, {}, string, {}, import('vue').GlobalComponents, import('vue').GlobalDirectives, string, import('vue').ComponentProvideOptions> & import('vue').VNodeProps & import('vue').AllowedComponentProps & import('vue').ComponentCustomProps & (new () => {
    $slots: Partial<Record<NonNullable<string | number>, (_: any) => any>>;
})) | import('vue').DefineComponent<import('vue').ExtractPropTypes<{
    treeCardConfig: {
        type: import('vue').PropType<{
            content: any;
        }>;
        required: true;
    };
    pageStore: {
        type: import('vue').PropType<any>;
        required: true;
    };
}>, {}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {
    newClick: (...args: any[]) => void;
    editClick: (...args: any[]) => void;
    nodeClick: (...args: any[]) => void;
    infoClick: (...args: any[]) => void;
    btnClick: (...args: any[]) => void;
    headerDeleteClick: (...args: any[]) => void;
}, string, import('vue').PublicProps, Readonly<import('vue').ExtractPropTypes<{
    treeCardConfig: {
        type: import('vue').PropType<{
            content: any;
        }>;
        required: true;
    };
    pageStore: {
        type: import('vue').PropType<any>;
        required: true;
    };
}>> & Readonly<{
    onNewClick?: ((...args: any[]) => any) | undefined;
    onEditClick?: ((...args: any[]) => any) | undefined;
    onNodeClick?: ((...args: any[]) => any) | undefined;
    onInfoClick?: ((...args: any[]) => any) | undefined;
    onBtnClick?: ((...args: any[]) => any) | undefined;
    onHeaderDeleteClick?: ((...args: any[]) => any) | undefined;
}>, {}, {}, {}, {}, string, import('vue').ComponentProvideOptions, true, {}, any> | import('vue').DefineComponent<import('vue').ExtractPropTypes<{
    imageArr: {
        type: import('vue').PropType<string[]>;
    };
    videoArr: {
        type: import('vue').PropType<string[]>;
    };
    audioArr: {
        type: import('vue').PropType<string[]>;
    };
}>, {}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {}, string, import('vue').PublicProps, Readonly<import('vue').ExtractPropTypes<{
    imageArr: {
        type: import('vue').PropType<string[]>;
    };
    videoArr: {
        type: import('vue').PropType<string[]>;
    };
    audioArr: {
        type: import('vue').PropType<string[]>;
    };
}>> & Readonly<{}>, {}, {}, {}, {}, string, import('vue').ComponentProvideOptions, true, {}, any> | ({
    new (...args: any[]): import('vue').CreateComponentPublicInstanceWithMixins<Readonly<import('vue').ExtractPropTypes<{
        userBgUrl: {
            type: import('vue').PropType<string>;
            required: true;
            default: any;
        };
        userInfo: {
            type: import('vue').PropType<import('../types').IUser>;
            required: true;
        };
    }>> & Readonly<{}>, {
        setLayout: (group?: number, row?: number) => void;
        setData: (roles: import('../types').IChooseRoleData[]) => void;
        data: import('vue').Ref<import('../types').IChooseRoleData[] | undefined, import('../types').IChooseRoleData[] | undefined>;
    }, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {}, import('vue').PublicProps, {
        userBgUrl: string;
    }, true, {}, {}, import('vue').GlobalComponents, import('vue').GlobalDirectives, string, {}, any, import('vue').ComponentProvideOptions, {
        P: {};
        B: {};
        D: {};
        C: {};
        M: {};
        Defaults: {};
    }, Readonly<import('vue').ExtractPropTypes<{
        userBgUrl: {
            type: import('vue').PropType<string>;
            required: true;
            default: any;
        };
        userInfo: {
            type: import('vue').PropType<import('../types').IUser>;
            required: true;
        };
    }>> & Readonly<{}>, {
        setLayout: (group?: number, row?: number) => void;
        setData: (roles: import('../types').IChooseRoleData[]) => void;
        data: import('vue').Ref<import('../types').IChooseRoleData[] | undefined, import('../types').IChooseRoleData[] | undefined>;
    }, {}, {}, {}, {
        userBgUrl: string;
    }>;
    __isFragment?: undefined;
    __isTeleport?: undefined;
    __isSuspense?: undefined;
} & import('vue').ComponentOptionsBase<Readonly<import('vue').ExtractPropTypes<{
    userBgUrl: {
        type: import('vue').PropType<string>;
        required: true;
        default: any;
    };
    userInfo: {
        type: import('vue').PropType<import('../types').IUser>;
        required: true;
    };
}>> & Readonly<{}>, {
    setLayout: (group?: number, row?: number) => void;
    setData: (roles: import('../types').IChooseRoleData[]) => void;
    data: import('vue').Ref<import('../types').IChooseRoleData[] | undefined, import('../types').IChooseRoleData[] | undefined>;
}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {}, string, {
    userBgUrl: string;
}, {}, string, {}, import('vue').GlobalComponents, import('vue').GlobalDirectives, string, import('vue').ComponentProvideOptions> & import('vue').VNodeProps & import('vue').AllowedComponentProps & import('vue').ComponentCustomProps & (new () => {
    $slots: {
        weather?(_: {}): any;
        login?(_: {}): any;
        footer?(_: {}): any;
    };
})) | import('vue').DefineComponent<import('vue').ExtractPropTypes<{
    modelValue: {
        type: import('vue').PropType<number | number[] | undefined>;
        required: true;
    };
    multiple: {
        type: import('vue').PropType<boolean>;
        required: true;
    };
    disabled: {
        type: import('vue').PropType<boolean>;
    };
    isHasChildren: {
        type: import('vue').PropType<boolean>;
    };
    customName: {
        type: import('vue').PropType<string>;
    };
    departmentStore: {
        type: import('vue').PropType<{
            postDeaprtmentListAction: (obj: any) => Promise<any>;
        }>;
        required: true;
    };
}>, {
    reset: () => void;
    setMultiple: (isMultiple: boolean) => void;
}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {
    "update:modelValue": (value: number | number[] | undefined) => void;
    change: (value: number | number[] | undefined) => void;
}, string, import('vue').PublicProps, Readonly<import('vue').ExtractPropTypes<{
    modelValue: {
        type: import('vue').PropType<number | number[] | undefined>;
        required: true;
    };
    multiple: {
        type: import('vue').PropType<boolean>;
        required: true;
    };
    disabled: {
        type: import('vue').PropType<boolean>;
    };
    isHasChildren: {
        type: import('vue').PropType<boolean>;
    };
    customName: {
        type: import('vue').PropType<string>;
    };
    departmentStore: {
        type: import('vue').PropType<{
            postDeaprtmentListAction: (obj: any) => Promise<any>;
        }>;
        required: true;
    };
}>> & Readonly<{
    onChange?: ((value: number | number[] | undefined) => any) | undefined;
    "onUpdate:modelValue"?: ((value: number | number[] | undefined) => any) | undefined;
}>, {}, {}, {}, {}, string, import('vue').ComponentProvideOptions, true, {}, any> | import('vue').DefineComponent<import('vue').ExtractPropTypes<{
    modelValue: {
        type: import('vue').PropType<number | number[] | undefined>;
        required: true;
    };
    multiple: {
        type: import('vue').PropType<boolean>;
        required: true;
    };
    disabled: {
        type: import('vue').PropType<boolean>;
    };
    width: {
        type: import('vue').PropType<string>;
    };
    departmentStore: {
        type: import('vue').PropType<{
            postDeaprtmentListAction: (obj: any) => Promise<any>;
            postDeaprtmentByUserIdAction: (id: number) => Promise<any>;
        }>;
        required: true;
    };
}>, {
    reset: () => void;
    setMultiple: (isMultiple: 1 | 2) => void;
}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {
    "update:modelValue": (value: number | number[] | undefined) => void;
    change: (value: number | number[] | undefined, name: import('../types').MaybeExist<string>) => void;
}, string, import('vue').PublicProps, Readonly<import('vue').ExtractPropTypes<{
    modelValue: {
        type: import('vue').PropType<number | number[] | undefined>;
        required: true;
    };
    multiple: {
        type: import('vue').PropType<boolean>;
        required: true;
    };
    disabled: {
        type: import('vue').PropType<boolean>;
    };
    width: {
        type: import('vue').PropType<string>;
    };
    departmentStore: {
        type: import('vue').PropType<{
            postDeaprtmentListAction: (obj: any) => Promise<any>;
            postDeaprtmentByUserIdAction: (id: number) => Promise<any>;
        }>;
        required: true;
    };
}>> & Readonly<{
    onChange?: ((value: number | number[] | undefined, name: import('../types').MaybeExist<string>) => any) | undefined;
    "onUpdate:modelValue"?: ((value: number | number[] | undefined) => any) | undefined;
}>, {}, {}, {}, {}, string, import('vue').ComponentProvideOptions, true, {}, any> | ({
    new (...args: any[]): import('vue').CreateComponentPublicInstanceWithMixins<Readonly<import('vue').ExtractPropTypes<{
        appendToBody: {
            type: import('vue').PropType<boolean>;
            default: boolean;
        };
        inlineStyle: {
            type: import('vue').PropType<boolean>;
            default: boolean;
        };
        bigFormStyle: {
            type: import('vue').PropType<boolean>;
            default: boolean;
        };
        modalConfig: {
            type: import('vue').PropType<{
                btnText?: {
                    confirm: string;
                    cancel: string;
                } | undefined;
                url: {
                    newUrl: string;
                    editUrl: string;
                    listUrl: string;
                };
                header: {
                    newTitle: string;
                    editTitle: string;
                    labelWidth?: string | undefined;
                };
                formItems: any[];
                columns?: string[] | undefined;
            }>;
            required: true;
        };
        otherInfo: {
            type: import('vue').PropType<any>;
            default: {};
        };
        queryInfo: {
            type: import('vue').PropType<any>;
        };
        newFun: {
            type: import('vue').PropType<(infoData: any) => Promise<import('../enums').RESPONSE_CODE>>;
        };
    }>> & Readonly<{
        onHandleClick?: ((...args: any[]) => any) | undefined;
        onPostAfter?: ((...args: any[]) => any) | undefined;
    }>, {
        setModal: (isNew?: boolean, itemData?: any, isSee?: boolean) => void;
        dialogVisible: import('vue').Ref<boolean, boolean>;
        formData: any;
        isNewRef: import('vue').Ref<boolean, boolean>;
        editData: import('vue').Ref<any, any>;
        clearFiles: (prop?: string | undefined, states?: import('element-plus/es/components/upload/src/upload.mjs').UploadStatus[] | undefined) => void;
    }, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {
        handleClick: (...args: any[]) => void;
        postAfter: (...args: any[]) => void;
    }, import('vue').PublicProps, {
        appendToBody: boolean;
        inlineStyle: boolean;
        bigFormStyle: boolean;
        otherInfo: any;
    }, true, {}, {}, import('vue').GlobalComponents, import('vue').GlobalDirectives, string, {}, any, import('vue').ComponentProvideOptions, {
        P: {};
        B: {};
        D: {};
        C: {};
        M: {};
        Defaults: {};
    }, Readonly<import('vue').ExtractPropTypes<{
        appendToBody: {
            type: import('vue').PropType<boolean>;
            default: boolean;
        };
        inlineStyle: {
            type: import('vue').PropType<boolean>;
            default: boolean;
        };
        bigFormStyle: {
            type: import('vue').PropType<boolean>;
            default: boolean;
        };
        modalConfig: {
            type: import('vue').PropType<{
                btnText?: {
                    confirm: string;
                    cancel: string;
                } | undefined;
                url: {
                    newUrl: string;
                    editUrl: string;
                    listUrl: string;
                };
                header: {
                    newTitle: string;
                    editTitle: string;
                    labelWidth?: string | undefined;
                };
                formItems: any[];
                columns?: string[] | undefined;
            }>;
            required: true;
        };
        otherInfo: {
            type: import('vue').PropType<any>;
            default: {};
        };
        queryInfo: {
            type: import('vue').PropType<any>;
        };
        newFun: {
            type: import('vue').PropType<(infoData: any) => Promise<import('../enums').RESPONSE_CODE>>;
        };
    }>> & Readonly<{
        onHandleClick?: ((...args: any[]) => any) | undefined;
        onPostAfter?: ((...args: any[]) => any) | undefined;
    }>, {
        setModal: (isNew?: boolean, itemData?: any, isSee?: boolean) => void;
        dialogVisible: import('vue').Ref<boolean, boolean>;
        formData: any;
        isNewRef: import('vue').Ref<boolean, boolean>;
        editData: import('vue').Ref<any, any>;
        clearFiles: (prop?: string | undefined, states?: import('element-plus/es/components/upload/src/upload.mjs').UploadStatus[] | undefined) => void;
    }, {}, {}, {}, {
        appendToBody: boolean;
        inlineStyle: boolean;
        bigFormStyle: boolean;
        otherInfo: any;
    }>;
    __isFragment?: undefined;
    __isTeleport?: undefined;
    __isSuspense?: undefined;
} & import('vue').ComponentOptionsBase<Readonly<import('vue').ExtractPropTypes<{
    appendToBody: {
        type: import('vue').PropType<boolean>;
        default: boolean;
    };
    inlineStyle: {
        type: import('vue').PropType<boolean>;
        default: boolean;
    };
    bigFormStyle: {
        type: import('vue').PropType<boolean>;
        default: boolean;
    };
    modalConfig: {
        type: import('vue').PropType<{
            btnText?: {
                confirm: string;
                cancel: string;
            } | undefined;
            url: {
                newUrl: string;
                editUrl: string;
                listUrl: string;
            };
            header: {
                newTitle: string;
                editTitle: string;
                labelWidth?: string | undefined;
            };
            formItems: any[];
            columns?: string[] | undefined;
        }>;
        required: true;
    };
    otherInfo: {
        type: import('vue').PropType<any>;
        default: {};
    };
    queryInfo: {
        type: import('vue').PropType<any>;
    };
    newFun: {
        type: import('vue').PropType<(infoData: any) => Promise<import('../enums').RESPONSE_CODE>>;
    };
}>> & Readonly<{
    onHandleClick?: ((...args: any[]) => any) | undefined;
    onPostAfter?: ((...args: any[]) => any) | undefined;
}>, {
    setModal: (isNew?: boolean, itemData?: any, isSee?: boolean) => void;
    dialogVisible: import('vue').Ref<boolean, boolean>;
    formData: any;
    isNewRef: import('vue').Ref<boolean, boolean>;
    editData: import('vue').Ref<any, any>;
    clearFiles: (prop?: string | undefined, states?: import('element-plus/es/components/upload/src/upload.mjs').UploadStatus[] | undefined) => void;
}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {
    handleClick: (...args: any[]) => void;
    postAfter: (...args: any[]) => void;
}, string, {
    appendToBody: boolean;
    inlineStyle: boolean;
    bigFormStyle: boolean;
    otherInfo: any;
}, {}, string, {}, import('vue').GlobalComponents, import('vue').GlobalDirectives, string, import('vue').ComponentProvideOptions> & import('vue').VNodeProps & import('vue').AllowedComponentProps & import('vue').ComponentCustomProps & (new () => {
    $slots: Partial<Record<any, (_: {
        data: any;
        isNew: boolean;
    }) => any>> & {
        freeContent?(_: {
            isNew: boolean;
            data: any;
        }): any;
    };
})))[];
export default _default;
export { MyLayoutHeader, MySvgIcon, MyModifyPassword, MyPageModal, MyPageModalDialog, MyPageSearch, MyPageContent, MyBigFileUpload, Myprogress, MyNotFound, MyUpload, MyPageTreeCard, MyVideoCom, MyImageCom, MyAudioCom, MyCarousel, MyMediumCarousel, MySearchTimer, MyEnableOrDisableBtn, MyNavigate, MyChooseRole, UserinfoDrop, MyAudioPlayer, MyDepartmentSelect, MyUserSelect, };
