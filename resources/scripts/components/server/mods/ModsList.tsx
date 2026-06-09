import {
    ArrowDownToLine,
    ArrowsRotateRight,
    BarsAscendingAlignLeftArrowDown,
    EllipsisVertical,
    Magnifier,
    TrashBin,
    Xmark,
} from '@gravity-ui/icons';
import clsx from 'clsx';
import debounce from 'debounce';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import ActionButton from '@/components/elements/ActionButton';
import { Checkbox } from '@/components/elements/CheckboxNew';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/elements/DropdownMenu';
import Modal from '@/components/elements/Modal';
import FadeTransition from '@/components/elements/transitions/FadeTransition';

import { buildUpdateCandidate, expandLoaderFamily, isCompatible, pickLatestCompatible } from '@/api/server/mods/compat';
import { isPluginLoader } from '@/api/server/mods/detect';
import { resolveDependencies } from '@/api/server/mods/dependencies';
import * as modrinth from '@/api/server/mods/modrinth';
import scanInstalledMods, { ModScanMode, ModScanResult, ScannedModFile } from '@/api/server/mods/scanInstalledMods';
import { ModVersion } from '@/api/server/mods/types';

import { ServerContext } from '@/state/server';

import DependencyDialog from './components/DependencyDialog';
import ModRow from './components/ModRow';
import { useRestartNeeded, useServerIsSafe } from './components/SafetyGate';
import VersionSwitcherModal from './components/VersionSwitcherModal';
import { InstalledEntry, useModsState } from './state';
import {
    installLatestForProject,
    installMod,
    removeMod,
    removeMods,
    setModEnabled,
    switchVersion,
} from './utils/operations';

interface Props {
    loader: string;
    minecraftVersion: string;
    modsDirectory: string;
    datapacksSupported: boolean;
    datapacksDirectory: string;
}

interface PendingInstall {
    targetName: string;
    targetVersion: ModVersion;
    replacePath?: string;
    requiredNames: Record<string, string>;
    missingRequiredProjectIds: string[];
}

/**
 * Toggleable filter chips. "All" is computed (highlighted when nothing else
 * is active) so it never lives in the state set. Chips with mutually
 * exclusive semantics (enabled/disabled, mods/datapacks) are still
 * individually toggleable — if a user picks both Enabled and Disabled, they
 * get an empty list, which is on them, but no chip secretly disables another.
 */
type FilterChip = 'enabled' | 'disabled' | 'mods' | 'plugins' | 'datapacks' | 'updates' | 'incompatible';

type SortMode = 'name-asc' | 'name-desc' | 'author-asc' | 'author-desc' | 'updated-newest' | 'updated-oldest';

const SORT_LABELS: Record<SortMode, string> = {
    'name-asc': 'Name (A → Z)',
    'name-desc': 'Name (Z → A)',
    'author-asc': 'Author (A → Z)',
    'author-desc': 'Author (Z → A)',
    'updated-newest': 'Recently updated',
    'updated-oldest': 'Oldest updated',
};

/**
 * Decide whether an installed entry is a mod, plugin, or datapack based on
 * its path prefix. The scanner labels each entry with the directory it came
 * from, so a datapack starts with `world/datapacks/` and a plugin lives
 * under `plugins/`. Anything else collapses to 'mod' since `mods/` is the
 * canonical mod-loader directory.
 *
 * This is path-based rather than loader-based so a hybrid server (Mohist /
 * Arclight, which run both Forge mods AND Bukkit plugins) can have rows
 * correctly classified into both categories simultaneously.
 */
const entryType = (path: string, datapacksDirectory: string): 'mod' | 'plugin' | 'datapack' => {
    const normalizedDp = datapacksDirectory.replace(/^\/+|\/+$/g, '');
    if (path.startsWith(`${normalizedDp}/`)) return 'datapack';
    if (path.startsWith('plugins/')) return 'plugin';
    return 'mod';
};

/**
 * Translate an axios/fetch error into a user-friendly message. The raw
 * "Request failed with status code 429" axios surfaces is useless for
 * end-users — we want to tell them what actually happened (rate-limited)
 * and that it's transient.
 */
const friendlyScanError = (err: unknown): string => {
    // Treat anything resembling an axios error duck-typed — we don't import
    // AxiosError here to keep the helper provider-agnostic.
    const axiosLike = err as { response?: { status?: number }; message?: string } | undefined;
    const status = axiosLike?.response?.status;
    if (status === 429) {
        return "Modrinth's rate-limit kicked in. Try again in a minute or two.";
    }
    if (status && status >= 500) {
        return `Modrinth returned ${status}. This is usually transient; try again shortly.`;
    }
    if (axiosLike?.message?.toLowerCase().includes('network')) {
        return 'Network error talking to Modrinth. Check your connection and retry.';
    }
    return err instanceof Error ? err.message : 'Failed to load installed mods.';
};
type RequestedScanMode = 'cached' | 'full';
type ScanPhase = 'idle' | 'listing' | 'identifying' | 'versions';

interface CachedEntry {
    fingerprint: string;
    entry: InstalledEntry;
}

interface InstalledCache {
    updatedAt: number;
    entries: Record<string, CachedEntry>;
    latestByModId: Record<string, ModVersion | null>;
}

const disabledRegex = /\.disabled$/i;

const filenameFromPath = (path: string): string => path.split('/').pop() ?? path;

/**
 * Escape a string for safe inclusion in a `new RegExp(...)`. We use the
 * dynamic-RegExp path in the search scorer to detect word-boundary matches;
 * a user could legitimately type characters like `+` or `(` which would
 * otherwise crash the search. Escape the standard PCRE metachars.
 */
const escapeRegex = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const cleanFilename = (path: string): string => filenameFromPath(path).replace(disabledRegex, '');
const modTitle = (entry: InstalledEntry): string => {
    if (entry.kind === 'identified') return entry.identified.project.title;
    if (entry.name) return entry.name;
    return cleanFilename(entry.path).replace(/\.jar$/i, '');
};

const quickEntry = (file: ScannedModFile): InstalledEntry => ({
    kind: 'unidentified',
    path: file.path,
    sha1: null,
    enabled: file.enabled,
    name: file.metadata.name ?? cleanFilename(file.path).replace(/\.jar$/i, ''),
    version: file.metadata.version,
    modId: file.metadata.modId,
});

// Bumped to v3 when author/avatar enrichment landed — the v2 cache rows
// have empty `author` strings (we used to drop the team-id-as-author) and
// would render as "Unknown author" forever without an invalidation.
const cacheKey = (uuid: string, modsDirectory: string, loader: string, minecraftVersion: string): string =>
    // Bumped to v4 when the org-owned author lookup landed — without
    // invalidating the cache, projects that previously identified as
    // "Unknown author" because the org branch was missing would keep
    // showing the empty string until manually refreshed.
    // v6 — fixed org-author lookup again. v2 has no /organization route at
    // all (everything 404s), so we now call /v3/organizations?ids=[…]
    // which is the actual working endpoint. Bumping invalidates v5 entries
    // that still got cached with empty orgs because of the 404s.
    `pyrodactyl:mods:${uuid}:${modsDirectory}:${loader}:${minecraftVersion}:v6`;

const readCache = (key: string): InstalledCache => {
    try {
        const raw = window.localStorage.getItem(key);
        if (!raw) return { updatedAt: 0, entries: {}, latestByModId: {} };
        const parsed = JSON.parse(raw) as InstalledCache;
        return {
            updatedAt: parsed.updatedAt ?? 0,
            entries: parsed.entries ?? {},
            latestByModId: parsed.latestByModId ?? {},
        };
    } catch {
        return { updatedAt: 0, entries: {}, latestByModId: {} };
    }
};

const writeCache = (key: string, cache: InstalledCache): void => {
    try {
        window.localStorage.setItem(key, JSON.stringify(cache));
    } catch {
        // Best-effort cache. If storage is full or unavailable, the UI still works.
    }
};

const updateAvailableFor = (entry: InstalledEntry, latest: ModVersion | null): boolean =>
    entry.kind === 'identified' && latest
        ? buildUpdateCandidate(entry.identified.version, latest).updateAvailable
        : false;

// million-ignore
// Million.js auto-mode breaks the controlled-input search bar — the
// onChange handler stops firing per-keystroke and only fires on blur.
// The directive has to sit directly above the COMPONENT DECLARATION,
// not the file-top imports: Million walks UP the AST from each JSX
// node looking for leading comments, and a comment on an import
// statement is never an ancestor of the JSX.
const ModsList = ({
    loader,
    minecraftVersion,
    modsDirectory,
    datapacksSupported,
    datapacksDirectory,
}: Props) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const serverId = ServerContext.useStoreState((state) => state.server.data!.id);
    const { status } = useServerIsSafe();

    // The "effective" loader list we send to Modrinth for non-datapack
    // lookups. For mod loaders this is just `[loader]`; for plugin loaders
    // (Paper, etc.) we expand to the family so a Paper server picks up
    // builds tagged only as Spigot or Bukkit.
    const serverLoaders = useMemo(() => (isPluginLoader(loader) ? expandLoaderFamily(loader) : [loader]), [loader]);
    const {
        installed,
        installedLoading,
        installedError,
        installedModIds,
        refreshNonce,
        setInstalled,
        setInstalledLoading,
        setInstalledError,
        bumpRefresh,
    } = useModsState();

    const [latestByModId, setLatestByModId] = useState<Record<string, ModVersion | null>>({});
    /**
     * Compatible-version lists keyed by project ID (without provider prefix).
     * - `undefined`: never requested.
     * - `'loading'`: in-flight.
     * - `ModVersion[]`: fetched (may be empty).
     * Populated lazily when a row's version dropdown is opened. Survives the
     * tab's life but resets across remounts; not persisted to localStorage
     * because Modrinth's own desktop cache uses a 30-minute TTL on project
     * data and panel mounts are short-lived anyway.
     */
    const [versionsByProject, setVersionsByProject] = useState<
        Record<string, 'loading' | ModVersion[] | undefined>
    >({});
    /**
     * Unfiltered version lists keyed by project ID. Populated only when the
     * user explicitly asks for "show all versions" via the row's submenu
     * footer. Kept separate from `versionsByProject` so the per-row default
     * stays scoped to compatible-only — the override is an opt-in for users
     * who know what they're doing.
     */
    const [allVersionsByProject, setAllVersionsByProject] = useState<
        Record<string, 'loading' | ModVersion[] | undefined>
    >({});
    const [busyPath, setBusyPath] = useState<string | null>(null);
    const [bulkBusy, setBulkBusy] = useState(false);
    const [pending, setPending] = useState<PendingInstall | null>(null);
    const [pendingBusy, setPendingBusy] = useState(false);
    // Search state — uncontrolled input pattern. The files page is the
    // only working precedent in this codebase for a per-keystroke
    // search bar; controlled inputs (`value={query}`) get mangled by
    // Million.js's auto-mode block VDOM and fall back to native
    // onchange-on-blur behaviour. Uncontrolled (ref + defaultValue)
    // sidesteps that — the browser/DOM manages the visible value and
    // React just listens for input events and debounces a URL write.
    //
    // The URL `?q=` parameter is the canonical "what's the active
    // search" value the in-memory filter keys off. We sync it back
    // into the DOM input imperatively (via ref) on external URL
    // changes (back / forward navigation, deep-link).
    const [searchParams, setSearchParams] = useSearchParams();
    const urlQuery = searchParams.get('q') ?? '';
    /** Ref to the search input — used to reset its value imperatively for the X-to-clear button. */
    const searchInputRef = useRef<HTMLInputElement | null>(null);
    /** Mirror of the typed value — only consumed for UI decisions like X-to-clear visibility. Not bound to the input's `value`. */
    const [query, setQuery] = useState<string>(urlQuery);

    // Debounced URL-param writer. Stored in a ref so the function
    // identity is stable across renders even though setSearchParams (a
    // react-router-provided closure) is not. Without the indirection,
    // the debouncer would lose any pending call on every render.
    const setSearchParamsRef = useRef(setSearchParams);
    setSearchParamsRef.current = setSearchParams;
    const writeQueryToUrl = useRef(
        debounce((v: string) => {
            setSearchParamsRef.current((prev) => {
                const next = new URLSearchParams(prev);
                if (v) next.set('q', v);
                else next.delete('q');
                return next;
            }, { replace: true });
        }, 300),
    ).current;
    useEffect(() => () => writeQueryToUrl.clear?.(), [writeQueryToUrl]);

    const onQueryChange = useCallback(
        (next: string) => {
            // Mirror the typed value into local state for UI bits like
            // the X-to-clear visibility. We do NOT bind this back to
            // the input's `value` — the input stays uncontrolled.
            setQuery(next);
            if (next === '') {
                writeQueryToUrl.clear?.();
                setSearchParamsRef.current((prev) => {
                    const np = new URLSearchParams(prev);
                    np.delete('q');
                    return np;
                }, { replace: true });
            } else {
                writeQueryToUrl(next);
            }
        },
        [writeQueryToUrl],
    );

    // External URL changes (back / forward, deep-link) — push the new
    // value into the DOM input imperatively. Skip the write when the
    // input already matches both to avoid clobbering an in-progress
    // edit and to keep cursor position stable during normal typing.
    useEffect(() => {
        const el = searchInputRef.current;
        if (el && el.value !== urlQuery) {
            el.value = urlQuery;
        }
        setQuery(urlQuery);
    }, [urlQuery]);
    const [activeFilters, setActiveFilters] = useState<Set<FilterChip>>(new Set());
    const [sortMode, setSortMode] = useState<SortMode>('name-asc');
    const [selected, setSelected] = useState<Set<string>>(new Set());
    /** Path of the entry the version-switcher modal is open for. */
    const [versionSwitcherPath, setVersionSwitcherPath] = useState<string | null>(null);
    // Tracks whether the user has performed any jar-mutating action since
    // the server was last offline. Persisted to localStorage by useRestartNeeded
    // so the flag survives navigation between Mods and Discover.
    // Only `mark` is consumed here — the chip is rendered upstream in the
    // ModsContainer header, so we just need the mutator.
    const { mark: markRestartNeededIfRunning } = useRestartNeeded(uuid, status);
    const [scanPhase, setScanPhase] = useState<ScanPhase>('idle');
    /**
     * Per-phase progress counter. `done` / `total` are reset whenever a
     * new phase starts; the scanLabel below uses these to render an
     * (X of Y) suffix so users see incremental progress instead of an
     * indeterminate spinner stuck on "Identifying new versions" for the
     * duration of a 60-mod scan. `total === 0` is treated as "no count
     * yet" so the label falls back to its phase string.
     */
    const [scanProgress, setScanProgress] = useState<{ done: number; total: number }>({ done: 0, total: 0 });
    /**
     * Directory the current scan target is reading from. Surfaced in the
     * loading label so users see what we're actually doing while waiting
     * on the daemon — "Scanning /mods..." reads better than the old
     * blanket "Loading files..." and provides visible movement when the
     * scan flips to /world/datapacks for the second target.
     */
    const [scanDirectory, setScanDirectory] = useState<string>('');
    const scanMode = useRef<RequestedScanMode>('cached');

    useEffect(() => {
        setSelected((current) => {
            const paths = new Set(installed.map((entry) => entry.path));
            const next = new Set([...current].filter((path) => paths.has(path)));
            return next.size === current.size ? current : next;
        });
    }, [installed]);

    // Quick mode only lists files and returns cached hashes from the panel.
    // Missing/full modes hash through the panel's mod scanner endpoint, so
    // background identification no longer spams server:file.read activity.
    useEffect(() => {
        let cancelled = false;
        const requestedMode = scanMode.current;
        scanMode.current = 'cached';

        // The two directories we may need to scan. Datapacks come second so a
        // server with only mods doesn't pay the round-trip cost.
        const scanTargets: Array<{ directory: string; isDatapack: boolean }> = [
            { directory: modsDirectory, isDatapack: false },
        ];
        if (datapacksSupported) {
            scanTargets.push({ directory: datapacksDirectory, isDatapack: true });
        }

        // Across-directory accumulator: every scan pushes its entries here and
        // setInstalled is called with the unified array. Keeps the row order
        // stable across the multi-phase render (placeholder → identified →
        // versioned) and across the two project types.
        const allEntries = new Map<string, InstalledEntry>();
        // We still keep a per-directory file order so the rendered list is
        // alphabetised within each directory (the scanner sorts internally).
        const fileOrder: string[] = [];

        const flushInstalled = () => {
            if (cancelled) return;
            const ordered: InstalledEntry[] = [];
            for (const path of fileOrder) {
                const entry = allEntries.get(path);
                if (entry) ordered.push(entry);
            }
            setInstalled(ordered);
        };

        const loadScan = async (
            target: { directory: string; isDatapack: boolean },
            mode: ModScanMode,
            cache: InstalledCache,
        ): Promise<InstalledCache> => {
            const result: ModScanResult = await scanInstalledMods(uuid, target.directory, mode);

            // Drop any stale entries we previously stored for this directory
            // (e.g. files the user just deleted from disk).
            const dirPrefix = target.directory.replace(/^\/+|\/+$/g, '') + '/';
            for (const path of [...allEntries.keys()]) {
                if (path.startsWith(dirPrefix)) allEntries.delete(path);
            }
            for (let i = fileOrder.length - 1; i >= 0; i--) {
                if (fileOrder[i]!.startsWith(dirPrefix)) fileOrder.splice(i, 1);
            }

            if (result.files.length === 0) {
                const empty = { updatedAt: Date.now(), entries: {}, latestByModId: {} };
                if (!cancelled) {
                    writeCache(cacheKey(uuid, target.directory, loader, minecraftVersion), empty);
                    flushInstalled();
                }
                return empty;
            }

            const hashesToIdentify: Array<ScannedModFile & { sha1: string }> = [];

            // First pass: seed every row with either the cached entry (fast
            // path) or a filename-only placeholder, then paint immediately so
            // the user sees the row count and existing data before we wait on
            // the Modrinth round-trip.
            for (const file of result.files) {
                const cached = cache.entries[file.path];
                const cacheHit =
                    cached?.fingerprint === file.fingerprint &&
                    (file.sha1 === null || cached.entry.sha1 === file.sha1);
                if (cacheHit) {
                    allEntries.set(file.path, { ...cached.entry, path: file.path, enabled: file.enabled });
                } else {
                    allEntries.set(file.path, quickEntry(file));
                    if (file.sha1 !== null) {
                        hashesToIdentify.push(file as ScannedModFile & { sha1: string });
                    }
                }
                fileOrder.push(file.path);
            }

            if (!cancelled) flushInstalled();

            // Second pass: hand the unmatched SHA-1s to Modrinth in a single
            // batched request and patch identified entries in place. Rows that
            // were already cache-hit keep their data; only new/changed jars
            // visibly flip from "Local jar" to identified.
            if (hashesToIdentify.length > 0) {
                setScanPhase('identifying');
                // identifyByHashes is a single batched call so we can't
                // tick a running counter, but surfacing the total tells
                // the user "we're looking at N mods" which is far more
                // useful than an indeterminate spinner.
                setScanProgress({ done: 0, total: hashesToIdentify.length });
                const identifiedList = await modrinth.identifyByHashes(hashesToIdentify.map((file) => file.sha1));
                if (cancelled) return cache;
                const identifiedBySha = new Map(identifiedList.map((entry) => [entry.sha1, entry] as const));

                for (const file of hashesToIdentify) {
                    const identified = identifiedBySha.get(file.sha1);
                    if (identified) {
                        allEntries.set(file.path, {
                            kind: 'identified',
                            path: file.path,
                            sha1: file.sha1,
                            enabled: file.enabled,
                            identified,
                        });
                    } else {
                        allEntries.set(file.path, {
                            kind: 'unidentified',
                            path: file.path,
                            sha1: file.sha1,
                            enabled: file.enabled,
                            modId: file.metadata.modId,
                            name: file.metadata.name,
                            version: file.metadata.version,
                        });
                    }
                }
                if (!cancelled) flushInstalled();
            }

            const dirEntries: InstalledEntry[] = result.files
                .map((file) => allEntries.get(file.path))
                .filter((e): e is InstalledEntry => !!e);

            // Look up the latest compatible version of each identified project
            // in this directory. Datapack compat skips the loader filter since
            // datapack versions on Modrinth never carry a `loaders` array.
            const projectIds = [
                ...new Set(
                    dirEntries.flatMap((entry) =>
                        entry.kind === 'identified' ? [entry.identified.project.projectId] : [],
                    ),
                ),
            ];
            const latestMap: Record<string, ModVersion | null> = { ...cache.latestByModId };
            const projectsToCheck = projectIds.filter((projectId) => {
                const latestKey = `modrinth:${projectId}`;
                return mode === 'full' || latestMap[latestKey] === undefined;
            });

            if (projectsToCheck.length > 0) {
                setScanPhase('versions');
                // Reset counter for this phase. The Promise.all loop below
                // ticks `done` after each project's version lookup
                // completes (success OR failure — both count as "done with
                // that project") so the user sees real progress, not a
                // stuck spinner.
                setScanProgress({ done: 0, total: projectsToCheck.length });
                const concurrency = Math.min(8, projectsToCheck.length);
                let cursor = 0;
                await Promise.all(
                    Array.from({ length: concurrency }, async () => {
                        while (!cancelled) {
                            const index = cursor++;
                            if (index >= projectsToCheck.length) return;
                            const projectId = projectsToCheck[index]!;
                            const namespaced = `modrinth:${projectId}`;
                            try {
                                const versions = await modrinth.listVersions(projectId, {
                                    loaders: target.isDatapack ? [] : serverLoaders,
                                    gameVersions: [minecraftVersion],
                                });
                                const compat = pickLatestCompatible(versions, {
                                    loaders: target.isDatapack ? [] : serverLoaders,
                                    gameVersion: minecraftVersion,
                                    projectType: target.isDatapack ? 'datapack' : 'mod',
                                });
                                latestMap[namespaced] = compat;
                                if (!cancelled) {
                                    setLatestByModId((current) => ({ ...current, [namespaced]: compat }));
                                    setVersionsByProject((current) =>
                                        current[projectId] === undefined
                                            ? { ...current, [projectId]: versions }
                                            : current,
                                    );
                                }
                            } catch (err) {
                                console.warn(`Could not fetch versions for ${projectId}:`, err);
                                latestMap[namespaced] = null;
                                if (!cancelled) {
                                    setLatestByModId((current) => ({ ...current, [namespaced]: null }));
                                }
                            } finally {
                                if (!cancelled) {
                                    setScanProgress((p) => ({ ...p, done: p.done + 1 }));
                                }
                            }
                        }
                    }),
                );
            }

            const nextCache: InstalledCache = { updatedAt: Date.now(), entries: {}, latestByModId: latestMap };
            for (const file of result.files) {
                const entry = allEntries.get(file.path);
                if (entry) nextCache.entries[entry.path] = { fingerprint: file.fingerprint, entry };
            }
            writeCache(cacheKey(uuid, target.directory, loader, minecraftVersion), nextCache);
            return nextCache;
        };

        const run = async () => {
            setInstalledError(null);

            // Stale-while-revalidate priming. Load cached entries for both
            // directories into the accumulator before we start scanning so the
            // first paint reflects everything the user had last time.
            const cachedLatestByModId: Record<string, ModVersion | null> = {};
            for (const target of scanTargets) {
                const cache = readCache(cacheKey(uuid, target.directory, loader, minecraftVersion));
                for (const cached of Object.values(cache.entries)) {
                    allEntries.set(cached.entry.path, cached.entry);
                    fileOrder.push(cached.entry.path);
                }
                Object.assign(cachedLatestByModId, cache.latestByModId);
            }
            setLatestByModId(cachedLatestByModId);

            const anyCached = allEntries.size > 0;
            if (anyCached && requestedMode !== 'full') {
                flushInstalled();
                setInstalledLoading(false);
            } else {
                setInstalledLoading(true);
            }
            setScanPhase('listing');

            try {
                for (const target of scanTargets) {
                    if (cancelled) return;
                    // Update the directory in state so the loading label
                    // shows which target we're currently working on. This
                    // is the user-facing "movement" between mods/ and
                    // world/datapacks/ when both are present.
                    setScanDirectory(target.directory);
                    const cache = readCache(cacheKey(uuid, target.directory, loader, minecraftVersion));
                    if (requestedMode === 'full') {
                        await loadScan(target, 'full', cache);
                        continue;
                    }

                    const quickCache = await loadScan(target, 'quick', cache);
                    if (!cancelled) setInstalledLoading(false);

                    const hasPending = Object.values(quickCache.entries).some((cached) => cached.entry.sha1 === null);
                    if (hasPending && !cancelled) {
                        setScanPhase('identifying');
                        await loadScan(target, 'missing', quickCache);
                    }
                }
            } catch (err) {
                if (!cancelled) {
                    // Surface as a toast rather than an inline banner so the
                    // mod list doesn't shift around when an error occurs.
                    // We still keep the message in state so screen readers
                    // pick it up via the SafetyBanner's aria-live region,
                    // but the visible inline render is gone (see below).
                    const message = friendlyScanError(err);
                    toast.error(message);
                    setInstalledError(message);
                }
            } finally {
                if (!cancelled) {
                    setInstalledLoading(false);
                    setScanPhase('idle');
                    setScanProgress({ done: 0, total: 0 });
                }
            }
        };

        void run();
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [uuid, modsDirectory, datapacksDirectory, datapacksSupported, loader, minecraftVersion, refreshNonce]);

    const withFullRefresh = () => {
        scanMode.current = 'full';
        bumpRefresh();
    };

    /**
     * Per-entry incompatibility check, mirrored from the row's
     * `versionCompatible` derivation. Centralised here so both the filter
     * predicate and the Incompatible chip's visibility gate use the same
     * answer — keeping them in sync prevents the "chip is hidden but the
     * filter is still active" bug.
     *
     * Unidentified rows can't be checked (no version data), so we treat
     * them as compatible for filter purposes — surfacing "incompatible"
     * for a row we don't know about would be misleading.
     */
    const entryIsIncompatible = (entry: InstalledEntry): boolean => {
        if (entry.kind !== 'identified') return false;
        const type = entryType(entry.path, datapacksDirectory);
        return !isCompatible(entry.identified.version, {
            loaders: type === 'datapack' ? [] : serverLoaders,
            gameVersion: minecraftVersion,
            projectType: type,
        });
    };
    const incompatibleCount = useMemo(
        () => installed.filter(entryIsIncompatible).length,
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [installed, serverLoaders, minecraftVersion, datapacksDirectory],
    );

    const updateAvailableCount = useMemo(
        () =>
            installed.filter((entry) =>
                updateAvailableFor(
                    entry,
                    entry.kind === 'identified' ? (latestByModId[entry.identified.project.id] ?? null) : null,
                ),
            ).length,
        [installed, latestByModId],
    );

    const filteredInstalled = useMemo(() => {
        const needle = urlQuery.trim().toLowerCase();

        const authorFor = (entry: InstalledEntry): string =>
            (entry.kind === 'identified' ? entry.identified.project.author : entry.modId ?? '') || '';
        // For "updated" sort, prefer the LATEST compatible version's date
        // (when known) so a stale mod with a known fresh release ranks first;
        // fall back to the currently installed version's date. Unidentified
        // mods have no date, so they get a sentinel that sinks them.
        const updatedFor = (entry: InstalledEntry): number => {
            if (entry.kind !== 'identified') return 0;
            const latest = latestByModId[entry.identified.project.id];
            const iso = latest?.datePublished ?? entry.identified.version.datePublished;
            return Date.parse(iso) || 0;
        };

        /**
         * Relevance score for the search needle. Higher is more relevant.
         * Returns -1 when there's no match at all so the caller can drop
         * the entry from results.
         *
         * Scoring tiers (large gaps between them so a higher-tier match
         * always beats a lower-tier one regardless of position bonuses):
         *   1000 — title starts with the needle    ("fabric"      → "Fabric API")
         *    750 — title contains the needle as a word boundary    ("Fabric Language Kotlin")
         *    500 — title contains the needle anywhere              ("Areas Fabric edition")
         *    300 — author starts with the needle
         *    200 — author contains the needle
         *    100 — mod id / filename contains the needle           (last resort)
         *
         * Within each tier we add a small position bonus (negative
         * indexOf) so an earlier match outranks a later one. We do NOT
         * collapse multiple matches across fields — only the highest-
         * scoring field wins, otherwise a mod that incidentally contains
         * "fabric" in three places would beat "Fabric API".
         */
        const scoreEntry = (entry: InstalledEntry): number => {
            if (!needle) return 0;
            const title = modTitle(entry).toLowerCase();
            const author = authorFor(entry).toLowerCase();
            const modId = entry.kind === 'identified' ? '' : (entry.modId ?? '').toLowerCase();
            const filename = filenameFromPath(entry.path).toLowerCase();

            let best = -1;
            if (title.startsWith(needle)) best = Math.max(best, 1000);
            // Word-boundary match: needle preceded by space, dash, underscore,
            // dot, slash, or start of string.
            else if (new RegExp(`(^|[\\s\\-_./])${escapeRegex(needle)}`).test(title)) best = Math.max(best, 750);
            else if (title.includes(needle)) best = Math.max(best, 500);

            if (author.startsWith(needle)) best = Math.max(best, 300);
            else if (author.includes(needle)) best = Math.max(best, 200);

            if (modId.includes(needle) || filename.includes(needle)) best = Math.max(best, 100);

            if (best < 0) return -1;
            // Tiny position bonus so "Fabric" outranks "Cool Fabric" within
            // the same tier. Clamp to avoid jumping tiers.
            const pos = title.indexOf(needle);
            return best + (pos >= 0 ? Math.max(0, 50 - pos) : 0);
        };

        const filtered = installed.filter((entry) => {
            const latest =
                entry.kind === 'identified' ? (latestByModId[entry.identified.project.id] ?? null) : null;
            const type = entryType(entry.path, datapacksDirectory);

            // All active filters AND together. An empty filter set
            // displays everything — the "All" chip is just a UI
            // affordance for that empty state.
            if (activeFilters.has('enabled') && !entry.enabled) return false;
            if (activeFilters.has('disabled') && entry.enabled) return false;
            if (activeFilters.has('updates') && !updateAvailableFor(entry, latest)) return false;
            if (activeFilters.has('incompatible') && !entryIsIncompatible(entry)) return false;
            if (activeFilters.has('mods') && type !== 'mod') return false;
            if (activeFilters.has('plugins') && type !== 'plugin') return false;
            if (activeFilters.has('datapacks') && type !== 'datapack') return false;

            if (!needle) return true;
            return scoreEntry(entry) >= 0;
        });

        // When the user has typed a search query, relevance takes
        // precedence over the sort mode — the user's intent is "find this
        // thing", not "sort everything by name". Without a query we fall
        // back to the explicit sort mode.
        if (needle) {
            return filtered.slice().sort((a, b) => {
                const diff = scoreEntry(b) - scoreEntry(a);
                if (diff !== 0) return diff;
                return modTitle(a).localeCompare(modTitle(b));
            });
        }

        return filtered.slice().sort((a, b) => {
            switch (sortMode) {
                case 'name-asc':
                    return modTitle(a).localeCompare(modTitle(b));
                case 'name-desc':
                    return modTitle(b).localeCompare(modTitle(a));
                case 'author-asc':
                    return authorFor(a).localeCompare(authorFor(b)) || modTitle(a).localeCompare(modTitle(b));
                case 'author-desc':
                    return authorFor(b).localeCompare(authorFor(a)) || modTitle(a).localeCompare(modTitle(b));
                case 'updated-newest':
                    return updatedFor(b) - updatedFor(a) || modTitle(a).localeCompare(modTitle(b));
                case 'updated-oldest':
                    return updatedFor(a) - updatedFor(b) || modTitle(a).localeCompare(modTitle(b));
            }
        });
    }, [activeFilters, installed, latestByModId, urlQuery, datapacksDirectory, sortMode]);

    const toggleFilter = (chip: FilterChip) =>
        setActiveFilters((current) => {
            const next = new Set(current);
            if (next.has(chip)) {
                next.delete(chip);
            } else {
                // Enabled / Disabled are mutually exclusive — turning one
                // on always turns the other off. (You can't sensibly
                // filter to "rows that are simultaneously enabled and
                // disabled", and the previous stackable behaviour just
                // collapsed to an empty list when both were active.)
                if (chip === 'enabled') next.delete('disabled');
                else if (chip === 'disabled') next.delete('enabled');
                next.add(chip);
            }
            return next;
        });

    const selectedEntries = useMemo(() => installed.filter((entry) => selected.has(entry.path)), [installed, selected]);

    const visibleSelected =
        filteredInstalled.length > 0 && filteredInstalled.every((entry) => selected.has(entry.path));
    const actionLocked = bulkBusy || installedLoading || pendingBusy;

    const selectVisible = (checked: boolean) => {
        setSelected((current) => {
            const next = new Set(current);
            for (const entry of filteredInstalled) {
                if (checked) next.add(entry.path);
                else next.delete(entry.path);
            }
            return next;
        });
    };

    const loadAllVersionsForProject = async (projectId: string) => {
        setAllVersionsByProject((current) => {
            if (current[projectId] !== undefined) return current;
            return { ...current, [projectId]: 'loading' };
        });

        try {
            // No loaders / no gameVersions = Modrinth returns every version
            // the project has ever published. This is what powers the
            // "Show all versions" override in the row submenu.
            const versions = await modrinth.listVersions(projectId, {});
            setAllVersionsByProject((current) => ({ ...current, [projectId]: versions }));
        } catch (err) {
            // Mid-session Modrinth failure (typically 429 rate-limit). Surface
            // the same friendly toast we use for the initial scan rather than
            // silently empty-stating the version list — otherwise the user
            // opens the modal, sees nothing, and has no idea why.
            toast.error(friendlyScanError(err));
            setAllVersionsByProject((current) => ({ ...current, [projectId]: [] }));
        }
    };

    const loadVersionsForProject = async (projectId: string) => {
        // Cheap idempotency check — multiple rows may request the same project.
        setVersionsByProject((current) => {
            if (current[projectId] !== undefined) return current;
            return { ...current, [projectId]: 'loading' };
        });

        try {
            const versions = await modrinth.listVersions(projectId, {
                loaders: serverLoaders,
                gameVersions: [minecraftVersion],
            });
            setVersionsByProject((current) => ({ ...current, [projectId]: versions }));
            // Opportunistic side benefit: if we hadn't picked a latest for this
            // project yet (because the initial scan ran out of budget for
            // version queries), do it now while we have the data.
            setLatestByModId((current) => {
                const namespaced = `modrinth:${projectId}`;
                if (current[namespaced] !== undefined) return current;
                const compat = pickLatestCompatible(versions, {
                    loaders: serverLoaders,
                    gameVersion: minecraftVersion,
                });
                return { ...current, [namespaced]: compat };
            });
        } catch (err) {
            // Same reasoning as loadAllVersionsForProject — Modrinth
            // mid-session failures need to surface as a toast so the user
            // understands why the version switcher's compatible list is
            // empty. Mark the cache as empty so we don't retry on every
            // dropdown open; Refresh on the toolbar retries the whole scan.
            toast.error(friendlyScanError(err));
            setVersionsByProject((current) => ({ ...current, [projectId]: [] }));
        }
    };

    const runSwitchVersion = async (entry: InstalledEntry, version: ModVersion) => {
        if (entry.kind !== 'identified') return;
        if (version.id === entry.identified.version.id) return;
        setBusyPath(entry.path);
        try {
            // The dep resolver also runs on a version switch — switching to an
            // older build can re-introduce a missing required dep, and the user
            // should see the same prompt as a fresh install in that case.
            await beginInstall({
                targetName: entry.identified.project.title,
                targetVersion: version,
                replacePath: entry.path,
            });
        } catch (err) {
            // Caller invokes us via `void runSwitchVersion(...)` so any
            // exception otherwise becomes an unhandled rejection. Surface
            // as a friendly toast so the user knows the switch didn't
            // take and can decide to retry.
            toast.error(friendlyScanError(err));
        } finally {
            setBusyPath(null);
        }
    };

    /**
     * `options.skipRefresh`: when called from a bulk loop, don't trigger
     * a full re-scan after this single update — the caller will do one
     * rescan after the whole batch completes. Per-item rescans during a
     * bulk update used to fan out hundreds of Modrinth API calls and
     * trip the rate limit. The same flag also suppresses per-item
     * success/error toasts (bulk surfaces a single summary toast
     * afterwards) and switches the function from throw-on-fail to
     * return-true/false so the loop can track per-mod outcomes.
     */
    const runUpdate = async (
        entry: InstalledEntry,
        options: { skipRefresh?: boolean } = {},
    ): Promise<boolean> => {
        if (entry.kind !== 'identified') return false;
        const latest = latestByModId[entry.identified.project.id];
        if (!latest) {
            if (!options.skipRefresh) toast.error('Latest version unavailable.');
            return false;
        }
        setBusyPath(entry.path);
        try {
            await beginInstall({
                targetName: entry.identified.project.title,
                targetVersion: latest,
                replacePath: entry.path,
                skipRefresh: options.skipRefresh,
            });
            return true;
        } catch (err) {
            // In single-update mode the toast IS our error surface. In
            // bulk mode the per-item toast would explode into N toasts
            // on a bad day, so the caller suppresses + summarises.
            if (!options.skipRefresh) toast.error(friendlyScanError(err));
            return false;
        } finally {
            setBusyPath(null);
        }
    };

    const runRemove = async (entry: InstalledEntry) => {
        setBusyPath(entry.path);
        try {
            await removeMod({ serverUuid: uuid, path: entry.path });
            toast.success('Mod deleted.');
            markRestartNeededIfRunning();
            setSelected((current) => {
                const next = new Set(current);
                next.delete(entry.path);
                return next;
            });
            bumpRefresh();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Delete failed.');
        } finally {
            setBusyPath(null);
        }
    };

    /**
     * Move a cached entry from `oldPath` to `newPath` in localStorage so the
     * next scan still cache-hits on the renamed file. Without this, toggling
     * a mod's enabled state invalidates the cache (the path-keyed entry
     * doesn't match the new filename) and the row briefly flashes back to
     * the "Local" placeholder until identification re-runs.
     */
    const migrateCacheEntry = (oldPath: string, newPath: string, nextEnabled: boolean) => {
        const dir =
            entryType(oldPath, datapacksDirectory) === 'datapack' ? datapacksDirectory : modsDirectory;
        const key = cacheKey(uuid, dir, loader, minecraftVersion);
        const cache = readCache(key);
        const previous = cache.entries[oldPath];
        if (!previous) return;
        const updated: InstalledCache = {
            ...cache,
            entries: {
                ...cache.entries,
                [newPath]: {
                    ...previous,
                    entry: { ...previous.entry, path: newPath, enabled: nextEnabled },
                },
            },
        };
        delete updated.entries[oldPath];
        writeCache(key, updated);
    };

    const runToggleEnabled = async (entry: InstalledEntry, enabled: boolean) => {
        setBusyPath(entry.path);
        try {
            const nextPath = await setModEnabled({ serverUuid: uuid, path: entry.path, enabled });
            markRestartNeededIfRunning();
            // In-memory state goes through one update — DON'T bumpRefresh
            // afterwards. A full re-scan would hit the disk again, find the
            // renamed file, miss the cache (which we just migrated), and
            // flicker the row through a placeholder state. The migration
            // call above keeps the localStorage in sync for the next mount.
            migrateCacheEntry(entry.path, nextPath, enabled);
            setInstalled(
                installed.map((item) => (item.path === entry.path ? { ...item, path: nextPath, enabled } : item)),
            );
            setSelected((current) => {
                const next = new Set(current);
                if (next.delete(entry.path)) next.add(nextPath);
                return next;
            });
            toast.success(enabled ? 'Mod enabled.' : 'Mod disabled.');
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Rename failed.');
        } finally {
            setBusyPath(null);
        }
    };

    const runBulkToggle = async (enabled: boolean) => {
        const targets = selectedEntries.filter((entry) => entry.enabled !== enabled);
        if (targets.length === 0) return;
        setBulkBusy(true);
        try {
            const renames: Array<{ from: string; to: string }> = [];
            for (const entry of targets) {
                const nextPath = await setModEnabled({ serverUuid: uuid, path: entry.path, enabled });
                renames.push({ from: entry.path, to: nextPath });
                migrateCacheEntry(entry.path, nextPath, enabled);
            }
            markRestartNeededIfRunning();
            // Apply all renames + the new enabled state in a single setInstalled
            // so the rows update at once without intermediate re-renders.
            const remap = new Map(renames.map((r) => [r.from, r.to]));
            setInstalled(
                installed.map((item) => {
                    const renamed = remap.get(item.path);
                    return renamed ? { ...item, path: renamed, enabled } : item;
                }),
            );
            toast.success(
                `${enabled ? 'Enabled' : 'Disabled'} ${targets.length} mod${targets.length === 1 ? '' : 's'}.`,
            );
            setSelected(new Set());
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Bulk rename failed.');
        } finally {
            setBulkBusy(false);
        }
    };

    const runBulkDelete = async () => {
        if (selectedEntries.length === 0) return;
        setBulkBusy(true);
        try {
            await removeMods(
                uuid,
                selectedEntries.map((entry) => entry.path),
            );
            toast.success(`Deleted ${selectedEntries.length} mod${selectedEntries.length === 1 ? '' : 's'}.`);
            markRestartNeededIfRunning();
            setSelected(new Set());
            bumpRefresh();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Bulk delete failed.');
        } finally {
            setBulkBusy(false);
        }
    };

    const runBulkUpdate = async (entries: InstalledEntry[]) => {
        const targets = entries.filter((entry) => {
            if (entry.kind !== 'identified') return false;
            return updateAvailableFor(entry, latestByModId[entry.identified.project.id] ?? null);
        });
        if (targets.length === 0) return;
        setBulkBusy(true);
        let successCount = 0;
        let failCount = 0;
        try {
            // Suppress the per-mod full refresh that commitInstall would
            // otherwise trigger. Each refresh re-scans every installed mod
            // and fans out dozens of Modrinth API calls, so a 60-mod bulk
            // update used to trigger ~60 full re-scans back-to-back and
            // burn through Modrinth's rate limit in seconds. With the
            // suppression in place we only do ONE rescan at the end.
            //
            // Tracking per-mod success/fail so the summary toast at the
            // end reflects what actually happened instead of just "done".
            for (const entry of targets) {
                const ok = await runUpdate(entry, { skipRefresh: true });
                if (ok) successCount++;
                else failCount++;
            }
        } finally {
            setBulkBusy(false);
            // One coalesced refresh covers every successful update — far
            // fewer Modrinth calls than per-entry refresh.
            withFullRefresh();
            // Single summary toast instead of N per-mod success toasts.
            if (successCount > 0 && failCount === 0) {
                toast.success(`${successCount} mod${successCount === 1 ? '' : 's'} updated.`);
            } else if (successCount > 0 && failCount > 0) {
                toast.warning(`${successCount} updated, ${failCount} failed.`);
            } else if (failCount > 0) {
                toast.error(`All ${failCount} updates failed.`);
            }
        }
    };

    const beginInstall = async ({
        targetName,
        targetVersion,
        replacePath,
        skipRefresh,
    }: {
        targetName: string;
        targetVersion: ModVersion;
        replacePath?: string;
        /** Forwarded to commitInstall — see runUpdate for the rationale. */
        skipRefresh?: boolean;
    }): Promise<void> => {
        const resolution = resolveDependencies({
            target: targetVersion,
            installedModIds,
        });

        if (!resolution.canProceed) {
            const ids = resolution.incompatibleInstalled.map((d) => d.modId).filter((id): id is string => !!id);
            const names = await resolveDepNames(ids);
            setPending({
                targetName,
                targetVersion,
                replacePath,
                requiredNames: names,
                missingRequiredProjectIds: [],
            });
            return;
        }

        if (!resolution.requiresPrompt) {
            await commitInstall(targetVersion, replacePath, { skipRefresh });
            return;
        }

        const missingIds = resolution.missingRequired.map((d) => d.modId).filter((id): id is string => !!id);
        const names = await resolveDepNames(missingIds);
        setPending({
            targetName,
            targetVersion,
            replacePath,
            requiredNames: names,
            missingRequiredProjectIds: missingIds.map((id) => id.replace(/^modrinth:/, '')),
        });
    };

    const resolveDepNames = async (namespacedIds: string[]): Promise<Record<string, string>> => {
        const out: Record<string, string> = {};
        const projectIds = namespacedIds.map((id) => id.replace(/^modrinth:/, ''));
        for (const pid of projectIds) {
            try {
                const proj = await modrinth.getProject(pid);
                out[`modrinth:${pid}`] = proj.title;
            } catch {
                out[`modrinth:${pid}`] = pid;
            }
        }
        return out;
    };

    const commitInstall = async (
        version: ModVersion,
        replacePath?: string,
        options: { skipRefresh?: boolean } = {},
    ): Promise<void> => {
        // Route every "replace an existing jar" path through switchVersion so
        // the .disabled suffix is preserved. Modrinth's CDN serves clean
        // `name.jar` filenames, so without this step updating or version-
        // switching a disabled mod silently re-enables it. The directory the
        // file already lives in dictates where the replacement goes — this
        // matters for datapacks that live in world/datapacks rather than
        // mods/.
        const directory =
            replacePath && replacePath.startsWith(datapacksDirectory.replace(/^\/+|\/+$/g, '') + '/')
                ? datapacksDirectory
                : modsDirectory;
        if (replacePath) {
            await switchVersion({ serverUuid: uuid, modsDirectory: directory, fromPath: replacePath, version });
        } else {
            await installMod({ serverUuid: uuid, modsDirectory: directory, version });
        }
        markRestartNeededIfRunning();
        // `skipRefresh` is set by the bulk Update All loop so we don't
        // fan out N full re-scans (each one hitting dozens of Modrinth
        // endpoints) for an N-mod batch. Toasts are also suppressed
        // during a bulk run — one success toast per mod is noise; the
        // caller surfaces a single summary instead.
        if (options.skipRefresh) return;
        toast.success(replacePath ? 'Mod updated.' : 'Mod installed.');
        withFullRefresh();
    };

    const confirmPending = async () => {
        if (!pending) return;
        setPendingBusy(true);
        try {
            for (const projectId of pending.missingRequiredProjectIds) {
                try {
                    await installLatestForProject({
                        serverUuid: uuid,
                        modsDirectory,
                        datapacksDirectory,
                        projectId,
                        loader,
                        gameVersion: minecraftVersion,
                    });
                } catch {
                    toast.error(`Failed to install dependency ${projectId}.`);
                    setPendingBusy(false);
                    return;
                }
            }
            await commitInstall(pending.targetVersion, pending.replacePath);
            setPending(null);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Install failed.');
        } finally {
            setPendingBusy(false);
        }
    };

    // Per-phase scan label. The versions phase ticks one-per-project so we
    // surface (done of total); identifying is a single batched HTTP call so
    // we surface just the total ("looking at N mods") instead. Listing
    // pre-daemon has no count — but we DO know which directory we're
    // working on, so the label says "Scanning /mods..." instead of an
    // unhelpful blanket "Loading files...". This is the user-facing
    // movement that confirms a refresh is making progress even before any
    // counts are available.
    const progressSuffix =
        scanProgress.total > 0
            ? scanPhase === 'versions'
                ? ` (${scanProgress.done} of ${scanProgress.total})`
                : scanPhase === 'identifying'
                  ? ` (${scanProgress.total})`
                  : ''
            : '';
    const scanDirLabel = scanDirectory ? `/${scanDirectory.replace(/^\/+|\/+$/g, '')}` : '';
    const scanLabel =
        scanPhase === 'listing'
            ? scanDirLabel
                ? `Scanning ${scanDirLabel} for jars...`
                : 'Looking for installed mods...'
            : scanPhase === 'identifying'
              ? `Identifying ${scanProgress.total > 0 ? `${scanProgress.total} ` : ''}new or changed mods...`
              : scanPhase === 'versions'
                ? `Checking versions${progressSuffix}...`
                : null;

    const selectedUpdateCount = selectedEntries.filter((entry) => {
        if (entry.kind !== 'identified') return false;
        return updateAvailableFor(entry, latestByModId[entry.identified.project.id] ?? null);
    }).length;

    // Filter chips. "All" is a sentinel — it isn't a member of FilterChip,
    // it's just the visual state when no chips are active. Clicking it
    // resets to that state.
    interface ChipDef {
        value: FilterChip;
        label: string;
    }
    // Whether each chip should appear. Rules:
    //   * Mods / Plugins / Datapacks: show only when at least one row of
    //     that type exists AND at least two DIFFERENT types are present.
    //     On a pure-mod server every row is the same type so the chips
    //     would just be noise — there's nothing to filter between.
    //   * Enabled / Disabled: show only when at least one row matches.
    //     If everything is enabled, the "Disabled" chip would always
    //     filter to nothing; same the other way around.
    //   * Updates / Incompatible: same — only show when at least one
    //     row in that state exists. The chip is the call-to-action, no
    //     point showing it when there's nothing to act on.
    const hasMods = installed.some((e) => entryType(e.path, datapacksDirectory) === 'mod');
    const hasPlugins = installed.some((e) => entryType(e.path, datapacksDirectory) === 'plugin');
    const hasDatapackEntries = installed.some((e) => entryType(e.path, datapacksDirectory) === 'datapack');
    const typeCount = (hasMods ? 1 : 0) + (hasPlugins ? 1 : 0) + (hasDatapackEntries ? 1 : 0);
    const showTypeChips = typeCount >= 2;
    const hasEnabled = installed.some((e) => e.enabled);
    const hasDisabled = installed.some((e) => !e.enabled);
    const filterChips: ChipDef[] = [
        ...(hasEnabled ? [{ value: 'enabled' as FilterChip, label: 'Enabled' }] : []),
        ...(hasDisabled ? [{ value: 'disabled' as FilterChip, label: 'Disabled' }] : []),
        ...(showTypeChips && hasMods ? [{ value: 'mods' as FilterChip, label: 'Mods' }] : []),
        ...(showTypeChips && hasPlugins ? [{ value: 'plugins' as FilterChip, label: 'Plugins' }] : []),
        ...(showTypeChips && hasDatapackEntries
            ? [{ value: 'datapacks' as FilterChip, label: 'Datapacks' }]
            : []),
        ...(updateAvailableCount > 0 ? [{ value: 'updates' as FilterChip, label: 'Updates' }] : []),
        ...(incompatibleCount > 0 ? [{ value: 'incompatible' as FilterChip, label: 'Incompatible' }] : []),
    ];
    const allFilterActive = activeFilters.size === 0;

    // Drop any active filter whose chip is no longer visible. Without this
    // sweep a user who'd filtered to e.g. "Updates" can install the last
    // update and end up looking at a chipless toolbar with an empty list
    // and no obvious way to reset.
    useEffect(() => {
        if (activeFilters.size === 0) return;
        const visible = new Set(filterChips.map((c) => c.value));
        let changed = false;
        const next = new Set<FilterChip>();
        for (const chip of activeFilters) {
            if (visible.has(chip)) next.add(chip);
            else changed = true;
        }
        if (changed) setActiveFilters(next);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterChips.map((c) => c.value).join(','), activeFilters]);

    return (
        // `min-w-0 overflow-hidden` on the outermost wrapper stops the
        // mod-list and toolbar from forcing the parent page wider than
        // the viewport at narrow widths. Without these the long mod
        // titles + their action buttons could push the right edge of
        // the table past the page bounds, producing a horizontal
        // scrollbar on the body and chopping off content visually.
        <div className='relative w-full min-w-0 overflow-hidden pb-24'>
            {/* Restart chip now lives in the container's MainPageHeader so
                it sits alongside the action buttons rather than eating a row
                of vertical space here. */}

            {/* Search bar — matches the files-page pattern: bordered container
                with an absolutely positioned search icon overlay. */}
            <div className='relative mb-3 border border-[#ffffff12] rounded-md p-1'>
                <div className='pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 pl-2'>
                    <Magnifier width={20} height={20} className='opacity-40' />
                </div>
                {/* Uncontrolled input (ref + defaultValue, NO `value`)
                    — mirrors the files page's working search bar.
                    Controlled inputs get mangled by Million.js auto-
                    mode and fall back to native onchange-on-blur
                    semantics; uncontrolled bypasses that entirely
                    because the browser/DOM manages the visible value. */}
                <input
                    ref={searchInputRef}
                    className='w-full rounded-lg bg-[#ffffff11] py-3 pl-14 pr-10 text-sm font-bold outline-none'
                    type='text'
                    /* Placeholder reflects the live filtered count so users
                       see the impact of the chip + query they've applied
                       without us cluttering each chip with its own number. */
                    placeholder={
                        filteredInstalled.length === installed.length
                            ? `Search ${installed.length} mod${installed.length === 1 ? '' : 's'}…`
                            : `Showing ${filteredInstalled.length} of ${installed.length} mod${
                                  installed.length === 1 ? '' : 's'
                              }`
                    }
                    defaultValue={urlQuery}
                    onChange={(event) => onQueryChange(event.currentTarget.value)}
                />
                {query && (
                    <button
                        type='button'
                        onClick={() => {
                            // Imperatively reset the DOM input value
                            // (uncontrolled input — React doesn't manage
                            // its `value`). Then run the same clear
                            // logic the onChange path would have.
                            if (searchInputRef.current) {
                                searchInputRef.current.value = '';
                            }
                            onQueryChange('');
                        }}
                        aria-label='Clear search'
                        className='absolute right-4 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-400 hover:text-white'
                    >
                        <Xmark width={16} height={16} />
                    </button>
                )}
            </div>

            {/* Toolbar — single row at every viewport. Chips on the
                left scroll horizontally inside their flex-1 / min-w-0
                container so they never push the action cluster off-
                screen. On md+ the action cluster shows Update + Refresh
                buttons inline; on smaller viewports those collapse
                into a 3-dot overflow menu so the row always fits on
                one line and the enable/disable chips stay accessible. */}
            <div className='mb-4 flex items-center gap-3'>
                <div
                    className='-mx-1 flex min-w-0 flex-1 items-center gap-2 overflow-x-auto px-1 pb-1 sm:pb-0'
                    role='group'
                    aria-label='Filter installed mods'
                >
                    {/* "All" chip — clears every active filter when clicked.
                        Highlighted as active whenever the filter set is empty. */}
                    <button
                        type='button'
                        aria-pressed={allFilterActive}
                        className={clsx(
                            'shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-semibold transition',
                            allFilterActive
                                ? 'border-brand/60 bg-brand/20 text-brand'
                                : 'border-[#ffffff12] bg-[#ffffff0d] text-zinc-300 hover:bg-[#ffffff16] hover:text-white',
                        )}
                        onClick={() => setActiveFilters(new Set())}
                    >
                        All
                    </button>
                    {filterChips.map((chip) => {
                        const active = activeFilters.has(chip.value);
                        return (
                            <button
                                key={chip.value}
                                type='button'
                                aria-pressed={active}
                                className={clsx(
                                    'shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-semibold transition',
                                    active
                                        ? 'border-brand/60 bg-brand/20 text-brand'
                                        : 'border-[#ffffff12] bg-[#ffffff0d] text-zinc-300 hover:bg-[#ffffff16] hover:text-white',
                                )}
                                onClick={() => toggleFilter(chip.value)}
                            >
                                {chip.label}
                            </button>
                        );
                    })}
                </div>

                <div className='flex shrink-0 items-center gap-2'>
                    {scanLabel && <span className='hidden text-xs text-zinc-500 lg:inline'>{scanLabel}</span>}

                    {/* Inline cluster — md+ only. Below md the same
                        actions live in the 3-dot menu next to it so the
                        toolbar always fits on a single row. */}
                    <div className='hidden md:flex items-center gap-2'>
                        <ActionButton
                            // Primary (brand red) when there's actually
                            // something to update — pulls the eye to the
                            // action. Falls back to secondary (and disabled)
                            // when count is 0 so it doesn't shout for
                            // attention with nothing to do.
                            variant={updateAvailableCount > 0 ? 'primary' : 'secondary'}
                            size='sm'
                            onClick={() => void runBulkUpdate(installed)}
                            disabled={updateAvailableCount === 0 || actionLocked}
                        >
                            <ArrowDownToLine width={14} height={14} className='mr-1' />
                            Update all{updateAvailableCount > 0 ? ` (${updateAvailableCount})` : ''}
                        </ActionButton>
                        <ActionButton
                            variant='secondary'
                            size='sm'
                            onClick={withFullRefresh}
                            disabled={installedLoading}
                            aria-label='Refresh'
                            title='Refresh'
                        >
                            <ArrowsRotateRight
                                width={14}
                                height={14}
                                className={installedLoading ? 'animate-spin' : ''}
                            />
                            <span className='ml-1 hidden lg:inline'>Refresh</span>
                        </ActionButton>
                    </div>

                    {/* Overflow menu — visible below md only. Same
                        actions as the inline cluster above, gated on
                        the same disable conditions. EllipsisVertical
                        icon mirrors the per-row 3-dot menu we use
                        elsewhere on this page so the affordance is
                        familiar. */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                type='button'
                                aria-label='More actions'
                                title='More actions'
                                className='inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#ffffff14] bg-[#ffffff08] text-zinc-200 transition hover:border-[#ffffff20] hover:bg-[#ffffff14] hover:text-white md:hidden'
                            >
                                <EllipsisVertical width={16} height={16} />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end' className='w-52'>
                            <DropdownMenuItem
                                onClick={() => void runBulkUpdate(installed)}
                                disabled={updateAvailableCount === 0 || actionLocked}
                                className={clsx(updateAvailableCount > 0 && 'text-brand')}
                            >
                                <ArrowDownToLine width={14} height={14} className='mr-2' />
                                Update all{updateAvailableCount > 0 ? ` (${updateAvailableCount})` : ''}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={withFullRefresh} disabled={installedLoading}>
                                <ArrowsRotateRight
                                    width={14}
                                    height={14}
                                    className={clsx('mr-2', installedLoading && 'animate-spin')}
                                />
                                Refresh
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Errors are surfaced as toasts via friendlyScanError() rather
                than as an inline banner here — the inline render used to
                push the entire mod list down on any 429 / network blip,
                which felt jarring. The error message is still kept in
                state for screen readers and is exposed via aria-live in
                the SafetyBanner area. */}
            {installedError && (
                <span className='sr-only' role='status' aria-live='polite'>
                    {installedError}
                </span>
            )}

            {installedLoading && installed.length === 0 ? (
                <div className='flex items-center justify-center rounded-xl border border-[#ffffff12] bg-[radial-gradient(124.75%_124.75%_at_50.01%_-10.55%,rgb(16,16,16)_0%,rgb(4,4,4)_100%)] py-16'>
                    <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-brand'></div>
                </div>
            ) : installed.length === 0 ? (
                <div className='rounded-xl border border-[#ffffff12] bg-[radial-gradient(124.75%_124.75%_at_50.01%_-10.55%,rgb(16,16,16)_0%,rgb(4,4,4)_100%)] py-16 text-center'>
                    <p className='text-sm text-zinc-400'>
                        No mods installed yet.{' '}
                        <NavLink to={`/server/${serverId}/discover`} className='underline hover:text-white'>
                            Discover mods
                        </NavLink>{' '}
                        or upload jars into <code className='text-zinc-300'>{modsDirectory}/</code>.
                    </p>
                </div>
            ) : (
                // Outer card matches the files page list container — same border,
                // same radial-gradient background, same rounded-xl edges.
                <div
                    data-pyro-mods-installed
                    className='rounded-xl border border-[#ffffff12] bg-[radial-gradient(124.75%_124.75%_at_50.01%_-10.55%,rgb(16,16,16)_0%,rgb(4,4,4)_100%)] p-1'
                >
                    {/* Column-header strip — mirrors the ModRow's
                        flex layout exactly so each label sits directly
                        above the content it describes:
                          checkbox | project (flex-1) | version (md flex-1)
                                   | supported (lg flex-1) | actions (shrink)
                        The "Project" header doubles as the sort dropdown
                        trigger. The Actions header's width matches the
                        controls cluster on the row: at lg+ it's ~144px
                        (switch button + toggle + kebab + gaps); at smaller
                        widths controls collapse so we hide the label.

                        Heights: header runs at ~32px (py-1 + tight 10px text)
                        which is roughly half a row's ~72px so the table
                        breathes the way a spreadsheet does — header is a
                        slim label strip, content fills the heavy rows. */}
                    <div
                        className='mb-1 flex items-center gap-3 rounded-md bg-[#ffffff05] px-3 py-1 text-[10px] uppercase tracking-wide text-zinc-500'
                        role='row'
                    >
                        <Checkbox
                            className='ml-1 shrink-0'
                            checked={visibleSelected}
                            onCheckedChange={(checked) => selectVisible(checked === true)}
                            aria-label='Select all visible mods'
                        />
                        {/* Project column — flex-1 min-w-0 with the sort
                            dropdown inline. We dropped the icon-width
                            placeholder that used to align "Project" over
                            the row's title text — the placeholder was
                            adding ~48-56px of vertical space to the header
                            for no benefit, and "Project" reads fine from
                            the left edge of the project column anyway. */}
                        <div className='flex min-w-0 flex-1 items-center gap-2'>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        type='button'
                                        aria-label={`Sort by ${SORT_LABELS[sortMode]}`}
                                        title={`Sort: ${SORT_LABELS[sortMode]}`}
                                        className='inline-flex min-w-0 items-center gap-1.5 text-left font-semibold text-zinc-400 hover:text-white'
                                    >
                                        <span>Project</span>
                                        <BarsAscendingAlignLeftArrowDown width={12} height={12} className='shrink-0' />
                                        <span className='hidden text-[10px] font-medium normal-case text-zinc-500 md:inline'>
                                            {SORT_LABELS[sortMode]}
                                        </span>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align='start' className='w-52'>
                                    {(Object.keys(SORT_LABELS) as SortMode[]).map((mode) => (
                                        <DropdownMenuItem
                                            key={mode}
                                            onClick={() => setSortMode(mode)}
                                            className={clsx(sortMode === mode && 'font-semibold text-brand')}
                                        >
                                            {SORT_LABELS[mode]}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        {/* Version column — md+, flex-1 basis-0 so it
                            splits the leftover space evenly with the
                            Supported column. */}
                        <div className='hidden min-w-0 flex-1 basis-0 md:block'>
                            <span className='font-semibold text-zinc-400'>Version</span>
                        </div>
                        {/* Supported column — xl+, same flex-1 basis-0.
                            Bumped from lg to xl so the column drops out
                            of the row at the same width the row's data
                            column does, fixing the narrow-width
                            overflow that used to appear between lg
                            (sidebar-hidden) and the actual mobile
                            breakpoint. */}
                        <div className='hidden min-w-0 flex-1 basis-0 xl:block'>
                            <span className='font-semibold text-zinc-400'>Supported</span>
                        </div>
                        {/* Actions column — shrink-0 width matching the
                            controls block on the row. Hidden below sm
                            where the row collapses controls into the
                            dropdown menu. */}
                        <div className='hidden shrink-0 text-right sm:block sm:w-24 lg:w-36'>
                            <span className='font-semibold text-zinc-400'>Actions</span>
                        </div>
                    </div>

                    {filteredInstalled.length === 0 ? (
                        <div className='px-4 py-12 text-center text-sm text-zinc-500'>
                            No mods match the current filters.
                        </div>
                    ) : (
                        <div className='flex flex-col gap-1'>
                            {filteredInstalled.map((entry) => {
                                const latest =
                                    entry.kind === 'identified'
                                        ? (latestByModId[entry.identified.project.id] ?? null)
                                        : null;
                                const type = entryType(entry.path, datapacksDirectory);
                                const detailPath =
                                    entry.kind === 'identified'
                                        ? // Project detail is mounted under
                                          // /discover so clicking through to
                                          // read about a mod lights up the
                                          // Discover sidebar entry. The Mods
                                          // page is for managing what's
                                          // already installed; the detail
                                          // page is for understanding the
                                          // project itself.
                                          `/server/${serverId}/discover/project/${entry.identified.project.projectId}`
                                        : undefined;
                                // Path of the directory the file lives in,
                                // used as a hash for the file manager link
                                // (matches FileManagerBreadcrumbs#hashToPath).
                                const fileDir = `/${entry.path.split('/').slice(0, -1).join('/')}`;
                                // Compatibility for the installed version.
                                // Datapacks skip the loader check (they have
                                // no loaders array on Modrinth).
                                const versionCompatible =
                                    entry.kind === 'identified'
                                        ? isCompatible(entry.identified.version, {
                                              loaders: type === 'datapack' ? [] : serverLoaders,
                                              gameVersion: minecraftVersion,
                                              projectType: type,
                                          })
                                        : true;
                                return (
                                    <ModRow
                                        key={entry.path}
                                        entry={entry}
                                        updateAvailable={updateAvailableFor(entry, latest)}
                                        selected={selected.has(entry.path)}
                                        versionCompatible={versionCompatible}
                                        detailPath={detailPath}
                                        onSelect={(checked) =>
                                            setSelected((current) => {
                                                const next = new Set(current);
                                                if (checked) next.add(entry.path);
                                                else next.delete(entry.path);
                                                return next;
                                            })
                                        }
                                        onUpdate={() => void runUpdate(entry)}
                                        onRemove={() => void runRemove(entry)}
                                        onOpenVersionSwitcher={() => {
                                            // Warm the version cache the moment
                                            // the modal opens so the list is
                                            // ready by the time it renders.
                                            if (entry.kind === 'identified') {
                                                void loadVersionsForProject(
                                                    entry.identified.project.projectId,
                                                );
                                            }
                                            setVersionSwitcherPath(entry.path);
                                        }}
                                        onToggleEnabled={(enabled) => void runToggleEnabled(entry, enabled)}
                                        onShowInFiles={() =>
                                            window.open(`/server/${serverId}/files#${fileDir}`, '_blank')
                                        }
                                        busy={busyPath === entry.path || bulkBusy}
                                        actionsDisabled={false}
                                        disabledReason={undefined}
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Bulk action bar — uses the same FadeTransition + pointer-events
                pattern as MassActionsBar so the two pages animate identically.
                The inner card is constrained to viewport width on small screens
                with overflow-x-auto to keep buttons reachable. */}
            <FadeTransition duration='duration-75' show={selectedEntries.length > 0} appear unmount>
                <div className='pointer-events-none fixed bottom-0 left-0 right-0 z-50 mb-6 flex w-full justify-center px-3'>
                    <div className='pointer-events-auto flex w-full max-w-3xl items-center gap-2 overflow-x-auto rounded-xl border border-[#ffffff18] bg-black/70 p-2 shadow-2xl backdrop-blur-xl sm:gap-3 sm:p-3'>
                        <div className='flex min-w-0 shrink-0 items-center gap-2'>
                            <div className='flex h-8 w-8 items-center justify-center rounded-md bg-[#ffffff10] text-xs font-bold text-zinc-100'>
                                {selectedEntries.length}
                            </div>
                            <span className='hidden whitespace-nowrap text-sm font-semibold text-zinc-100 sm:inline'>
                                selected
                            </span>
                            <button
                                type='button'
                                className='whitespace-nowrap text-xs font-semibold text-zinc-400 hover:text-white'
                                onClick={() => setSelected(new Set())}
                            >
                                Clear
                            </button>
                        </div>
                        <div className='ml-auto flex shrink-0 items-center gap-2'>
                            <ActionButton
                                variant='secondary'
                                size='sm'
                                disabled={selectedUpdateCount === 0 || bulkBusy}
                                onClick={() => void runBulkUpdate(selectedEntries)}
                                title='Update selected'
                            >
                                <ArrowDownToLine width={14} height={14} />
                                <span className='ml-1 hidden sm:inline'>Update</span>
                            </ActionButton>
                            <ActionButton
                                variant='secondary'
                                size='sm'
                                disabled={bulkBusy}
                                onClick={() => void runBulkToggle(true)}
                            >
                                Enable
                            </ActionButton>
                            <ActionButton
                                variant='secondary'
                                size='sm'
                                disabled={bulkBusy}
                                onClick={() => void runBulkToggle(false)}
                            >
                                Disable
                            </ActionButton>
                            <ActionButton
                                variant='danger'
                                size='sm'
                                disabled={bulkBusy}
                                onClick={() => void runBulkDelete()}
                                title='Delete selected'
                            >
                                <TrashBin width={14} height={14} />
                                <span className='ml-1 hidden sm:inline'>Delete</span>
                            </ActionButton>
                        </div>
                    </div>
                </div>
            </FadeTransition>

            <Modal
                visible={pending !== null}
                onDismissed={() => !pendingBusy && setPending(null)}
                title='Dependencies required'
                dismissable={!pendingBusy}
                showSpinnerOverlay={pendingBusy}
            >
                {pending && (
                    <DependencyDialog
                        targetName={pending.targetName}
                        resolution={resolveDependencies({
                            target: pending.targetVersion,
                            installedModIds,
                        })}
                        requiredNames={pending.requiredNames}
                        onConfirm={() => void confirmPending()}
                        onCancel={() => setPending(null)}
                        busy={pendingBusy}
                    />
                )}
            </Modal>

            {/* Version switcher modal. The active entry is identified by path
                because that's the stable per-row identity — versionsByProject
                / allVersionsByProject are keyed by project ID, which the
                modal uses internally. Setting versionSwitcherPath to null
                dismisses. */}
            {(() => {
                const activeEntry = installed.find((e) => e.path === versionSwitcherPath) ?? null;
                const activeProject = activeEntry?.kind === 'identified' ? activeEntry.identified.project : null;
                const activeVersion = activeEntry?.kind === 'identified' ? activeEntry.identified.version : null;
                const activeProjectId = activeProject?.projectId ?? null;
                const compatState = activeProjectId ? versionsByProject[activeProjectId] : undefined;
                const allState = activeProjectId ? allVersionsByProject[activeProjectId] : undefined;
                const activeType = activeEntry ? entryType(activeEntry.path, datapacksDirectory) : 'mod';
                // If this row has an update pending we pre-select the latest
                // compatible version in the modal so a click on the red
                // switch button lands the user directly on the new version's
                // changelog — one fewer click to read what they'd be
                // installing.
                const activeLatest =
                    activeEntry?.kind === 'identified'
                        ? (latestByModId[activeEntry.identified.project.id] ?? null)
                        : null;
                const hasUpdate = activeEntry ? updateAvailableFor(activeEntry, activeLatest) : false;
                return (
                    <VersionSwitcherModal
                        visible={versionSwitcherPath !== null && !!activeProject}
                        project={activeProject}
                        currentVersion={activeVersion}
                        preselectedVersionId={hasUpdate ? (activeLatest?.id ?? null) : null}
                        versions={Array.isArray(compatState) ? compatState : null}
                        allVersions={allState === undefined ? null : allState}
                        constraints={{
                            loader,
                            minecraftVersion,
                            projectType: activeType,
                        }}
                        onSwitchVersion={(version) => {
                            if (activeEntry) void runSwitchVersion(activeEntry, version);
                            setVersionSwitcherPath(null);
                        }}
                        onLoadAllVersions={() => {
                            if (activeProjectId) void loadAllVersionsForProject(activeProjectId);
                        }}
                        onDismiss={() => setVersionSwitcherPath(null)}
                        busy={busyPath === activeEntry?.path}
                    />
                );
            })()}
        </div>
    );
};

export default ModsList;
