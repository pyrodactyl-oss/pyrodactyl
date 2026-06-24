/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_BRANCH_NAME: string;
    readonly VITE_COMMIT_HASH: string;
    readonly VITE_PYRODACTYL_BUILD_NUMBER: string;
    readonly VITE_PYRODACTYL_VERSION: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
