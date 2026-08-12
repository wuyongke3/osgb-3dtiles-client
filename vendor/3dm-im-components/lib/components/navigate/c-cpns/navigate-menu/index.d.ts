import { FunctionalComponent } from 'vue';
import { IMapMenu, MaybeExist, ISystemDataItem, ISystemDatas } from '../../../../types';

type IProps = {
    systemData?: ISystemDatas;
    /** @description 是否水平折叠收起菜单 */
    collapse?: boolean;
    /** @description 是否只保持一个子菜单的展开 */
    uniqueOpened?: boolean;
    /** @description 菜单跳转的映射表，其中key为菜单的name，value为跳转的url key为role的port */
    toMap: Map<string, string>;
    maxHeight: string;
};
type IEvents = {
    activeMenuChange(activeMenu: ISystemDataItem, activeMenuChildren: MaybeExist<IMapMenu[]>): void;
    setCollapse(_collapse: boolean): void;
};
export type IExpose = {
    /** @description 关闭所有激活的菜单项 */
    closeAllCollapse(): void;
    resetIsFirstOpend(): void;
};
export declare const NavigateMenu: FunctionalComponent<IProps, IEvents> & IExpose;
export default NavigateMenu;
