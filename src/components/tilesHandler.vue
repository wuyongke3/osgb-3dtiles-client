<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import {
  clampBrightnessPercent,
  clampOpacityPercent,
  createTilesVisualController,
  type TilesetLike,
  type TilesVisualController,
} from "../utils/tilesHandler";

const props = withDefaults(
  defineProps<{
    tilesets?: TilesetLike | TilesetLike[] | null;
    opacityPercent?: number;
    brightnessPercent?: number;
    disabled?: boolean;
    title?: string;
  }>(),
  {
    opacityPercent: 100,
    brightnessPercent: 100,
    disabled: false,
    title: "3D Tiles 显示控制",
  },
);

const emit = defineEmits<{
  (e: "update:opacityPercent", value: number): void;
  (e: "update:brightnessPercent", value: number): void;
  (e: "change", value: { opacityPercent: number; brightnessPercent: number }): void;
  (e: "ready", controller: TilesVisualController | null): void;
}>();

const opacity = ref(clampOpacityPercent(props.opacityPercent));
const brightness = ref(clampBrightnessPercent(props.brightnessPercent));
const controller = ref<TilesVisualController | null>(null);

const opacityLabel = computed(() => `${opacity.value}%`);
const brightnessLabel = computed(() => `${brightness.value}%`);

function syncController() {
  controller.value?.destroy();
  controller.value = props.tilesets
    ? createTilesVisualController(props.tilesets, {
        opacityPercent: opacity.value,
        brightnessPercent: brightness.value,
      })
    : null;
  emit("ready", controller.value);
}

function emitChange() {
  const next = {
    opacityPercent: opacity.value,
    brightnessPercent: brightness.value,
  };
  emit("update:opacityPercent", next.opacityPercent);
  emit("update:brightnessPercent", next.brightnessPercent);
  emit("change", next);
  controller.value?.update(next);
}

function onOpacityInput(event: Event) {
  const value = Number((event.target as HTMLInputElement).value);
  opacity.value = clampOpacityPercent(value);
  emitChange();
}

function onBrightnessInput(event: Event) {
  const value = Number((event.target as HTMLInputElement).value);
  brightness.value = clampBrightnessPercent(value);
  emitChange();
}

function reset() {
  opacity.value = 100;
  brightness.value = 100;
  emitChange();
}

watch(
  () => props.tilesets,
  () => syncController(),
  { immediate: true },
);

watch(
  () => props.opacityPercent,
  (value) => {
    const next = clampOpacityPercent(value ?? 100);
    if (next !== opacity.value) {
      opacity.value = next;
      controller.value?.setOpacityPercent(next);
    }
  },
);

watch(
  () => props.brightnessPercent,
  (value) => {
    const next = clampBrightnessPercent(value ?? 100);
    if (next !== brightness.value) {
      brightness.value = next;
      controller.value?.setBrightnessPercent(next);
    }
  },
);

onBeforeUnmount(() => {
  controller.value?.destroy();
  controller.value = null;
});
</script>

<template>
  <section class="tiles-handler" :class="{ 'is-disabled': disabled }">
    <div class="tiles-handler__header">
      <div>
        <h3 class="tiles-handler__title">{{ title }}</h3>
        <p class="tiles-handler__meta">统一控制整套 3D Tiles 的透明度和亮度</p>
      </div>
      <button class="tiles-handler__reset" type="button" @click="reset" :disabled="disabled">
        恢复默认
      </button>
    </div>

    <div class="tiles-handler__group">
      <div class="tiles-handler__row">
        <label class="tiles-handler__label" for="tiles-opacity">透明度</label>
        <span class="tiles-handler__value">{{ opacityLabel }}</span>
      </div>
      <div class="tiles-handler__control">
        <input
          id="tiles-opacity"
          :value="opacity"
          type="range"
          min="1"
          max="100"
          step="1"
          :disabled="disabled"
          @input="onOpacityInput"
        />
        <input
          :value="opacity"
          type="number"
          min="1"
          max="100"
          step="1"
          :disabled="disabled"
          @input="onOpacityInput"
        />
      </div>
    </div>

    <div class="tiles-handler__group">
      <div class="tiles-handler__row">
        <label class="tiles-handler__label" for="tiles-brightness">亮度</label>
        <span class="tiles-handler__value">{{ brightnessLabel }}</span>
      </div>
      <div class="tiles-handler__control">
        <input
          id="tiles-brightness"
          :value="brightness"
          type="range"
          min="1"
          max="200"
          step="1"
          :disabled="disabled"
          @input="onBrightnessInput"
        />
        <input
          :value="brightness"
          type="number"
          min="1"
          max="200"
          step="1"
          :disabled="disabled"
          @input="onBrightnessInput"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.tiles-handler {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 14px 16px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
}

.tiles-handler.is-disabled {
  opacity: 0.72;
}

.tiles-handler__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.tiles-handler__title {
  margin: 0;
  font-size: 15px;
  line-height: 1.3;
  font-weight: 700;
  color: var(--color-text-bright);
}

.tiles-handler__meta {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.45;
  color: var(--color-text-dim);
}

.tiles-handler__reset {
  flex: 0 0 auto;
  padding: 6px 12px;
  font-size: 13px;
}

.tiles-handler__group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tiles-handler__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.tiles-handler__label {
  margin: 0;
  font-size: 13px;
  color: var(--color-text);
}

.tiles-handler__value {
  font-size: 12px;
  color: var(--color-text-dim);
  font-variant-numeric: tabular-nums;
}

.tiles-handler__control {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 76px;
  gap: 10px;
}

.tiles-handler__control input[type="range"] {
  width: 100%;
  accent-color: var(--color-primary);
}

.tiles-handler__control input[type="number"] {
  width: 100%;
  min-width: 76px;
  padding: 8px 10px;
  font-size: 14px;
}

@media (max-width: 720px) {
  .tiles-handler__header,
  .tiles-handler__row {
    align-items: stretch;
    flex-direction: column;
  }

  .tiles-handler__control {
    grid-template-columns: 1fr;
  }
}
</style>
