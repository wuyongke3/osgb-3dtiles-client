import { ButtonProps } from 'element-plus';
import { FunctionalComponent } from 'vue';

interface IProps extends Partial<ButtonProps> {
    /** @description ElButton */
    buttonProps?: Partial<ButtonProps>;
    /** @description 状态:1/启用;2/停用; */
    status: 1 | 2;
    /** @description 单行的数据 */
    row: any;
    /** @description 点击了停用的方法 */
    disableAction: Function;
    /** @description 点击了启用的方法 */
    enableAction: Function;
}
type IEvents = {};
/** @description 启用或停用按钮 */
declare const useEnableOrDisableBtn: FunctionalComponent<IProps, IEvents>;
export default useEnableOrDisableBtn;
