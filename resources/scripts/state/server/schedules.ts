import { type Action, action } from 'easy-peasy';

import type { Schedule } from '@/api/server/schedules/getServerSchedules';

export interface ServerScheduleStore {
    appendSchedule: Action<ServerScheduleStore, Schedule>;
    data: Schedule[];
    removeSchedule: Action<ServerScheduleStore, number>;
    setSchedules: Action<ServerScheduleStore, Schedule[]>;
}

const schedules: ServerScheduleStore = {
    data: [],

    setSchedules: action((state, payload) => {
        state.data = payload;
    }),

    appendSchedule: action((state, payload) => {
        if (state.data.find((schedule) => schedule.id === payload.id)) {
            state.data = state.data.map((schedule) => (schedule.id === payload.id ? payload : schedule));
        } else {
            state.data = [...state.data, payload];
        }
    }),

    removeSchedule: action((state, payload) => {
        state.data = [...state.data.filter((schedule) => schedule.id !== payload)];
    }),
};

export default schedules;
