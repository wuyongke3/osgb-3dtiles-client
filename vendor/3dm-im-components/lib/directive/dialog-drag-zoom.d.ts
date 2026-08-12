import { DirectiveBinding } from 'vue';

interface IValue {
    /** @description 弹窗最小宽度 */
    minWidth: number;
    /** @description 弹窗最小高度 */
    minHeight: number;
    /** @description 是否加载完元素 */
    isShow: boolean;
    /** @description 是否按元素自身的宽高比缩放 -- 默认为true */
    isProportion: boolean;
    /** @description 设置元素的style -- 默认为{ position: "fixed", zIndex: "999" } */
    elStyle: CSSStyleDeclaration;
    /** @description 是否需要改变宽度 -- 默认为true */
    isHasWidthChange: boolean;
    /** @description 是否需要改变高度 -- 默认为true */
    isHasHeightChange: boolean;
    /** @description 是否需要拖拽功能 -- 默认为true */
    isHasDrag: boolean;
    /** @description 拖拽的位置需要 ["left", "right", "bottom", "right-bottom", "left-bottom"] -- 默认为["right-bottom"] */
    dragPositions: IValue_dragPositions[];
}
/** @description 拖拽的位置需要 ["left", "right", "bottom", "right-bottom", "left-bottom"] -- 默认为["right-bottom"] */
type IValue_dragPositions = "left" | "right" | "bottom" | "right-bottom" | "left-bottom";
/**
 * @description el-dialog弹窗右下角缩放窗口，双击头部全屏
 
 * @param  minWidth 弹窗最小宽度
 * @param  minHeight 弹窗最小高度
 * @param  isShow 是否加载完元素
 * @param  isProportion 是否按元素自身的宽高比缩放 -- 默认为true
 * @param  elStyle 设置元素的style -- 默认为{ position: "fixed", zIndex: "999" }
 * @param  isHasWidthChange 是否需要改变宽度 -- 默认为true
 * @param  isHasHeightChange 是否需要改变高度 -- 默认为true
 * @param  dragPositions 拖拽的位置需要 ["left", "right", "bottom", "right-bottom", "left-bottom"] -- 默认为["right-bottom"]
 *
 *
 * @example
 * <div v-dialog-zoom="{ minWidth: 300, minHeight: 400, isShow: dialogRwSearchSF, isProportion: true }">
 *  <el-dialog></el-dialog>
 * </div
 */
export declare function dialogZoom(el: HTMLElement, binding: DirectiveBinding<IValue>, _vnode: any): void;
export {};
