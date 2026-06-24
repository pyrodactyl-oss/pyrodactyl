import { AntennaSignal, Check, Copy, CrownDiamond, TrashBin, Xmark } from '@gravity-ui/icons';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import isEqual from 'react-fast-compare';
import type { Allocation } from '@/api/server/getServer';
import deleteServerAllocation from '@/api/server/network/deleteServerAllocation';
import setPrimaryServerAllocation from '@/api/server/network/setPrimaryServerAllocation';
import setServerAllocationNotes from '@/api/server/network/setServerAllocationNotes';
import getServerAllocations from '@/api/swr/getServerAllocations';
import ActionButton from '@/components/elements/ActionButton';
import Can from '@/components/elements/Can';
import CopyOnClick from '@/components/elements/CopyOnClick';
import { Dialog } from '@/components/elements/dialog';
import { Textarea } from '@/components/elements/Input';
import InputSpinner from '@/components/elements/InputSpinner';
import { PageListItem } from '@/components/elements/pages/PageList';
import Spinner from '@/components/elements/Spinner';
import { ip } from '@/lib/formatters';
import { useFlashKey } from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';

interface Props {
    allocation: Allocation;
}

const AllocationRow = ({ allocation }: Props) => {
    const [loading, setLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [isEditingNotes, setIsEditingNotes] = useState(false);
    const [notesValue, setNotesValue] = useState(allocation.notes || '');
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const { clearFlashes, clearAndAddHttpError } = useFlashKey('server:network');
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { mutate } = getServerAllocations();

    const onNotesChanged = useCallback(
        (id: number, notes: string) => {
            mutate((data) => data?.map((a) => (a.id === id ? { ...a, notes } : a)), false);
        },
        [mutate],
    );

    const saveNotes = useCallback(() => {
        setLoading(true);
        clearFlashes();

        setServerAllocationNotes(uuid, allocation.id, notesValue)
            .then(() => {
                onNotesChanged(allocation.id, notesValue);
                setIsEditingNotes(false);
            })
            .catch((error) => clearAndAddHttpError(error))
            .then(() => setLoading(false));
    }, [uuid, allocation.id, notesValue, onNotesChanged, clearFlashes, clearAndAddHttpError]);

    const cancelEdit = useCallback(() => {
        setNotesValue(allocation.notes || '');
        setIsEditingNotes(false);
    }, [allocation.notes]);

    const startEdit = useCallback(() => {
        setIsEditingNotes(true);
        setTimeout(() => textareaRef.current?.focus(), 0);
    }, []);

    useEffect(() => {
        setNotesValue(allocation.notes || '');
    }, [allocation.notes]);

    // Format the full allocation string for copying
    const allocationString = allocation.alias
        ? `${allocation.alias}:${allocation.port}`
        : `${ip(allocation.ip)}:${allocation.port}`;

    const setPrimaryAllocation = () => {
        clearFlashes();
        mutate((data) => data?.map((a) => ({ ...a, isDefault: a.id === allocation.id })), false);

        setPrimaryServerAllocation(uuid, allocation.id).catch((error) => {
            clearAndAddHttpError(error);
            mutate();
        });
    };

    const deleteAllocation = () => {
        setShowDeleteDialog(false);
        clearFlashes();
        setDeleteLoading(true);

        deleteServerAllocation(uuid, allocation.id)
            .then(() => {
                mutate((data) => data?.filter((a) => a.id !== allocation.id), false);
            })
            .catch((error) => clearAndAddHttpError(error))
            .then(() => setDeleteLoading(false));
    };

    return (
        <PageListItem>
            <div className='flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
                <div className='min-w-0 flex-1'>
                    <div className='mb-3 flex items-center gap-3'>
                        <div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#ffffff11]'>
                            <AntennaSignal className='text-zinc-400' fill='currentColor' height={22} width={22} />
                        </div>
                        <div className='min-w-0 flex-1'>
                            <div className='flex flex-wrap items-center gap-2'>
                                <CopyOnClick text={allocationString}>
                                    <div className='group flex cursor-pointer items-center gap-2 transition-colors hover:text-zinc-50'>
                                        <h3 className='truncate font-medium font-mono text-base text-zinc-100'>
                                            {allocation.alias ? allocation.alias : ip(allocation.ip)}:{allocation.port}
                                        </h3>
                                        <Copy
                                            className='text-zinc-500 transition-colors group-hover:text-zinc-400'
                                            fill='currentColor'
                                            height={22}
                                            width={22}
                                        />
                                    </div>
                                </CopyOnClick>
                                {allocation.isDefault && (
                                    <span className='flex items-center gap-1 rounded bg-brand/10 px-2 py-1 font-medium text-brand text-xs'>
                                        <CrownDiamond className='' fill='currentColor' height={22} width={22} />
                                        Primary
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Notes Section - Inline Editable */}
                    <div className='mt-3'>
                        <p className='mb-2 text-xs text-zinc-500 uppercase tracking-wide'>Notes</p>

                        {isEditingNotes ? (
                            <div className='space-y-2'>
                                <InputSpinner visible={loading}>
                                    <Textarea
                                        className='w-full resize-none rounded-lg border border-[#ffffff08] bg-[#ffffff06] p-3 text-sm text-zinc-300 placeholder-zinc-500 transition-all focus:border-[#ffffff20] focus:ring-1 focus:ring-[#ffffff20]'
                                        onChange={(e) => setNotesValue(e.currentTarget.value)}
                                        placeholder='Add notes for this allocation...'
                                        ref={textareaRef}
                                        rows={3}
                                        value={notesValue}
                                    />
                                </InputSpinner>
                                <div className='flex items-center gap-2'>
                                    <ActionButton disabled={loading} onClick={saveNotes} size='sm' variant='primary'>
                                        {loading ? (
                                            <Spinner size='small' />
                                        ) : (
                                            <Check className='mr-1 h-3 w-3' fill='currentColor' />
                                        )}
                                        Save
                                    </ActionButton>
                                    <ActionButton disabled={loading} onClick={cancelEdit} size='sm' variant='secondary'>
                                        <Xmark className='mr-1' fill='currentColor' height={22} width={22} />
                                        Cancel
                                    </ActionButton>
                                </div>
                            </div>
                        ) : (
                            <Can action={'allocation.update'}>
                                <div
                                    className={`min-h-[2.5rem] cursor-pointer rounded-lg border border-[#ffffff08] bg-[#ffffff03] p-3 transition-colors hover:border-[#ffffff15] ${allocation.notes ? 'text-sm text-zinc-300' : 'text-sm text-zinc-500 italic'}`}
                                    onClick={startEdit}
                                >
                                    {allocation.notes || 'Click to add notes...'}
                                </div>
                            </Can>
                        )}
                    </div>
                </div>

                <div className='flex items-center justify-center gap-2 sm:flex-col sm:gap-3'>
                    <Can action={'allocation.update'}>
                        <ActionButton
                            disabled={allocation.isDefault}
                            onClick={setPrimaryAllocation}
                            size='sm'
                            title={
                                allocation.isDefault
                                    ? 'This is already the primary allocation'
                                    : 'Make this the primary allocation'
                            }
                            variant='secondary'
                        >
                            <CrownDiamond className='mr-1' fill='currentColor' height={22} width={22} />
                            <span className='hidden sm:inline'>Make Primary</span>
                            <span className='sm:hidden'>Primary</span>
                        </ActionButton>
                    </Can>
                    <Can action={'allocation.delete'}>
                        <ActionButton
                            disabled={allocation.isDefault || deleteLoading}
                            onClick={() => setShowDeleteDialog(true)}
                            size='sm'
                            title={
                                allocation.isDefault ? 'Cannot delete the primary allocation' : 'Delete this allocation'
                            }
                            variant='danger'
                        >
                            {deleteLoading ? (
                                <Spinner size='small' />
                            ) : (
                                <TrashBin className='mr-1' fill='currentColor' height={22} width={22} />
                            )}
                            <span className='hidden sm:inline'>Delete</span>
                        </ActionButton>
                    </Can>
                </div>
            </div>
            <Dialog.Confirm
                confirm={'Delete'}
                onClose={() => setShowDeleteDialog(false)}
                onConfirmed={deleteAllocation}
                open={showDeleteDialog}
                title={'Delete Allocation'}
            >
                Are you sure you want to delete this allocation? This action cannot be undone.
            </Dialog.Confirm>
        </PageListItem>
    );
};

export default memo(AllocationRow, isEqual);
