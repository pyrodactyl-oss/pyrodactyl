import http from '@/api/http';
import { getGlobalDaemonType } from '@/api/server/getServer';

export interface BackupJobStatus {
    can_cancel: boolean;
    can_retry: boolean;
    completed_at?: string;
    error?: string;
    is_successful: boolean;
    job_id: string | null;
    last_updated_at?: string;
    message?: string;
    progress: number;
    started_at?: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
}

export default async (uuid: string, backupUuid: string): Promise<BackupJobStatus> => {
    const daemonType = getGlobalDaemonType();
    const { data } = await http.get(`/api/client/servers/${daemonType}/${uuid}/backups/${backupUuid}/status`);

    return data;
};
