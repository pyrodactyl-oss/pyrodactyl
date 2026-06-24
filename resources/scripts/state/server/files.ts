import type { Action } from 'easy-peasy';
import { action } from 'easy-peasy';
import { cleanDirectoryPath } from '@/helpers';

interface FileUploadData {
    readonly abort: AbortController;
    loaded: number;
    readonly total: number;
}

interface ServerFileStore {
    appendSelectedFile: Action<ServerFileStore, string>;
    cancelFileUpload: Action<ServerFileStore, string>;
    clearFileUploads: Action<ServerFileStore>;
    directory: string;
    lastSelectedFile: string | null;

    pushFileUpload: Action<ServerFileStore, { name: string; data: FileUploadData }>;
    removeFileUpload: Action<ServerFileStore, string>;
    removeSelectedFile: Action<ServerFileStore, string>;
    selectedFiles: string[];
    selectFileRange: Action<ServerFileStore, { from: string; to: string; files: string[] }>;

    setDirectory: Action<ServerFileStore, string>;
    setLastSelectedFile: Action<ServerFileStore, string>;
    setSelectedFiles: Action<ServerFileStore, string[]>;
    setUploadProgress: Action<ServerFileStore, { name: string; loaded: number }>;
    uploads: Record<string, FileUploadData>;
}

const files: ServerFileStore = {
    directory: '/',
    selectedFiles: [],
    lastSelectedFile: null,
    uploads: {},

    setDirectory: action((state, payload) => {
        state.directory = cleanDirectoryPath(payload);
    }),

    setSelectedFiles: action((state, payload) => {
        state.selectedFiles = payload;
    }),

    appendSelectedFile: action((state, payload) => {
        state.selectedFiles = state.selectedFiles.filter((f) => f !== payload).concat(payload);
    }),

    removeSelectedFile: action((state, payload) => {
        state.selectedFiles = state.selectedFiles.filter((f) => f !== payload);
    }),

    selectFileRange: action((state, { from, to, files }) => {
        const fromIndex = files.indexOf(from);
        const toIndex = files.indexOf(to);

        if (fromIndex === -1 || toIndex === -1) {
            return;
        }

        const startIndex = Math.min(fromIndex, toIndex);
        const endIndex = Math.max(fromIndex, toIndex);

        const range = files.slice(startIndex, endIndex + 1);
        state.selectedFiles = [...new Set([...state.selectedFiles, ...range])];
    }),

    setLastSelectedFile: action((state, payload) => {
        state.lastSelectedFile = payload;
    }),

    clearFileUploads: action((state) => {
        Object.values(state.uploads).forEach((upload) => upload.abort.abort());

        state.uploads = {};
    }),

    pushFileUpload: action((state, payload) => {
        state.uploads[payload.name] = payload.data;
    }),

    setUploadProgress: action((state, { name, loaded }) => {
        const upload = state.uploads[name];
        if (upload === undefined) {
            return;
        }

        upload.loaded = loaded;
    }),

    removeFileUpload: action((state, payload) => {
        const upload = state.uploads[payload];
        if (upload === undefined) {
            return;
        }

        delete state.uploads[payload];
    }),

    cancelFileUpload: action((state, payload) => {
        const upload = state.uploads[payload];
        if (upload === undefined) {
            return;
        }

        // Abort the request if it is still in flight. If it already completed this is
        // a no-op.
        upload.abort.abort();

        delete state.uploads[payload];
    }),
};

export type { FileUploadData, ServerFileStore };
export default files;
