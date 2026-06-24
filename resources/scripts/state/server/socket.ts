import { type Action, action } from 'easy-peasy';

import type { Websocket } from '@/plugins/Websocket';

export interface SocketStore {
    connected: boolean;
    instance: Websocket | null;
    setConnectionState: Action<SocketStore, boolean>;
    setInstance: Action<SocketStore, Websocket | null>;
}

const socket: SocketStore = {
    instance: null,
    connected: false,
    setInstance: action((state, payload) => {
        state.instance = payload;
    }),
    setConnectionState: action((state, payload) => {
        state.connected = payload;
    }),
};

export default socket;
