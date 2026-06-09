import {
    ArrowDownToLine,
    ArrowUpRightFromSquare,
    CircleExclamation,
    Code,
    Comments,
    Compass,
    Copy,
    EllipsisVertical,
    FileText,
    HeartFill,
    Person,
    TriangleExclamation,
} from '@gravity-ui/icons';
import clsx from 'clsx';
import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import ActionButton from '@/components/elements/ActionButton';
import Modal from '@/components/elements/Modal';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/elements/DropdownMenu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/elements/Tabs';
import ActiveFilterChips, { type ActiveFilter } from '@/components/server/mods/components/ActiveFilterChips';
import FilterDropdown from '@/components/server/mods/components/FilterDropdown';
import GalleryViewer from '@/components/server/mods/components/GalleryViewer';
import Markdown from '@/components/server/mods/components/Markdown';

import { compareVersionStrings, isCompatible } from '@/api/server/mods/compat';
import * as modrinth from '@/api/server/mods/modrinth';
import { ModProject, ModVersion } from '@/api/server/mods/types';

import { ServerContext } from '@/state/server';

import { useRestartNeeded, useServerIsSafe } from './components/SafetyGate';
import { useModsState } from './state';
import { installMod, primaryFile } from './utils/operations';

interface Props {
    loader: string;
    minecraftVersion: string;
    modsDirectory: string;
    /**
     * Datapack install destination. Only populated by the parent when the
     * server actually supports datapacks (MC ≥ 1.13). For mods this argument
     * is ignored.
     */
    datapacksDirectory?: string;
}

const formatCount = (n: number): string => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toString();
};

const formatRelative = (iso: string | undefined): string => {
    if (!iso) return '—';
    const date = new Date(iso);
    const diffMs = Date.now() - date.getTime();
    const days = Math.floor(diffMs / 86_400_000);
    if (days < 1) return 'today';
    if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
    if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) === 1 ? '' : 's'} ago`;
    if (days < 365) return `${Math.floor(days / 30)} month${Math.floor(days / 30) === 1 ? '' : 's'} ago`;
    const years = Math.floor(days / 365);
    return `${years} year${years === 1 ? '' : 's'} ago`;
};

/**
 * Strict-numeric release-version filter for the compatibility sidebar.
 *
 * Modrinth's `project.gameVersions` mixes release entries ("1.21.1") with
 * snapshot identifiers ("23w35a"), pre-releases ("1.21-pre1"), and
 * release-candidate strings ("1.21-rc2"). Users on the panel rarely care
 * which snapshots a mod claims to support — what they want from the
 * compatibility chips is "does this work with the stable MC version I'm
 * actually running?". So we keep only the strict major.minor[.patch]
 * pattern and drop everything else. The detail page's Versions tab still
 * shows every version in full.
 *
 * We intentionally do this locally with a regex rather than cross-
 * referencing Modrinth's /tag/game_version endpoint — the regex is right
 * for every release MC version ever shipped, and it keeps the sidebar
 * render synchronous.
 */
const RELEASE_VERSION_RE = /^\d+\.\d+(?:\.\d+)?$/;
const filterReleaseVersions = (versions: string[]): string[] => versions.filter((v) => RELEASE_VERSION_RE.test(v));

/**
 * Friendly display name for a Modrinth donation-platform id. The API
 * returns lowercase platform slugs ("ko-fi", "patreon", "github",
 * "buymeacoffee", "open-collective", "other"); we surface the
 * conventional casing so the sidebar reads "Donate on Ko-fi" rather than
 * "Donate on ko-fi". Unknown platforms get a sensible title-case
 * fallback instead of a hardcoded list — Modrinth occasionally adds new
 * platforms and we'd rather show "PaymentMethod" than nothing.
 */
const DONATION_PLATFORM_LABELS: Record<string, string> = {
    'ko-fi': 'Ko-fi',
    'kofi': 'Ko-fi',
    'patreon': 'Patreon',
    'github': 'GitHub Sponsors',
    'github-sponsors': 'GitHub Sponsors',
    'paypal': 'PayPal',
    'buymeacoffee': 'Buy Me a Coffee',
    'buy-me-a-coffee': 'Buy Me a Coffee',
    'open-collective': 'Open Collective',
    'opencollective': 'Open Collective',
    'liberapay': 'Liberapay',
    'other': 'their site',
};
const prettifyPlatform = (raw: string): string => {
    if (!raw) return 'their site';
    const k = raw.toLowerCase();
    if (DONATION_PLATFORM_LABELS[k]) return DONATION_PLATFORM_LABELS[k]!;
    // Title-case the slug as a fallback ("crowd-funding" → "Crowd Funding").
    return raw
        .split(/[-_\s]+/)
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join(' ');
};

/**
 * Collapse a flat MC version list into Modrinth-web style major.minor groups.
 *
 * Input:  ["1.21.1", "1.21.2", "1.21.3", "1.20.1", "1.19.4"]
 * Output: ["1.21.x", "1.20.x", "1.19.x"]
 *
 * Each major.minor group becomes "1.X.x" when it has 2+ patches OR when it
 * already covers the bare "1.X" release. Lone patches (e.g. only 1.18.2)
 * stay as-is so we don't mislabel a project as supporting versions it
 * doesn't. Major.minor groups are returned sorted newest-first so the
 * compatibility sidebar reads top-down from most recent.
 */
const compactGameVersions = (versions: string[]): string[] => {
    const groups = new Map<string, string[]>();
    const singletons: string[] = [];
    for (const v of versions) {
        const m = /^(\d+)\.(\d+)(?:\.(\d+))?(.*)?$/.exec(v);
        if (!m) {
            singletons.push(v);
            continue;
        }
        const minorKey = `${m[1]}.${m[2]}`;
        if (!groups.has(minorKey)) groups.set(minorKey, []);
        groups.get(minorKey)!.push(v);
    }
    const labels: string[] = [];
    for (const [minor, members] of groups.entries()) {
        labels.push(members.length > 1 ? `${minor}.x` : members[0]!);
    }
    // Sort newest-first using the natural comparator — same logic that
    // makes `1.21.10` follow `1.21.9` correctly. Reverse the sign so the
    // most recent label appears at the top of the compatibility sidebar.
    labels.sort((a, b) => -compareVersionStrings(a, b));
    // Sort singletons too — without this, "1.18.2" added after "1.21.x"
    // would appear out of order in the chip grid.
    const sortedSingletons = [...singletons].sort((a, b) => -compareVersionStrings(a, b));
    return [...labels, ...sortedSingletons];
};

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

/**
 * Mod detail page — full Modrinth-style project view.
 *
 * Layout mirrors modrinth.com's project page: a tall header with the icon,
 * title, primary metadata + the install CTA, three internal tabs
 * (Description / Changelog / Versions), and a right-hand sidebar on desktop
 * containing every secondary detail (compatibility, platforms, environments,
 * external links, tags, creator, and licensing/dates).
 *
 * The sidebar collapses below the main column on viewports narrower than lg.
 */
const ProjectDetail = ({ loader, minecraftVersion, modsDirectory, datapacksDirectory }: Props) => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const serverId = ServerContext.useStoreState((state) => state.server.data!.id);
    const { status } = useServerIsSafe();
    const { mark: markRestartNeededIfRunning } = useRestartNeeded(uuid, status);
    const { installedModIds, bumpRefresh } = useModsState();

    const [project, setProject] = useState<ModProject | null>(null);
    const [compatibleVersions, setCompatibleVersions] = useState<ModVersion[]>([]);
    /**
     * Every published version of this project, regardless of loader or MC
     * version. Powers the Changelog tab (which always shows the full
     * history with optional filter chips) and is fetched lazily the
     * first time the user opens that tab. `null` = not yet fetched;
     * `[]` = fetched but project has no versions.
     */
    const [allVersions, setAllVersions] = useState<ModVersion[] | null>(null);
    const [allVersionsLoading, setAllVersionsLoading] = useState(false);
    /** Loader IDs selected as Changelog filters. Empty = no filter. */
    const [changelogLoaderFilters, setChangelogLoaderFilters] = useState<Set<string>>(new Set());
    /** MC version strings selected as Changelog filters. Empty = no filter. */
    const [changelogMcFilters, setChangelogMcFilters] = useState<Set<string>>(new Set());
    /**
     * Same filter pair for the Versions tab. Initialised to the server's
     * loader + MC version on mount so the default view matches what the
     * server can install. User can clear or broaden via the chips, which
     * supersedes the old "Show all versions" checkbox.
     */
    const [versionsLoaderFilters, setVersionsLoaderFilters] = useState<Set<string>>(() => new Set([loader]));
    const [versionsMcFilters, setVersionsMcFilters] = useState<Set<string>>(() => new Set());
    /**
     * Whether the Game versions filter dropdown should expose snapshot /
     * pre-release / release-candidate Minecraft versions. Off by default
     * (most users only ever care about stable releases); flipping it on
     * grows the option list so a user can filter by e.g. "24w12a" or
     * "1.21-pre1". Tracked separately per-tab so toggling the Versions
     * tab's view doesn't disrupt the Changelog tab's selection.
     */
    const [changelogShowAllMc, setChangelogShowAllMc] = useState(false);
    const [versionsShowAllMc, setVersionsShowAllMc] = useState(false);
    /**
     * Ref tracks whether we've already seeded the Versions tab's MC chip
     * default for this project. We can only set it once allVersions
     * arrives (the chip values depend on the project's actual MC
     * coverage — "1.21.5" the server runs might end up as a "1.21.x"
     * group chip if multiple patches are present). One-shot.
     */
    const versionsMcSeededFor = useRef<string | null>(null);
    // `loading` only covers the FIRST project fetch — once project is set
    // we keep the page mounted. Filter chip changes don't need their own
    // spinner; the heavy lifting is the one-shot allVersions fetch.
    const [loading, setLoading] = useState(true);
    // Compatible-versions list is loaded once in the initial project
    // fetch effect below and never refetched (chips operate on
    // allVersions instead). No standalone loading flag is needed; the
    // top-level `loading` covers the initial state.
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    // Tab selection is controlled so it survives any re-render — toggling
    // showAllVersions or installing a mod from inside a tab shouldn't reset
    // the user to Description.
    const [activeTab, setActiveTab] = useState<string>('description');

    /**
     * Version-details modal — opened from the per-row 3-dot menu on the
     * Versions tab. Renders the version's full changelog + file list in
     * a focused dialog, similar to the version switcher modal but
     * without the install action (the row's own Install button is the
     * canonical action surface).
     */
    const [detailsVersion, setDetailsVersion] = useState<ModVersion | null>(null);

    const versionPageSize = 12;
    const [versionPage, setVersionPage] = useState(1);

    useEffect(() => {
        setVersionPage(1);
    }, [projectId, versionsLoaderFilters, versionsMcFilters]);

    // Tracks which project id we've already kicked off the all-versions
    // fetch for. Declared as a ref (not state) so updating it doesn't
    // retrigger the lazy-fetch effect below — the previous draft kept
    // this in state, which created a render loop that cancelled the
    // fetch on its very next render and stuck the Changelog tab on
    // "Loading…" forever.
    const allVersionsFetchedFor = useRef<string | null>(null);

    // Reset filter state when project changes — otherwise we'd briefly
    // show one project's filters applied to another's versions. Reset
    // both fetch sentinels too so the next changelog or versions open
    // re-runs the lazy fetch for the new project.
    useEffect(() => {
        setAllVersions(null);
        setChangelogLoaderFilters(new Set());
        setChangelogMcFilters(new Set());
        setVersionsLoaderFilters(new Set([loader]));
        setVersionsMcFilters(new Set());
        setChangelogShowAllMc(false);
        setVersionsShowAllMc(false);
        allVersionsFetchedFor.current = null;
        versionsMcSeededFor.current = null;
    }, [projectId, loader]);

    // Lazy-fetch every published version the first time the Changelog OR
    // Versions tab is opened. The ref above guarantees we only fire once
    // per project — the effect's deps are intentionally narrow so we
    // don't end up cancelling our own fetch on a re-render.
    useEffect(() => {
        if (activeTab !== 'changelog' && activeTab !== 'versions') return;
        if (!projectId || !project) return;
        if (allVersionsFetchedFor.current === projectId) return;
        allVersionsFetchedFor.current = projectId;
        let cancelled = false;
        const run = async () => {
            setAllVersionsLoading(true);
            try {
                const versions = await modrinth.listVersions(projectId, {});
                if (!cancelled) setAllVersions(versions);
            } catch (err) {
                if (!cancelled) {
                    toast.error(err instanceof Error ? err.message : 'Could not load versions.');
                    // Allow a retry on the next tab open by clearing the
                    // sentinel — otherwise an error would lock the tab
                    // out of ever fetching for this project id again.
                    allVersionsFetchedFor.current = null;
                }
            } finally {
                if (!cancelled) setAllVersionsLoading(false);
            }
        };
        void run();
        return () => {
            cancelled = true;
        };
    }, [activeTab, projectId, project]);

    // Initial project + version fetch — runs on mount and when the projectId
    // / server constraints change. Sets `loading` because we have no data to
    // show during this round-trip.
    useEffect(() => {
        if (!projectId) return;
        let cancelled = false;
        const run = async () => {
            setLoading(true);
            setError(null);
            try {
                const proj = await modrinth.getProject(projectId);
                if (cancelled) return;
                setProject(proj);

                const isDatapack = proj.projectType === 'datapack';
                const versions = await modrinth.listVersions(projectId, {
                    loaders: isDatapack ? [] : [loader],
                    gameVersions: [minecraftVersion],
                });
                if (cancelled) return;
                setCompatibleVersions(versions);
            } catch (err) {
                if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load mod.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        run();
        return () => {
            cancelled = true;
        };
    }, [projectId, loader, minecraftVersion]);

    // The old showAllVersions-driven refetch effect that used to live
    // here was removed when the Versions tab moved to chip-based
    // filtering. The chips now operate on the lazily-fetched
    // `allVersions` list — no extra Modrinth round-trips per toggle.

    const isInstalled = useMemo(() => (project ? installedModIds.has(project.id) : false), [project, installedModIds]);

    const installLatest = async () => {
        if (!project) return;
        const isDatapack = project.projectType === 'datapack';
        // Always target the server's loader + MC version for the install
        // itself — the "Show all" toggle is for exploration, not installs.
        const targetable = compatibleVersions.find((v) =>
            isCompatible(v, {
                loaders: isDatapack ? [] : [loader],
                gameVersion: minecraftVersion,
                projectType: project.projectType,
            }),
        );
        if (!targetable) {
            toast.error('No version compatible with this server.');
            return;
        }
        await handleInstall(targetable);
    };

    const handleInstall = async (version: ModVersion) => {
        if (!primaryFile(version)) {
            toast.error('This version has no downloadable file.');
            return;
        }
        if (!project) return;
        setBusy(true);
        try {
            const destination =
                project.projectType === 'datapack' && datapacksDirectory ? datapacksDirectory : modsDirectory;
            await installMod({ serverUuid: uuid, modsDirectory: destination, version });
            toast.success(`${project.projectType === 'datapack' ? 'Datapack' : 'Mod'} installed.`);
            markRestartNeededIfRunning();
            bumpRefresh();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Install failed.');
        } finally {
            setBusy(false);
        }
    };

    /** Open the primary file's CDN URL in a new tab — straight CDN download. */
    const handleDownloadFile = (version: ModVersion) => {
        const file = primaryFile(version);
        if (!file) {
            toast.error('This version has no downloadable file.');
            return;
        }
        window.open(file.url, '_blank', 'noopener,noreferrer');
    };

    /** Copy the primary file URL to the clipboard. */
    const handleCopyDownloadLink = async (version: ModVersion) => {
        const file = primaryFile(version);
        if (!file) {
            toast.error('This version has no downloadable file.');
            return;
        }
        try {
            await navigator.clipboard.writeText(file.url);
            toast.success('Download link copied to clipboard.');
        } catch {
            // Some browsers reject clipboard writes outside a direct user
            // gesture (or in non-HTTPS contexts). Fall back to a manual
            // toast that surfaces the URL so the user can copy it.
            toast.info(file.url, { description: 'Long-press to copy.' });
        }
    };

    /** Jump to this version's page on modrinth.com in a new tab. */
    const handleOpenOnModrinth = (version: ModVersion) => {
        if (!project) return;
        // Modrinth's per-version page is /<projectType>/<slug>/version/<id>.
        // projectUrl already encodes the projectType + slug, so we just
        // append the version segment.
        window.open(`${project.projectUrl}/version/${version.id}`, '_blank', 'noopener,noreferrer');
    };

    // Derived data for sidebar sections — only computed when project loaded.
    const compatGameVersions = useMemo(
        () => compactGameVersions(filterReleaseVersions(project?.gameVersions ?? [])),
        [project?.gameVersions],
    );
    const compatLoaders = project?.loaders ?? [];

    /**
     * Build a Discover URL pre-filtered by the chip the user clicked.
     * `type` is included whenever we have it so a click on a plugin's
     * "decoration" tag lands the user on the Plugins tab even if their
     * server defaults to Mods. DiscoverContainer ignores `?type=`
     * silently when it matches the natural default for the server.
     */
    const discoverUrl = (filters: { type?: string; cat?: string; loader?: string; mc?: string }): string => {
        const sp = new URLSearchParams();
        if (filters.type) sp.set('type', filters.type);
        if (filters.loader) sp.set('loader', filters.loader);
        if (filters.mc) sp.set('mc', filters.mc);
        if (filters.cat) sp.set('cat', filters.cat);
        const qs = sp.toString();
        return `/server/${serverId}/discover${qs ? `?${qs}` : ''}`;
    };

    /**
     * Distinct loader IDs that appear across the full version history.
     * Powers the Changelog tab's loader-filter chip row — we only surface
     * chips for loaders actually present in this project's data, not
     * every possible Modrinth loader.
     */
    const changelogLoaderOptions = useMemo(() => {
        const set = new Set<string>();
        for (const v of allVersions ?? []) for (const l of v.loaders) set.add(l);
        return [...set].sort();
    }, [allVersions]);

    /**
     * Distinct MC release versions across the full version history,
     * sorted newest-first. We surface each precise version (1.21.5,
     * 1.21.4, 1.21.3, …) individually rather than collapsing to a
     * "1.21.x" group — users want to pin to exactly the patch their
     * server runs, not a wildcard. Snapshots/pre-releases drop out via
     * filterReleaseVersions; the user flips the sticky "Show all
     * versions" toggle to surface those.
     */
    const changelogMcOptions = useMemo(() => {
        const set = new Set<string>();
        for (const v of allVersions ?? []) for (const mc of v.gameVersions) set.add(mc);
        const releases = filterReleaseVersions([...set]);
        releases.sort((a, b) => -compareVersionStrings(a, b));
        return releases;
    }, [allVersions]);

    /**
     * Full MC version option list including snapshots, pre-releases, and
     * release-candidates. Surfaced only when the user flips the
     * "Show all versions" toggle inside the Game versions dropdown.
     * Single combined list sorted newest-first via the natural
     * comparator so snapshots interleave with their stable peers.
     */
    const changelogMcOptionsAll = useMemo(() => {
        const set = new Set<string>();
        for (const v of allVersions ?? []) for (const mc of v.gameVersions) set.add(mc);
        const all = [...set];
        all.sort((a, b) => -compareVersionStrings(a, b));
        return all;
    }, [allVersions]);

    /**
     * Match a precise MC chip ("1.21.5", "24w12a") against a version's
     * raw `gameVersions` list. Now that we surface each version
     * individually (no more 1.21.x wildcards), this is just a literal
     * array containment check.
     */
    const chipMatchesGameVersions = (chip: string, gameVersions: string[]): boolean =>
        gameVersions.includes(chip);

    /** Apply the loader + MC chip filters to an allVersions slice. */
    const applyVersionFilters = (
        src: ModVersion[],
        loaderFilters: Set<string>,
        mcFilters: Set<string>,
    ): ModVersion[] => {
        if (loaderFilters.size === 0 && mcFilters.size === 0) return src;
        return src.filter((v) => {
            if (loaderFilters.size > 0 && !v.loaders.some((l) => loaderFilters.has(l))) return false;
            if (mcFilters.size > 0) {
                if (![...mcFilters].some((chip) => chipMatchesGameVersions(chip, v.gameVersions))) return false;
            }
            return true;
        });
    };

    /**
     * Build the active-filter chip list for either tab. Each chip removes
     * its own filter when clicked — the parent setters are passed in so
     * the helper stays a pure function of its arguments and we can reuse
     * it for both Changelog and Versions tabs. Order: loaders first, then
     * MC versions, so the chip row reads "platform → game version" the
     * same way the dropdown buttons above it do.
     */
    const buildActiveFilters = (
        loaderFilters: Set<string>,
        setLoaderFilters: React.Dispatch<React.SetStateAction<Set<string>>>,
        mcFilters: Set<string>,
        setMcFilters: React.Dispatch<React.SetStateAction<Set<string>>>,
    ): ActiveFilter[] => {
        const out: ActiveFilter[] = [];
        for (const l of loaderFilters) {
            out.push({
                key: `loader:${l}`,
                label: l,
                onRemove: () =>
                    setLoaderFilters((prev) => {
                        const next = new Set(prev);
                        next.delete(l);
                        return next;
                    }),
            });
        }
        for (const v of mcFilters) {
            out.push({
                key: `mc:${v}`,
                label: v,
                onRemove: () =>
                    setMcFilters((prev) => {
                        const next = new Set(prev);
                        next.delete(v);
                        return next;
                    }),
            });
        }
        return out;
    };

    /**
     * Versions actually displayed on the Changelog timeline after the
     * loader + MC filter chips are applied. Chip selection is OR within
     * a category, AND across categories. Empty filters = show
     * everything (the default for the Changelog tab).
     */
    const changelogVersions = useMemo(
        () => applyVersionFilters(allVersions ?? [], changelogLoaderFilters, changelogMcFilters),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [allVersions, changelogLoaderFilters, changelogMcFilters],
    );

    /**
     * Versions displayed on the Versions tab after its own filter chips.
     * Defaults match what the server can install (loader + MC), so the
     * initial view is "compatible only" — same as the old Show-all
     * checkbox default. Users can clear chips to broaden.
     */
    const versionsViewVersions = useMemo(
        () => applyVersionFilters(allVersions ?? compatibleVersions, versionsLoaderFilters, versionsMcFilters),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [allVersions, compatibleVersions, versionsLoaderFilters, versionsMcFilters],
    );

    // Once allVersions arrives, seed the Versions tab's MC filter to
    // the server's exact MC version (if the project actually supports
    // it). Done as a one-shot via the ref so re-renders don't fight the
    // user's manual selections.
    useEffect(() => {
        if (!allVersions || !projectId) return;
        if (versionsMcSeededFor.current === projectId) return;
        // Look in the FULL option list — minecraftVersion might be a
        // snapshot like "24w12a" that wouldn't appear in the release-only
        // default list. Better to seed it correctly even if the user
        // hasn't toggled "Show all versions" yet.
        if (changelogMcOptionsAll.includes(minecraftVersion)) {
            setVersionsMcFilters(new Set([minecraftVersion]));
        }
        versionsMcSeededFor.current = projectId;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allVersions, projectId, minecraftVersion]);

    return (
        <div className='relative'>
            {/* Restart chip is rendered inside the parent container's header. */}

            <button
                onClick={() => navigate(-1)}
                className='mb-4 inline-flex items-center gap-1 text-sm text-zinc-300 hover:text-white'
            >
                ← Back
            </button>

            {loading ? (
                <div className='flex items-center justify-center py-16'>
                    <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-brand'></div>
                </div>
            ) : error ? (
                <div className='rounded-lg border border-red-600/40 bg-red-500/10 p-4 text-sm text-red-200'>
                    {error}
                </div>
            ) : project ? (
                <>
                    {/* Header bar — icon + title + stats + install CTA */}
                    <header className='mb-6 rounded-xl border border-[#ffffff10] bg-[#ffffff05] p-4 sm:p-6'>
                        <div className='flex flex-col gap-4 sm:flex-row sm:items-start'>
                            <div className='flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#ffffff10] bg-[#ffffff0d] sm:h-24 sm:w-24'>
                                {project.iconUrl ? (
                                    <img src={project.iconUrl} alt='' className='h-full w-full object-cover' />
                                ) : (
                                    <span className='text-xs font-semibold text-zinc-500'>MOD</span>
                                )}
                            </div>
                            <div className='min-w-0 flex-1'>
                                <h1 className='text-2xl font-bold text-zinc-100'>{project.title}</h1>
                                <p className='mt-1 text-sm text-zinc-400'>{project.description}</p>
                                <div className='mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400'>
                                    <span className='inline-flex items-center gap-1.5'>
                                        <ArrowDownToLine width={14} height={14} />
                                        {formatCount(project.downloads)} downloads
                                    </span>
                                    <span className='inline-flex items-center gap-1.5'>
                                        ♥ {formatCount(project.follows)} followers
                                    </span>
                                    {project.categories.length > 0 && (
                                        <div className='flex flex-wrap gap-1.5'>
                                            {/* Header category chips are clickable
                                                shortcuts into a filtered Discover
                                                view — click "decoration" on a
                                                plugin's page to see every other
                                                Modrinth plugin tagged
                                                decoration. We pass the
                                                project's projectType so the
                                                landed tab matches the project,
                                                not just whatever the server's
                                                natural default is. */}
                                            {project.categories.slice(0, 6).map((cat) => (
                                                <NavLink
                                                    key={cat}
                                                    to={discoverUrl({ type: project.projectType, cat })}
                                                    title={`Find more ${cat} on Discover`}
                                                    className='rounded-full bg-[#ffffff10] px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-300 transition hover:bg-brand/20 hover:text-white'
                                                >
                                                    {cat}
                                                </NavLink>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className='flex shrink-0 items-center gap-2'>
                                <ActionButton
                                    variant='primary'
                                    onClick={() => void installLatest()}
                                    disabled={busy || isInstalled}
                                    title={isInstalled ? 'Already installed' : undefined}
                                >
                                    <ArrowDownToLine width={16} height={16} className='mr-2' />
                                    {isInstalled ? 'Installed' : 'Install'}
                                </ActionButton>
                                <a
                                    href={project.projectUrl}
                                    target='_blank'
                                    rel='noreferrer'
                                    className='inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#ffffff11] text-zinc-300 transition hover:bg-[#ffffff23] hover:text-white'
                                    title='Open on Modrinth'
                                    aria-label='Open on Modrinth'
                                >
                                    <ArrowUpRightFromSquare width={16} height={16} />
                                </a>
                            </div>
                        </div>
                    </header>

                    {/* Body — main column + sidebar */}
                    <div className='flex flex-col gap-6 lg:flex-row lg:items-start'>
                        <div className='min-w-0 flex-1'>
                            {/* Controlled tabs — survives every re-render in
                                this component so flipping the show-all toggle
                                or installing a version never throws the user
                                back to the Description tab. */}
                            <Tabs value={activeTab} onValueChange={setActiveTab}>
                                <TabsList className='mb-4'>
                                    <TabsTrigger value='description'>Description</TabsTrigger>
                                    {/* Gallery tab only appears when the
                                        project has screenshots — no point
                                        showing an empty tab. Sits between
                                        Description and Changelog,
                                        matching Modrinth's own ordering. */}
                                    {project.gallery && project.gallery.length > 0 && (
                                        <TabsTrigger value='gallery'>Gallery</TabsTrigger>
                                    )}
                                    <TabsTrigger value='changelog'>Changelog</TabsTrigger>
                                    <TabsTrigger value='versions'>Versions</TabsTrigger>
                                </TabsList>

                                <TabsContent value='description'>
                                    <div className='rounded-xl border border-[#ffffff10] bg-[#ffffff05] p-4 sm:p-6'>
                                        <Markdown>{project.body ?? project.description}</Markdown>
                                    </div>
                                </TabsContent>

                                {project.gallery && project.gallery.length > 0 && (
                                    <TabsContent value='gallery'>
                                        <GalleryViewer items={project.gallery} />
                                    </TabsContent>
                                )}

                                <TabsContent value='changelog'>
                                    {/* Filter toolbar — collapsed Platform
                                        + Game versions dropdown buttons,
                                        with a row of active-filter chips
                                        below. Matches Modrinth's web UI:
                                        the dropdowns stay compact even
                                        when the user has many filters
                                        applied, and the chip row beneath
                                        gives one-click removal of any
                                        single filter. */}
                                    {allVersions && allVersions.length > 0 && (
                                        <div className='mb-4 flex flex-col gap-3 rounded-xl border border-[#ffffff10] bg-[#ffffff05] p-3'>
                                            <div className='flex flex-wrap items-center gap-2'>
                                                {changelogLoaderOptions.length > 0 && (
                                                    <FilterDropdown
                                                        label='Platform'
                                                        options={changelogLoaderOptions.map((l) => ({
                                                            value: l,
                                                        }))}
                                                        selected={changelogLoaderFilters}
                                                        onChange={setChangelogLoaderFilters}
                                                    />
                                                )}
                                                {changelogMcOptions.length > 0 && (
                                                    <FilterDropdown
                                                        label='Game versions'
                                                        options={(changelogShowAllMc
                                                            ? changelogMcOptionsAll
                                                            : changelogMcOptions
                                                        ).map((v) => ({ value: v }))}
                                                        selected={changelogMcFilters}
                                                        onChange={setChangelogMcFilters}
                                                        showSearch
                                                        searchPlaceholder='Search versions…'
                                                        stickyToggle={{
                                                            label: 'Show all versions',
                                                            checked: changelogShowAllMc,
                                                            onChange: setChangelogShowAllMc,
                                                        }}
                                                    />
                                                )}
                                                <span className='ml-auto text-[11px] text-zinc-500'>
                                                    {changelogVersions.length} of {allVersions.length}{' '}
                                                    versions
                                                </span>
                                            </div>
                                            <ActiveFilterChips
                                                filters={buildActiveFilters(
                                                    changelogLoaderFilters,
                                                    setChangelogLoaderFilters,
                                                    changelogMcFilters,
                                                    setChangelogMcFilters,
                                                )}
                                                onClearAll={() => {
                                                    setChangelogLoaderFilters(new Set());
                                                    setChangelogMcFilters(new Set());
                                                }}
                                            />
                                        </div>
                                    )}

                                    {allVersionsLoading && !allVersions ? (
                                        <p className='py-8 text-center text-sm text-zinc-400'>
                                            <span className='inline-flex items-center gap-2'>
                                                <span className='inline-block h-3 w-3 animate-spin rounded-full border border-zinc-500 border-t-transparent' />
                                                Loading changelog…
                                            </span>
                                        </p>
                                    ) : !allVersions || allVersions.length === 0 ? (
                                        <p className='py-8 text-center text-sm text-zinc-400'>
                                            No versions to show changelogs for.
                                        </p>
                                    ) : changelogVersions.length === 0 ? (
                                        <p className='py-8 text-center text-sm text-zinc-400'>
                                            No versions match the current filters.
                                        </p>
                                    ) : (
                                        // Modrinth-style vertical timeline.
                                        // Each version renders as a node on a
                                        // shared vertical rail: a coloured
                                        // dot at the row's vertical centre,
                                        // a thin connector line drawn down to
                                        // the next entry, and a card on the
                                        // right with the version's metadata +
                                        // changelog body. The connector is
                                        // built via a `before:` pseudo on
                                        // every entry except the last so we
                                        // never paint past the final dot.
                                        <ol className='flex flex-col'>
                                            {changelogVersions
                                                .slice(0, versionPageSize * versionPage)
                                                .map((version, idx, arr) => {
                                                    const isLast = idx === arr.length - 1;
                                                    return (
                                                        <li
                                                            key={version.id}
                                                            className='relative flex gap-4 pb-6 last:pb-0'
                                                        >
                                                            {/* Rail dot + connector. The dot
                                                                colour follows the channel so
                                                                releases get green, betas orange,
                                                                alphas red — matches the version
                                                                badge styling elsewhere. */}
                                                            <div className='relative flex w-3 shrink-0 justify-center pt-2'>
                                                                <span
                                                                    className={clsx(
                                                                        'relative z-10 mt-1 inline-block h-3 w-3 rounded-full border-2',
                                                                        channelColorFor(version.versionType),
                                                                    )}
                                                                />
                                                                {!isLast && (
                                                                    <span
                                                                        aria-hidden
                                                                        className='absolute top-4 bottom-[-1.5rem] left-1/2 w-px -translate-x-1/2 bg-[#ffffff15]'
                                                                    />
                                                                )}
                                                            </div>
                                                            <article className='min-w-0 flex-1 rounded-xl border border-[#ffffff10] bg-[#ffffff05] p-4 sm:p-5'>
                                                                <div className='mb-3 flex flex-wrap items-center justify-between gap-3'>
                                                                    <div className='min-w-0 flex-1'>
                                                                        <div className='flex flex-wrap items-baseline gap-x-3 gap-y-1'>
                                                                            <h3 className='text-base font-semibold text-zinc-100'>
                                                                                {version.versionNumber}
                                                                            </h3>
                                                                            <span
                                                                                className={clsx(
                                                                                    'rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                                                                                    channelColorFor(
                                                                                        version.versionType,
                                                                                    ),
                                                                                )}
                                                                            >
                                                                                {version.versionType}
                                                                            </span>
                                                                        </div>
                                                                        <p className='mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-zinc-500'>
                                                                            {project.author && (
                                                                                <span className='inline-flex items-center gap-1'>
                                                                                    <Person
                                                                                        width={12}
                                                                                        height={12}
                                                                                    />
                                                                                    {project.author}
                                                                                </span>
                                                                            )}
                                                                            <span
                                                                                title={new Date(
                                                                                    version.datePublished,
                                                                                ).toLocaleString()}
                                                                            >
                                                                                {formatRelative(
                                                                                    version.datePublished,
                                                                                )}
                                                                            </span>
                                                                        </p>
                                                                    </div>
                                                                    <ActionButton
                                                                        size='sm'
                                                                        variant='secondary'
                                                                        onClick={() =>
                                                                            void handleInstall(version)
                                                                        }
                                                                        disabled={busy}
                                                                    >
                                                                        <ArrowDownToLine
                                                                            width={14}
                                                                            height={14}
                                                                            className='mr-1'
                                                                        />
                                                                        Download
                                                                    </ActionButton>
                                                                </div>
                                                                {version.changelog ? (
                                                                    <Markdown>{version.changelog}</Markdown>
                                                                ) : (
                                                                    <p className='text-xs text-zinc-500'>
                                                                        No changelog provided.
                                                                    </p>
                                                                )}
                                                            </article>
                                                        </li>
                                                    );
                                                })}
                                            {changelogVersions.length > versionPageSize * versionPage && (
                                                <li className='ml-7 mt-1'>
                                                    <ActionButton
                                                        variant='secondary'
                                                        size='sm'
                                                        onClick={() => setVersionPage((p) => p + 1)}
                                                    >
                                                        Show{' '}
                                                        {Math.min(
                                                            versionPageSize,
                                                            changelogVersions.length - versionPageSize * versionPage,
                                                        )}{' '}
                                                        more
                                                    </ActionButton>
                                                </li>
                                            )}
                                        </ol>
                                    )}
                                </TabsContent>

                                <TabsContent value='versions'>
                                    {/* Same dropdown filter toolbar as the
                                        Changelog tab, but seeded with the
                                        server's loader + MC version so
                                        the initial view stays focused on
                                        "what I can install right now".
                                        Removing chips via the active-
                                        filters row beneath broadens the
                                        list — supersedes the old
                                        Show-all checkbox. */}
                                    {allVersions && allVersions.length > 0 && (
                                        <div className='mb-4 flex flex-col gap-3 rounded-xl border border-[#ffffff10] bg-[#ffffff05] p-3'>
                                            <div className='flex flex-wrap items-center gap-2'>
                                                {changelogLoaderOptions.length > 0 && (
                                                    <FilterDropdown
                                                        label='Platform'
                                                        // Defaults to {loader}. Highlight only when the
                                                        // user has deviated from that single-server-loader
                                                        // selection.
                                                        highlight={
                                                            !(
                                                                versionsLoaderFilters.size === 1 &&
                                                                versionsLoaderFilters.has(loader)
                                                            )
                                                        }
                                                        options={changelogLoaderOptions.map((l) => ({
                                                            value: l,
                                                        }))}
                                                        selected={versionsLoaderFilters}
                                                        onChange={setVersionsLoaderFilters}
                                                    />
                                                )}
                                                {changelogMcOptions.length > 0 && (
                                                    <FilterDropdown
                                                        label='Game versions'
                                                        // Defaults to {server's MC version}. Stays
                                                        // neutral while that's the only selection.
                                                        highlight={
                                                            !(
                                                                versionsMcFilters.size === 1 &&
                                                                versionsMcFilters.has(minecraftVersion)
                                                            )
                                                        }
                                                        options={(versionsShowAllMc
                                                            ? changelogMcOptionsAll
                                                            : changelogMcOptions
                                                        ).map((v) => ({ value: v }))}
                                                        selected={versionsMcFilters}
                                                        onChange={setVersionsMcFilters}
                                                        showSearch
                                                        searchPlaceholder='Search versions…'
                                                        stickyToggle={{
                                                            label: 'Show all versions',
                                                            checked: versionsShowAllMc,
                                                            onChange: setVersionsShowAllMc,
                                                        }}
                                                    />
                                                )}
                                                <span className='ml-auto text-[11px] text-zinc-500'>
                                                    {versionsViewVersions.length} of {allVersions.length}{' '}
                                                    versions
                                                </span>
                                            </div>
                                            <ActiveFilterChips
                                                filters={buildActiveFilters(
                                                    versionsLoaderFilters,
                                                    setVersionsLoaderFilters,
                                                    versionsMcFilters,
                                                    setVersionsMcFilters,
                                                )}
                                                onClearAll={() => {
                                                    setVersionsLoaderFilters(new Set());
                                                    setVersionsMcFilters(new Set());
                                                }}
                                            />
                                        </div>
                                    )}
                                    {allVersionsLoading && !allVersions ? (
                                        <p className='py-8 text-center text-sm text-zinc-400'>
                                            <span className='inline-flex items-center gap-2'>
                                                <span className='inline-block h-3 w-3 animate-spin rounded-full border border-zinc-500 border-t-transparent' />
                                                Loading versions…
                                            </span>
                                        </p>
                                    ) : versionsViewVersions.length === 0 ? (
                                        <p className='py-8 text-center text-sm text-zinc-400'>
                                            {allVersions && allVersions.length > 0
                                                ? 'No versions match the current filters.'
                                                : 'This project has no published versions.'}
                                        </p>
                                    ) : (
                                        <>
                                            {/* Modrinth-style versions table.
                                                Columns collapse progressively
                                                on smaller screens:
                                                  - sm: hides Downloads
                                                  - md: hides Published
                                                  - lg: hides Platforms
                                                The Name column always keeps
                                                the channel badge + game
                                                version inline so the table
                                                stays readable on phones. */}
                                            <div className='overflow-hidden rounded-xl border border-[#ffffff10] bg-[#ffffff05]'>
                                                <table className='w-full border-collapse text-sm'>
                                                    <thead>
                                                        <tr className='border-b border-[#ffffff10] text-left text-[10px] font-semibold uppercase tracking-wide text-zinc-500'>
                                                            <th className='px-3 py-2 font-semibold' />
                                                            <th className='px-3 py-2 font-semibold'>Name</th>
                                                            <th className='hidden px-3 py-2 font-semibold md:table-cell'>
                                                                Game version
                                                            </th>
                                                            <th className='hidden px-3 py-2 font-semibold lg:table-cell'>
                                                                Platforms
                                                            </th>
                                                            <th className='hidden px-3 py-2 font-semibold md:table-cell'>
                                                                Published
                                                            </th>
                                                            <th className='hidden px-3 py-2 text-right font-semibold sm:table-cell'>
                                                                Downloads
                                                            </th>
                                                            <th className='px-3 py-2' />
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {versionsViewVersions
                                                            .slice(0, versionPageSize * versionPage)
                                                            .map((version) => {
                                                                const compat = isCompatible(version, {
                                                                    loaders:
                                                                        project.projectType === 'datapack'
                                                                            ? []
                                                                            : [loader],
                                                                    gameVersion: minecraftVersion,
                                                                    projectType: project.projectType,
                                                                });
                                                                const versionGameVersions = compactGameVersions(
                                                                    version.gameVersions,
                                                                );
                                                                return (
                                                                    <tr
                                                                        key={version.id}
                                                                        className='border-b border-[#ffffff08] last:border-b-0 hover:bg-[#ffffff05]'
                                                                    >
                                                                        <td className='px-3 py-3 align-middle'>
                                                                            <span
                                                                                className={clsx(
                                                                                    'flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold',
                                                                                    channelColorFor(
                                                                                        version.versionType,
                                                                                    ),
                                                                                )}
                                                                                title={version.versionType}
                                                                            >
                                                                                {version.versionType
                                                                                    .charAt(0)
                                                                                    .toUpperCase()}
                                                                            </span>
                                                                        </td>
                                                                        <td className='min-w-0 px-3 py-3 align-middle'>
                                                                            <div className='flex flex-col gap-0.5'>
                                                                                <div className='flex items-center gap-2'>
                                                                                    <span className='font-medium text-zinc-100'>
                                                                                        {version.versionNumber}
                                                                                    </span>
                                                                                    {!compat && (
                                                                                        <span
                                                                                            className='text-yellow-300'
                                                                                            title='Not compatible with the server'
                                                                                        >
                                                                                            <CircleExclamation
                                                                                                width={13}
                                                                                                height={13}
                                                                                            />
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                                <span className='text-xs text-zinc-500'>
                                                                                    {version.name}
                                                                                </span>
                                                                                {/* Inline summary for narrow viewports
                                                                                    where the dedicated columns are hidden. */}
                                                                                <span className='mt-0.5 text-[11px] text-zinc-500 md:hidden'>
                                                                                    {versionGameVersions.join(', ')}
                                                                                    {version.loaders.length > 0 &&
                                                                                        ` · ${version.loaders.join(', ')}`}
                                                                                    {' · '}
                                                                                    {formatRelative(version.datePublished)}
                                                                                </span>
                                                                            </div>
                                                                        </td>
                                                                        <td className='hidden px-3 py-3 align-middle text-xs text-zinc-300 md:table-cell'>
                                                                            {versionGameVersions.join(', ')}
                                                                        </td>
                                                                        <td className='hidden px-3 py-3 align-middle text-xs text-zinc-300 lg:table-cell'>
                                                                            {version.loaders.length > 0
                                                                                ? version.loaders.join(', ')
                                                                                : '—'}
                                                                        </td>
                                                                        <td className='hidden px-3 py-3 align-middle text-xs text-zinc-400 md:table-cell'>
                                                                            <span
                                                                                title={new Date(
                                                                                    version.datePublished,
                                                                                ).toLocaleString()}
                                                                            >
                                                                                {formatRelative(version.datePublished)}
                                                                            </span>
                                                                        </td>
                                                                        <td className='hidden px-3 py-3 text-right align-middle text-xs text-zinc-400 sm:table-cell'>
                                                                            {typeof version.downloads === 'number'
                                                                                ? formatCount(version.downloads)
                                                                                : '—'}
                                                                        </td>
                                                                        <td className='px-3 py-3 text-right align-middle'>
                                                                            <div className='inline-flex items-center gap-1'>
                                                                                <ActionButton
                                                                                    size='sm'
                                                                                    onClick={() =>
                                                                                        void handleInstall(version)
                                                                                    }
                                                                                    disabled={busy}
                                                                                >
                                                                                    <ArrowDownToLine
                                                                                        width={14}
                                                                                        height={14}
                                                                                        className='mr-1'
                                                                                    />
                                                                                    Install
                                                                                </ActionButton>
                                                                                {/* Per-row menu — secondary
                                                                                    actions kept here so the
                                                                                    primary Install button
                                                                                    stays the easy target.
                                                                                    Download is a CDN-direct
                                                                                    open, copy link writes the
                                                                                    same URL to the clipboard,
                                                                                    details opens an
                                                                                    in-page modal, Modrinth
                                                                                    opens the canonical web
                                                                                    page in a new tab. */}
                                                                                <DropdownMenu>
                                                                                    <DropdownMenuTrigger asChild>
                                                                                        <button
                                                                                            type='button'
                                                                                            aria-label='More actions'
                                                                                            title='More actions'
                                                                                            className='inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 transition hover:bg-[#ffffff12] hover:text-white'
                                                                                        >
                                                                                            <EllipsisVertical
                                                                                                width={15}
                                                                                                height={15}
                                                                                            />
                                                                                        </button>
                                                                                    </DropdownMenuTrigger>
                                                                                    <DropdownMenuContent
                                                                                        align='end'
                                                                                        className='w-56'
                                                                                    >
                                                                                        <DropdownMenuItem
                                                                                            onClick={() =>
                                                                                                handleDownloadFile(
                                                                                                    version,
                                                                                                )
                                                                                            }
                                                                                        >
                                                                                            <ArrowDownToLine
                                                                                                width={14}
                                                                                                height={14}
                                                                                                className='mr-2'
                                                                                            />
                                                                                            Download file
                                                                                        </DropdownMenuItem>
                                                                                        <DropdownMenuItem
                                                                                            onClick={() =>
                                                                                                void handleCopyDownloadLink(
                                                                                                    version,
                                                                                                )
                                                                                            }
                                                                                        >
                                                                                            <Copy
                                                                                                width={14}
                                                                                                height={14}
                                                                                                className='mr-2'
                                                                                            />
                                                                                            Copy download link
                                                                                        </DropdownMenuItem>
                                                                                        <DropdownMenuItem
                                                                                            onClick={() =>
                                                                                                setDetailsVersion(
                                                                                                    version,
                                                                                                )
                                                                                            }
                                                                                        >
                                                                                            <FileText
                                                                                                width={14}
                                                                                                height={14}
                                                                                                className='mr-2'
                                                                                            />
                                                                                            View version details
                                                                                        </DropdownMenuItem>
                                                                                        <DropdownMenuSeparator />
                                                                                        <DropdownMenuItem
                                                                                            onClick={() =>
                                                                                                handleOpenOnModrinth(
                                                                                                    version,
                                                                                                )
                                                                                            }
                                                                                        >
                                                                                            <ArrowUpRightFromSquare
                                                                                                width={14}
                                                                                                height={14}
                                                                                                className='mr-2'
                                                                                            />
                                                                                            Open on Modrinth
                                                                                        </DropdownMenuItem>
                                                                                    </DropdownMenuContent>
                                                                                </DropdownMenu>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                    </tbody>
                                                </table>
                                            </div>
                                            {versionsViewVersions.length > versionPageSize * versionPage && (
                                                <div className='mt-3 flex justify-center'>
                                                    <ActionButton
                                                        variant='secondary'
                                                        size='sm'
                                                        onClick={() => setVersionPage((p) => p + 1)}
                                                    >
                                                        Show{' '}
                                                        {Math.min(
                                                            versionPageSize,
                                                            versionsViewVersions.length - versionPageSize * versionPage,
                                                        )}{' '}
                                                        more
                                                    </ActionButton>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </TabsContent>
                            </Tabs>
                        </div>

                        {/* Sidebar — secondary metadata. Visible inline on
                            mobile (below tab content) and as a fixed-width
                            column on lg+. */}
                        <aside className='lg:w-72 lg:shrink-0'>
                            <div className='flex flex-col gap-4'>
                                <SidebarSection title='Compatibility'>
                                    {compatGameVersions.length > 0 ? (
                                        <ChipGrid>
                                            {compatGameVersions.map((v) => (
                                                <Chip key={v}>{v}</Chip>
                                            ))}
                                        </ChipGrid>
                                    ) : (
                                        <p className='text-xs text-zinc-500'>—</p>
                                    )}
                                </SidebarSection>

                                {compatLoaders.length > 0 && (
                                    <SidebarSection title='Platforms'>
                                        <ChipGrid>
                                            {/* Platform (loader) chips link to a
                                                Discover view scoped to that
                                                loader + the project's type.
                                                Datapacks list no loaders, so
                                                this section just doesn't
                                                render for them. */}
                                            {compatLoaders.map((l) => (
                                                <Chip
                                                    key={l}
                                                    to={discoverUrl({ type: project.projectType, loader: l })}
                                                    title={`Find more ${project.projectType}s for ${l} on Discover`}
                                                >
                                                    {l}
                                                </Chip>
                                            ))}
                                        </ChipGrid>
                                    </SidebarSection>
                                )}

                                <SidebarSection title='Supported environments'>
                                    <ChipGrid>
                                        {project.serverSide !== 'unsupported' && (
                                            <Chip>Server-side</Chip>
                                        )}
                                        {project.clientSide !== 'unsupported' && (
                                            <Chip>Singleplayer</Chip>
                                        )}
                                        {project.serverSide === 'unsupported' &&
                                            project.clientSide === 'unsupported' && (
                                                <Chip>Unknown</Chip>
                                            )}
                                    </ChipGrid>
                                </SidebarSection>

                                {(project.issuesUrl ||
                                    project.sourceUrl ||
                                    project.wikiUrl ||
                                    project.discordUrl ||
                                    (project.donationUrls && project.donationUrls.length > 0)) && (
                                    <SidebarSection title='Links'>
                                        <ul className='flex flex-col gap-1.5'>
                                            {project.issuesUrl && (
                                                <SidebarLink href={project.issuesUrl} icon={<TriangleExclamation width={14} height={14} />}>
                                                    Report issues
                                                </SidebarLink>
                                            )}
                                            {project.sourceUrl && (
                                                <SidebarLink href={project.sourceUrl} icon={<Code width={14} height={14} />}>
                                                    View source
                                                </SidebarLink>
                                            )}
                                            {project.wikiUrl && (
                                                <SidebarLink href={project.wikiUrl} icon={<FileText width={14} height={14} />}>
                                                    Wiki
                                                </SidebarLink>
                                            )}
                                            {project.discordUrl && (
                                                <SidebarLink href={project.discordUrl} icon={<Comments width={14} height={14} />}>
                                                    Join Discord server
                                                </SidebarLink>
                                            )}
                                        </ul>

                                        {/* Donation links live under a
                                            separator so the asks visually
                                            sit apart from the primary
                                            project links (issues / source /
                                            wiki / discord). Each platform
                                            gets its own labeled entry. */}
                                        {project.donationUrls && project.donationUrls.length > 0 && (
                                            <>
                                                <div className='mt-3 mb-2 border-t border-[#ffffff10]' />
                                                <ul className='flex flex-col gap-1.5'>
                                                    {project.donationUrls.map((d) => (
                                                        <SidebarLink
                                                            key={d.id || d.url}
                                                            href={d.url}
                                                            icon={<HeartFill width={14} height={14} />}
                                                        >
                                                            Donate on {prettifyPlatform(d.platform)}
                                                        </SidebarLink>
                                                    ))}
                                                </ul>
                                            </>
                                        )}
                                    </SidebarSection>
                                )}

                                {project.categories.length > 0 && (
                                    <SidebarSection title='Tags'>
                                        <ChipGrid>
                                            {/* Tag chips mirror the header
                                                chips — clicking any one
                                                navigates to a Discover view
                                                filtered to that category and
                                                the project's projectType. */}
                                            {project.categories.map((cat) => (
                                                <Chip
                                                    key={cat}
                                                    to={discoverUrl({ type: project.projectType, cat })}
                                                    title={`Find more ${cat} ${project.projectType}s on Discover`}
                                                >
                                                    {cat}
                                                </Chip>
                                            ))}
                                        </ChipGrid>
                                    </SidebarSection>
                                )}

                                {/* Creators sits between Tags and Details
                                    so the attribution is the last thing
                                    before the catalogue metadata
                                    (license, dates) — mirrors the
                                    information hierarchy on
                                    modrinth.com's own project pages. */}
                                {project.author && (
                                    <SidebarSection title='Creators'>
                                        <a
                                            href={project.authorUrl ?? '#'}
                                            target='_blank'
                                            rel='noreferrer'
                                            className='inline-flex items-center gap-2 text-sm text-zinc-200 hover:text-white'
                                        >
                                            {project.authorAvatarUrl ? (
                                                <img
                                                    src={project.authorAvatarUrl}
                                                    alt=''
                                                    className='h-7 w-7 rounded-full border border-[#ffffff10] object-cover'
                                                />
                                            ) : (
                                                <span className='inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#ffffff10] text-zinc-400'>
                                                    <Person width={14} height={14} />
                                                </span>
                                            )}
                                            <span className='flex flex-col'>
                                                <span className='font-medium'>{project.author}</span>
                                                <span className='text-[10px] uppercase tracking-wide text-zinc-500'>
                                                    Owner
                                                </span>
                                            </span>
                                        </a>
                                    </SidebarSection>
                                )}

                                <SidebarSection title='Details'>
                                    <dl className='flex flex-col gap-2 text-xs text-zinc-300'>
                                        {project.license && (
                                            <div className='flex items-center gap-2'>
                                                <FileText width={14} height={14} className='text-zinc-500' />
                                                <span>
                                                    Licensed{' '}
                                                    {project.licenseUrl ? (
                                                        <a
                                                            href={project.licenseUrl}
                                                            target='_blank'
                                                            rel='noreferrer'
                                                            className='text-brand hover:underline'
                                                        >
                                                            {project.license}
                                                        </a>
                                                    ) : (
                                                        project.license
                                                    )}
                                                </span>
                                            </div>
                                        )}
                                        {project.published && (
                                            <div className='flex items-center gap-2'>
                                                <Compass width={14} height={14} className='text-zinc-500' />
                                                <span>Published {formatRelative(project.published)}</span>
                                            </div>
                                        )}
                                        {project.updated && project.updated !== project.published && (
                                            <div className='flex items-center gap-2'>
                                                <Compass width={14} height={14} className='text-zinc-500' />
                                                <span>Updated {formatRelative(project.updated)}</span>
                                            </div>
                                        )}
                                    </dl>
                                </SidebarSection>
                            </div>
                        </aside>
                    </div>

                    {isInstalled && (
                        <p className='mt-6 text-xs text-zinc-500'>
                            <NavLink to='..' className='underline hover:text-white'>
                                This {project.projectType === 'datapack' ? 'datapack' : 'mod'} is already
                                installed.
                            </NavLink>
                        </p>
                    )}
                </>
            ) : null}

            {/* Version-details modal: surfaces the version's full
                changelog + file list when the user picks "View version
                details" from a row's 3-dot menu. Read-only — the row's
                own Install button stays the canonical install action. */}
            <Modal
                visible={detailsVersion !== null}
                onDismissed={() => setDetailsVersion(null)}
                title={detailsVersion ? `${detailsVersion.versionNumber} — ${detailsVersion.name}` : undefined}
                dismissable
            >
                {detailsVersion && (
                    <div className='flex flex-col gap-4'>
                        <div className='flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400'>
                            <span
                                className={clsx(
                                    'rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                                    channelColorFor(detailsVersion.versionType),
                                )}
                            >
                                {detailsVersion.versionType}
                            </span>
                            <span title={new Date(detailsVersion.datePublished).toLocaleString()}>
                                Published {formatRelative(detailsVersion.datePublished)}
                            </span>
                            {typeof detailsVersion.downloads === 'number' && (
                                <span>{formatCount(detailsVersion.downloads)} downloads</span>
                            )}
                            {detailsVersion.gameVersions.length > 0 && (
                                <span>MC {compactGameVersions(detailsVersion.gameVersions).join(', ')}</span>
                            )}
                            {detailsVersion.loaders.length > 0 && <span>{detailsVersion.loaders.join(', ')}</span>}
                        </div>

                        {detailsVersion.files.length > 0 && (
                            <div className='rounded-lg border border-[#ffffff10] bg-[#ffffff05] p-3'>
                                <h4 className='mb-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-500'>
                                    Files
                                </h4>
                                <ul className='flex flex-col gap-1.5'>
                                    {detailsVersion.files.map((f) => (
                                        <li
                                            key={f.url}
                                            className='flex items-center justify-between gap-2 text-xs'
                                        >
                                            <span className='min-w-0 truncate font-mono text-zinc-200'>
                                                {f.filename}
                                                {f.primary && (
                                                    <span className='ml-2 rounded-sm bg-brand/20 px-1.5 py-0.5 text-[9px] font-bold uppercase text-brand'>
                                                        primary
                                                    </span>
                                                )}
                                            </span>
                                            <span className='shrink-0 text-zinc-500'>
                                                {(f.sizeBytes / 1024).toFixed(0)} KB
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className='rounded-lg border border-[#ffffff10] bg-[#ffffff05] p-3 max-h-[40vh] overflow-y-auto'>
                            <h4 className='mb-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-500'>
                                Changelog
                            </h4>
                            {detailsVersion.changelog ? (
                                <Markdown>{detailsVersion.changelog}</Markdown>
                            ) : (
                                <p className='text-xs text-zinc-500'>No changelog provided for this version.</p>
                            )}
                        </div>

                        <div className='flex justify-end gap-2'>
                            <ActionButton
                                variant='secondary'
                                size='sm'
                                onClick={() => handleOpenOnModrinth(detailsVersion)}
                            >
                                <ArrowUpRightFromSquare width={14} height={14} className='mr-1' />
                                Open on Modrinth
                            </ActionButton>
                            <ActionButton
                                variant='primary'
                                size='sm'
                                onClick={() => {
                                    void handleInstall(detailsVersion);
                                    setDetailsVersion(null);
                                }}
                                disabled={busy}
                            >
                                <ArrowDownToLine width={14} height={14} className='mr-1' />
                                Install
                            </ActionButton>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

// Small layout primitives used throughout the sidebar. Local so they aren't
// part of the broader element library — they exist only for this page.
const SidebarSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className='rounded-xl border border-[#ffffff10] bg-[#ffffff05] p-4'>
        <h3 className='mb-2 text-sm font-bold text-zinc-100'>{title}</h3>
        {children}
    </section>
);

const ChipGrid = ({ children }: { children: React.ReactNode }) => (
    <div className='flex flex-wrap gap-1.5'>{children}</div>
);

/**
 * Sidebar chip. Renders as a plain `<span>` by default; when `to` is
 * passed, becomes a `<NavLink>` to a filtered Discover URL so the user
 * can pivot from "what is this project tagged with?" to "show me other
 * projects tagged like this" in one click. The link variant picks up
 * a brand-tinted hover state so the affordance is obvious without
 * making it visually noisy at rest.
 */
const Chip = ({ children, to, title }: { children: React.ReactNode; to?: string; title?: string }) => {
    if (to) {
        return (
            <NavLink
                to={to}
                title={title}
                className='rounded-md bg-[#ffffff10] px-2 py-0.5 text-[11px] font-medium text-zinc-200 transition hover:bg-brand/20 hover:text-white'
            >
                {children}
            </NavLink>
        );
    }
    return (
        <span className='rounded-md bg-[#ffffff10] px-2 py-0.5 text-[11px] font-medium text-zinc-200'>
            {children}
        </span>
    );
};

const SidebarLink = ({
    href,
    icon,
    children,
}: {
    href: string;
    icon: React.ReactNode;
    children: React.ReactNode;
}) => (
    <li>
        <a
            href={href}
            target='_blank'
            rel='noreferrer'
            className='inline-flex w-full items-center gap-2 text-sm text-zinc-300 hover:text-white'
        >
            <span className='text-zinc-500'>{icon}</span>
            <span className='flex-1 truncate'>{children}</span>
            <ArrowUpRightFromSquare width={12} height={12} className='shrink-0 text-zinc-500' />
        </a>
    </li>
);

export default ProjectDetail;
