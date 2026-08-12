import { App } from 'vue';
import { default as myDirectives } from './directive';

export * as enums from './enums';
export * as utils from './utils';
export * as hooks from './hooks';
export { myDirectives };
export { useSocket } from './socket/websocket';
export type { modalPropsType } from './types';
export type { uploadPropsType } from './types';
export type { IResetPassword } from './types';
export type { IBigFileUploadFinishResult } from './types';
import * as types from "./types";
export type { types };
export * from './components/components';
/**
 * @description 完整引入组件
 */
export declare function install(app: App): void;
