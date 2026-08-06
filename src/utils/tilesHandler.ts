import * as Cesium from "cesium";

export interface TilesVisualState {
  opacityPercent: number;
  brightnessPercent: number;
}

export interface TilesVisualOptions {
  opacityPercent?: number;
  brightnessPercent?: number;
}

export interface TilesetLike {
  customShader?: Cesium.CustomShader | null;
  style?: unknown;
  color?: Cesium.Color | null;
}

export interface TilesVisualController {
  readonly state: TilesVisualState;
  setOpacityPercent(value: number): void;
  setBrightnessPercent(value: number): void;
  update(next: TilesVisualOptions): void;
  setTargets(targets: TilesetLike | TilesetLike[] | null | undefined): void;
  destroy(): void;
}

interface Snapshot {
  customShader: TilesetLike["customShader"];
  style: TilesetLike["style"];
  color: TilesetLike["color"];
}

const snapshotMap = new WeakMap<object, Snapshot>();
const managedShaders = new WeakSet<Cesium.CustomShader>();

export function clampOpacityPercent(value: number): number {
  if (!Number.isFinite(value)) return 100;
  return Math.min(100, Math.max(1, Math.round(value)));
}

export function clampBrightnessPercent(value: number): number {
  if (!Number.isFinite(value)) return 100;
  return Math.min(200, Math.max(1, Math.round(value)));
}

function normalizeState(next?: TilesVisualOptions): TilesVisualState {
  return {
    opacityPercent: clampOpacityPercent(next?.opacityPercent ?? 100),
    brightnessPercent: clampBrightnessPercent(next?.brightnessPercent ?? 100),
  };
}

function normalizeTargets(
  targets: TilesetLike | TilesetLike[] | null | undefined,
): TilesetLike[] {
  if (!targets) return [];
  return Array.isArray(targets) ? targets.filter(Boolean) : [targets];
}

function takeSnapshot(target: TilesetLike): void {
  if (snapshotMap.has(target as object)) return;
  snapshotMap.set(target as object, {
    customShader: target.customShader ?? null,
    style: target.style,
    color: target.color ?? null,
  });
}

function restoreSnapshot(target: TilesetLike): void {
  const snapshot = snapshotMap.get(target as object);
  if (!snapshot) return;
  target.customShader = snapshot.customShader;
  target.style = snapshot.style;
  target.color = snapshot.color;
  snapshotMap.delete(target as object);
}

function buildShader(state: TilesVisualState): Cesium.CustomShader {
  const opacity = state.opacityPercent / 100;
  const brightness = state.brightnessPercent / 100;

  const shader = new Cesium.CustomShader({
    mode: Cesium.CustomShaderMode.MODIFY_MATERIAL,
    translucencyMode: Cesium.CustomShaderTranslucencyMode.TRANSLUCENT,
    uniforms: {
      u_opacity: {
        type: Cesium.UniformType.FLOAT,
        value: opacity,
      },
      u_brightness: {
        type: Cesium.UniformType.FLOAT,
        value: brightness,
      },
    },
    fragmentShaderText: `
      void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material)
      {
        material.diffuse = clamp(material.diffuse * u_brightness, vec3(0.0), vec3(1.0));
        material.alpha *= u_opacity;
      }
    `,
  });
  managedShaders.add(shader);
  return shader;
}

function updateShader(shader: Cesium.CustomShader, state: TilesVisualState): void {
  const opacity = state.opacityPercent / 100;
  const brightness = state.brightnessPercent / 100;
  if (typeof (shader as unknown as { setUniform?: unknown }).setUniform === "function") {
    shader.setUniform("u_opacity", opacity);
    shader.setUniform("u_brightness", brightness);
  }
}

function applyToTarget(target: TilesetLike, state: TilesVisualState): void {
  takeSnapshot(target);

  if (target.customShader && managedShaders.has(target.customShader)) {
    updateShader(target.customShader, state);
    return;
  }

  const shader = buildShader(state);
  target.customShader = shader;
  target.style = undefined;
}

export function createTilesVisualController(
  targets: TilesetLike | TilesetLike[] | null | undefined,
  initial?: TilesVisualOptions,
): TilesVisualController {
  let currentTargets = normalizeTargets(targets);
  let state = normalizeState(initial);

  const controller: TilesVisualController = {
    get state() {
      return state;
    },
    setOpacityPercent(value: number) {
      state = {
        ...state,
        opacityPercent: clampOpacityPercent(value),
      };
      apply();
    },
    setBrightnessPercent(value: number) {
      state = {
        ...state,
        brightnessPercent: clampBrightnessPercent(value),
      };
      apply();
    },
    update(next: TilesVisualOptions) {
      state = normalizeState({
        opacityPercent: next.opacityPercent ?? state.opacityPercent,
        brightnessPercent: next.brightnessPercent ?? state.brightnessPercent,
      });
      apply();
    },
    setTargets(nextTargets: TilesetLike | TilesetLike[] | null | undefined) {
      restore();
      currentTargets = normalizeTargets(nextTargets);
      apply();
    },
    destroy() {
      restore();
      currentTargets = [];
    },
  };

  function apply(): void {
    for (const target of currentTargets) {
      applyToTarget(target, state);
    }
  }

  function restore(): void {
    for (const target of currentTargets) {
      restoreSnapshot(target);
    }
  }

  apply();
  return controller;
}

export function applyTilesVisualOptions(
  targets: TilesetLike | TilesetLike[] | null | undefined,
  options?: TilesVisualOptions,
): TilesVisualController {
  return createTilesVisualController(targets, options);
}
