import { Copy, Cpu, Cube, HardDrive } from '@gravity-ui/icons';
import { useMemo } from 'react';
import isEqual from 'react-fast-compare';

import CopyOnClick from '@/components/elements/CopyOnClick';

import { ServerContext } from '@/state/server';

/**
 * Format a megabyte limit value. 0 means "unlimited" in the Pterodactyl
 * model so we surface that explicitly instead of "0 MB".
 */
const formatMemory = (mb: number): string => {
    if (mb === 0) return 'Unlimited';
    if (mb >= 1024) return `${(mb / 1024).toFixed(mb % 1024 === 0 ? 0 : 1)} GiB`;
    return `${mb} MiB`;
};

/**
 * CPU is exposed as a percentage in the Pterodactyl model, where 100 ==
 * one full core. 0 means "unlimited". We round to the nearest integer for
 * display because fractional CPU percentages aren't a thing the user
 * cares about at a glance.
 */
const formatCpu = (pct: number): string => {
    if (pct === 0) return 'Unlimited';
    return `${Math.round(pct)}%`;
};

/**
 * Resources card — replaces the cramped SERVER_MEMORY / SERVER_CPU env-
 * variable tiles that used to live in the Startup section. Same data,
 * displayed as visual tiles with units and human-friendly labels instead
 * of `null`-friendly raw strings. Three tiles: Memory, CPU, Disk.
 *
 * Hosts the **Node** line in its footer because "which physical node am
 * I on" is conceptually a resource provisioning attribute, lives at the
 * same data-source (server.node alongside server.limits), and the user
 * explicitly asked to collapse the old standalone Diagnostics footer
 * into the cards that own the related data.
 *
 * We deliberately stop short of plumbing in live usage (that's the Home
 * page's job). This card is about provisioned limits — what the server
 * is allowed to use — not what it's currently using.
 */
const ServerResourcesCard = () => {
    const limits = ServerContext.useStoreState((state) => state.server.data!.limits, isEqual);
    const node = ServerContext.useStoreState((state) => state.server.data!.node);
    const tiles = useMemo(
        () => [
            {
                icon: <Cube width={18} height={18} />,
                label: 'Memory',
                value: formatMemory(limits.memory),
                accent: 'text-emerald-300',
            },
            {
                icon: <Cpu width={18} height={18} />,
                label: 'CPU',
                value: formatCpu(limits.cpu),
                accent: 'text-sky-300',
            },
            {
                icon: <HardDrive width={18} height={18} />,
                label: 'Disk',
                value: formatMemory(limits.disk),
                accent: 'text-amber-300',
            },
        ],
        [limits],
    );

    return (
        <section className='rounded-2xl border border-[#ffffff10] bg-[#ffffff05] transition hover:duration-0 hover:border-[#ffffff20] hover:bg-[#ffffff08]'>
            <header className='flex items-center gap-2 border-b border-[#ffffff10] px-5 py-3.5'>
                <Cpu width={16} height={16} className='text-zinc-400' />
                <h2 className='text-sm font-semibold text-zinc-100'>Resources</h2>
                <span className='ml-2 text-[11px] text-zinc-500'>provisioned limits</span>
                {/* Node id lives in the header strip rather than a
                    separate footer row — same surface, less vertical
                    space. ml-auto pushes it to the far right so the
                    visual hierarchy is "title + subtitle on the left,
                    diagnostics chip on the right". */}
                <CopyOnClick text={node}>
                    <span className='group ml-auto inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-[#ffffff08] px-2 py-1 font-mono text-[11px] text-zinc-200 transition hover:bg-[#ffffff14]'>
                        <span className='text-[10px] font-bold uppercase tracking-wide text-zinc-500'>Node</span>
                        <span>{node}</span>
                        <Copy width={11} height={11} className='text-zinc-500 group-hover:text-zinc-200' />
                    </span>
                </CopyOnClick>
            </header>
            <div className='grid grid-cols-1 gap-3 p-5 sm:grid-cols-3'>
                {tiles.map((tile) => (
                    <div
                        key={tile.label}
                        className='flex items-center gap-3 rounded-xl border border-[#ffffff10] bg-[#ffffff06] p-4'
                    >
                        <span className={tile.accent}>{tile.icon}</span>
                        <div className='flex min-w-0 flex-col'>
                            <span className='text-[10px] font-bold uppercase tracking-wide text-zinc-500'>
                                {tile.label}
                            </span>
                            <span className='truncate text-sm font-semibold text-zinc-100'>{tile.value}</span>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default ServerResourcesCard;
