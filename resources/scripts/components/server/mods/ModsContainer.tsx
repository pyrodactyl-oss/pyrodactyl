import { CloudArrowUpIn, Magnifier } from '@gravity-ui/icons';
import { useNavigate } from 'react-router-dom';

import ActionButton from '@/components/elements/ActionButton';
import Can from '@/components/elements/Can';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import ServerContentBlock from '@/components/elements/ServerContentBlock';

import { useResolvedModSupport } from '@/api/server/mods/detect';

import { ServerContext } from '@/state/server';

import ModsList from './ModsList';
import DetectionEmptyState from './components/DetectionEmptyState';
import { useRestartNeeded, useServerIsSafe } from './components/SafetyGate';
import { ModsStateProvider } from './state';
import { ensureDirectoryThen } from './utils/ensureDirectory';

/**
 * Mods page — lists every mod, plugin, or datapack already on the server's
 * disk. Sibling page is Discover  which handles content
 * discovery from Modrinth.
 *
 * Lives at /server/:id/mods and shows up in the sidebar as "Mods". Project
 * detail (/mods/project/:projectId) is mounted under the same container so
 * back-navigation from a detail page lands on the installed list.
 */
const ModsContainerInner = () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const eggFeatures = ServerContext.useStoreState((state) => state.server.data?.eggFeatures);
    const variables = ServerContext.useStoreState((state) => state.server.data?.variables);
    const serverId = ServerContext.useStoreState((state) => state.server.data?.id);

    const support = useResolvedModSupport({
        eggFeatures: eggFeatures ?? [],
        variables: variables ?? [],
    });

    const { status } = useServerIsSafe();
    // We still mount the hook so any installs / removes that happen on this
    // page can fire the one-shot "restart required" toast. There's no
    // visible indicator anymore — the toast itself is the signal.
    useRestartNeeded(uuid, status);

    const navigate = useNavigate();

    return (
        <ServerContentBlock title={'Mods'}>
            {/* Toasts are rendered by the global <Toaster> mounted in
                App.tsx — no per-page mount needed (the duplicate caused
                every toast to paint twice). */}
            <MainPageHeader
                title='Mods'
                direction='column'
                titleChildren={
                    support.supported ? (
                        // Mirror the files page pattern: keep the
                        // header action buttons at their natural size
                        // and let them sit on a row beneath the title
                        // at narrow widths (rather than stretching
                        // full-width and consuming a ton of vertical
                        // space). `flex-row gap-2 flex-wrap` lets a
                        // very tight viewport wrap the second button
                        // to its own line rather than overflow.
                        <div className='flex flex-row flex-wrap gap-2'>
                            <Can action={'mod.download'}>
                                <ActionButton
                                    variant='primary'
                                    onClick={() => serverId && navigate(`/server/${serverId}/discover`)}
                                >
                                    <Magnifier width={16} height={16} className='mr-2' />
                                    Discover mods
                                </ActionButton>
                                <ActionButton
                                    variant='secondary'
                                    onClick={() => {
                                        if (!serverId || !uuid) return;
                                        // Ensure the directory exists before
                                        // navigating into the file manager —
                                        // without this a never-started server
                                        // hits a daemon 500 when /mods doesn't
                                        // exist yet.
                                        void ensureDirectoryThen(uuid, support.modsDirectory, () =>
                                            navigate(`/server/${serverId}/files#/${support.modsDirectory}`),
                                        );
                                    }}
                                >
                                    <CloudArrowUpIn width={16} height={16} className='mr-2' />
                                    Upload files
                                </ActionButton>
                            </Can>
                        </div>
                    ) : undefined
                }
            >
                <p className='text-sm text-neutral-400 leading-relaxed'>
                    Manage your mods, plugins, and datapacks installed on this server. Mod identification and
                    updates sourced from the{' '}
                    <a
                        href='https://modrinth.com'
                        target='_blank'
                        rel='noreferrer'
                        className='underline hover:text-white'
                    >
                        Modrinth
                    </a>{' '}
                    catalogue.
                </p>
            </MainPageHeader>

            {support.isResolvingLatest ? (
                <div className='flex items-center justify-center py-16'>
                    <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-brand'></div>
                </div>
            ) : !support.supported ? (
                <DetectionEmptyState reason={support.reason ?? 'Mods are not available for this server.'} />
            ) : (
                <ModsList
                    loader={support.loader!}
                    minecraftVersion={support.minecraftVersion!}
                    modsDirectory={support.modsDirectory}
                    datapacksSupported={support.datapacksSupported}
                    datapacksDirectory={support.datapacksDirectory}
                />
            )}
        </ServerContentBlock>
    );
};

const ModsContainer = () => (
    <ModsStateProvider>
        <ModsContainerInner />
    </ModsStateProvider>
);

export default ModsContainer;
