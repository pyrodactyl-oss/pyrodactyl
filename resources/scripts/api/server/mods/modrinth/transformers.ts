import { ModDependency, ModFile, ModProject, ModSide, ModSummary, ModVersion, ProjectType } from '../types';

// Modrinth raw API shapes — narrow enough for the fields we consume.

interface RawHit {
    project_id: string;
    project_type?: string;
    slug: string;
    author: string;
    title: string;
    description: string;
    categories: string[];
    display_categories?: string[];
    versions: string[];
    downloads: number;
    follows: number;
    icon_url: string | null;
    client_side: string;
    server_side: string;
    gallery: string[];
    /** ISO-8601 timestamp of the project's most recent update. */
    date_modified?: string;
    date_created?: string;
}

interface RawProject {
    id: string;
    slug: string;
    title: string;
    description: string;
    body?: string;
    project_type?: string;
    categories: string[];
    additional_categories?: string[];
    icon_url: string | null;
    client_side: string;
    server_side: string;
    downloads: number;
    followers: number;
    license?: { id: string; name: string; url?: string | null } | null;
    gallery?: Array<{
        url: string;
        raw_url?: string | null;
        title?: string | null;
        description?: string | null;
        featured?: boolean;
        created?: string | null;
    }>;
    team?: string;
    published?: string;
    updated?: string;
    game_versions?: string[];
    loaders?: string[];
    issues_url?: string | null;
    source_url?: string | null;
    wiki_url?: string | null;
    discord_url?: string | null;
    donation_urls?: Array<{ id: string; platform: string; url: string }>;
}

interface RawFile {
    hashes: { sha1: string; sha512?: string };
    url: string;
    filename: string;
    primary: boolean;
    size: number;
    file_type?: string | null;
}

interface RawDep {
    project_id: string | null;
    version_id: string | null;
    dependency_type: string;
}

interface RawVersion {
    id: string;
    project_id: string;
    name: string;
    version_number: string;
    version_type: string;
    date_published: string;
    game_versions: string[];
    loaders: string[];
    files: RawFile[];
    dependencies?: RawDep[];
    changelog?: string;
    downloads?: number;
}

const PROVIDER = 'modrinth' as const;

// Modrinth's canonical slug-routed URL uses the project type as the path
// segment, e.g. /mod/sodium vs. /datapack/terralith. Building the right URL
// here means the "View on Modrinth" link in the UI always lands on the
// correct project page even for non-mod types.
const projectUrlFor = (slug: string, projectType: ProjectType): string =>
    `https://modrinth.com/${projectType}/${slug}`;

const normalizeProjectType = (raw: string | undefined): ProjectType => {
    if (raw === 'datapack') return 'datapack';
    // Plugins are first-class for paper/spigot/bukkit servers — they install
    // into `plugins/` and the Modrinth loaders list uses paper/spigot/etc.
    // We surface them as their own type so the UI can branch correctly.
    if (raw === 'plugin') return 'plugin';
    // Everything else (mod, modpack, resourcepack, shader) collapses to
    // "mod" — Modrinth's search returns mod-pack hits when we don't
    // explicitly filter, and treating them as mods for routing/display is
    // safer than failing on an unknown discriminator. The project_type:mod
    // facet on our search calls makes this nearly always 'mod' in practice.
    return 'mod';
};

const normalizeSide = (s: string): ModSide => {
    if (s === 'required' || s === 'optional' || s === 'unsupported') return s;
    return 'unknown';
};

export const summaryFromHit = (h: RawHit): ModSummary => {
    const projectType = normalizeProjectType(h.project_type);
    return {
        id: `${PROVIDER}:${h.project_id}`,
        projectId: h.project_id,
        provider: PROVIDER,
        projectType,
        slug: h.slug,
        title: h.title,
        description: h.description,
        author: h.author,
        authorUrl: h.author ? `https://modrinth.com/user/${h.author}` : null,
        // Search hits don't include an avatar URL — that needs a separate
        // /v2/user/{username} lookup. The UI uses a generic placeholder until
        // enrichment fills it in.
        authorAvatarUrl: null,
        iconUrl: h.icon_url ?? null,
        downloads: h.downloads,
        follows: h.follows,
        categories: h.display_categories ?? h.categories,
        clientSide: normalizeSide(h.client_side),
        serverSide: normalizeSide(h.server_side),
        projectUrl: projectUrlFor(h.slug, projectType),
        // date_modified is the last-meaningful-change timestamp on
        // Modrinth (new version published, metadata edit, etc.) —
        // exactly what the "X days ago" chip on the Discover card
        // wants. Fall back to date_created when modified is missing
        // so brand-new projects still get a reasonable timestamp.
        updated: h.date_modified ?? h.date_created ?? undefined,
    };
};

export const summaryFromProject = (p: RawProject): ModSummary => {
    const projectType = normalizeProjectType(p.project_type);
    return {
        id: `${PROVIDER}:${p.id}`,
        projectId: p.id,
        provider: PROVIDER,
        projectType,
        slug: p.slug,
        title: p.title,
        description: p.description,
        // The project endpoint never returns an author username — it only
        // exposes a team id. We leave the field blank and let the caller
        // enrich via /teams when they want to surface the author. The old
        // behaviour of falling back to the team id leaked Modrinth-internal
        // hash-looking IDs into the UI as if they were usernames.
        author: '',
        authorUrl: null,
        authorAvatarUrl: null,
        iconUrl: p.icon_url ?? null,
        downloads: p.downloads,
        follows: p.followers,
        categories: [...(p.categories ?? []), ...(p.additional_categories ?? [])],
        clientSide: normalizeSide(p.client_side),
        serverSide: normalizeSide(p.server_side),
        projectUrl: projectUrlFor(p.slug, projectType),
        // Mirror the search-hit path: prefer last-modified, fall back
        // to first-publish for projects that have never been updated.
        updated: p.updated ?? p.published ?? undefined,
    };
};

const fileFromRaw = (f: RawFile): ModFile => ({
    filename: f.filename,
    url: f.url,
    sizeBytes: f.size,
    sha1: f.hashes.sha1,
    sha512: f.hashes.sha512,
    primary: f.primary,
});

const depFromRaw = (d: RawDep): ModDependency => ({
    modId: d.project_id ? `${PROVIDER}:${d.project_id}` : null,
    versionId: d.version_id,
    type:
        d.dependency_type === 'required' ||
        d.dependency_type === 'optional' ||
        d.dependency_type === 'incompatible' ||
        d.dependency_type === 'embedded'
            ? d.dependency_type
            : 'optional',
});

export const versionFromRaw = (v: RawVersion): ModVersion => ({
    id: v.id,
    projectId: v.project_id,
    provider: PROVIDER,
    name: v.name,
    versionNumber: v.version_number,
    versionType:
        v.version_type === 'release' || v.version_type === 'beta' || v.version_type === 'alpha'
            ? v.version_type
            : v.version_type,
    datePublished: v.date_published,
    gameVersions: v.game_versions,
    loaders: v.loaders,
    files: v.files.map(fileFromRaw),
    dependencies: (v.dependencies ?? []).map(depFromRaw),
    changelog: v.changelog,
    downloads: v.downloads,
});

export const projectFromRaw = (p: RawProject, versions: RawVersion[]): ModProject => ({
    ...summaryFromProject(p),
    versions: versions.map(versionFromRaw),
    body: p.body,
    license: p.license?.name,
    licenseUrl: p.license?.url ?? null,
    gallery: (p.gallery ?? []).map((g) => ({
        url: g.url,
        // raw_url is the full-quality original; url is a 350px-wide
        // CDN-resized thumbnail. Preserve both so the lightbox can
        // upgrade to native resolution while the grid keeps using the
        // cheap thumbnail.
        rawUrl: g.raw_url ?? undefined,
        title: g.title ?? undefined,
        description: g.description ?? undefined,
        featured: !!g.featured,
        created: g.created ?? undefined,
    })),
    published: p.published,
    updated: p.updated,
    gameVersions: p.game_versions ?? [],
    loaders: p.loaders ?? [],
    issuesUrl: p.issues_url ?? null,
    sourceUrl: p.source_url ?? null,
    wikiUrl: p.wiki_url ?? null,
    discordUrl: p.discord_url ?? null,
    donationUrls: p.donation_urls ?? [],
});
