import { ROUTER, RESPONSE_CODE } from '../../enums';
import { Sort, TableProps, TreeComponentProps } from 'element-plus';

interface IProps {
    contentConfig: {
        key: string;
        titleBtn: {
            left?: any[];
            right?: any[];
        };
        url: {
            listUrl: string;
            deleteUrl?: string;
        };
        propsList: any[];
        childrenTree?: any;
    };
    isComponent?: boolean;
    /**
     * @description 是否需要自定义的操作行
     */
    isHasComHandleRow?: boolean;
    isMultipleChoice?: boolean;
    isHasTree?: boolean;
    isHasTableColumn?: boolean;
    treeData?: any;
    listQuery?: any;
    result?: {
        lists: any[];
        totals: number;
    };
    highestPriorityQueryInfo?: any;
    columnEmpty?: any;
    showPagination?: boolean;
    defaultExpandAll?: boolean;
    tableBind?: Partial<TableProps<any>>;
    paginationBind?: any;
    delimiterSymbol: string;
    defaultSort?: Sort;
    isNeedPost?: boolean;
    paginationLayout?: string;
    spanMethods?: (data: any) => void;
    deleteMethodsAfter?: (data: any, code: RESPONSE_CODE) => void;
    pageStore: any;
    treeProps?: Partial<Omit<TreeComponentProps, "data" | "defaultExpandAll" | "highlightCurrent">>;
}
/**
 * @description 获取当前页码和每页条数
 *
 */
declare function getCurrent(): {
    currentPage: number;
    pageSize: number;
};
/**
 * @description 设置当前页码和每页条数
 * @param current_page 当前页码
 * @param page_size 每页条数
 */
declare function setCurrent(current_page: any, page_size: any): void;
declare function featchPageListDataSort(formData?: any, isClearSort?: boolean): void;
/**
 * @description 设置或取消选中的所有行
 *
 * @param highLightSelection 要操作的行的id数组
 * @param selected 是否选中，默认选中
 */
declare function toggleRowSelection(highLightSelection?: number[], selected?: boolean): void;
/**
 * @description 获取当前表格中所有选中项
 */
declare function getSelectionRows<T = any>(): T[];
/**
 * @description 设置页面的list数据
 *
 * @param lists
 */
declare function setTableList(lists: any[]): void;
/**
 * @description 获取页面的list数据
 */
declare function getTableList(): any[];
declare const _default: __VLS_WithTemplateSlots<import('vue').DefineComponent<import('vue').ExtractPropTypes<__VLS_WithDefaults<__VLS_TypePropsToRuntimeProps<IProps>, {
    showPagination: boolean;
    defaultExpandAll: boolean;
    delimiterSymbol: ROUTER;
    isNeedPost: boolean;
    paginationLayout: string;
}>>, {
    list: import('vue').Ref<any[], any[]>;
    pageInfo: {
        limit: number;
        page: number;
    };
    setTableList: typeof setTableList;
    getTableList: typeof getTableList;
    featchPageListData: typeof featchPageListDataSort;
    getSelectionRows: typeof getSelectionRows;
    toggleRowSelection: typeof toggleRowSelection;
    getCurrent: typeof getCurrent;
    setCurrent: typeof setCurrent;
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
}, string, import('vue').PublicProps, Readonly<import('vue').ExtractPropTypes<__VLS_WithDefaults<__VLS_TypePropsToRuntimeProps<IProps>, {
    showPagination: boolean;
    defaultExpandAll: boolean;
    delimiterSymbol: ROUTER;
    isNeedPost: boolean;
    paginationLayout: string;
}>>> & Readonly<{
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
    defaultExpandAll: boolean;
    showPagination: boolean;
    delimiterSymbol: string;
    isNeedPost: boolean;
    paginationLayout: string;
}, {}, {}, {}, string, import('vue').ComponentProvideOptions, true, {}, any>, Partial<Record<NonNullable<string | number>, (_: any) => any>> & {
    table?(_: {}): any;
}>;
export default _default;
type __VLS_NonUndefinedable<T> = T extends undefined ? never : T;
type __VLS_TypePropsToRuntimeProps<T> = {
    [K in keyof T]-?: {} extends Pick<T, K> ? {
        type: import('vue').PropType<__VLS_NonUndefinedable<T[K]>>;
    } : {
        type: import('vue').PropType<T[K]>;
        required: true;
    };
};
type __VLS_WithDefaults<P, D> = {
    [K in keyof Pick<P, keyof P>]: K extends keyof D ? __VLS_Prettify<P[K] & {
        default: D[K];
    }> : P[K];
};
type __VLS_Prettify<T> = {
    [K in keyof T]: T[K];
} & {};
type __VLS_WithTemplateSlots<T, S> = T & {
    new (): {
        $slots: S;
    };
};
