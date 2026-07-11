import { CloudArrowUpIn, Cubes3 } from '@gravity-ui/icons';
import { useCallback, useEffect } from 'react';
import { Route, Routes, useNavigate, useSearchParams } from 'react-router-dom';

import ActionButton from '@/components/elements/ActionButton';
import Can from '@/components/elements/Can';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import ServerContentBlock from '@/components/elements/ServerContentBlock';

import { isPluginLoader, useResolvedModSupport } from '@/api/server/mods/detect';
import { ProjectType } from '@/api/server/mods/types';

import { ServerContext } from '@/state/server';

import DiscoverList from './DiscoverList';
import ProjectDetail from './ProjectDetail';
import DetectionEmptyState from './components/DetectionEmptyState';
import { useRestartNeeded, useServerIsSafe } from './components/SafetyGate';
import { InstalledEntry, ModsStateProvider, useModsState } from './state';
import { ensureDirectoryThen } from './utils/ensureDirectory';

/**
 * Hydrates `installedModIds` from localStorage so the "Already installed"
 * indicator on Discover cards works without first visiting the Mods page.
 *
 * Mods and Discover are now sibling pages with separate ModsStateProvider
 * instances (they live at different sidebar entries). The two pages would
 * otherwise have completely disjoint state, but Discover only needs the
 * set of installed project IDs — which the Mods page writes to
 * localStorage on every scan — so we can read that cheaply on mount
 * without a Wings round-trip.
 */
interface CacheEntry {
    fingerprint: string;
    entry: InstalledEntry;
}
interface CacheShape {
    updatedAt: number;
    entries: Record<string, CacheEntry>;
}
const cacheKey = (uuid: string, dir: string, loader: string, mcVersion: string): string =>
    // Keep in lock-step with the ModsList cache key version — Mods
    // writes, Discover reads, so a version mismatch would mean Discover never
    // sees a freshly-scanned set until the next full scan.
    `pyrodactyl:mods:${uuid}:${dir}:${loader}:${mcVersion}:v6`;
const readCache = (key: string): CacheShape => {
    try {
        const raw = window.localStorage.getItem(key);
        if (!raw) return { updatedAt: 0, entries: {} };
        const parsed = JSON.parse(raw) as CacheShape;
        return { updatedAt: parsed.updatedAt ?? 0, entries: parsed.entries ?? {} };
    } catch {
        return { updatedAt: 0, entries: {} };
    }
};

const InstalledHydrator = ({
    uuid,
    loader,
    minecraftVersion,
    modsDirectory,
    datapacksDirectory,
    datapacksSupported,
}: {
    uuid: string;
    loader: string;
    minecraftVersion: string;
    modsDirectory: string;
    datapacksDirectory: string;
    datapacksSupported: boolean;
}) => {
    const { setInstalled } = useModsState();
    useEffect(() => {
        const dirs = [modsDirectory, ...(datapacksSupported ? [datapacksDirectory] : [])];
        const merged: InstalledEntry[] = [];
        for (const dir of dirs) {
            const cache = readCache(cacheKey(uuid, dir, loader, minecraftVersion));
            for (const cached of Object.values(cache.entries)) merged.push(cached.entry);
        }
        if (merged.length > 0) setInstalled(merged);
        // Run once per identity tuple — re-reading on every render would
        // bash the state on every keystroke in the Discover search input.
    }, [uuid, loader, minecraftVersion, modsDirectory, datapacksDirectory, datapacksSupported, setInstalled]);
    return null;
};

const DiscoverContainerInner = () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const eggFeatures = ServerContext.useStoreState((state) => state.server.data?.eggFeatures);
    const variables = ServerContext.useStoreState((state) => state.server.data?.variables);
    const serverId = ServerContext.useStoreState((state) => state.server.data?.id);

    const support = useResolvedModSupport({
        eggFeatures: eggFeatures ?? [],
        variables: variables ?? [],
    });

    const { status } = useServerIsSafe();
    // Mount the hook so install actions originating from Discover can fire
    // the shared one-shot "restart required" toast. There's no visible
    // indicator anymore — the toast itself is the signal.
    useRestartNeeded(uuid, status);

    const navigate = useNavigate();

    // `projectType` lives here (not in DiscoverList) because the container's
    // "Upload files" button needs to know it — datapack tab targets the
    // datapacks dir, plugin tab targets plugins/, mod tab targets the
    // server's primary mods dir. DiscoverList consumes it as a controlled
    // prop pair.
    //
    // Backed by the `?type=` URL search param so the active project
    // tab survives a refresh, can be deep-linked, and matches the
    // pattern used by every other Discover filter. Default is 'mod'
    // for ordinary servers; plugin-loader servers (Paper / Spigot /
    // Bukkit / etc.) get 'plugin' as the more useful default.
    const isPluginServer = support.loader ? isPluginLoader(support.loader) : false;
    const defaultType: ProjectType = isPluginServer ? 'plugin' : 'mod';
    const [searchParams, setSearchParams] = useSearchParams();
    const rawType = searchParams.get('type');
    const projectType: ProjectType =
        rawType === 'mod' || rawType === 'plugin' || rawType === 'datapack' ? rawType : defaultType;
    const setProjectType = useCallback(
        (next: ProjectType) => {
            setSearchParams(
                (prev) => {
                    const params = new URLSearchParams(prev);
                    // Clearing the param when the user picks the
                    // server's natural default keeps "shareable
                    // default URL" clean — no params land in the URL
                    // until the user actively overrides something.
                    if (next === defaultType) params.delete('type');
                    else params.set('type', next);
                    return params;
                },
                { replace: true },
            );
        },
        [setSearchParams, defaultType],
    );
    const uploadDirectory =
        projectType === 'datapack'
            ? support.datapacksDirectory
            : projectType === 'plugin'
              ? 'plugins'
              : support.modsDirectory;

    return (
        <ServerContentBlock title={'Discover'}>
            {/* Global <Toaster> is mounted in App.tsx — don't add a per-
                page one or every toast paints twice. */}
            <MainPageHeader
                title='Discover'
                direction='column'
                titleChildren={
                    support.supported ? (
                        // Same files-page pattern as the Mods page —
                        // natural-size buttons that wrap to a row
                        // beneath the title instead of stretching
                        // full-width on narrow viewports.
                        <div className='flex flex-row flex-wrap gap-2'>
                            <Can action={'mod.download'}>
                                <ActionButton
                                    variant='primary'
                                    onClick={() => serverId && navigate(`/server/${serverId}/mods`)}
                                >
                                    <Cubes3 width={16} height={16} className='mr-2' />
                                    View installed mods
                                </ActionButton>
                                <ActionButton
                                    variant='secondary'
                                    onClick={() => {
                                        if (!serverId || !uuid) return;
                                        // Auto-create the target directory
                                        // before navigating — a fresh server
                                        // may not have plugins/ or
                                        // world/datapacks/ yet, and the file
                                        // manager 500s when you point it at a
                                        // non-existent path.
                                        void ensureDirectoryThen(uuid, uploadDirectory, () =>
                                            navigate(`/server/${serverId}/files#/${uploadDirectory}`),
                                        );
                                    }}
                                    title={`Upload to /${uploadDirectory}`}
                                >
                                    <CloudArrowUpIn width={16} height={16} className='mr-2' />
                                    Upload{' '}
                                    {projectType === 'datapack'
                                        ? 'datapacks'
                                        : projectType === 'plugin'
                                          ? 'plugins'
                                          : 'mods'}
                                </ActionButton>
                            </Can>
                        </div>
                    ) : undefined
                }
            >
                <p className='text-sm text-neutral-400 leading-relaxed'>
                    Find new mods, plugins, and datapacks from{' '}
                    <a
                        href='https://modrinth.com'
                        target='_blank'
                        rel='noreferrer'
                        className='underline hover:text-white'
                    >
                        Modrinth
                    </a>
                    , with a variety of filters to aid in your search.
                </p>
            </MainPageHeader>

            {support.isResolvingLatest ? (
                <div className='flex items-center justify-center py-16'>
                    <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-brand'></div>
                </div>
            ) : !support.supported ? (
                <DetectionEmptyState reason={support.reason ?? 'Discover is not available for this server.'} />
            ) : (
                <>
                    {uuid && (
                        <InstalledHydrator
                            uuid={uuid}
                            loader={support.loader!}
                            minecraftVersion={support.minecraftVersion!}
                            modsDirectory={support.modsDirectory}
                            datapacksDirectory={support.datapacksDirectory}
                            datapacksSupported={support.datapacksSupported}
                        />
                    )}
                    <Routes>
                        {/* Project detail lives under /discover/project/:id
                            so the Discover sidebar entry stays lit when the
                            user is reading about a project. Mounting it
                            here (rather than under the Mods route tree)
                            keeps that contract simple: every project page
                            is a Discover-flow page. */}
                        <Route
                            path='project/:projectId'
                            element={
                                <ProjectDetail
                                    loader={support.loader!}
                                    minecraftVersion={support.minecraftVersion!}
                                    modsDirectory={support.modsDirectory}
                                    datapacksDirectory={support.datapacksDirectory}
                                />
                            }
                        />
                        <Route
                            path='*'
                            element={
                                <DiscoverList
                                    loader={support.loader!}
                                    minecraftVersion={support.minecraftVersion!}
                                    modsDirectory={support.modsDirectory}
                                    datapacksSupported={support.datapacksSupported}
                                    datapacksDirectory={support.datapacksDirectory}
                                    projectType={projectType}
                                    onProjectTypeChange={setProjectType}
                                />
                            }
                        />
                    </Routes>
                </>
            )}
        </ServerContentBlock>
    );
};

const DiscoverContainer = () => (
    <ModsStateProvider>
        <DiscoverContainerInner />
    </ModsStateProvider>
);

export default DiscoverContainer;
