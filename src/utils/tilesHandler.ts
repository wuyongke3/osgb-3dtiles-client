import * as Cesium from "mars3d-cesium";

export interface TilesVisualState {
  opacityPercent: number;
  brightnessPercent: number;
}

export interface TilesVisualOptions {
  opacityPercent?: number;
  brightnessPercent?: number;
}

export interface TilesetLike {
  style?: unknown;
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
  style: TilesetLike["style"];
}

const snapshotMap = new WeakMap<object, Snapshot>();

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
    style: target.style,
  });
}

function restoreSnapshot(target: TilesetLike): void {
  const snapshot = snapshotMap.get(target as object);
  if (!snapshot) return;
  target.style = snapshot.style;
  snapshotMap.delete(target as object);
}

function buildStyle(state: TilesVisualState): Cesium.Cesium3DTileStyle {
  const opacity = state.opacityPercent / 100;
  const brightness = state.brightnessPercent / 100;
  const colorChannel = Math.round(255 * Math.min(brightness, 1));

  return new Cesium.Cesium3DTileStyle({
    color: `rgba(${colorChannel}, ${colorChannel}, ${colorChannel}, ${opacity.toFixed(3)})`,
  });
}

function applyToTarget(target: TilesetLike, state: TilesVisualState): void {
  takeSnapshot(target);
  target.style = buildStyle(state);
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
