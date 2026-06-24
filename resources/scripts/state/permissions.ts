import { type Action, action, type Thunk, thunk } from 'easy-peasy';

import getSystemPermissions from '@/api/getSystemPermissions';

export interface PanelPermissions {
    [key: string]: {
        description: string;
        keys: { [k: string]: string };
    };
}

export interface GloablPermissionsStore {
    data: PanelPermissions;
    getPermissions: Thunk<GloablPermissionsStore, void, Record<string, unknown>, any, Promise<void>>;
    setPermissions: Action<GloablPermissionsStore, PanelPermissions>;
}

const permissions: GloablPermissionsStore = {
    data: {},

    setPermissions: action((state, payload) => {
        state.data = payload;
    }),

    getPermissions: thunk(async (actions) => {
        const permissions = await getSystemPermissions();

        actions.setPermissions(permissions);
    }),
};

export default permissions;
