/**
 * 导出 Excel 文件
 * @param data  表格数据，数组格式
 * @param headers 表头（字段映射）
 * @param filename 文件名
 */
export declare function exportExcel<T extends Record<string, any>>(data: T[], headers: Record<string, string>, filename?: string): void;
