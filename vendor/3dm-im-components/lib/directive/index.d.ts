import { App } from 'vue';

/**
 * @name dragZoom
 * @description el-dialog弹窗右下角缩放窗口，双击头部全屏，头部header区域拖拽
 * @param  minWidth 弹窗最小宽度
 * @param  minHeight 弹窗最小高度
 * @param isShow 是否加载完元素
 * @param  isProportion 是否按元素自身的宽高比缩放 -- 默认为true
 * @param  elStyle 设置元素的style -- 默认为{ position: "fixed", zIndex: "999" }
 * @param  isHasWidthChange 是否需要改变宽度 -- 默认为true
 * @param  isHasHeightChange 是否需要改变高度 -- 默认为true
 * @param  isHasDrag 是否需要拖拽功能 -- 默认为true
 * @param  dragPositions 拖拽的位置需要 ["left", "right", "bottom", "right-bottom", "left-bottom"] -- 默认为["right-bottom"]
 *
 *
 * @description class="drag-box"以及class="drag-header"必须且元素父子级关系正确；drag-header元素为拖拽的元素
 *
 * @example
  <div
    class="drag-box"
    v-drag-zoom="{
      minWidth: 300,
      minHeight: 400,
      isProportion: true,
      isShow: true,
    }"
  >
    <div
      class="drag-header"
    ></div>
  </div>

 *******************************************************************************

 @name dialogZoom
 * @description el-dialog弹窗右下角缩放窗口，双击头部全屏
 * @param  minWidth 弹窗最小宽度
 * @param  minHeight 弹窗最小高度
 * @param isShow 是否加载完元素
 * @param  isProportion 是否按元素自身的宽高比缩放 -- 默认为true
 *
 * @example
 * <div v-dialog-zoom="{ minWidth: 300, minHeight: 400, isShow: dialogRwSearchSF, isProportion: true }">
 *  <el-dialog></el-dialog>
 * </div
 */
declare const directives: {
    install: (app: App<Element>) => void;
};
export default directives;
