import { DependencyResolution } from '@/api/server/mods/dependencies';

import ActionButton from '@/components/elements/ActionButton';

interface Props {
    /**
     * Name of the mod the user is about to install/update. Used in the
     * banner text so the prompt reads naturally.
     */
    targetName: string;
    resolution: DependencyResolution;
    /** Resolved display names for each missing-required dep (modId → name). */
    requiredNames: Record<string, string>;
    onConfirm: () => void;
    onCancel: () => void;
    busy?: boolean;
}

const DependencyDialog = ({ targetName, resolution, requiredNames, onConfirm, onCancel, busy }: Props) => {
    if (resolution.incompatibleInstalled.length > 0) {
        return (
            <div className='flex flex-col gap-4'>
                <div>
                    <h3 className='text-base font-semibold text-zinc-100 mb-2'>Incompatible mods installed</h3>
                    <p className='text-sm text-zinc-400 leading-relaxed'>
                        <span className='text-zinc-200'>{targetName}</span> declares the following installed mods as
                        incompatible. Remove them before installing this version.
                    </p>
                </div>
                <ul className='text-sm text-zinc-300 list-disc pl-5 space-y-1'>
                    {resolution.incompatibleInstalled.map((d) => (
                        <li key={d.modId ?? d.versionId ?? Math.random()}>
                            {requiredNames[d.modId ?? ''] ?? d.modId ?? 'unknown mod'}
                        </li>
                    ))}
                </ul>
                <div className='flex justify-end gap-3 pt-2'>
                    <ActionButton variant='secondary' onClick={onCancel} disabled={busy}>
                        Dismiss
                    </ActionButton>
                </div>
            </div>
        );
    }

    return (
        <div className='flex flex-col gap-4'>
            <div>
                <h3 className='text-base font-semibold text-zinc-100 mb-2'>Install required dependencies?</h3>
                <p className='text-sm text-zinc-400 leading-relaxed'>
                    <span className='text-zinc-200'>{targetName}</span> requires the following mods that aren’t
                    installed yet. We’ll install the latest compatible version of each alongside it.
                </p>
            </div>
            <ul className='text-sm text-zinc-300 list-disc pl-5 space-y-1'>
                {resolution.missingRequired.map((d) => (
                    <li key={d.modId ?? d.versionId ?? Math.random()}>
                        {requiredNames[d.modId ?? ''] ?? d.modId ?? 'unknown mod'}
                    </li>
                ))}
            </ul>
            {resolution.missingOptional.length > 0 && (
                <p className='text-xs text-zinc-500'>
                    {resolution.missingOptional.length} optional dependenc
                    {resolution.missingOptional.length === 1 ? 'y is' : 'ies are'} not installed and will be skipped.
                </p>
            )}
            <div className='flex justify-end gap-3 pt-2'>
                <ActionButton variant='secondary' onClick={onCancel} disabled={busy}>
                    Cancel
                </ActionButton>
                <ActionButton onClick={onConfirm} disabled={busy}>
                    {busy ? 'Installing…' : 'Install all'}
                </ActionButton>
            </div>
        </div>
    );
};

export default DependencyDialog;
