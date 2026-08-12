import * as mars3d from "mars3d";
import * as Cesium from "mars3d-cesium";

/**
 * @description ??????????? 3dmine js/map.js initMap ???
 */
export function initMap(mine3d) {
  const map = new mars3d.Map("mars3dContainer", {
    scene: {
      // center: { lat: 30.054604, lng: 108.885436, alt: 17036414, heading: 0, pitch: -90 },
      showSun: false,
      showMoon: false,
      showSkyBox: false,
      showSkyAtmosphere: false,
      fog: false,
      fxaa: true,
      backgroundColor: "#000",
      globe: {
        show: false,
        showGroundAtmosphere: false,
        enableLighting: false,
      },
      contextOptions: { webgl: { alpha: true } },
      cameraController: {
        zoomFactor: 3.0,
        minimumZoomDistance: 1,
        enableRotate: true,
        enableZoom: true,
        constrainedAxis: false,
      },
    },
    control: {
      compass: { top: "100px", right: "5px" },
      baseLayerPicker: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      fullscreenButton: false,
      contextmenu: { hasDefault: true },
      mouseDownView: true,
      locationBar: false,
      clockAnimate: false,
      timeline: false,
    },
    terrain: { show: false },
    basemaps: [],
  });
  return map;
}
