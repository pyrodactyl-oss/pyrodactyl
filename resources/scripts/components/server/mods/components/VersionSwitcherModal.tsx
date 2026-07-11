import { Dialog as HDialog } from '@headlessui/react';
import { CircleExclamation, FileText, Magnifier, Xmark } from '@gravity-ui/icons';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';

import ActionButton from '@/components/elements/ActionButton';
import { Checkbox } from '@/components/elements/CheckboxNew';

import { isCompatible } from '@/api/server/mods/compat';
import { ModSummary, ModVersion, ProjectType } from '@/api/server/mods/types';

import Markdown from './Markdown';

interface Props {
    visible: boolean;
    project: ModSummary | null;
    /** The version currently installed for this project. */
    currentVersion: ModVersion | null;
    /**
     * Optional override for which version is highlighted when the modal
     * opens. Used by the "update available" path: clicking the red
     * switch-version button on a row with an update pending pre-selects
     * the latest compatible version instead of the currently-installed
     * one, so the user can read its changelog and confirm with one click.
     * Defaults to `currentVersion.id` when null/missing.
     */
    preselectedVersionId?: string | null;
    /** Server-compatible versions, newest first. `null` = still loading. */
    versions: ModVersion[] | null;
    /** Every published version. Loaded lazily when the user toggles "show all". */
    allVersions: ModVersion[] | 'loading' | null;
    /** What "compatible" means for this server right now. */
    constraints: { loader: string; minecraftVersion: string; projectType: ProjectType };
    onSwitchVersion: (version: ModVersion) => void;
    onLoadAllVersions: () => void;
    onDismiss: () => void;
    busy?: boolean;
}

const channelColorFor = (versionType: string): string => {
    switch (versionType) {
        case 'release':
            return 'bg-green-500/20 text-green-300 border-green-500/40';
        case 'beta':
            return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
        case 'alpha':
            return 'bg-red-500/20 text-red-300 border-red-500/40';
        default:
            return 'bg-zinc-500/20 text-zinc-300 border-zinc-500/40';
    }
};

const channelLetterFor = (versionType: string): string => versionType.charAt(0).toUpperCase() || '?';

const formatDate = (iso: string): string => {
    try {
        return new Date(iso).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    } catch {
        return iso;
    }
};

const panelVariants = {
    open: {
        scale: 1,
        opacity: 1,
        transition: { type: 'spring', damping: 22, stiffness: 280, duration: 0.18 },
    },
    closed: {
        scale: 0.92,
        opacity: 0,
        transition: { type: 'easeIn', duration: 0.12 },
    },
};

/**
 * Modrinth-style version switcher modal. Built as a bespoke HeadlessUI dialog
 * rather than wrapping the panel-wide `<Modal>` component because that one
 * caps width at `max-w-xl` (576px) and we want a 1:2 (versions | details)
 * layout that needs ~800px of horizontal room on desktop.
 *
 * Layout contract: the panel itself never scrolls — only the two inner
 * scroll regions do (version list on the left, changelog on the right).
 */
const VersionSwitcherModal = ({
    visible,
    project,
    currentVersion,
    preselectedVersionId,
    versions,
    allVersions,
    constraints,
    onSwitchVersion,
    onLoadAllVersions,
    onDismiss,
    busy,
}: Props) => {
    const [search, setSearch] = useState('');
    const [showAll, setShowAll] = useState(false);
    const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

    // When the modal opens, snap the selection to whichever version the
    // caller wants highlighted first. Callers pass `preselectedVersionId`
    // for the "update available" flow (the latest compatible version);
    // everything else falls through to the currently-installed version so
    // the user lands on relevant content.
    useEffect(() => {
        if (visible) {
            setSelectedVersionId(preselectedVersionId ?? currentVersion?.id ?? null);
            setShowAll(false);
            setSearch('');
        }
    }, [visible, preselectedVersionId, currentVersion?.id]);

    // Lazy-load the all-versions list the first time the user opts in.
    useEffect(() => {
        if (showAll && allVersions === null) onLoadAllVersions();
    }, [showAll, allVersions, onLoadAllVersions]);

    const sourceVersions = useMemo<ModVersion[] | null>(() => {
        if (showAll) {
            return Array.isArray(allVersions) ? allVersions : null;
        }
        return versions;
    }, [showAll, versions, allVersions]);

    const filteredVersions = useMemo(() => {
        const list = sourceVersions ?? [];
        const needle = search.trim().toLowerCase();
        if (!needle) return list;
        return list.filter((v) =>
            [v.versionNumber, v.name, ...v.gameVersions, ...v.loaders]
                .filter(Boolean)
                .some((value) => value!.toLowerCase().includes(needle)),
        );
    }, [sourceVersions, search]);

    const selectedVersion = useMemo<ModVersion | null>(() => {
        if (!selectedVersionId) return null;
        const all = sourceVersions ?? [];
        const found = all.find((v) => v.id === selectedVersionId);
        return found ?? filteredVersions[0] ?? null;
    }, [selectedVersionId, sourceVersions, filteredVersions]);

    const compatibleHere = (v: ModVersion) =>
        isCompatible(v, {
            loaders: constraints.projectType === 'datapack' ? [] : [constraints.loader],
            gameVersion: constraints.minecraftVersion,
            projectType: constraints.projectType,
        });
    const selectedIsCompatible = !!selectedVersion && compatibleHere(selectedVersion);
    const selectedIsCurrent = !!currentVersion && selectedVersion?.id === currentVersion.id;
    const switchDisabled = !selectedVersion || selectedIsCurrent || busy;

    useEffect(() => {
        if (filteredVersions.length === 0) return;
        if (!filteredVersions.some((v) => v.id === selectedVersionId)) {
            setSelectedVersionId(filteredVersions[0]!.id);
        }
    }, [filteredVersions, selectedVersionId]);

    return (
        <AnimatePresence>
            {visible && (
                <HDialog
                    static
                    open={visible}
                    onClose={() => !busy && onDismiss()}
                    as={motion.div}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                >
                    {/* Backdrop */}
                    <div
                        aria-hidden
                        className='fixed inset-0 z-9997 backdrop-blur-xs'
                        style={{
                            background:
                                'radial-gradient(50% 50% at 50% 50%, rgba(0, 0, 0, 0.42) 0%, rgba(0, 0, 0, 0.94) 100%)',
                        }}
                    />

                    {/* Panel wrapper. Uses flex+padding so the panel is
                        centered AND its height stays bounded — we want the
                        dialog as a whole to be capped at ~90vh so the user
                        never has to scroll the outer page to see the footer. */}
                    <div className='fixed inset-0 z-9998 flex items-center justify-center p-3 sm:p-6'>
                        <HDialog.Panel
                            as={motion.div}
                            initial='closed'
                            animate='open'
                            exit='closed'
                            variants={panelVariants}
                            // Fixed dialog dimensions on desktop so the panel
                            // doesn't grow/shrink between mods. h-[80vh]
                            // anchors a generous size that's tall enough to
                            // breathe but never overflows the viewport. On
                            // narrow screens we fall back to the natural
                            // height bounded by max-h-[90vh].
                            className='relative flex w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[#ffffff10] bg-[radial-gradient(50%_50%_at_50%_50%,rgba(0,0,0,0.5)_0%,rgba(0,0,0,0.94)_100%)] shadow-2xl backdrop-blur-3xl max-h-[90vh] md:h-[80vh] md:max-h-[80vh]'
                        >
                            {/* Header — fixed height, doesn't scroll. */}
                            <div className='flex shrink-0 items-center gap-3 border-b border-[#ffffff10] px-5 py-4'>
                                <div className='flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[#ffffff14] bg-[#ffffff0d]'>
                                    {project?.iconUrl ? (
                                        <img src={project.iconUrl} alt='' className='h-full w-full object-cover' />
                                    ) : (
                                        <span className='text-[10px] font-semibold text-zinc-500'>JAR</span>
                                    )}
                                </div>
                                <div className='min-w-0 flex-1'>
                                    <h2 className='truncate text-base font-bold text-zinc-100'>Switch version</h2>
                                    {project && (
                                        <p className='truncate text-xs text-zinc-400'>
                                            {project.title}
                                            {project.author && (
                                                <span className='text-zinc-500'> · by {project.author}</span>
                                            )}
                                        </p>
                                    )}
                                </div>
                                <button
                                    type='button'
                                    onClick={() => !busy && onDismiss()}
                                    aria-label='Close'
                                    className='ml-auto inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-400 transition hover:bg-[#ffffff10] hover:text-white'
                                >
                                    <Xmark width={18} height={18} />
                                </button>
                            </div>

                            {/* Body — fills remaining space, hosts the two
                                independently scrollable panels. min-h-0 is
                                load-bearing: without it the inner
                                overflow-y-auto regions would expand the
                                parent past max-h-[90vh]. */}
                            <div className='flex min-h-0 flex-1 flex-col gap-3 p-4 md:flex-row md:gap-4'>
                                {/* Left rail — version list. 1/3 width on
                                    desktop, full width on mobile (stacked).
                                    Internal scroll only. */}
                                <div className='flex min-h-0 flex-col gap-2 md:w-1/3 md:shrink-0'>
                                    <div className='relative shrink-0'>
                                        <Magnifier
                                            width={16}
                                            height={16}
                                            className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500'
                                        />
                                        <input
                                            type='text'
                                            value={search}
                                            onChange={(e) => setSearch(e.currentTarget.value)}
                                            placeholder='Search version…'
                                            className='w-full rounded-md border border-[#ffffff14] bg-[#0d0d10] py-2 pl-9 pr-8 text-sm text-zinc-100 outline-hidden transition focus:border-brand/60'
                                        />
                                        {search && (
                                            <button
                                                type='button'
                                                aria-label='Clear search'
                                                onClick={() => setSearch('')}
                                                className='absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-400 hover:text-white'
                                            >
                                                <Xmark width={14} height={14} />
                                            </button>
                                        )}
                                    </div>

                                    <div className='flex max-h-72 min-h-0 flex-col gap-1 overflow-y-auto md:max-h-none md:flex-1'>
                                        {sourceVersions === null ? (
                                            <div className='flex items-center justify-center py-12'>
                                                <div className='h-6 w-6 animate-spin rounded-full border-b-2 border-brand'></div>
                                            </div>
                                        ) : filteredVersions.length === 0 ? (
                                            <p className='px-2 py-6 text-center text-xs text-zinc-500'>
                                                {sourceVersions.length === 0
                                                    ? showAll
                                                        ? 'This project has no published versions.'
                                                        : `No versions compatible with ${constraints.projectType === 'datapack' ? `Minecraft ${constraints.minecraftVersion}` : `${constraints.loader} ${constraints.minecraftVersion}`}.`
                                                    : 'No versions match your search.'}
                                            </p>
                                        ) : (
                                            filteredVersions.map((version) => {
                                                const isCurrent =
                                                    !!currentVersion && version.id === currentVersion.id;
                                                const isSelected = selectedVersion?.id === version.id;
                                                const compatible = compatibleHere(version);
                                                return (
                                                    <button
                                                        key={version.id}
                                                        type='button'
                                                        onClick={() => setSelectedVersionId(version.id)}
                                                        className={clsx(
                                                            'flex items-center gap-3 rounded-md border px-3 py-2 text-left text-sm transition',
                                                            isSelected
                                                                ? 'border-brand/60 bg-brand/15 text-zinc-100'
                                                                : 'border-transparent hover:border-[#ffffff18] hover:bg-[#ffffff08] text-zinc-300',
                                                        )}
                                                    >
                                                        <span
                                                            className={clsx(
                                                                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold',
                                                                channelColorFor(version.versionType),
                                                            )}
                                                            title={version.versionType}
                                                        >
                                                            {channelLetterFor(version.versionType)}
                                                        </span>
                                                        <span className='flex min-w-0 flex-1 flex-col'>
                                                            <span className='flex items-center gap-2'>
                                                                <span className='truncate font-medium'>
                                                                    {version.versionNumber}
                                                                </span>
                                                                {isCurrent && (
                                                                    <span className='shrink-0 rounded-full bg-[#ffffff14] px-1.5 py-0.5 text-[10px] font-bold uppercase text-zinc-300'>
                                                                        current
                                                                    </span>
                                                                )}
                                                            </span>
                                                            {!compatible && showAll && (
                                                                <span className='text-[10px] uppercase tracking-wide text-yellow-300'>
                                                                    Incompatible
                                                                </span>
                                                            )}
                                                        </span>
                                                    </button>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>

                                {/* Right pane — details. 2/3 width on desktop,
                                    independent scroll. */}
                                <div className='flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-[#ffffff10] bg-[#ffffff04]'>
                                    {selectedVersion ? (
                                        <div className='flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4'>
                                            <div className='flex flex-wrap items-center justify-between gap-2'>
                                                <div className='min-w-0'>
                                                    <div className='flex flex-wrap items-center gap-2'>
                                                        <h3 className='truncate text-lg font-semibold text-zinc-100'>
                                                            {selectedVersion.versionNumber}
                                                        </h3>
                                                        <span
                                                            className={clsx(
                                                                'rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                                                                channelColorFor(selectedVersion.versionType),
                                                            )}
                                                        >
                                                            {selectedVersion.versionType}
                                                        </span>
                                                    </div>
                                                    {selectedVersion.name && (
                                                        <p className='mt-1 text-xs text-zinc-400'>
                                                            {selectedVersion.name}
                                                        </p>
                                                    )}
                                                </div>
                                                <p className='shrink-0 text-xs text-zinc-500'>
                                                    {formatDate(selectedVersion.datePublished)}
                                                </p>
                                            </div>

                                            {!selectedIsCompatible && (
                                                <div className='flex items-start gap-2 rounded-md border border-yellow-500/40 bg-yellow-500/10 p-3 text-xs text-yellow-100'>
                                                    <CircleExclamation
                                                        width={14}
                                                        height={14}
                                                        className='mt-0.5 shrink-0'
                                                    />
                                                    <p>
                                                        This version isn’t marked compatible with{' '}
                                                        <span className='font-semibold'>
                                                            {constraints.projectType === 'datapack'
                                                                ? `Minecraft ${constraints.minecraftVersion}`
                                                                : `${constraints.loader} ${constraints.minecraftVersion}`}
                                                        </span>
                                                        . Installing it anyway may break your server.
                                                    </p>
                                                </div>
                                            )}

                                            <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                                                <div>
                                                    <p className='text-[10px] font-semibold uppercase tracking-wide text-zinc-500'>
                                                        Minecraft
                                                    </p>
                                                    <p className='mt-1 break-words text-xs text-zinc-200'>
                                                        {selectedVersion.gameVersions.join(', ') || '—'}
                                                    </p>
                                                </div>
                                                {selectedVersion.loaders.length > 0 && (
                                                    <div>
                                                        <p className='text-[10px] font-semibold uppercase tracking-wide text-zinc-500'>
                                                            Loaders
                                                        </p>
                                                        <p className='mt-1 break-words text-xs text-zinc-200'>
                                                            {selectedVersion.loaders.join(', ')}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            {selectedVersion.changelog && (
                                                <div className='flex min-h-0 flex-1 flex-col'>
                                                    <div className='flex items-center gap-2 text-xs text-zinc-400'>
                                                        <FileText width={14} height={14} />
                                                        <span className='font-semibold uppercase tracking-wide'>
                                                            Changelog
                                                        </span>
                                                    </div>
                                                    <Markdown className='mt-2 flex-1 rounded-md border border-[#ffffff0e] bg-[#0a0a0c] p-3 text-xs'>
                                                        {selectedVersion.changelog}
                                                    </Markdown>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className='flex h-full items-center justify-center p-6 text-center text-xs text-zinc-500'>
                                            Select a version on the left to see its details.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer — fixed at the bottom of the panel.
                                Stacks on narrow screens; row on sm+ so the
                                action buttons stay on the right where users
                                expect them. */}
                            <div className='flex shrink-0 flex-col gap-3 border-t border-[#ffffff10] px-4 py-3 sm:flex-row sm:items-center sm:justify-between'>
                                <div className='flex flex-col gap-2'>
                                    <label className='inline-flex items-center gap-2 text-xs text-zinc-300'>
                                        <Checkbox
                                            checked={showAll}
                                            onCheckedChange={(checked) => setShowAll(checked === true)}
                                            aria-label='Show incompatible versions'
                                        />
                                        Show incompatible
                                    </label>
                                    <p className='flex items-start gap-2 text-xs text-yellow-300/90'>
                                        <CircleExclamation width={13} height={13} className='mt-0.5 shrink-0' />
                                        Updating can break your instance. Review version changelogs and back up first.
                                    </p>
                                </div>
                                <div className='flex shrink-0 items-center gap-2'>
                                    <ActionButton variant='secondary' size='sm' onClick={onDismiss} disabled={busy}>
                                        <Xmark width={14} height={14} className='mr-1' />
                                        Cancel
                                    </ActionButton>
                                    <ActionButton
                                        size='sm'
                                        disabled={switchDisabled}
                                        onClick={() => selectedVersion && onSwitchVersion(selectedVersion)}
                                    >
                                        Switch to {selectedVersion?.versionNumber ?? '…'}
                                    </ActionButton>
                                </div>
                            </div>
                        </HDialog.Panel>
                    </div>
                </HDialog>
            )}
        </AnimatePresence>
    );
};

export default VersionSwitcherModal;
