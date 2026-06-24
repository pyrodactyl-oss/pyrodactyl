import { type Action, action } from 'easy-peasy';

import type { ServerDatabase } from '@/api/server/databases/getServerDatabases';

export interface ServerDatabaseStore {
    appendDatabase: Action<ServerDatabaseStore, ServerDatabase>;
    data: ServerDatabase[];
    removeDatabase: Action<ServerDatabaseStore, string>;
    setDatabases: Action<ServerDatabaseStore, ServerDatabase[]>;
}

const databases: ServerDatabaseStore = {
    data: [],

    setDatabases: action((state, payload) => {
        state.data = payload;
    }),

    appendDatabase: action((state, payload) => {
        if (state.data.find((database) => database.id === payload.id)) {
            state.data = state.data.map((database) => (database.id === payload.id ? payload : database));
        } else {
            state.data = [...state.data, payload];
        }
    }),

    removeDatabase: action((state, payload) => {
        state.data = [...state.data.filter((database) => database.id !== payload)];
    }),
};

export default databases;
