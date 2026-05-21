import http from '@/api/http';
import { getGlobalDaemonType } from '@/api/server/getServer';

export type ModScanMode = 'quick' | 'missing' | 'full';
export type ModScanStatus = 'cached' | 'scanned' | 'pending' | 'failed';

export interface ScannedModMetadata {
    modId: string | null;
    name: string | null;
    version: string | null;
    source: 'fabric.mod.json' | 'quilt.mod.json' | 'mods.toml' | null;
}

export interface ScannedModFile {
    path: string;
    name: string;
    enabled: boolean;
    size: number;
    modifiedAt: Date;
    fingerprint: string;
    sha1: string | null;
    metadata: ScannedModMetadata;
    scanStatus: ModScanStatus;
    error: string | null;
}

export interface ModScanResult {
    files: ScannedModFile[];
    meta: {
        directory: string;
        mode: ModScanMode;
        total: number;
        cached: number;
        scanned: number;
        pending: number;
        failed: number;
    };
}

interface RawScannedModFile {
    path: string;
    name: string;
    enabled: boolean;
    size: number;
    modified_at: string;
    fingerprint: string;
    sha1: string | null;
    metadata?: {
        mod_id?: string | null;
        name?: string | null;
        version?: string | null;
        source?: ScannedModMetadata['source'];
    };
    scan_status: ModScanStatus;
    error?: string | null;
}

export default async (uuid: string, directory: string, mode: ModScanMode): Promise<ModScanResult> => {
    const { data } = await http.get(`/api/client/servers/${getGlobalDaemonType()}/${uuid}/mods/scan`, {
        params: { directory, mode },
    });

    return {
        files: ((data.data ?? []) as RawScannedModFile[]).map((file) => ({
            path: file.path,
            name: file.name,
            enabled: file.enabled,
            size: Number(file.size),
            modifiedAt: new Date(file.modified_at),
            fingerprint: file.fingerprint,
            sha1: file.sha1,
            metadata: {
                modId: file.metadata?.mod_id ?? null,
                name: file.metadata?.name ?? null,
                version: file.metadata?.version ?? null,
                source: file.metadata?.source ?? null,
            },
            scanStatus: file.scan_status,
            error: file.error ?? null,
        })),
        meta: data.meta,
    };
};
