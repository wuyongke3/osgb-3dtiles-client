import * as mars3d from "mars3d";
import * as Cesium from "mars3d-cesium";

/** @description 仿 3dmine js/public.js */
let mine3d = null;

export function getMine3d() {
  return mine3d;
}

export function setMine3d(map) {
  mine3d = map;
}

// 当前缩放比例（供 popup 等外部使用）
let currentScale = 1;

///////////////
// 适配分辨率（抄 3dmine js/public.js bodyScreenScale，按屏幕高度 / 设计稿高度计算（与 3dmine 原版一致））
export const bodyScreenScale = () => {
  screenScale();
  window.onload = window.onresize = function () {
    screenScale();
  };
};

// 返回默认缩放
export const bodyScreenBack = () => {
  document.body.style.zoom = 1;
};

// 适配分辨率
function screenScale() {
  var devicewidth = document.documentElement.clientWidth;
  var deviceheight = document.documentElement.clientHeight;
  // 与 3dmine 原版一致：按屏幕高度计算缩放，分母为设计稿高度 1320
  let scale = deviceheight / 1320;
  currentScale = scale;
  // console.log("devicesize_w", devicewidth);
  // console.log("devicesize_h", deviceheight);
  const scaleDiv = document.getElementById("scaleDiv");
  if (scaleDiv) scaleDiv.style.zoom = String(scale);
  const controls = document.querySelectorAll(
    ".mars3d-compass, .mars3d-locationbar, .cesium-viewer-toolbar"
  );
  controls.forEach((el) => {
    el.style.zoom = String(scale);
  });
}

export function setPopupScale(dom) {
  if (!dom) return;
  dom.style.transform = `scale(${currentScale})`;
}

export { Cesium, mars3d };