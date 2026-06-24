export type ServerStatus =
    | 'installing'
    | 'install_failed'
    | 'reinstall_failed'
    | 'suspended'
    | 'restoring_backup'
    | null;

export interface ServerBackup {
    adapter: string;
    bytes: number;
    canRetry: boolean;
    checksum: string;
    completedAt: Date | null;
    createdAt: Date;
    ignoredFiles: string;
    isAutomatic: boolean;
    isInProgress: boolean;
    isLocked: boolean;
    isRustic: boolean;
    isSuccessful: boolean;
    jobError: string | null;
    // Async job fields
    jobId: string | null;
    jobLastUpdatedAt: Date | null;
    jobMessage: string | null;
    jobProgress: number;
    jobStartedAt: Date | null;
    jobStatus: 'pending' | 'running' | 'completed' | 'failed';
    name: string;
    sizeGb: number;
    snapshotId: string | null;
    uuid: string;
}

export interface ServerEggVariable {
    defaultValue: string;
    description: string;
    envVariable: string;
    isEditable: boolean;
    name: string;
    rules: string[];
    serverValue: string | null;
}
