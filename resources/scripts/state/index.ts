import { createStore } from 'easy-peasy';

import flashes, { type FlashStore } from '@/state/flashes';
import permissions, { type GloablPermissionsStore } from '@/state/permissions';
import progress, { type ProgressStore } from '@/state/progress';
import settings, { type SettingsStore } from '@/state/settings';
import user, { type UserStore } from '@/state/user';

export interface ApplicationStore {
    flashes: FlashStore;
    permissions: GloablPermissionsStore;
    progress: ProgressStore;
    settings: SettingsStore;
    user: UserStore;
}

const state: ApplicationStore = {
    permissions,
    flashes,
    user,
    settings,
    progress,
};

export const store = createStore(state);
