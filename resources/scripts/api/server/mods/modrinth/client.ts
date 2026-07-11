import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';

// Modrinth's published guideline: identify yourself, respect 300 req/min.
// https://docs.modrinth.com/api/#authentication
const BASE_URL = 'https://api.modrinth.com/v2';
const DEFAULT_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 3;

let instance: AxiosInstance | null = null;

const getUserAgent = (): string => {
    // VITE_PYRODACTYL_VERSION is injected at build time (vite.config.ts).
    const v = (import.meta.env.VITE_PYRODACTYL_VERSION as string | undefined) ?? 'dev';
    return `pyrodactyl/${v} (+https://pyrodactyl.dev)`;
};

const isRetryable = (status: number | undefined): boolean => {
    if (status === undefined) return false;
    return status === 429 || (status >= 500 && status < 600);
};

/**
 * Lazily build (and cache) the axios instance used to talk to Modrinth.
 *
 * Kept lazy on purpose: previous iterations did the User-Agent setup at module
 * load time using a top-level `await`, which broke SSR-style code paths and
 * blocked the bundle on a panel HTTP request unrelated to the mod manager.
 */
export const modrinthClient = (): AxiosInstance => {
    if (instance) return instance;

    const ax = axios.create({
        baseURL: BASE_URL,
        timeout: DEFAULT_TIMEOUT_MS,
        headers: {
            // Note: most browsers ignore an explicit User-Agent header set from
            // JS and override it with the browser UA. We send it anyway so that
            // requests routed through a future Laravel passthrough controller
            // can pick it up and the value is at least visible in dev tools.
            'User-Agent': getUserAgent(),
            Accept: 'application/json',
        },
    });

    ax.interceptors.response.use(undefined, async (error: AxiosError) => {
        const cfg = error.config as (AxiosRequestConfig & { _retries?: number }) | undefined;
        if (!cfg) return Promise.reject(error);

        cfg._retries = cfg._retries ?? 0;
        if (cfg._retries >= MAX_RETRIES) return Promise.reject(error);
        if (!isRetryable(error.response?.status)) return Promise.reject(error);

        cfg._retries += 1;
        const backoffMs = 2 ** cfg._retries * 250;
        await new Promise((r) => setTimeout(r, backoffMs));
        return ax(cfg);
    });

    instance = ax;
    return ax;
};

/** Force a fresh client (used by tests). */
export const __resetModrinthClient = (): void => {
    instance = null;
};
