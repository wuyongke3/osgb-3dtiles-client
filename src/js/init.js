import "mars3d-cesium/Build/Cesium/Widgets/widgets.css";
import * as Cesium from "mars3d-cesium";
import "mars3d/dist/mars3d.css";
import * as mars3d from "mars3d";
import { initMap } from "./map";

/**
 * @description ???????? 3dmine js/init.js?
 */
export async function init(mine3d) {
  initMap(mine3d);
}
