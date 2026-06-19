import { CircleCheck, Xmark } from '@gravity-ui/icons';
import * as Tooltip from '@radix-ui/react-tooltip';
import { useContext, useEffect, useState } from 'react';

import i18n from '@/lib/i18n';

import ActionButton from '@/components/elements/ActionButton';
import Code from '@/components/elements/Code';
import { Dialog, DialogWrapperContext } from '@/components/elements/dialog';

import asDialog from '@/hoc/asDialog';

import { ServerContext } from '@/state/server';

const CircleProgress = ({ progress, error, className }: { progress: number; error?: string; className?: string }) => {
    if (error) {
        return (
            <svg className={className} viewBox='0 0 32 32'>
                <circle cx='16' cy='16' r='12' fill='none' stroke='currentColor' strokeWidth='3' className='text-red-400 opacity-50' />
                <path d='M11 11l10 10M21 11l-10 10' stroke='currentColor' strokeWidth='3' strokeLinecap='round' className='text-red-400' />
            </svg>
        );
    }

    if (progress >= 100) {
        return (
            <svg className={className} viewBox='0 0 32 32'>
                <circle cx='16' cy='16' r='12' fill='none' stroke='currentColor' strokeWidth='3' className='text-green-400' />
                <path d='M9 16l4 4 10-8' stroke='currentColor' strokeWidth='3' strokeLinecap='round' strokeLinejoin='round' className='text-green-400' fill='none' />
            </svg>
        );
    }

    const radius = 12;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <svg className={className} viewBox='0 0 32 32'>
            <circle
                stroke='currentColor'
                strokeWidth='4'
                fill='transparent'
                r={radius}
                cx='16'
                cy='16'
                className='opacity-25'
            />
            <circle
                className='transition-all duration-300'
                stroke='currentColor'
                strokeWidth='4'
                strokeLinecap='round'
                fill='transparent'
                r={radius}
                cx='16'
                cy='16'
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                transform='rotate(-90 16 16)'
            />
        </svg>
    );
};

const FileUploadList = () => {
    const { close } = useContext(DialogWrapperContext);
    const cancelFileUpload = ServerContext.useStoreActions((actions) => actions.files.cancelFileUpload);
    const clearFileUploads = ServerContext.useStoreActions((actions) => actions.files.clearFileUploads);
    const uploads = ServerContext.useStoreState((state) =>
        Object.entries(state.files.uploads).sort(([a], [b]) => a.localeCompare(b)),
    );

    const allDone = uploads.length > 0 && uploads.every(([, f]) => !(f as any).error && f.loaded >= f.total);

    return (
        <div className={'space-y-2 mt-4 max-h-[50vh] overflow-y-auto'}>
            {uploads.map(([name, file]) => (
                <div
                    key={name}
                    className={`flex items-center space-x-3 bg-[#ffffff08] border p-3 rounded-lg ${(file as any).error ? 'border-red-400/30' : 'border-[#ffffff12]'}`}
                >
                    <div className={'shrink-0'}>
                        <CircleProgress
                            progress={(file.loaded / file.total) * 100}
                            error={(file as any).error}
                            className={'w-6 h-6'}
                        />
                    </div>
                    <Code className={`flex-1 truncate ${(file as any).error ? 'text-red-400' : ''}`}>{name}</Code>
                    <ActionButton
                        variant='secondary'
                        size='sm'
                        onClick={cancelFileUpload.bind(this, name)}
                        className='hover:!text-red-400'
                    >
                        <Xmark />
                    </ActionButton>
                </div>
            ))}
            <Dialog.Footer>
                {!allDone && (
                    <ActionButton variant='danger' onClick={() => clearFileUploads()}>
                        Cancel Uploads
                    </ActionButton>
                )}
                <ActionButton variant='secondary' onClick={() => { if (allDone) { clearFileUploads(); } close(); }}>
                    {allDone ? 'Done' : 'Close'}
                </ActionButton>
            </Dialog.Footer>
        </div>
    );
};

const FileUploadListDialog = asDialog({
    title: 'File Uploads',
    description: 'The following files are being uploaded to your server.',
})(FileUploadList);

const FileManagerStatus = () => {
    const [open, setOpen] = useState(false);

    const count = ServerContext.useStoreState((state) => Object.keys(state.files.uploads).length);
    const hasErrors = ServerContext.useStoreState((state) =>
        Object.values(state.files.uploads).some((u) => (u as any).error),
    );
    const allDone = ServerContext.useStoreState((state) =>
        Object.keys(state.files.uploads).length > 0 &&
        Object.values(state.files.uploads).every((u) => !(u as any).error && u.loaded >= u.total),
    );

    useEffect(() => {
        if (count === 0) {
            setOpen(false);
        }
    }, [count]);

    return (
        <>
            {count > 0 && (
                <ActionButton
                    variant='secondary'
                    size='sm'
                    className={`w-10 h-10 p-0 ${hasErrors ? '!border-red-400/50 !text-red-400' : ''}`}
                    onClick={() => setOpen(true)}
                    title={
                        hasErrors
                            ? `${count} files, some failed - click to view`
                            : allDone
                              ? 'All uploads complete'
                              : `${count} files uploading, click to view`
                    }
                >
                    {hasErrors ? (
                        <svg className='h-4 w-4' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
                            <path d='M12 9v5M12 17h.01' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
                            <path d='M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z' stroke='currentColor' strokeWidth='2' strokeLinejoin='round' />
                        </svg>
                    ) : allDone ? (
                        <CircleCheck className='h-5 w-5 text-green-400' />
                    ) : (
                        <svg className='animate-spin h-5 w-5 text-white' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'>
                            <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                            <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' />
                        </svg>
                    )}
                </ActionButton>
            )}
            <FileUploadListDialog open={open} onClose={() => setOpen(false)} />
        </>
    );
};

export default FileManagerStatus;
