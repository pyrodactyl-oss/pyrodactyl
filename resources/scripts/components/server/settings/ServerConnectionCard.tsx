import { Copy, PlugConnection } from '@gravity-ui/icons';
import { useStoreState } from 'easy-peasy';
import isEqual from 'react-fast-compare';

import ActionButton from '@/components/elements/ActionButton';
import CopyOnClick from '@/components/elements/CopyOnClick';

import { ip } from '@/lib/formatters';

import { ServerContext } from '@/state/server';

/**
 * Connection card — a single panel that surfaces every "how do I connect"
 * detail that used to be sprinkled across the old Debug Info, SFTP
 * Details, and Startup environment-variable tiles.
 *
 * The old layout split server IP/port (advertised under the SERVER_IP /
 * SERVER_PORT env-var tiles) away from SFTP (its own card on the General
 * section). Players don't think of those as separate concepts — they're
 * both "addresses you connect to" — so we merge them into one card with
 * clearly labelled rows.
 *
 * The "Launch SFTP" affordance gets bumped to a real primary-coloured
 * button because the previous secondary-styled grey button looked
 * disabled. Players regularly missed it on the old screen.
 */
const ServerConnectionCard = () => {
    const username = useStoreState((state) => state.user.data!.username);
    const serverId = ServerContext.useStoreState((state) => state.server.data!.id);
    const sftp = ServerContext.useStoreState((state) => state.server.data!.sftpDetails, isEqual);
    const allocations = ServerContext.useStoreState((state) => state.server.data!.allocations, isEqual);
    const primary = allocations.find((a) => a.isDefault) ?? allocations[0];

    const gameAddress = primary ? `${ip(primary.ip)}:${primary.port}` : null;
    const sftpUrl = `sftp://${username}.${serverId}@${ip(sftp.ip)}:${sftp.port}`;
    const sftpAddress = `${ip(sftp.ip)}:${sftp.port}`;
    const sftpUsername = `${username}.${serverId}`;

    return (
        <section className='rounded-2xl border border-[#ffffff10] bg-[#ffffff05] transition hover:duration-0 hover:border-[#ffffff20] hover:bg-[#ffffff08]'>
            <header className='flex items-center gap-2 border-b border-[#ffffff10] px-5 py-3.5'>
                <PlugConnection width={16} height={16} className='text-zinc-400' />
                <h2 className='text-sm font-semibold text-zinc-100'>Connection</h2>
            </header>
            <div className='grid grid-cols-1 gap-x-6 gap-y-5 p-5 md:grid-cols-2'>
                {/* Game-server address — what players paste into their
                    Minecraft client. Pulled from the default allocation. */}
                <ConnectionRow
                    label='Game Address'
                    value={gameAddress ?? '—'}
                    copyText={gameAddress ?? undefined}
                    hint='Players connect to this address from their game client.'
                />
                {/* Empty grid cell on md+ so the SFTP block lines up
                    cleanly below the game-address row on wider viewports. */}
                <ConnectionRow
                    label='SFTP Address'
                    value={sftpAddress}
                    copyText={sftpAddress}
                    hint='For SFTP clients like FileZilla or WinSCP.'
                />
                <ConnectionRow
                    label='SFTP Username'
                    value={sftpUsername}
                    copyText={sftpUsername}
                    hint='Use the same password you log in to this panel with.'
                />
                {/* SFTP launcher cell — helper text on the left wraps
                    onto two lines to balance the visual weight of the
                    button on the right. The button hugs its label
                    rather than stretching, and text + button stay on
                    one row on md+ (stacks on phones). */}
                <div className='flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between'>
                    <p className='max-w-[20ch] text-xs leading-snug text-zinc-400'>
                        Open SFTP in your default client without copying credentials manually.
                    </p>
                    <a href={sftpUrl} className='shrink-0'>
                        <ActionButton variant='primary' size='md'>
                            Launch SFTP
                        </ActionButton>
                    </a>
                </div>
            </div>
        </section>
    );
};

/** One labelled value row inside the Connection card. */
const ConnectionRow = ({
    label,
    value,
    copyText,
    hint,
}: {
    label: string;
    value: string;
    copyText?: string;
    hint?: string;
}) => (
    <div className='flex flex-col gap-1.5'>
        <span className='text-[10px] font-bold uppercase tracking-wide text-zinc-500'>{label}</span>
        {copyText ? (
            <CopyOnClick text={copyText}>
                <div className='group inline-flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-[#ffffff10] bg-[#ffffff08] px-3 py-2 transition hover:border-brand/40 hover:bg-[#ffffff12]'>
                    <span className='truncate font-mono text-sm text-zinc-100'>{value}</span>
                    <Copy
                        width={14}
                        height={14}
                        className='shrink-0 text-zinc-500 transition group-hover:text-zinc-200'
                    />
                </div>
            </CopyOnClick>
        ) : (
            <div className='inline-flex w-full items-center rounded-lg border border-[#ffffff10] bg-[#ffffff08] px-3 py-2'>
                <span className='truncate font-mono text-sm text-zinc-100'>{value}</span>
            </div>
        )}
        {hint && <span className='text-[11px] text-zinc-500'>{hint}</span>}
    </div>
);

export default ServerConnectionCard;
