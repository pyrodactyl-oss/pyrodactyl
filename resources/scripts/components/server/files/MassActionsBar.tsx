import { useEffect, useState } from 'react';

import ActionButton from '@/components/elements/ActionButton';
import Spinner from '@/components/elements/Spinner';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import { Dialog } from '@/components/elements/dialog';
import FadeTransition from '@/components/elements/transitions/FadeTransition';
import RenameFileModal from '@/components/server/files/RenameFileModal';

import compressFiles from '@/api/server/files/compressFiles';
import trashFiles from '@/api/server/files/trashFiles';

import { useStoreState } from '@/state/hooks';
import { ServerContext } from '@/state/server';

import useFileManagerSwr from '@/plugins/useFileManagerSwr';
import useFlash from '@/plugins/useFlash';

const MassActionsBar = () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);

    const { data: fileObjects, mutate } = useFileManagerSwr();
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const [loading, setLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [showConfirm, setShowConfirm] = useState(false);
    const [showMove, setShowMove] = useState(false);
    const directory = ServerContext.useStoreState((state) => state.files.directory);

    const selectedFiles = ServerContext.useStoreState((state) => state.files.selectedFiles);
    const setSelectedFiles = ServerContext.useStoreActions((actions) => actions.files.setSelectedFiles);
    const retentionDays = useStoreState((state) => state.settings.data?.trash_retention_days ?? 30);

    useEffect(() => {
        if (!loading) setLoadingMessage('');
    }, [loading]);

    const onClickCompress = () => {
        setLoading(true);
        clearFlashes('files');
        setLoadingMessage('Archiving files...');

        compressFiles(uuid, directory, selectedFiles)
            .then(() => mutate())
            .then(() => setSelectedFiles([]))
            .catch((error) => clearAndAddHttpError({ key: 'files', error }))
            .then(() => setLoading(false));
    };

    const onClickConfirmDeletion = () => {
        setLoading(true);
        setShowConfirm(false);
        clearFlashes('files');
        setLoadingMessage('Moving files to trash...');

        const filesToTrash = selectedFiles.map((name) => {
            const obj = fileObjects?.find((f) => f.name === name);
            return obj && !obj.isFile ? name + '/' : name;
        });

        trashFiles(uuid, directory, filesToTrash)
            .then(async () => {
                await mutate((files) => files!.filter((f) => selectedFiles.indexOf(f.name) < 0), false);
                setSelectedFiles([]);
            })
            .catch(async (error) => {
                await mutate();
                clearAndAddHttpError({ key: 'files', error });
            })
            .then(() => setLoading(false));
    };

    return (
        <>
            <div className={`pointer-events-none fixed bottom-0 z-20 left-0 right-0 flex justify-center`}>
                <SpinnerOverlay visible={loading} size={'large'} fixed>
                    {loadingMessage}
                </SpinnerOverlay>
                <Dialog.Confirm
                    title={'Move to Trash'}
                    open={showConfirm}
                    confirm={'Move to Trash'}
                    onClose={() => setShowConfirm(false)}
                    onConfirmed={onClickConfirmDeletion}
                    loading={loading}
                >
                    <p className={'mb-2'}>
                        Are you sure you want to move&nbsp;
                        <span className={'font-semibold text-zinc-50'}>{selectedFiles.length} files</span> to the trash?
                        Files will be recoverable until the retention period expires ({retentionDays} days).
                    </p>
                    <ul className={'list-disc pl-5 text-sm text-zinc-400 space-y-0.5'}>
                        {selectedFiles.slice(0, 15).map((file) => (
                            <li key={file}>{file}</li>
                        ))}
                        {selectedFiles.length > 15 && <li>and {selectedFiles.length - 15} others</li>}
                    </ul>
                </Dialog.Confirm>
                {showMove && (
                    <RenameFileModal
                        files={selectedFiles}
                        visible
                        appear
                        useMoveTerminology
                        onDismissed={() => setShowMove(false)}
                    />
                )}
                <FadeTransition duration='duration-75' show={selectedFiles.length > 0} appear unmount>
                    <div
                        className={
                            'pointer-events-none fixed bottom-0 left-0 right-0 mb-6 flex justify-center w-full z-50'
                        }
                    >
                        <div
                            className={`flex items-center space-x-4 pointer-events-auto rounded-lg p-4 bg-black/50 backdrop-blur-sm border border-[#ffffff12]`}
                        >
                            <ActionButton onClick={() => setShowMove(true)} disabled={loading}>
                                {loading && loadingMessage.includes('Moving') && <Spinner size='small' />}
                                Move
                            </ActionButton>
                            <ActionButton onClick={onClickCompress} disabled={loading}>
                                {loading && loadingMessage.includes('Archiving') && <Spinner size='small' />}
                                Archive
                            </ActionButton>
                            <ActionButton variant='danger' onClick={() => setShowConfirm(true)} disabled={loading}>
                                {loading && loadingMessage.includes('Moving') && <Spinner size='small' />}
                                Move to Trash
                            </ActionButton>
                        </div>
                    </div>
                </FadeTransition>
            </div>
        </>
    );
};

export default MassActionsBar;
