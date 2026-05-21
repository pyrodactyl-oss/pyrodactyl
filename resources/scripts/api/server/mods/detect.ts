import { useEffect, useMemo, useState } from 'react';

import { ServerEggVariable } from '@/api/server/types';

import { listGameVersions } from './modrinth';
import { LoaderId } from './types';

// Loaders we know how to talk to via Modrinth. The mod manager surfaces only
// when a server's egg matches one of these. We split the list into two
// flavours — pure mod loaders that read `mods/`, and plugin loaders that
// read `plugins/`. Both are surfaced through the same UI; the directory and
// the Modrinth project_type are what differs.
export const MOD_LOADERS: LoaderId[] = ['forge', 'fabric', 'neoforge', 'quilt'];

/**
 * Plugin loaders — Bukkit-derived servers. Paper is the modern default;
 * Spigot/Bukkit are the older base; Purpur/Folia are paper forks. Velocity
 * + Waterfall + Bungeecord are proxy-style loaders. Modrinth indexes
 * projects against any of these.
 */
export const PLUGIN_LOADERS: LoaderId[] = [
    'paper',
    'spigot',
    'bukkit',
    'purpur',
    'folia',
    'velocity',
    'waterfall',
    'bungeecord',
];

export const ALL_LOADERS: LoaderId[] = [...MOD_LOADERS, ...PLUGIN_LOADERS];

const MOD_LOADER_SET = new Set<string>(MOD_LOADERS);
const PLUGIN_LOADER_SET = new Set<string>(PLUGIN_LOADERS);

/** True if the given loader runs plugins (drops .jars into `plugins/`). */
export const isPluginLoader = (loader: string | null | undefined): boolean =>
    !!loader && PLUGIN_LOADER_SET.has(loader);

/**
 * Egg env-variable names that commonly hold the Minecraft version. Different
 * eggs use different names — we scan a known list in priority order.
 *
 * Order matters: more specific names come first so loader-specific eggs win
 * over generic VANILLA_VERSION fallbacks.
 */
const MC_VERSION_ENV_KEYS = [
    'MINECRAFT_VERSION',
    'MC_VERSION',
    'VANILLA_VERSION',
    'GAME_VERSION',
] as const;

/**
 * Egg feature strings that imply a particular loader. Listed in a specific
 * order so the more-specific names win — `neoforge` before `forge` so
 * "neoforge" doesn't accidentally resolve to "forge"; `purpur` and `folia`
 * before `paper` for the same reason; `paper` before `spigot` before
 * `bukkit` because they form a fork chain and most eggs that advertise
 * `paper` would also accept `spigot` features as a fallback.
 */
const LOADER_FEATURE_HINTS: Array<{ loader: LoaderId; match: (s: string) => boolean }> = [
    { loader: 'fabric', match: (s) => s.includes('fabric') },
    { loader: 'quilt', match: (s) => s.includes('quilt') },
    { loader: 'neoforge', match: (s) => s.includes('neoforge') || s.includes('neo_forge') || s.includes('neo-forge') },
    { loader: 'forge', match: (s) => s.includes('forge') },
    { loader: 'folia', match: (s) => s.includes('folia') },
    { loader: 'purpur', match: (s) => s.includes('purpur') },
    { loader: 'paper', match: (s) => s.includes('paper') },
    { loader: 'velocity', match: (s) => s.includes('velocity') },
    { loader: 'waterfall', match: (s) => s.includes('waterfall') },
    { loader: 'bungeecord', match: (s) => s.includes('bungeecord') || s.includes('bungee') },
    { loader: 'spigot', match: (s) => s.includes('spigot') },
    { loader: 'bukkit', match: (s) => s.includes('bukkit') },
];

export interface ServerModSupport {
    /** True if this server can host mods this manager understands. */
    supported: boolean;
    /** Detected loader (lowercased) or null if undetected. */
    loader: LoaderId | null;
    /** Detected Minecraft version, or null if undetected. */
    minecraftVersion: string | null;
    /**
     * True when the egg variable was a sentinel value (`latest` / `snapshot`)
     * rather than a literal version. The UI is expected to async-resolve the
     * actual latest release from Modrinth's tag list before treating this as
     * a supported server. While unresolved, `minecraftVersion` stays null and
     * `supported` is false, with a friendly reason explaining the state.
     */
    minecraftVersionIsLatest: boolean;
    /** Mods directory path relative to the server root (no leading slash). */
    modsDirectory: string;
    /**
     * True if datapacks are supported on this server. Vanilla Minecraft has
     * shipped datapack support since 1.13, so any MC ≥ 1.13 instance can host
     * datapacks regardless of loader. We're conservative about flagging this
     * as false when the MC version is unknown or pre-1.13.
     */
    datapacksSupported: boolean;
    /**
     * Datapack directory path relative to the server root. Defaults to
     * `world/datapacks` because that's the world Minecraft loads on a
     * dedicated server. Configurations that use a different `level-name`
     * value in server.properties may need to override this in the UI.
     */
    datapacksDirectory: string;
    /** Human-readable reason when `supported` is false. */
    reason?: string;
}

/**
 * Compare two Minecraft version strings of the form "major.minor[.patch]".
 * Returns a negative number if a < b, 0 if equal, positive if a > b. Snapshot
 * and weekly-build identifiers (e.g. "1.21-rc1", "23w35a") fall through to a
 * lexical compare on the leftover, which works for our only use case
 * (gating datapack support at >= 1.13).
 */
const compareMcVersions = (a: string, b: string): number => {
    const parts = (s: string) =>
        s
            .split(/[^0-9]+/)
            .filter(Boolean)
            .map(Number);
    const pa = parts(a);
    const pb = parts(b);
    const len = Math.max(pa.length, pb.length);
    for (let i = 0; i < len; i++) {
        const av = pa[i] ?? 0;
        const bv = pb[i] ?? 0;
        if (av !== bv) return av - bv;
    }
    return 0;
};

interface ReadMcVersionResult {
    value: string | null;
    /** True when the variable was set but to a `latest`/`snapshot` sentinel. */
    isLatest: boolean;
}

/**
 * Sentinel values eggs sometimes use to mean "newest stable release". We
 * recognise both `latest` and `snapshot` even though their semantics differ
 * upstream — the egg installer is what disambiguates, and from the panel's
 * perspective the resolution path is the same (ask Modrinth for the most
 * recent version of the appropriate type).
 */
const MC_VERSION_SENTINELS = new Set(['latest', 'snapshot']);

/** Try to read the Minecraft version from the server's egg variables. */
const readMcVersion = (variables: ServerEggVariable[] | undefined): ReadMcVersionResult => {
    if (!variables) return { value: null, isLatest: false };
    const byEnv = new Map(variables.map((v) => [v.envVariable, v] as const));

    let sawSentinel = false;
    for (const key of MC_VERSION_ENV_KEYS) {
        const v = byEnv.get(key);
        if (!v) continue;
        const value = (v.serverValue ?? v.defaultValue ?? '').trim();
        if (!value) continue;
        // `latest`/`snapshot` are eggs' way of saying "use whatever's newest
        // at install time". We don't resolve these here (detection is sync);
        // we surface a flag so the caller can do an async Modrinth lookup
        // and substitute the real version once it's known.
        if (MC_VERSION_SENTINELS.has(value.toLowerCase())) {
            sawSentinel = true;
            continue;
        }
        return { value, isLatest: false };
    }
    return { value: null, isLatest: sawSentinel };
};

/**
 * Try to detect the loader from the egg's feature list. Feature strings are
 * not fully standardized — different installs sometimes use "mod/fabric",
 * "fabric", "fabric_loader", etc. We accept any substring match.
 */
const readLoader = (eggFeatures: string[] | undefined): LoaderId | null => {
    if (!eggFeatures || eggFeatures.length === 0) return null;
    const normalized = eggFeatures.map((s) => s.toLowerCase());

    // Exact "mod/<loader>" or "plugin/<loader>" wins.
    for (const f of normalized) {
        const m = /^(mod|plugin)\/([a-z0-9_-]+)$/.exec(f);
        if (m && MOD_LOADER_SET.has(m[2]!)) return m[2] as LoaderId;
    }
    // Fall back to substring hints in priority order. NeoForge before Forge so
    // a string like "neoforge" doesn't accidentally resolve to "forge".
    for (const { loader, match } of LOADER_FEATURE_HINTS) {
        if (normalized.some(match)) return loader;
    }
    return null;
};

/**
 * Returns the canonical install directory for a given loader.
 * - Mod loaders (forge/fabric/neoforge/quilt) → `mods/`
 * - Plugin loaders (paper/spigot/bukkit/etc.) → `plugins/`
 * Anything we don't recognise falls through to `mods/` because that's the
 * sane default for a server we already classified as supported (the
 * detection block above wouldn't return `supported=true` otherwise).
 */
const modsDirFor = (loader: LoaderId | null): string => {
    if (loader && PLUGIN_LOADER_SET.has(loader)) return 'plugins';
    return 'mods';
};

export interface DetectInput {
    eggFeatures?: string[];
    variables?: ServerEggVariable[];
}

/**
 * Decide whether the mod manager applies to a given server, and if so, what
 * loader / MC version / mods directory it should target.
 */
export const detectModSupport = ({ eggFeatures, variables }: DetectInput): ServerModSupport => {
    const loader = readLoader(eggFeatures);
    const { value: mcVersion, isLatest } = readMcVersion(variables);

    // Vanilla Minecraft has accepted datapacks at `world/datapacks/` since
    // 1.13. The check is intentionally lenient: even an unrecognised loader
    // (e.g. Paper) can host datapacks if the MC version qualifies.
    const datapacksSupported = !!mcVersion && compareMcVersions(mcVersion, '1.13') >= 0;
    const datapacksDirectory = 'world/datapacks';

    if (!loader) {
        return {
            supported: false,
            loader: null,
            minecraftVersion: mcVersion,
            minecraftVersionIsLatest: isLatest,
            modsDirectory: 'mods',
            datapacksSupported,
            datapacksDirectory,
            reason: 'This server doesn’t look like a modded or plugin-based Minecraft instance. The mod manager supports Fabric, Forge, NeoForge, Quilt, Paper, Spigot, Bukkit, Purpur, Folia, Velocity, Waterfall, and Bungeecord eggs.',
        };
    }
    if (!mcVersion) {
        return {
            supported: false,
            loader,
            minecraftVersion: null,
            minecraftVersionIsLatest: isLatest,
            modsDirectory: modsDirFor(loader),
            datapacksSupported: false,
            datapacksDirectory,
            reason: isLatest
                ? 'Your egg sets MINECRAFT_VERSION to “latest”, which the panel is resolving from Modrinth — this should clear in a moment.'
                : 'Couldn’t determine the Minecraft version from the egg variables. Set MINECRAFT_VERSION (or your egg’s equivalent) to an exact version like 1.20.1.',
        };
    }

    return {
        supported: true,
        loader,
        minecraftVersion: mcVersion,
        minecraftVersionIsLatest: isLatest,
        modsDirectory: modsDirFor(loader),
        datapacksSupported,
        datapacksDirectory,
    };
};

/** Module-level cache so multiple containers on the same page share one fetch. */
let latestReleaseCache: { value: string | null; fetchedAt: number } | null = null;
const LATEST_RELEASE_TTL_MS = 30 * 60 * 1000;

/**
 * Pull Modrinth's most-recent release-channel game version. Cached at the
 * module level for 30 minutes — release entries change a couple of times a
 * year so a short TTL is plenty of freshness without spamming the tag
 * endpoint when the user navigates between the three mod containers.
 */
const fetchLatestRelease = async (): Promise<string | null> => {
    if (latestReleaseCache && Date.now() - latestReleaseCache.fetchedAt < LATEST_RELEASE_TTL_MS) {
        return latestReleaseCache.value;
    }
    try {
        const versions = await listGameVersions();
        // Modrinth's /tag/game_version returns newest-first; defensively
        // sort by releaseDate desc anyway so we don't depend on that
        // ordering. We always pick a "release" entry — never snapshot/beta —
        // because the sentinel always means "newest stable", not "newest of
        // any kind".
        const sorted = [...versions]
            .filter((v) => v.type === 'release')
            .sort((a, b) => (b.releaseDate ?? '').localeCompare(a.releaseDate ?? ''));
        const top = sorted[0]?.id ?? null;
        latestReleaseCache = { value: top, fetchedAt: Date.now() };
        return top;
    } catch (err) {
        // Don't cache the error — we want the next caller to retry.
        console.warn('Could not resolve latest Minecraft release from Modrinth:', err);
        return null;
    }
};

export interface ResolvedModSupport extends ServerModSupport {
    /** True while the latest-version lookup is in flight. */
    isResolvingLatest: boolean;
}

/**
 * Wrapper around `detectModSupport` that async-resolves the
 * `MINECRAFT_VERSION=latest` sentinel into a concrete version via Modrinth's
 * /tag/game_version endpoint.
 *
 * Behaviour matrix:
 *   - Egg has a concrete version  → pass through unchanged, `isResolvingLatest=false`.
 *   - Egg has `latest`/`snapshot` → first render returns `isResolvingLatest=true`
 *     and `supported=false`; once the tag list resolves the hook re-renders
 *     with the actual version + `supported=true`.
 *   - Lookup fails (network, 429) → leaves `supported=false` with the original
 *     "couldn't determine the version" reason; the user can still navigate
 *     away cleanly.
 *
 * All three mod containers (LegacyModsRedirect / ModsContainer / DiscoverContainer)
 * call this so the resolution logic only lives in one place.
 */
export const useResolvedModSupport = ({ eggFeatures, variables }: DetectInput): ResolvedModSupport => {
    const baseline = useMemo(() => detectModSupport({ eggFeatures, variables }), [eggFeatures, variables]);

    const [resolvedLatest, setResolvedLatest] = useState<string | null>(null);
    const [resolving, setResolving] = useState<boolean>(baseline.minecraftVersionIsLatest && !baseline.minecraftVersion);

    useEffect(() => {
        // Only resolve when we actually need to: sentinel present, no concrete
        // version in the egg, and we haven't already resolved one.
        if (!baseline.minecraftVersionIsLatest || baseline.minecraftVersion) {
            setResolving(false);
            return;
        }
        let cancelled = false;
        setResolving(true);
        void (async () => {
            const latest = await fetchLatestRelease();
            if (cancelled) return;
            setResolvedLatest(latest);
            setResolving(false);
        })();
        return () => {
            cancelled = true;
        };
    }, [baseline.minecraftVersionIsLatest, baseline.minecraftVersion]);

    // If we successfully resolved a latest version, splice it into the
    // baseline result so callers see a `supported=true` shape with the real
    // version. Datapack support is recomputed because it depends on the
    // version we just learned.
    if (baseline.minecraftVersionIsLatest && !baseline.minecraftVersion && resolvedLatest && baseline.loader) {
        return {
            ...baseline,
            minecraftVersion: resolvedLatest,
            supported: true,
            datapacksSupported: compareMcVersions(resolvedLatest, '1.13') >= 0,
            reason: undefined,
            isResolvingLatest: false,
        };
    }
    return { ...baseline, isResolvingLatest: resolving };
};
