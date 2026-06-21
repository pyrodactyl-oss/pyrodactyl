import axios from 'axios';
import { useState } from 'react';
import { toast } from 'sonner';

import i18n from '@/lib/i18n';

interface DownloadProps {
    url: string;
    serverUuid: string;
    directory?: string;
}

const DownloadModrinth: React.FC<DownloadProps> = ({ url, serverUuid, directory = 'mods' }) => {
    const [progress, setProgress] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);

    const downloadAndUploadFile = async () => {
        setLoading(true);
        try {
            toast.info(i18n.t('server:modrinth.downloading_from_modrinth'));

            // 1️⃣ Download the file from Modrinth
            const downloadResponse = await axios.get(url, {
                responseType: 'blob',
            });

            const fileName = url.split('/').pop() || 'modrinth-file.jar';
            const file = new Blob([downloadResponse.data], {
                type: downloadResponse.headers['content-type'] || 'application/java-archive',
            });

            // 2️⃣ Prepare FormData for Upload
            const formData = new FormData();
            formData.append('files', file, fileName);

            // 3️⃣ Upload to Pyrodactyl Server
            toast.info(i18n.t('server:modrinth.uploading_to_server', { fileName }));
            await axios.post(`/api/client/servers/${serverUuid}/files/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                params: { directory: `/container/${directory}` },
                onUploadProgress: (event) => {
                    if (event.total) {
                        setProgress(Math.round((event.loaded * 100) / event.total));
                    }
                },
            });

            toast.success(i18n.t('server:modrinth.uploaded_successfully', { fileName }));
        } catch (error) {
            handleError(error);
        } finally {
            setLoading(false);
        }
    };

    const handleError = (error: any) => {
        if (axios.isCancel(error)) {
            toast.warning(i18n.t('server:modrinth.request_cancelled'));
        } else if (error.response) {
            toast.error(i18n.t('server:modrinth.server_error_status', { status: error.response.status }));
        } else if (error.request) {
            toast.error(i18n.t('server:modrinth.no_response_from_server'));
        } else {
            toast.error(i18n.t('server:modrinth.error_with_message', { message: error.message }));
        }
    };

    return (
        <div className='p-4'>
            <button
                onClick={downloadAndUploadFile}
                disabled={loading}
                className='px-4 py-2 bg-blue-500 text-white rounded-lg cursor-pointer'
            >
                {loading ? i18n.t('server:operations.processing') : i18n.t('server:modrinth.download_and_upload')}
            </button>
            {progress > 0 && <p className='mt-2 text-sm'>{i18n.t('server:modrinth.upload_progress', { progress })}</p>}
        </div>
    );
};

export default DownloadModrinth;
