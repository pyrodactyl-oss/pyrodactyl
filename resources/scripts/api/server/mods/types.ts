// Provider-agnostic types for the mod manager.
//
// The mod manager is designed to support multiple sources for mods. v1 ships
// with Modrinth only, but the surface area here intentionally avoids leaking
// Modrinth-specific shapes so a second provider (e.g. CurseForge) can be added
// later without changing call sites.

export type LoaderId =
    | 'forge'
    | 'fabric'
    | 'neoforge'
    | 'quilt'
    | 'liteloader'
    | 'rift'
    // Plugin loaders — these target Bukkit-derived servers (Paper, Spigot,
    // Purpur, etc.) where the runtime drops .jars into `plugins/` rather
    // than `mods/`. They share enough surface with mod loaders that the
    // manager treats them as another loader category.
    | 'paper'
    | 'spigot'
    | 'bukkit'
    | 'purpur'
    | 'folia'
    | 'velocity'
    | 'waterfall'
    | 'bungeecord'
    | (string & {});

export type ModSide = 'required' | 'optional' | 'unsupported' | 'unknown';

/**
 * Project type as the mod manager understands it. Mirrors Modrinth's
 * `project_type` field. Resource packs and shader packs are client-side
 * concerns and have no server-side install destination, so we don't expose
 * them as installable from a panel. Modpacks come in via a separate
 * `.mrpack` import flow (not implemented here).
 *
 * `plugin` covers Bukkit-derived servers — Paper, Spigot, Purpur, etc. The
 * install destination is the server's `plugins/` directory rather than
 * `mods/`, and Modrinth's loader list for these projects uses
 * paper/spigot/bukkit-style identifiers.
 */
export type ProjectType = 'mod' | 'datapack' | 'plugin';

export interface ModSummary {
    /** Provider-namespaced ID, e.g. "modrinth:AANobbMI". */
    id: string;
    /** Provider's native project id (without namespace). */
    projectId: string;
    provider: 'modrinth';
    projectType: ProjectType;
    slug: string;
    title: string;
    description: string;
    /**
     * Display name for the project's primary author. Empty string when the
     * provider didn't return an author (Modrinth's bulk-projects endpoint
     * omits author info — we enrich via /teams when we identify installed
     * mods, but search hits already have it).
     */
    author: string;
    /** Modrinth profile URL for `author` when known. */
    authorUrl: string | null;
    /** Avatar URL for `author` when known. Falls back to a generic icon in the UI. */
    authorAvatarUrl: string | null;
    iconUrl: string | null;
    downloads: number;
    follows: number;
    categories: string[];
    clientSide: ModSide;
    serverSide: ModSide;
    /** Convenience URL into the provider's own UI. */
    projectUrl: string;
    /**
     * ISO-8601 timestamp of the project's most recent update (new version,
     * metadata change, etc.). Surfaced as the "X days ago" chip on the
     * Discover card. Optional because old providers / cached payloads
     * might not include it.
     */
    updated?: string;
}

export interface ModFile {
    filename: string;
    /** Direct CDN URL the daemon can pull. */
    url: string;
    sizeBytes: number;
    sha1: string;
    sha512?: string;
    primary: boolean;
}

export interface ModDependency {
    /** Provider-namespaced ID of the referenced mod, when known. */
    modId: string | null;
    /** Required version id (provider-native) if pinned, else null. */
    versionId: string | null;
    type: 'required' | 'optional' | 'incompatible' | 'embedded';
}

export interface ModVersion {
    id: string;
    projectId: string;
    provider: 'modrinth';
    name: string;
    versionNumber: string;
    versionType: 'release' | 'beta' | 'alpha' | (string & {});
    datePublished: string;
    gameVersions: string[];
    loaders: string[];
    files: ModFile[];
    dependencies: ModDependency[];
    changelog?: string;
    /** Download count for this specific version (Modrinth's `downloads` field). */
    downloads?: number;
}

/**
 * One image entry in a project's gallery. Title + description are
 * optional — many older projects only set the URL — but when present we
 * render them in the lightbox so the user sees the author's caption
 * (e.g. "Boss fight in the End"). `featured` flags the primary preview
 * image that Modrinth displays on the project's card.
 */
export interface ModGalleryItem {
    /**
     * URL to the CDN-sized thumbnail (Modrinth resizes to ~350px wide,
     * e.g. `cdn.modrinth.com/.../<hash>_350.webp`). Cheap to load —
     * use for thumbnail grids.
     */
    url: string;
    /**
     * URL to the full-quality raw image without CDN resizing. Use when
     * the user opens the lightbox / wants the actual screenshot at
     * native resolution. Falls back to `url` if the provider didn't
     * expose a separate raw asset.
     */
    rawUrl?: string;
    title?: string;
    description?: string;
    featured?: boolean;
    /**
     * ISO-8601 timestamp of when the gallery image was uploaded.
     * Surfaced under each thumbnail on the project's Gallery tab
     * (matches Modrinth's web UI which captions each image with its
     * upload date). Optional because older gallery entries may not
     * have one.
     */
    created?: string;
}

export interface ModProject extends ModSummary {
    versions: ModVersion[];
    /** Markdown-flavored long description if available. */
    body?: string;
    license?: string;
    /** SPDX or freeform license URL when one is published. */
    licenseUrl?: string | null;
    /**
     * Project gallery items (screenshots, banners, etc.). Modrinth lets
     * mod authors caption each image and flag one as the "featured"
     * image; we preserve title + description so the lightbox viewer can
     * surface them alongside the image. Empty array when the project
     * has no gallery.
     */
    gallery: ModGalleryItem[];
    /** ISO-8601 timestamp the project was first published. */
    published?: string;
    /** ISO-8601 timestamp of the project's most recent metadata or version update. */
    updated?: string;
    /** Compiled list of MC versions across every published version of the project. */
    gameVersions: string[];
    /** Compiled list of loaders across every published version. */
    loaders: string[];
    /** Links the maintainer exposes — all four are optional and frequently null. */
    issuesUrl?: string | null;
    sourceUrl?: string | null;
    wikiUrl?: string | null;
    discordUrl?: string | null;
    /** Donation platform + URL pairs. */
    donationUrls?: Array<{ id: string; platform: string; url: string }>;
}

/** Search facets the UI builds before handing off to the provider. */
export interface ModSearchFacets {
    loaders: string[];
    gameVersions: string[];
    categories: string[];
    /** Project type — Modrinth uses "mod", "plugin", "datapack", etc. */
    projectType: string;
    /** Restrict to mods that run on the server side. */
    serverSide: boolean;
}

/**
 * Sort modes Modrinth's search API supports. `follows` mirrors the way
 * Modrinth itself orders the "Most followed" list — the underlying field is
 * called "follows" in our normalised type even though their docs sometimes
 * call it "followers". Listed in the same order the Modrinth desktop app
 * exposes them.
 */
export type ModSortMode = 'relevance' | 'downloads' | 'follows' | 'newest' | 'updated';

export interface ModSearchParams {
    query?: string;
    facets: ModSearchFacets;
    limit?: number;
    offset?: number;
    sort?: ModSortMode;
}

export interface ModSearchResult {
    hits: ModSummary[];
    totalHits: number;
    offset: number;
    limit: number;
}

/**
 * Result of identifying a local jar by its SHA-1 against a provider's index.
 * Unidentified entries indicate a mod that isn't on the provider (or is on a
 * different provider).
 */
export interface IdentifiedJar {
    sha1: string;
    project: ModSummary;
    version: ModVersion;
}

/** Result of looking for a newer compatible version of an installed mod. */
export interface UpdateCandidate {
    /** Current version that's installed. */
    current: ModVersion;
    /** Latest version compatible with the server (loader + MC version). */
    latest: ModVersion;
    /** True iff latest is strictly newer than current by date_published. */
    updateAvailable: boolean;
}
