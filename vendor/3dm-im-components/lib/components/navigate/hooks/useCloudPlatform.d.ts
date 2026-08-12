import { IEnv } from '../../../types';

export declare function useCloudPlatform(env: IEnv): {
    id: number;
    name: string;
    hasChildren: boolean;
    to: string;
    port: string;
    icon: string;
};
