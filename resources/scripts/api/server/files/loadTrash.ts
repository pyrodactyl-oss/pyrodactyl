import http from '@/api/http';
import { getGlobalDaemonType } from '@/api/server/getServer';

export interface TrashedFile {
    id: number;
    uuid: string;
    original_root: string;
    original_name: string;
    trash_path: string;
    is_directory: boolean;
    deleted_by: number | null;
    trashed_at: string;
}

export default async (uuid: string, directory?: string): Promise<TrashedFile[]> => {
    const { data } = await http.get(`/api/client/servers/${getGlobalDaemonType()}/${uuid}/files/trash`, {
        params: directory ? { directory } : {},
    });

    return (data.data || []).map((item: any) => ({
        id: item.id,
        uuid: item.uuid,
        original_root: item.original_root,
        original_name: item.original_name,
        trash_path: item.trash_path,
        is_directory: item.is_directory,
        deleted_by: item.deleted_by,
        trashed_at: item.trashed_at,
    }));
};
