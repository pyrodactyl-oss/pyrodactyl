import {
    ArrowDownToLine,
    ArrowUpArrowDown,
    ArrowUpRightFromSquare,
    CircleExclamation,
    EllipsisVertical,
    FolderOpen,
    Person,
    Power,
    TrashBin,
} from '@gravity-ui/icons';
import clsx from 'clsx';
import { NavLink } from 'react-router-dom';

import { Checkbox } from '@/components/elements/CheckboxNew';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/elements/DropdownMenu';
import { Switch } from '@/components/elements/SwitchV2';

import { compareVersionStrings } from '@/api/server/mods/compat';

import { InstalledEntry } from '../state';

interface Props {
    entry: InstalledEntry;
    updateAvailable: boolean;
    selected: boolean;
    /** True if the installed version still satisfies the server's loader + MC version. */
    versionCompatible: boolean;
    /** URL to navigate to in-panel for this mod's detail page. */
    detailPath?: string;
    onSelect: (selected: boolean) => void;
    onUpdate: () => void;
    onRemove: () => void;
    onOpenVersionSwitcher: () => void;
    onToggleEnabled: (enabled: boolean) => void;
    onShowInFiles?: () => void;
    busy?: boolean;
    actionsDisabled?: boolean;
    disabledReason?: string;
}

const filenameFromPath = (path: string): string => path.split('/').pop() ?? path;
const cleanFilename = (path: string): string => filenameFromPath(path).replace(/\.disabled$/i, '');

const displayTitle = (entry: InstalledEntry): string => {
    if (entry.kind === 'identified') return entry.identified.project.title;
    if (entry.name) return entry.name;
    return cleanFilename(entry.path).replace(/\.jar$/i, '');
};

/**
 * Collapse a list of MC versions into a short readable summary.
 * For "1.20.1, 1.20.2, 1.20.3" we show "1.20.1 – 1.20.3" so the cell stays
 * scannable on a row that already has four columns to fit.
 */
const summarizeGameVersions = (versions: string[]): string => {
    if (versions.length === 0) return '—';
    if (versions.length === 1) return versions[0]!;
    if (versions.length === 2) return versions.join(', ');
    // Heuristic: show the oldest → newest of the supported range. We have
    // to use the natural-order comparator because plain JS sort is a string
    // compare and would put `1.21.10` before `1.21.2`.
    const sorted = [...versions].sort(compareVersionStrings);
    return `${sorted[0]} – ${sorted[sorted.length - 1]}`;
};

const ModRow = ({
    entry,
    updateAvailable,
    selected,
    versionCompatible,
    detailPath,
    onSelect,
    onUpdate,
    onRemove,
    onOpenVersionSwitcher,
    onToggleEnabled,
    onShowInFiles,
    busy,
    actionsDisabled,
    disabledReason,
}: Props) => {
    const identified = entry.kind === 'identified' ? entry.identified : null;
    const title = displayTitle(entry);
    const iconUrl = identified?.project.iconUrl ?? null;
    const currentVersionLabel =
        identified?.version.versionNumber ??
        (entry.kind === 'unidentified' ? (entry.version ?? null) : null) ??
        'Unknown';
    /**
     * URL of the installed version's page on modrinth.com. Modrinth
     * accepts either the version_number (cleaner — what their own UI
     * surfaces) or the internal id; we prefer the version_number so
     * the link reads like `/mod/sodium/version/mc1.21.5-0.6.13-fabric`
     * instead of an opaque hash. Null for unidentified jars — there's
     * no canonical Modrinth page to link to.
     */
    const versionUrl = identified
        ? `${identified.project.projectUrl}/version/${encodeURIComponent(identified.version.versionNumber || identified.version.id)}`
        : null;
    const author = identified?.project.author ?? null;
    const authorUrl = identified?.project.authorUrl ?? null;
    const authorAvatarUrl = identified?.project.authorAvatarUrl ?? null;
    const actionTitle = actionsDisabled ? disabledReason : undefined;
    const gameVersions = identified?.version.gameVersions ?? [];
    const gameVersionsLabel = summarizeGameVersions(gameVersions);
    const versionSwitcherEnabled = !!identified;

    // When a mod is disabled we visually dim the informational columns
    // (project, version, MC versions) so the user immediately sees it's
    // off — but the controls column stays at full opacity. Greying the
    // toggle would make the row look broken when the user wants to
    // re-enable it.
    const dimmedClass = !entry.enabled ? 'opacity-55' : '';

    return (
        <div
            className={clsx(
                'flex items-center gap-3 border border-[#ffffff07] bg-[#ffffff08] p-2 sm:p-3 transition first:rounded-t-md last:rounded-b-md',
                'hover:bg-[#ffffff12] hover:duration-0',
                selected && 'bg-brand/10! border-brand/30',
            )}
        >
            <Checkbox
                className={clsx('ml-1 shrink-0', dimmedClass)}
                checked={selected}
                onCheckedChange={(checked) => onSelect(checked === true)}
                aria-label={selected ? `Deselect ${title}` : `Select ${title}`}
            />

            {/* Column 1 — Project: icon, title (link to detail), author w/ avatar.
                Always rendered. Takes the lion's share of horizontal space. */}
            <div className={clsx('flex min-w-0 flex-1 items-center gap-3', dimmedClass)}>
                <div className='flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[#ffffff14] bg-[#ffffff0d] sm:h-14 sm:w-14'>
                    {iconUrl ? (
                        <img src={iconUrl} alt='' className='h-full w-full object-cover' />
                    ) : (
                        <span className='text-[10px] font-semibold text-zinc-500'>JAR</span>
                    )}
                </div>
                <div className='min-w-0'>
                    {/* Title row — `flex` (no wrap) so pills appearing or
                        disappearing never push the title to a second line.
                        The title itself is min-w-0 + truncate so it
                        gracefully shrinks when a pill needs room. */}
                    <div className='flex min-w-0 items-center gap-2'>
                        {detailPath ? (
                            <NavLink
                                to={detailPath}
                                className='min-w-0 truncate text-sm font-semibold text-zinc-100 hover:underline'
                                title={title}
                            >
                                {title}
                            </NavLink>
                        ) : (
                            <span className='min-w-0 truncate text-sm font-semibold text-zinc-100' title={title}>
                                {title}
                            </span>
                        )}
                        {updateAvailable && (
                            <span className='shrink-0 rounded-full bg-brand/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand'>
                                Update
                            </span>
                        )}
                        {!identified && (
                            <span className='shrink-0 rounded-full bg-[#ffffff12] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-400'>
                                Local
                            </span>
                        )}
                    </div>
                    {author && authorUrl ? (
                        <a
                            href={authorUrl}
                            target='_blank'
                            rel='noreferrer'
                            className='mt-1 inline-flex max-w-full items-center gap-1.5 text-xs text-zinc-400 hover:text-white'
                            title={`View ${author} on Modrinth`}
                        >
                            {authorAvatarUrl ? (
                                <img
                                    src={authorAvatarUrl}
                                    alt=''
                                    className='h-4 w-4 shrink-0 rounded-full border border-[#ffffff10] object-cover'
                                />
                            ) : (
                                <Person width={12} height={12} className='shrink-0 text-zinc-500' />
                            )}
                            <span className='truncate'>{author}</span>
                        </a>
                    ) : (
                        <p className='mt-1 truncate text-xs text-zinc-500'>
                            {entry.kind === 'unidentified' && entry.modId ? entry.modId : 'Unknown author'}
                        </p>
                    )}
                </div>
            </div>

            {/* Column 2 — Version: installed version + on-disk filename.
                flex-1 with a sane min so the leftover space is shared evenly
                between this column and the MC-versions column. Hidden below
                md (file column collapses into the project column on small
                screens). */}
            <div className={clsx('hidden min-w-0 flex-1 basis-0 flex-col md:flex', dimmedClass)}>
                {versionUrl ? (
                    <a
                        href={versionUrl}
                        target='_blank'
                        rel='noreferrer'
                        title={`Open ${currentVersionLabel} on Modrinth`}
                        className='truncate text-sm font-medium text-zinc-100 hover:text-brand hover:underline'
                    >
                        {currentVersionLabel}
                    </a>
                ) : (
                    <span className='truncate text-sm font-medium text-zinc-100' title={currentVersionLabel}>
                        {currentVersionLabel}
                    </span>
                )}
                <span className='truncate font-mono text-[11px] text-zinc-500' title={filenameFromPath(entry.path)}>
                    {filenameFromPath(entry.path)}
                </span>
            </div>

            {/* Column 3 — MC versions: which MC versions the installed build
                supports, with a warning icon when none of them match the
                server's actual MC version. Hidden below xl (was lg) — at
                ~50-75% viewport width with the dashboard sidebar visible
                this was the column eating the most horizontal space and
                forcing horizontal overflow before the lg breakpoint
                kicked in. */}
            <div
                className={clsx(
                    'hidden min-w-0 flex-1 basis-0 items-center gap-1.5 xl:flex',
                    dimmedClass,
                )}
            >
                {identified ? (
                    <>
                        {!versionCompatible && (
                            <span
                                className='inline-flex shrink-0'
                                title='This version is not marked compatible with the server.'
                            >
                                <CircleExclamation width={14} height={14} className='text-yellow-400' />
                            </span>
                        )}
                        <span
                            className={clsx(
                                'truncate text-xs',
                                versionCompatible ? 'text-zinc-300' : 'text-yellow-200',
                            )}
                            title={gameVersions.join(', ')}
                        >
                            {gameVersionsLabel}
                        </span>
                    </>
                ) : (
                    <span className='text-xs text-zinc-500'>—</span>
                )}
            </div>

            {/* Column 4 — Controls: switch version button, enable toggle, more menu. */}
            <div className='flex shrink-0 items-center gap-1.5'>
                <button
                    type='button'
                    className={clsx(
                        // Default look: subtle dark pill that matches the
                        // other row controls.
                        // Visible at xl (matches the Supported column's
                        // visibility) — at narrower widths the switch
                        // version action moves into the kebab dropdown,
                        // keeping the row from forcing horizontal
                        // overflow at mid-viewport widths.
                        'hidden h-9 w-9 shrink-0 items-center justify-center rounded-md border transition disabled:cursor-not-allowed disabled:opacity-50 xl:inline-flex',
                        updateAvailable
                            ? // Update-available variant: the full brand
                              // red used by primary/danger CTAs
                              // elsewhere — same intensity as the
                              // Discover mods and Update all buttons so
                              // the eye reads "this is a real action".
                              'border-brand/40 bg-brand text-white hover:bg-brand/80 hover:border-brand/60'
                            : 'border-[#ffffff14] bg-[#0d0d10] text-zinc-200 hover:border-brand/60 hover:text-white',
                    )}
                    disabled={!versionSwitcherEnabled || busy || actionsDisabled}
                    onClick={onOpenVersionSwitcher}
                    title={
                        actionTitle ??
                        (!versionSwitcherEnabled
                            ? 'Local jars can’t be version-switched.'
                            : updateAvailable
                              ? 'Update available — review and switch'
                              : 'Switch version…')
                    }
                    aria-label={updateAvailable ? 'Update available — switch version' : 'Switch version'}
                >
                    <ArrowUpArrowDown width={15} height={15} />
                </button>
                {/* Enable/disable toggle — visible at every viewport
                    width. Was previously `hidden sm:inline-flex`, which
                    forced phone users into the kebab menu for the most
                    common per-mod action. User explicitly asked to keep
                    it inline everywhere so it stays one tap away. */}
                <Switch
                    checked={entry.enabled}
                    disabled={busy || actionsDisabled}
                    title={actionTitle ?? (entry.enabled ? 'Disable mod' : 'Enable mod')}
                    onCheckedChange={onToggleEnabled}
                    className='inline-flex h-7 w-14 shrink-0 bg-[#ffffff12]'
                />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            type='button'
                            className='inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-zinc-400 transition hover:bg-[#ffffff12] hover:text-white disabled:cursor-not-allowed disabled:opacity-50'
                            disabled={busy}
                            title='More actions'
                            aria-label='More actions'
                        >
                            <EllipsisVertical width={16} height={16} />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end' className='w-56'>
                        <DropdownMenuItem
                            disabled={!updateAvailable || busy || actionsDisabled}
                            onClick={onUpdate}
                        >
                            <ArrowDownToLine width={15} height={15} className='mr-2' />
                            Update to latest
                        </DropdownMenuItem>
                        {versionSwitcherEnabled && (
                            <DropdownMenuItem
                                disabled={busy || actionsDisabled}
                                onClick={onOpenVersionSwitcher}
                            >
                                <ArrowUpArrowDown width={15} height={15} className='mr-2' />
                                Switch version…
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                            disabled={busy || actionsDisabled}
                            onClick={() => onToggleEnabled(!entry.enabled)}
                        >
                            {/* Power glyph — visually communicates "this
                                action toggles the mod off" (or on). The menu
                                label below provides direction; we used to
                                show a mirror of the row's toggle Switch here
                                which read as "current state" rather than
                                "what this does". */}
                            <Power
                                width={15}
                                height={15}
                                className={clsx(
                                    'mr-2',
                                    entry.enabled ? 'text-zinc-300' : 'text-green-400',
                                )}
                            />
                            {entry.enabled ? 'Disable' : 'Enable'}
                        </DropdownMenuItem>
                        {onShowInFiles && (
                            <DropdownMenuItem onClick={onShowInFiles}>
                                <FolderOpen width={15} height={15} className='mr-2' />
                                Show in files
                            </DropdownMenuItem>
                        )}
                        {identified && (
                            <DropdownMenuItem
                                onClick={() =>
                                    window.open(identified.project.projectUrl, '_blank', 'noopener,noreferrer')
                                }
                            >
                                <ArrowUpRightFromSquare width={15} height={15} className='mr-2' />
                                View on Modrinth
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            disabled={busy || actionsDisabled}
                            onClick={onRemove}
                            className='text-red-300 focus:text-red-200'
                        >
                            <TrashBin width={15} height={15} className='mr-2' />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
};

export default ModRow;
