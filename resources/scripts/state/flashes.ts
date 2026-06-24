import { type Action, action } from 'easy-peasy';
import { httpErrorToHuman } from '@/api/http';
import type { FlashMessageType } from '@/components/MessageBox';

export interface FlashStore {
    addError: Action<FlashStore, { message: string; key?: string }>;
    addFlash: Action<FlashStore, FlashMessage>;
    clearAndAddHttpError: Action<FlashStore, { error?: Error | any | null; key?: string }>;
    clearFlashes: Action<FlashStore, string | undefined>;
    items: FlashMessage[];
}

export interface FlashMessage {
    id?: string;
    key?: string;
    message: string;
    title?: string;
    type: FlashMessageType;
}

const flashes: FlashStore = {
    items: [],

    addFlash: action((state, payload) => {
        state.items.push(payload);
    }),

    addError: action((state, payload) => {
        state.items.push({ type: 'error', title: 'Error', ...payload });
    }),

    clearAndAddHttpError: action((state, payload) => {
        if (payload.error) {
            console.error(payload.error);

            state.items = [
                {
                    type: 'error',
                    title: 'Error',
                    key: payload.key,
                    message: httpErrorToHuman(payload.error),
                },
            ];
        } else {
            state.items = [];
        }
    }),

    clearFlashes: action((state, payload) => {
        state.items = payload ? state.items.filter((flashes) => flashes.key !== payload) : [];
    }),
};

export default flashes;
