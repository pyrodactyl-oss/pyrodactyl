import { ModVersion, ProjectType, UpdateCandidate } from './types';

export interface CompatConstraints {
    /** Loader IDs, lowercased (e.g. "fabric", "forge"). */
    loaders: string[];
    /** Minecraft version string, e.g. "1.20.1". */
    gameVersion: string;
    /**
     * Project type the constraint applies to. Datapacks have no loader on
     * Modrinth (vanilla Minecraft parses them directly), so we skip the
     * loader intersection for them. Defaults to 'mod' so existing call sites
     * keep working unchanged.
     */
    projectType?: ProjectType;
}

const intersects = <T>(a: T[], b: T[]): boolean => a.some((x) => b.includes(x));

/** Returns true iff this version is compatible with the given server. */
export const isCompatible = (version: ModVersion, c: CompatConstraints): boolean => {
    if (!version.gameVersions.includes(c.gameVersion)) return false;
    // Datapacks have no loader concept — every version's `loaders` array is
    // empty on Modrinth. Skip the loader intersection entirely for them.
    if (c.projectType === 'datapack') return true;
    if (c.loaders.length === 0) return true;
    return intersects(
        c.loaders.map((l) => l.toLowerCase()),
        version.loaders.map((l) => l.toLowerCase()),
    );
};

/**
 * Set of plugin-loader IDs that fall under the Bukkit lineage. We pre-
 * compute this so `pluginLoaderCompat` (used by both the version filter
 * and the UI) can decide which loaders implicitly accept builds tagged
 * for the parent fork.
 */
const PLUGIN_FAMILY_TREE: Record<string, string[]> = {
    // Each entry maps a server's actual loader to the set of loader IDs
    // its builds will tolerate. Paper accepts spigot + bukkit builds;
    // Purpur and Folia further accept paper. Spigot accepts bukkit.
    // Anything we don't know about gets exact-match only (no implicit
    // fallback to ancestors).
    paper: ['paper', 'spigot', 'bukkit'],
    purpur: ['purpur', 'paper', 'spigot', 'bukkit'],
    folia: ['folia', 'paper', 'spigot', 'bukkit'],
    spigot: ['spigot', 'bukkit'],
    bukkit: ['bukkit'],
    velocity: ['velocity'],
    waterfall: ['waterfall', 'bungeecord'],
    bungeecord: ['bungeecord'],
};

/**
 * Expand a single loader into the family of loaders it can run. Used by the
 * version-switcher so a Paper server doesn't reject a plugin that's only
 * flagged as `spigot` on Modrinth — Paper runs Spigot plugins natively,
 * and the UI should reflect that.
 */
export const expandLoaderFamily = (loader: string): string[] => {
    const normalised = loader.toLowerCase();
    return PLUGIN_FAMILY_TREE[normalised] ?? [normalised];
};

/**
 * From a list of versions return the most recent one that is compatible with
 * the server's loader + MC version. Versions are sorted by datePublished
 * descending; release builds beat alpha/beta when dates tie.
 */
export const pickLatestCompatible = (versions: ModVersion[], c: CompatConstraints): ModVersion | null => {
    const compatible = versions.filter((v) => isCompatible(v, c));
    if (compatible.length === 0) return null;

    const releaseScore = (v: ModVersion): number => (v.versionType === 'release' ? 1 : 0);
    return compatible.slice().sort((a, b) => {
        const ad = Date.parse(a.datePublished);
        const bd = Date.parse(b.datePublished);
        if (bd !== ad) return bd - ad;
        return releaseScore(b) - releaseScore(a);
    })[0]!;
};

/** Compare two ModVersions by publish date and return an UpdateCandidate. */
export const buildUpdateCandidate = (current: ModVersion, latest: ModVersion): UpdateCandidate => {
    const currentDate = Date.parse(current.datePublished);
    const latestDate = Date.parse(latest.datePublished);
    return {
        current,
        latest,
        updateAvailable: latest.id !== current.id && latestDate > currentDate,
    };
};

/**
 * Natural-order comparator for version-number-shaped strings.
 *
 * The default JS `Array.prototype.sort()` is a string compare, which produces
 * lexicographic ordering — that orders `1.21.10` BEFORE `1.21.2` because '1'
 * < '2' at character index 5. Modrinth and Minecraft both use semver-ish
 * version numbers where multi-digit segments are routine (1.21.10, 1.21.11
 * etc.) so we need a comparator that splits on `.`/`-` and compares each
 * numeric segment as a number.
 *
 * Non-numeric segments (e.g. `1.21-rc1`) fall back to lexical comparison
 * within that segment so we get a stable ordering without crashing on
 * pre-release suffixes. Returns the usual <0/0/>0 sort sentinel.
 */
export const compareVersionStrings = (a: string, b: string): number => {
    const tokenize = (s: string): Array<{ n: number; raw: string; isNum: boolean }> =>
        s
            .split(/[.\-+ _]+/)
            .filter(Boolean)
            .map((seg) => {
                const n = Number(seg);
                return Number.isFinite(n) && /^[0-9]+$/.test(seg)
                    ? { n, raw: seg, isNum: true }
                    : { n: 0, raw: seg, isNum: false };
            });

    const ta = tokenize(a);
    const tb = tokenize(b);
    const len = Math.max(ta.length, tb.length);
    for (let i = 0; i < len; i++) {
        const av = ta[i];
        const bv = tb[i];
        // Missing trailing segments count as 0 so "1.20" sorts before
        // "1.20.1" — that's the conventional semver semantics and what users
        // expect when they see a list of MC versions.
        if (!av) return -1;
        if (!bv) return 1;
        if (av.isNum && bv.isNum) {
            if (av.n !== bv.n) return av.n - bv.n;
            continue;
        }
        if (av.isNum !== bv.isNum) {
            // Numeric segments sort BEFORE textual ones at the same position
            // so "1.21" beats "1.21-rc1" — release wins over pre-release.
            return av.isNum ? 1 : -1;
        }
        const cmp = av.raw.localeCompare(bv.raw);
        if (cmp !== 0) return cmp;
    }
    return 0;
};
