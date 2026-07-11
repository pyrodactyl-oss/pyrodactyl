import { ChevronLeft, ChevronRight } from '@gravity-ui/icons';
import clsx from 'clsx';
import debounce from 'debounce';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { Checkbox } from '@/components/elements/CheckboxNew';
import Modal from '@/components/elements/Modal';
import { PageListContainer } from '@/components/elements/pages/PageList';

import { expandLoaderFamily } from '@/api/server/mods/compat';
import { resolveDependencies } from '@/api/server/mods/dependencies';
import { isPluginLoader } from '@/api/server/mods/detect';
import * as modrinth from '@/api/server/mods/modrinth';
import { ModSortMode, ModSummary, ModVersion, ProjectType } from '@/api/server/mods/types';

import { ServerContext } from '@/state/server';

import DiscoverCard from './components/DiscoverCard';
import DependencyDialog from './components/DependencyDialog';
import FilterDropdown from './components/FilterDropdown';
import { useRestartNeeded, useServerIsSafe } from './components/SafetyGate';
import { useModsState } from './state';
import { installLatestForProject, installMod, primaryFile } from './utils/operations';

interface Props {
    loader: string;
    minecraftVersion: string;
    modsDirectory: string;
    datapacksSupported: boolean;
    datapacksDirectory: string;
    /**
     * Controlled project-type state. Lifted into DiscoverContainer so its
     * "Upload files" button can target the right directory for the active
     * tab; without lifting it, the container would have no idea whether
     * the user was looking at datapacks vs plugins vs mods.
     */
    projectType: ProjectType;
    onProjectTypeChange: (next: ProjectType) => void;
}

const PAGE_SIZE = 20;

// Categories per project type. Modrinth keeps these as runtime-fetched tags
// in their own UI; we hard-code a curated subset because the panel is meant
// to be approachable for non-power-users. The complete list is always
// reachable via the search box.
const MOD_CATEGORIES = [
    'adventure',
    'cursed',
    'decoration',
    'economy',
    'equipment',
    'food',
    'game-mechanics',
    'library',
    'magic',
    'management',
    'minigame',
    'mobs',
    'optimization',
    'social',
    'storage',
    'technology',
    'transportation',
    'utility',
    'worldgen',
];

const DATAPACK_CATEGORIES = [
    'adventure',
    'challenging',
    'combat',
    'decoration',
    'economy',
    'food',
    'game-mechanics',
    'library',
    'magic',
    'management',
    'minigame',
    'mobs',
    'optimization',
    'social',
    'storage',
    'technology',
    'transportation',
    'utility',
    'worldgen',
];

const SORT_OPTIONS: Array<{ value: ModSortMode; label: string }> = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'downloads', label: 'Downloads' },
    { value: 'follows', label: 'Followers' },
    { value: 'newest', label: 'Newest' },
    { value: 'updated', label: 'Recently updated' },
];

// The loader dropdown is intentionally narrow — we only support the four
// mod-loader eggs Pyrodactyl's detection covers, so a user shouldn't be able
// to "browse for liteloader 1.7.10" against a fabric server. We surface
// both mod-loader IDs and plugin-loader IDs because we now support
// Paper/Spigot/etc. servers — but the UI scopes the loader picker to the
// family relevant to the current server (mod loaders for forge/fabric
// servers, plugin loaders for paper/spigot servers).
const MOD_LOADER_IDS = new Set<string>(['forge', 'fabric', 'neoforge', 'quilt']);
const PLUGIN_LOADER_IDS = new Set<string>([
    'paper',
    'spigot',
    'bukkit',
    'purpur',
    'folia',
    'velocity',
    'waterfall',
    'bungeecord',
]);

interface PendingInstall {
    target: ModSummary;
    targetVersion: ModVersion;
    requiredNames: Record<string, string>;
    missingRequiredProjectIds: string[];
    incompatible: boolean;
}

// million-ignore
// Million.js auto-mode rewrites this component's virtual DOM and
// breaks controlled inputs — the <input value={query} onChange={...}>
// search bar stops propagating per-keystroke updates back into local
// state, so typing only "registers" on blur/Enter. The directive must
// sit directly above the COMPONENT DECLARATION (not the file-top
// imports) because Million attaches leading comments to the nearest
// node, and walks UP the AST from each JSX element looking for the
// marker — a comment on an import statement is never visited.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const DiscoverList = ({
    loader,
    minecraftVersion,
    modsDirectory,
    datapacksSupported: _ds,
    datapacksDirectory,
    projectType,
    onProjectTypeChange,
}: Props) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const serverId = ServerContext.useStoreState((state) => state.server.data!.id);
    const { status } = useServerIsSafe();
    const { mark: markRestartNeededIfRunning } = useRestartNeeded(uuid, status);
    const { installedModIds, bumpRefresh } = useModsState();

    // `projectType` and its setter are controlled props from
    // DiscoverContainer — the container owns this state so its title-bar
    // Upload button can route to the right directory.
    const setProjectType = onProjectTypeChange;

    // Search state: the input is **uncontrolled** — same pattern the
    // files page uses, which is the only one in the codebase that
    // worked reliably under Million.js auto-mode. With a controlled
    // input (`value={query}`), Million's block-VDOM bypass made the
    // browser fall back to native `onchange` semantics (fires on blur,
    // not per-keystroke); users reported typing only "submitting" when
    // they clicked away. Going uncontrolled puts the visible value
    // under the browser/DOM's control and reduces our React surface
    // to "listen for input events + debounce a URL write".
    //
    // The URL `?q=` parameter is still the canonical "what's the
    // current search" value the data effect keys off. We sync it
    // back into the DOM input imperatively (via ref) when it changes
    // externally — e.g. browser back / forward.
    const [searchParams, setSearchParams] = useSearchParams();
    const urlQuery = searchParams.get('q') ?? '';
    /** Ref to the search input — lets us sync ?q= back into the field imperatively on browser back/forward. */
    const searchInputRef = useRef<HTMLInputElement | null>(null);
    /** Available game versions fetched from Modrinth's tag endpoint, cached. */
    const [availableGameVersions, setAvailableGameVersions] = useState<
        Array<{ id: string; type: 'release' | 'snapshot' | 'beta' | string; releaseDate?: string }>
    >([]);
    /** Available loaders for the current project type. */
    const [availableLoaders, setAvailableLoaders] = useState<Array<{ id: string; name: string }>>([]);

    /**
     * The "natural" loader for a given project type on this server. This is
     * what a user would expect to be browsing without any explicit choice:
     *   - mod      → the server's loader, unless that's a plugin loader
     *                (in which case there's no sensible mod default; fall
     *                back to 'fabric' so the user can still browse mods on
     *                a Paper server without seeing zero results)
     *   - plugin   → the server's loader if it's a plugin loader, else
     *                'paper' so the user gets Bukkit-derived results
     *   - datapack → null; datapacks have no loader concept
     *
     * Used both by the URL filter derivations (loaderOverride falls back to
     * the natural default when the URL has no `?loader=` param) and by the
     * "is the user overriding?" check that gates the warning toast.
     */
    const naturalDefaultLoader = (pt: ProjectType): string | null => {
        if (pt === 'datapack') return null;
        if (pt === 'plugin') return isPluginLoader(loader) ? loader : 'paper';
        // Mod tab: the server's actual loader, unless it's plugin-only —
        // then default to fabric (most popular mod loader) so the user
        // sees results immediately instead of an empty list.
        return isPluginLoader(loader) ? 'fabric' : loader;
    };
    const naturalLoader = naturalDefaultLoader(projectType);

    // ---- URL-driven filter state ------------------------------------------
    //
    // Every filter beyond the search box reads/writes the URL query string,
    // so the active filter set is shareable, deep-linkable, and survives a
    // refresh. The URL shape mirrors modrinth.com's discover:
    //   /discover?type=plugin&loader=paper&mc=1.21.1&cat=adventure&cat=storage&sort=downloads&hideInstalled&page=2
    //
    // For each filter, the "natural default" (mod tab on a mod server →
    // server's loader, MC = server's detected version, sort = relevance,
    // page = 1, flags = off) is encoded as the *absence* of its param.
    // Default views land on a clean URL — no params bake in until the
    // user actually overrides something.

    // Loader override. URL ?loader=X. Falls back to the natural default
    // for the current project type. A deep-linked incompatible loader
    // (e.g. ?type=mod&loader=paper) is ignored on read — UI shows the
    // graceful fallback. The fix-up effect below also strips it from
    // the URL when the user actively changes project type.
    const rawLoader = searchParams.get('loader');
    const loaderIsValidForType =
        rawLoader === null
            ? false
            : projectType === 'plugin'
              ? isPluginLoader(rawLoader)
              : projectType === 'mod'
                ? !isPluginLoader(rawLoader)
                : true;
    const loaderOverride: string = loaderIsValidForType ? (rawLoader as string) : (naturalLoader ?? loader);

    // MC version override. URL ?mc=X. Falls back to the server's detected
    // Minecraft version.
    const mcVersionOverride = searchParams.get('mc') ?? minecraftVersion;

    // Categories. URL ?cat=A&cat=B (repeated). A stable string key feeds
    // the React deps so the memoised array's identity stays stable
    // across renders that don't change the cat list — otherwise every
    // unrelated URL write would refire the search effect.
    const catKey = searchParams.getAll('cat').join('\x00');
    const selectedCategories = useMemo(() => (catKey === '' ? [] : catKey.split('\x00')), [catKey]);

    // Sort mode. URL ?sort=X. Default 'relevance' is left out of the URL
    // entirely so default views stay clean.
    const rawSort = searchParams.get('sort');
    const sort: ModSortMode =
        rawSort === 'downloads' ||
        rawSort === 'follows' ||
        rawSort === 'newest' ||
        rawSort === 'updated' ||
        rawSort === 'relevance'
            ? rawSort
            : 'relevance';

    // Flag filters. URL ?hideInstalled, ?snapshots — presence means true,
    // absence means false. Value is ignored; we only check `has()` so a
    // bare `?hideInstalled` (no `=1`) works fine.
    const hideInstalled = searchParams.has('hideInstalled');
    const showGameVersionSnapshots = searchParams.has('snapshots');

    // Page. URL ?page=N (1-indexed). Default 1. A garbage value clamps
    // back to 1 — a malformed deep link shouldn't crash the search
    // effect's offset math.
    const rawPage = searchParams.get('page');
    const page = rawPage ? Math.max(1, parseInt(rawPage, 10) || 1) : 1;

    // ---- URL filter setters -----------------------------------------------
    //
    // Every filter write goes through one of these helpers so two
    // invariants stay true:
    //   1. Default values are stripped from the URL (clean URLs).
    //   2. Changing a filter resets `?page=` to 1 — paging through stale
    //      offsets after a filter change is always wrong.
    // All writes use `replace: true` so the back button steps through
    // distinct filter states, not every keystroke or chip toggle.
    //
    // The ref pattern is the same one the debounced search writer uses:
    // react-router re-creates setSearchParams every render, which would
    // otherwise force every callback below to be re-memoised constantly.
    const setSearchParamsRef = useRef(setSearchParams);
    setSearchParamsRef.current = setSearchParams;

    const setLoaderOverride = useCallback(
        (next: string) => {
            setSearchParamsRef.current(
                (prev) => {
                    const params = new URLSearchParams(prev);
                    if (naturalLoader !== null && next === naturalLoader) params.delete('loader');
                    else params.set('loader', next);
                    params.delete('page');
                    return params;
                },
                { replace: true },
            );
        },
        [naturalLoader],
    );

    const setMcVersionOverride = useCallback(
        (next: string) => {
            setSearchParamsRef.current(
                (prev) => {
                    const params = new URLSearchParams(prev);
                    if (next === minecraftVersion) params.delete('mc');
                    else params.set('mc', next);
                    params.delete('page');
                    return params;
                },
                { replace: true },
            );
        },
        [minecraftVersion],
    );

    const setSelectedCategories = useCallback(
        (next: string[] | ((prev: string[]) => string[])) => {
            setSearchParamsRef.current(
                (prev) => {
                    const params = new URLSearchParams(prev);
                    const prevCats = params.getAll('cat');
                    const resolved = typeof next === 'function' ? next(prevCats) : next;
                    params.delete('cat');
                    for (const c of resolved) params.append('cat', c);
                    params.delete('page');
                    return params;
                },
                { replace: true },
            );
        },
        [],
    );

    const setSort = useCallback((next: ModSortMode) => {
        setSearchParamsRef.current(
            (prev) => {
                const params = new URLSearchParams(prev);
                if (next === 'relevance') params.delete('sort');
                else params.set('sort', next);
                params.delete('page');
                return params;
            },
            { replace: true },
        );
    }, []);

    const setHideInstalled = useCallback((next: boolean) => {
        setSearchParamsRef.current(
            (prev) => {
                const params = new URLSearchParams(prev);
                if (next) params.set('hideInstalled', '1');
                else params.delete('hideInstalled');
                params.delete('page');
                return params;
            },
            { replace: true },
        );
    }, []);

    const setShowGameVersionSnapshots = useCallback((next: boolean) => {
        setSearchParamsRef.current(
            (prev) => {
                const params = new URLSearchParams(prev);
                if (next) params.set('snapshots', '1');
                else params.delete('snapshots');
                return params;
            },
            { replace: true },
        );
    }, []);

    const setPage = useCallback((next: number) => {
        setSearchParamsRef.current(
            (prev) => {
                const params = new URLSearchParams(prev);
                if (next === 1) params.delete('page');
                else params.set('page', String(next));
                return params;
            },
            { replace: true },
        );
    }, []);

    // On project-type switch (user-initiated), reset filters that don't
    // carry across tabs: drop categories (datapack vs mod categories
    // overlap but aren't 1:1), clear paging, and strip a now-
    // incompatible loader from the URL (a plugin loader on the Mods
    // tab, or vice versa). Skipped on initial mount so a deep-link like
    // ?type=mod&cat=storage actually lands with storage selected.
    const initialMountRef = useRef(true);
    useEffect(() => {
        if (initialMountRef.current) {
            initialMountRef.current = false;
            return;
        }
        setSearchParamsRef.current(
            (prev) => {
                const params = new URLSearchParams(prev);
                let changed = false;
                if (params.has('cat')) {
                    params.delete('cat');
                    changed = true;
                }
                if (params.has('page')) {
                    params.delete('page');
                    changed = true;
                }
                const currentLoader = params.get('loader');
                if (currentLoader !== null) {
                    const compatible =
                        projectType === 'plugin'
                            ? isPluginLoader(currentLoader)
                            : projectType === 'mod'
                              ? !isPluginLoader(currentLoader)
                              : true;
                    if (!compatible) {
                        params.delete('loader');
                        changed = true;
                    }
                }
                return changed ? params : prev;
            },
            { replace: true },
        );
    }, [projectType]);

    // Fetch the tag lists once per component lifetime — Modrinth doesn't
    // change these often and the responses are large enough that caching
    // them is worth it.
    useEffect(() => {
        let cancelled = false;
        const fetchTags = async () => {
            try {
                const [versions, loaders] = await Promise.all([
                    modrinth.listGameVersions(),
                    modrinth.listLoaders(),
                ]);
                if (cancelled) return;
                setAvailableGameVersions(versions);
                setAvailableLoaders(loaders);
            } catch (err) {
                console.warn('Could not fetch Modrinth tag lists:', err);
            }
        };
        void fetchTags();
        return () => {
            cancelled = true;
        };
    }, []);

    const [hits, setHits] = useState<ModSummary[]>([]);
    const [totalHits, setTotalHits] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [busyId, setBusyId] = useState<string | null>(null);
    const [pending, setPending] = useState<PendingInstall | null>(null);
    const [pendingBusy, setPendingBusy] = useState(false);

    // Debounced URL writer. Each keystroke pushes a new value through,
    // but only the trailing one (350ms after the user pauses) actually
    // updates the URL. We use `replace: true` so the back button steps
    // through whole-search states rather than every individual keypress.
    // The debouncer captures `setSearchParamsRef` (declared above with
    // the rest of the filter setters) rather than `setSearchParams`
    // directly — without the ref, the debounce would silently lose its
    // pending call whenever react-router re-created its setter on a
    // re-render.
    const writeQueryToUrl = useRef(
        debounce((v: string) => {
            setSearchParamsRef.current((prev) => {
                const next = new URLSearchParams(prev);
                if (v) next.set('q', v);
                else next.delete('q');
                // A new search resets paging; stale offsets after a
                // query change are always wrong.
                next.delete('page');
                return next;
            }, { replace: true });
        }, 350),
    ).current;
    useEffect(() => () => writeQueryToUrl.clear?.(), [writeQueryToUrl]);

    const onQueryChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const v = e.target.value;
            if (v === '') {
                // Empty input: flush the debounce and clear ?q= eagerly
                // so the empty-state UI doesn't wait 350ms to reappear.
                writeQueryToUrl.clear?.();
                setSearchParamsRef.current((prev) => {
                    const next = new URLSearchParams(prev);
                    next.delete('q');
                    next.delete('page');
                    return next;
                }, { replace: true });
            } else {
                writeQueryToUrl(v);
            }
        },
        [writeQueryToUrl],
    );

    // External URL changes (back / forward navigation, deep-link with
    // ?q=...) — push the new value into the DOM input imperatively so
    // the field reflects what's in the URL. We skip the imperative
    // write when the input is already showing the same value, both to
    // avoid clobbering an in-progress edit and to keep cursor position
    // stable during normal typing.
    useEffect(() => {
        const el = searchInputRef.current;
        if (el && el.value !== urlQuery) {
            el.value = urlQuery;
        }
    }, [urlQuery]);

    const installDirectory =
        projectType === 'datapack' ? datapacksDirectory : projectType === 'plugin' ? 'plugins' : modsDirectory;
    const categories = projectType === 'datapack' ? DATAPACK_CATEGORIES : MOD_CATEGORIES;

    // Page reset on filter change is handled by the URL filter setters
    // themselves — each one calls `params.delete('page')` in the same
    // setSearchParams call that writes the filter value, so stale page
    // offsets never persist across a filter change. The project-type
    // fix-up effect above also clears categories + page when the user
    // switches tabs. No standalone reset effects needed here.

    // Categories were toggled imperatively via a bespoke chip-cluster
    // popover; the unified FilterDropdown handles toggling internally
    // and hands us back the whole `Set` via `onChange`, so a separate
    // `toggleCategory` helper isn't needed here anymore.

    // -- Search -------------------------------------------------------------
    useEffect(() => {
        let cancelled = false;
        const run = async () => {
            setLoading(true);
            setError(null);
            try {
                // Loader handling per project type:
                //   - mod      → single mod-loader (forge/fabric/etc.)
                //   - datapack → none (datapacks have no loader concept)
                //   - plugin   → loader family expansion so a Paper server
                //                also matches plugins flagged only as
                //                Spigot or Bukkit on Modrinth.
                let loaderFacet: string[] = [];
                if (projectType === 'mod') loaderFacet = [loaderOverride];
                else if (projectType === 'plugin') loaderFacet = expandLoaderFamily(loaderOverride);

                const result = await modrinth.search({
                    query: urlQuery || undefined,
                    facets: {
                        loaders: loaderFacet,
                        gameVersions: [mcVersionOverride],
                        categories: selectedCategories,
                        projectType,
                        // server_side is a mod-only metadata field. Plugins
                        // don't carry an environment split (they're always
                        // server-side) and datapack search returns zero
                        // hits when we apply the facet.
                        serverSide: projectType === 'mod',
                    },
                    limit: PAGE_SIZE,
                    offset: (page - 1) * PAGE_SIZE,
                    sort,
                });
                if (cancelled) return;
                setHits(result.hits);
                setTotalHits(result.totalHits);
            } catch (err) {
                if (!cancelled) {
                    // Surface as a toast so mid-session Modrinth failures
                    // (typically 429) are visible without taking inline
                    // layout space. The inline `setError` is kept for
                    // empty-state messaging only — it gates the toolbar's
                    // error banner block when set.
                    const msg = err instanceof Error ? err.message : 'Search failed.';
                    setError(msg);
                    toast.error(/429|rate.?limit/i.test(msg)
                        ? "Modrinth's rate-limit kicked in. Try again in a minute or two."
                        : msg);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        run();
        return () => {
            cancelled = true;
        };
    }, [urlQuery, projectType, loaderOverride, mcVersionOverride, selectedCategories, sort, page]);

    // Apply the client-side "hide installed" filter on top of the API result.
    // Pagination still uses Modrinth's total so the page numbers stay stable —
    // a hidden hit just leaves a blank slot rather than reshuffling pages.
    const visibleHits = useMemo(
        () => (hideInstalled ? hits.filter((mod) => !installedModIds.has(mod.id)) : hits),
        [hits, installedModIds, hideInstalled],
    );

    /**
     * Tags the user has already filtered by — the loader picker, the
     * loader-family expansion (paper / spigot / bukkit when browsing
     * Plugins on a Paper server), and any selected categories. The
     * Discover card uses this set to hide redundant pills from each
     * result (no point in saying "Fabric" on every card when the user
     * has explicitly filtered to Fabric). All lower-cased so the card
     * can do a single case-insensitive lookup against
     * `mod.categories[i].toLowerCase()`.
     */
    const hiddenTagSet = useMemo(() => {
        const out = new Set<string>();
        // Loader: include the family expansion for plugins, so picking
        // "Paper" also hides Spigot/Bukkit chips from result cards.
        if (projectType === 'plugin') {
            for (const l of expandLoaderFamily(loaderOverride)) out.add(l.toLowerCase());
        } else if (projectType === 'mod') {
            out.add(loaderOverride.toLowerCase());
        }
        for (const cat of selectedCategories) out.add(cat.toLowerCase());
        return out;
    }, [projectType, loaderOverride, selectedCategories]);

    const totalPages = Math.max(1, Math.ceil(totalHits / PAGE_SIZE));
    const onPageSelect = (p: number) => {
        if (p < 1 || p > totalPages || p === page) return;
        setPage(p);
        // Scroll the page back into view — when the user pages from "showing
        // 21-40" the natural expectation is to land at the top of the results.
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // -- Install flow -------------------------------------------------------
    const beginInstall = async (mod: ModSummary) => {
        setBusyId(mod.id);
        try {
            const isDatapack = mod.projectType === 'datapack';
            const isPlugin = mod.projectType === 'plugin';
            // Loader filter for the version lookup. Datapacks have no
            // loader (vanilla MC reads them directly). Plugins use the
            // Bukkit family when the SERVER's loader isn't already a
            // plugin loader — that way a Forge user clicking install on a
            // Paper plugin still gets a version download (and the file
            // lands in plugins/, which a hybrid Mohist setup picks up).
            // For mods + plugin servers, we use the server's loader
            // family as before.
            let loaderFilter: string[] = [];
            if (isDatapack) {
                loaderFilter = [];
            } else if (isPlugin) {
                loaderFilter = isPluginLoader(loader)
                    ? expandLoaderFamily(loader)
                    : ['paper', 'spigot', 'bukkit'];
            } else {
                loaderFilter = isPluginLoader(loader) ? [] : [loader];
            }
            const versions = await modrinth.listVersions(mod.projectId, {
                loaders: loaderFilter,
                gameVersions: [minecraftVersion],
            });
            if (versions.length === 0) {
                toast.error(
                    isDatapack
                        ? `No version of ${mod.title} compatible with Minecraft ${minecraftVersion}.`
                        : isPlugin
                          ? `No plugin version of ${mod.title} compatible with Minecraft ${minecraftVersion}.`
                          : `No ${loader} version of ${mod.title} compatible with ${minecraftVersion}.`,
                );
                return;
            }
            const targetVersion = versions[0]!;
            if (!primaryFile(targetVersion)) {
                toast.error(`${mod.title} has no downloadable file.`);
                return;
            }

            const resolution = resolveDependencies({
                target: targetVersion,
                installedModIds,
            });

            if (!resolution.canProceed) {
                const names = await resolveDepNames(
                    resolution.incompatibleInstalled.map((d) => d.modId).filter((id): id is string => !!id),
                );
                setPending({
                    target: mod,
                    targetVersion,
                    requiredNames: names,
                    missingRequiredProjectIds: [],
                    incompatible: true,
                });
                return;
            }

            if (!resolution.requiresPrompt) {
                await commitInstall(mod, targetVersion);
                return;
            }

            const missingIds = resolution.missingRequired.map((d) => d.modId).filter((id): id is string => !!id);
            const names = await resolveDepNames(missingIds);
            setPending({
                target: mod,
                targetVersion,
                requiredNames: names,
                missingRequiredProjectIds: missingIds.map((id) => id.replace(/^modrinth:/, '')),
                incompatible: false,
            });
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Install failed.');
        } finally {
            setBusyId(null);
        }
    };

    const resolveDepNames = async (namespacedIds: string[]): Promise<Record<string, string>> => {
        const out: Record<string, string> = {};
        for (const id of namespacedIds) {
            const projectId = id.replace(/^modrinth:/, '');
            try {
                const p = await modrinth.getProject(projectId);
                out[id] = p.title;
            } catch {
                out[id] = projectId;
            }
        }
        return out;
    };

    const commitInstall = async (mod: ModSummary, version: ModVersion) => {
        // Route to the right directory by project type — datapacks land
        // in the configured datapacks dir, plugins always go to `plugins/`
        // even on a mod-loader server (covers Mohist / hybrid setups),
        // mods drop into the server's primary mods directory.
        const directory =
            mod.projectType === 'datapack'
                ? datapacksDirectory
                : mod.projectType === 'plugin'
                  ? 'plugins'
                  : modsDirectory;
        await installMod({
            serverUuid: uuid,
            modsDirectory: directory,
            version,
        });
        const label =
            mod.projectType === 'datapack'
                ? 'Datapack'
                : mod.projectType === 'plugin'
                  ? 'Plugin'
                  : 'Mod';
        toast.success(`${label} installed.`);
        markRestartNeededIfRunning();
        bumpRefresh();
    };

    const confirmPending = async () => {
        if (!pending) return;
        setPendingBusy(true);
        try {
            for (const projectId of pending.missingRequiredProjectIds) {
                await installLatestForProject({
                    serverUuid: uuid,
                    modsDirectory,
                    datapacksDirectory,
                    projectId,
                    loader,
                    gameVersion: minecraftVersion,
                });
            }
            await commitInstall(pending.target, pending.targetVersion);
            setPending(null);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Install failed.');
        } finally {
            setPendingBusy(false);
        }
    };

    const resolutionForPending = useMemo(() => {
        if (!pending) return null;
        return resolveDependencies({
            target: pending.targetVersion,
            installedModIds,
        });
    }, [pending, installedModIds]);

    // All three project-type tabs are surfaced on every server so the user
    // can discover content of any kind from Modrinth. The default tab
    // matches what their server is built for (plugin loaders default to
    // Plugins, mod loaders default to Mods) but they can swap freely —
    // useful for hybrid loaders like Mohist (Forge + Bukkit), and
    // generally for browsing what's out there. Installs route to the
    // correct directory regardless of the active tab.
    const projectTypeTabs: Array<{ value: ProjectType; label: string; show: boolean }> = [
        { value: 'mod', label: 'Mods', show: true },
        { value: 'plugin', label: 'Plugins', show: true },
        // Datapacks need vanilla MC ≥ 1.13. We still surface the tab for
        // pre-1.13 servers — the user can browse but installs will fail
        // explicitly, which is friendlier than hiding the option.
        { value: 'datapack', label: 'Datapacks', show: true },
    ];

    // Override warning is a toast now — the inline banner used to live
    // above the results and pushed content up/down whenever it toggled,
    // and even with a height-reserving placeholder it ate visual space
    // that's better used for the actual results. The toast fires only when
    // the user has explicitly diverged from the *natural* default for the
    // current project type, NOT when the natural default itself happens
    // to differ from the server's literal loader. Otherwise switching to
    // the Plugins tab on a Forge server would always toast (paper ≠ forge
    // by definition), and clicking Reset would put forge+plugins which is
    // an impossible combo.
    // (`naturalLoader` itself is computed once near the top of the
    // component alongside the URL-derived filter state — reuse it here
    // rather than re-deriving.)
    const loaderIsOverridden = naturalLoader !== null && loaderOverride !== naturalLoader;
    const mcIsOverridden = mcVersionOverride !== minecraftVersion;
    const isOverriding = loaderIsOverridden || mcIsOverridden;
    useEffect(() => {
        if (!isOverriding) return;
        // Build the "browsing for" message.
        //   * Datapack: no loader segment, just MC version.
        //   * Project type matches the server's loader (mod on mod-server,
        //     plugin on plugin-server): compare to "your server".
        //   * Project type doesn't match (mod on plugin-server etc.):
        //     compare to "the default for {projectType}" — the natural
        //     loader isn't really "your server" in that case, so calling
        //     it that would be misleading.
        const includeLoader = naturalLoader !== null && loaderIsOverridden;
        const targetText = `${includeLoader ? `${loaderOverride} ` : ''}${mcVersionOverride}`;
        const compareToServer = naturalLoader === null || naturalLoader === loader;
        const compareText = compareToServer
            ? `your server (${includeLoader ? `${loader} ` : ''}${minecraftVersion})`
            : `the ${projectType} default (${naturalLoader} ${minecraftVersion})`;
        const message = `Browsing for ${targetText}, which differs from ${compareText}.`;
        const t = toast.warning(message, {
            description:
                projectType === 'datapack'
                    ? 'Installs still target Minecraft ' + minecraftVersion + '.'
                    : 'Installs still target the server’s actual loader + MC version.',
            duration: 8000,
            action: {
                label: 'Reset',
                onClick: () => {
                    // Reset = clear `?loader=` AND `?mc=` AND `?page=` in
                    // a SINGLE URL write. Two sequential `setSearchParams`
                    // calls in the same tick both see the same `prev`
                    // (each setter's closure captured the current
                    // render's searchParams, not the URL state mutated by
                    // the previous call), so the second navigate
                    // overwrites the first — the loader clear would be
                    // lost. Bundling both deletes in one callback dodges
                    // that race.
                    //
                    // Natural defaults are encoded as the absence of
                    // their param (see the URL-derivation block at the
                    // top of the component), so a plain `params.delete`
                    // for each is the same as "set to natural default"
                    // — no need to thread `naturalLoader` /
                    // `minecraftVersion` through.
                    setSearchParamsRef.current(
                        (prev) => {
                            const params = new URLSearchParams(prev);
                            params.delete('loader');
                            params.delete('mc');
                            params.delete('page');
                            return params;
                        },
                        { replace: true },
                    );
                },
            },
        });
        return () => {
            // Sonner returns a toast id; dismiss the old toast when the
            // override pair changes so we never stack two of these on top
            // of each other.
            toast.dismiss(t);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOverriding, loaderOverride, mcVersionOverride, projectType, naturalLoader]);

    // -- Render -------------------------------------------------------------
    /**
     * Inline pagination control extracted so we can render it both above
     * and below the results without duplicating the markup. `key` is purely
     * for stable React keys when both copies are mounted simultaneously;
     * `compact` swaps the centered, padded "bottom" appearance for a tighter
     * inline-toolbar look used in the top row alongside the chips and sort.
     * Returns null when there's only one page so callers can render the slot
     * unconditionally.
     */
    const renderPagination = (key: 'top' | 'bottom') => {
        if (totalPages <= 1) return null;
        // Right-aligned at both top and bottom. The top paginator
        // rides inside the filter toolbar via `ml-auto` on its
        // wrapper; this internal flex wrapper is just an
        // `inline-flex` so it sizes to its content. The bottom
        // paginator gets `justify-end` so it lines up under the top
        // one for a consistent right-edge anchor.
        return (
            <div
                key={key}
                className={clsx(
                    key === 'bottom' ? 'mt-6 flex justify-end overflow-x-auto pb-1' : 'inline-flex',
                )}
            >
                <div className='flex shrink-0 items-center gap-1 rounded-md border border-[#ffffff14] bg-linear-to-b from-[#ffffff10] to-[#ffffff09] p-1'>
                    <button
                        type='button'
                        disabled={page <= 1 || loading}
                        onClick={() => onPageSelect(page - 1)}
                        className='inline-flex h-8 w-8 items-center justify-center rounded text-zinc-300 transition hover:bg-[#ffffff14] hover:text-white disabled:cursor-not-allowed disabled:opacity-50'
                        aria-label='Previous page'
                    >
                        <ChevronLeft width={16} height={16} />
                    </button>
                    {pageWindow(page, totalPages).map((p, i) =>
                        p === null ? (
                            <span key={`gap-${key}-${i}`} className='px-1 text-xs text-zinc-500'>
                                …
                            </span>
                        ) : (
                            <button
                                key={`${key}-${p}`}
                                type='button'
                                disabled={loading}
                                onClick={() => onPageSelect(p)}
                                aria-current={p === page ? 'page' : undefined}
                                className={clsx(
                                    'inline-flex h-8 min-w-8 items-center justify-center rounded px-2 text-sm font-semibold transition',
                                    p === page
                                        ? 'bg-brand text-white'
                                        : 'text-zinc-300 hover:bg-[#ffffff14] hover:text-white',
                                    loading && 'cursor-wait',
                                )}
                            >
                                {p}
                            </button>
                        ),
                    )}
                    <button
                        type='button'
                        disabled={page >= totalPages || loading}
                        onClick={() => onPageSelect(page + 1)}
                        className='inline-flex h-8 w-8 items-center justify-center rounded text-zinc-300 transition hover:bg-[#ffffff14] hover:text-white disabled:cursor-not-allowed disabled:opacity-50'
                        aria-label='Next page'
                    >
                        <ChevronRight width={16} height={16} />
                    </button>
                </div>
            </div>
        );
    };

    return (
        // `w-full min-w-0 overflow-hidden` clamps this entire tab to the
        // available width even when its deepest grid/flex descendants
        // would otherwise force horizontal overflow on narrow viewports.
        // Without it a wide mod card or long title can push the right
        // edge past the page bounds and create a page-level horizontal
        // scrollbar.
        <div className='w-full min-w-0 overflow-hidden'>
            {/* Restart chip now lives in the container header. */}

            {/* Full-width search bar — matches the Mods page's search input
                pattern. Lives above everything else so the user always sees a
                single canonical "what am I looking for" input. */}
            <div className='mb-3 relative border border-[#ffffff12] rounded-md p-1'>
                <div className='pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 pl-2'>
                    <svg
                        aria-hidden
                        xmlns='http://www.w3.org/2000/svg'
                        fill='none'
                        viewBox='0 0 24 24'
                        strokeWidth={1.5}
                        stroke='currentColor'
                        className='w-5 h-5 opacity-40'
                    >
                        <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            d='m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z'
                        />
                    </svg>
                </div>
                {/* Uncontrolled input (ref + defaultValue, NO `value`)
                    — mirrors the files page's working search bar.
                    Million.js auto-mode breaks controlled inputs but
                    leaves uncontrolled ones alone; this is the only
                    pattern in this codebase that reliably fires onChange
                    per-keystroke under the production bundle. */}
                <input
                    ref={searchInputRef}
                    className='w-full rounded-lg bg-[#ffffff11] py-3 pl-14 pr-4 text-sm font-bold outline-none'
                    type='text'
                    placeholder={
                        projectType === 'datapack'
                            ? `Search datapacks for Minecraft ${mcVersionOverride}…`
                            : `Search ${loaderOverride} mods for ${mcVersionOverride}…`
                    }
                    defaultValue={urlQuery}
                    onChange={onQueryChange}
                />
            </div>

            {/* Toolbar — single wrapping row that packs every control
                left-to-right. Project-type used to be three chip
                buttons (Mods / Plugins / Datapacks) but that
                ate ~250 px of horizontal real estate that nothing
                else could fill; collapsing it into the same
                FilterDropdown shape as Loader/MC/Categories lets
                pagination ride on the same row at wide viewports. */}
            <div className='mb-4 flex flex-wrap items-center gap-2'>
                {projectTypeTabs.length > 1 && (
                    <FilterDropdown
                        mode='single'
                        renderSelectionInTrigger
                        label='Type'
                        // Type is always selected (it's not a filter that
                        // can be cleared), so the default "highlight when
                        // selectedCount > 0" logic would keep this red
                        // forever. Pin to false so it renders neutral
                        // like a regular dropdown — the brand colour is
                        // reserved for "the user has actually overridden
                        // a default" signals on the other filters.
                        highlight={false}
                        options={projectTypeTabs.map((t) => ({ value: t.value, label: t.label }))}
                        value={projectType}
                        onChange={(v) => setProjectType(v as typeof projectType)}
                        panelWidth={180}
                    />
                )}
                <div className='flex flex-wrap items-center gap-2'>
                    {(projectType === 'mod' || projectType === 'plugin') && (
                        <FilterDropdown
                            mode='single'
                            renderSelectionInTrigger
                            label={projectType === 'plugin' ? 'Platform' : 'Loader'}
                            // Only highlight red when the user has actually
                            // overridden the server's natural loader — not
                            // just because something is selected.
                            highlight={loaderOverride !== naturalLoader && naturalLoader !== null}
                            options={availableLoaders
                                .filter((l) =>
                                    projectType === 'plugin'
                                        ? PLUGIN_LOADER_IDS.has(l.id)
                                        : MOD_LOADER_IDS.has(l.id),
                                )
                                .map((l) => ({
                                    value: l.id,
                                    label: l.name,
                                    badge: l.id === loader ? 'server' : undefined,
                                }))}
                            value={loaderOverride}
                            onChange={setLoaderOverride}
                            panelWidth={220}
                            emptyLabel={availableLoaders.length === 0 ? 'Loading…' : 'No loaders.'}
                        />
                    )}
                    {/* Game version dropdown — searchable, with a sticky
                        "Show snapshots" toggle so users hunting for a pre-
                        release can flip it on without losing their search
                        text. Matches modrinth.com's own version picker. */}
                    <FilterDropdown
                        mode='single'
                        renderSelectionInTrigger
                        label='MC'
                        showSearch
                        searchPlaceholder='Search versions…'
                        // Highlight only when the user is browsing a different
                        // MC version than the server actually runs.
                        highlight={mcVersionOverride !== minecraftVersion}
                        options={availableGameVersions
                            .filter((v) => showGameVersionSnapshots || v.type === 'release')
                            .map((v) => ({
                                value: v.id,
                                label: v.id,
                                badge:
                                    v.type !== 'release'
                                        ? v.type
                                        : v.id === minecraftVersion
                                          ? 'server'
                                          : undefined,
                            }))}
                        value={mcVersionOverride}
                        onChange={setMcVersionOverride}
                        stickyToggle={{
                            label: 'Show snapshots',
                            checked: showGameVersionSnapshots,
                            onChange: setShowGameVersionSnapshots,
                        }}
                        panelWidth={240}
                        emptyLabel={availableGameVersions.length === 0 ? 'Loading versions…' : 'No matches.'}
                    />
                    {/* Categories — multi-select via the shared
                        FilterDropdown so it shares the same trigger
                        shell, panel surface, and open-state
                        coordination as Type / Loader / MC. Earlier
                        drafts used a bespoke chip-cluster popover that
                        opened independently of FilterDropdown panels,
                        which let a Categories popover and a Loader
                        popover both stay open at once. The FilterDropdown
                        / Radix shell now owns dismissal centrally. */}
                    <FilterDropdown
                        mode='multi'
                        label='Categories'
                        options={categories.map((c) => ({ value: c }))}
                        selected={new Set(selectedCategories)}
                        // Multi-select setter — preserves URL-state
                        // semantics: setSelectedCategories drops the
                        // `?cat=` param (and resets ?page=) when the
                        // resolved array is empty.
                        onChange={(next) => setSelectedCategories([...next])}
                        panelWidth={240}
                    />
                </div>

                {/* Display options (Sort + Hide installed) — sit
                    flush against the data filters above with the
                    same gap rather than being pushed to the right
                    edge. Keeps the whole toolbar packed left,
                    matching the "no empty horizontal space" goal. */}
                <div className='flex flex-wrap items-center gap-2'>
                    {/* Sort — single-select via FilterDropdown so the
                        trigger / panel match the rest of the toolbar.
                        Highlight only when the user has actually picked
                        a non-default sort (relevance is the implicit
                        default — most users never touch it). The old
                        bespoke trigger used a sort icon; dropping it
                        keeps every trigger in the toolbar visually
                        uniform. */}
                    <FilterDropdown
                        mode='single'
                        label='Sort'
                        renderSelectionInTrigger
                        highlight={sort !== 'relevance'}
                        options={SORT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                        value={sort}
                        onChange={(v) => setSort(v as ModSortMode)}
                        panelWidth={200}
                    />
                    <label className='inline-flex h-9 items-center gap-2 rounded-md border border-[#ffffff14] bg-[#0d0d10] px-3 text-xs text-zinc-300 cursor-pointer hover:border-brand/60'>
                        <Checkbox
                            checked={hideInstalled}
                            onCheckedChange={(checked) => setHideInstalled(checked === true)}
                        />
                        <span className='whitespace-nowrap'>Hide installed</span>
                    </label>
                </div>
                {/* Pagination rides on the SAME row as the filter
                    buttons, pushed to the right via `ml-auto`. Earlier
                    drafts gave it a dedicated centered row + result-
                    count caption; the user found that wasteful at
                    wide viewports (lots of empty space above the
                    pagination). Right-aligning it here fills the
                    leftover row space and keeps everything on one
                    line. Wraps to a new line at narrow viewports. */}
                <div className='ml-auto'>{renderPagination('top')}</div>
            </div>

            {error && (
                <div className='mb-4 rounded-lg border border-red-600/40 bg-red-500/10 p-4 text-sm text-red-200'>
                    {error}
                </div>
            )}

            {/* Results body — single column. Loader / MC version /
                categories / hide-installed are now inline in the toolbar
                rows above, so the page no longer needs a flex-row + sidebar
                wrapper. */}
            <div className='min-w-0'>
                {/* Override warning lives in a Sonner toast now (see
                    useEffect above); no inline banner slot needed. */}
                <div>
                    {loading && hits.length === 0 ? (
                        <div className='flex items-center justify-center py-16'>
                            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-brand'></div>
                        </div>
                    ) : visibleHits.length === 0 ? (
                        <div className='text-center py-16 text-zinc-400'>
                            <p className='text-sm'>
                                {hideInstalled && hits.length > 0
                                    ? 'All results on this page are already installed. Turn off "Hide installed" to see them.'
                                    : 'No results match your filters.'}
                            </p>
                        </div>
                    ) : (
                        <PageListContainer>
                            {visibleHits.map((mod) => (
                                <DiscoverCard
                                    key={mod.id}
                                    mod={mod}
                                    installed={installedModIds.has(mod.id)}
                                    detailPath={`/server/${serverId}/discover/project/${mod.projectId}`}
                                    onInstall={() => void beginInstall(mod)}
                                    busy={busyId === mod.id}
                                    actionsDisabled={false}
                                    disabledReason={undefined}
                                    /* Tags the user has already filtered by — the
                                       card hides those from the visible pill row
                                       (showing them redundantly on every result
                                       just adds noise) and stuffs them into the
                                       +N overflow popover instead. Lower-cased
                                       on the way out so the card's lookup is
                                       case-insensitive. */
                                    hiddenTags={hiddenTagSet}
                                />
                            ))}
                        </PageListContainer>
                    )}

                    {renderPagination('bottom')}
                </div>
            </div>

            <Modal
                visible={pending !== null}
                onDismissed={() => !pendingBusy && setPending(null)}
                title={pending?.incompatible ? 'Incompatible mods installed' : 'Dependencies required'}
                dismissable={!pendingBusy}
                showSpinnerOverlay={pendingBusy}
            >
                {pending && resolutionForPending && (
                    <DependencyDialog
                        targetName={pending.target.title}
                        resolution={resolutionForPending}
                        requiredNames={pending.requiredNames}
                        onConfirm={() => void confirmPending()}
                        onCancel={() => setPending(null)}
                        busy={pendingBusy}
                    />
                )}
            </Modal>

            {/* Hidden divs preserve the directory variables so the bundler
                tree-shake doesn't mark them as unused — both are referenced
                conditionally in the dep installer above. */}
            <span className='hidden' aria-hidden>
                {installDirectory}
            </span>
        </div>
    );
};

/**
 * Build a compact list of page numbers to render around the current page.
 * Returns up to 7 entries, using `null` to indicate a visual gap ("…"). The
 * first and last page are always present so users can jump to either end.
 */
function pageWindow(current: number, total: number): Array<number | null> {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const window: Array<number | null> = [1];
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    if (start > 2) window.push(null);
    for (let i = start; i <= end; i++) window.push(i);
    if (end < total - 1) window.push(null);
    window.push(total);
    return window;
}

export default DiscoverList;
