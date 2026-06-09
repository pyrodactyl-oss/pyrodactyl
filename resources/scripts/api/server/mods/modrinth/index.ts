// Modrinth provider implementation for the mod manager.
//
// Talks directly to api.modrinth.com from the browser. CORS is open and no
// auth is needed for the read endpoints we use. If we later want to centralise
// the User-Agent header or add caching, add a Laravel passthrough controller
// and point `modrinthClient()` at it — call sites won't change.
import { IdentifiedJar, ModProject, ModSearchParams, ModSearchResult, ModVersion } from '../types';
import { modrinthClient } from './client';
import { projectFromRaw, summaryFromHit, versionFromRaw } from './transformers';

/**
 * Modrinth's effective batch ceiling for /version_files is around 1000 hashes,
 * and their own desktop app uses 800 (see packages/app-lib/src/state/cache.rs,
 * MAX_REQUEST_SIZE = 800). We use a slightly more conservative 500 to leave
 * headroom for the JSON payload size and any future Modrinth-side throttling.
 */
const HASH_BATCH = 500;

const buildFacets = (params: ModSearchParams): string[][] => {
    const facets: string[][] = [];
    if (params.facets.projectType) {
        facets.push([`project_type:${params.facets.projectType}`]);
    }
    for (const loader of params.facets.loaders) {
        facets.push([`categories:${loader}`]);
    }
    if (params.facets.gameVersions.length > 0) {
        // Multiple game versions are OR'd together inside a single facet group.
        facets.push(params.facets.gameVersions.map((v) => `versions:${v}`));
    }
    for (const cat of params.facets.categories) {
        facets.push([`categories:${cat}`]);
    }
    if (params.facets.serverSide) {
        facets.push(['server_side:required', 'server_side:optional']);
    }
    return facets;
};

export const search = async (params: ModSearchParams): Promise<ModSearchResult> => {
    const facets = buildFacets(params);
    const query: Record<string, string> = {
        limit: String(params.limit ?? 20),
        offset: String(params.offset ?? 0),
        index: params.sort ?? 'relevance',
    };
    if (params.query) query.query = params.query;
    if (facets.length > 0) query.facets = JSON.stringify(facets);

    const { data } = await modrinthClient().get('/search', { params: query });
    return {
        hits: (data.hits as unknown[]).map((h) => summaryFromHit(h as Parameters<typeof summaryFromHit>[0])),
        totalHits: data.total_hits,
        offset: data.offset,
        limit: data.limit,
    };
};

export const getProject = async (idOrSlug: string): Promise<ModProject> => {
    const [{ data: project }, { data: versions }] = await Promise.all([
        modrinthClient().get(`/project/${idOrSlug}`),
        modrinthClient().get(`/project/${idOrSlug}/version`),
    ]);
    const built = projectFromRaw(project, versions);
    // The /project endpoint omits the human-readable author/owner name, so
    // we enrich here before returning. Same logic as identifyProjects: an
    // `organization` field wins over the team-owner fallback. Failures
    // along this path are best-effort — if the enrichment call dies, the
    // detail page still renders with an empty author rather than crashing.
    try {
        const raw = project as {
            organization?: string | null;
            team?: string | null;
        };
        const author = await resolveProjectAuthor(raw.organization ?? null, raw.team ?? null);
        if (author) {
            return {
                ...built,
                author: author.username,
                authorUrl: author.url,
                authorAvatarUrl: author.avatarUrl,
            };
        }
    } catch (err) {
        console.warn('Could not enrich project author:', err);
    }
    return built;
};

/**
 * Resolve a project's display author + avatar from either its organization
 * (when org-owned) or its team-owner (when user-owned). Returns null when
 * neither lookup succeeds. Used by `getProject` to power the ProjectDetail
 * sidebar; the bulk `identifyProjects` path has its own batched equivalent.
 */
const resolveProjectAuthor = async (
    organizationId: string | null,
    teamId: string | null,
): Promise<{ username: string; url: string; avatarUrl: string | null } | null> => {
    if (organizationId) {
        try {
            // Organizations only exist on Modrinth's v3 API — /v2 returns
            // 404 for every org route. We pass an absolute URL so axios
            // ignores our v2-rooted baseURL for this one request and the
            // rest of the call sites continue to use v2 as before.
            const { data: org } = await modrinthClient().get<{
                slug: string;
                name: string;
                icon_url?: string | null;
            }>(`https://api.modrinth.com/v3/organization/${organizationId}`);
            if (org?.name) {
                return {
                    username: org.name,
                    url: `https://modrinth.com/organization/${org.slug}`,
                    avatarUrl: org.icon_url ?? null,
                };
            }
        } catch {
            // Fall through to team lookup.
        }
    }
    if (teamId) {
        try {
            const { data: members } = await modrinthClient().get<
                Array<{
                    is_owner?: boolean;
                    role?: string;
                    ordering?: number;
                    user: { username: string; avatar_url?: string | null };
                }>
            >(`/team/${teamId}/members`);
            if (Array.isArray(members) && members.length > 0) {
                const owner =
                    members.find((m) => m.is_owner) ??
                    members.find((m) => m.role?.toLowerCase().startsWith('owner')) ??
                    members.slice().sort((a, b) => (a.ordering ?? 0) - (b.ordering ?? 0))[0]!;
                return {
                    username: owner.user.username,
                    url: `https://modrinth.com/user/${owner.user.username}`,
                    avatarUrl: owner.user.avatar_url ?? null,
                };
            }
        } catch {
            // Fall through to null.
        }
    }
    return null;
};

/** List versions for a project, filtered by loader and game version on the server side. */
export const listVersions = async (
    idOrSlug: string,
    opts: { loaders?: string[]; gameVersions?: string[] } = {},
): Promise<ModVersion[]> => {
    const params: Record<string, string> = {};
    if (opts.loaders && opts.loaders.length > 0) params.loaders = JSON.stringify(opts.loaders);
    if (opts.gameVersions && opts.gameVersions.length > 0) {
        params.game_versions = JSON.stringify(opts.gameVersions);
    }
    const { data } = await modrinthClient().get(`/project/${idOrSlug}/version`, { params });
    return (data as unknown[]).map((v) => versionFromRaw(v as Parameters<typeof versionFromRaw>[0]));
};

/**
 * Batch-identify local jars by their SHA-1 hashes. Wraps Modrinth's
 * `POST /version_files` endpoint, which returns a map of hash → version.
 * Hashes that don't match a known file are simply absent from the response.
 *
 * We chunk the request so we never blow past the documented batch limit.
 */
export const identifyByHashes = async (sha1s: string[]): Promise<IdentifiedJar[]> => {
    if (sha1s.length === 0) return [];
    const chunks: string[][] = [];
    for (let i = 0; i < sha1s.length; i += HASH_BATCH) {
        chunks.push(sha1s.slice(i, i + HASH_BATCH));
    }

    const versionByHash = new Map<string, ModVersion>();
    const projectIdsNeeded = new Set<string>();

    for (const chunk of chunks) {
        const { data } = await modrinthClient().post<Record<string, Parameters<typeof versionFromRaw>[0]>>(
            '/version_files',
            { hashes: chunk, algorithm: 'sha1' },
        );
        for (const [sha1, raw] of Object.entries(data)) {
            const version = versionFromRaw(raw);
            versionByHash.set(sha1, version);
            projectIdsNeeded.add(version.projectId);
        }
    }

    if (projectIdsNeeded.size === 0) return [];

    // Fetch the project metadata for every identified mod in a single call.
    const { data: rawProjects } = await modrinthClient().get('/projects', {
        params: { ids: JSON.stringify([...projectIdsNeeded]) },
    });
    interface RawProjectsItem {
        id: string;
        slug: string;
        title: string;
        description: string;
        project_type?: string;
        team?: string;
        /**
         * When a project is owned by a Modrinth organization (e.g.
         * GeyserMC owns Geyser) this carries the org ID. The `team`
         * field still exists for collaborator-list purposes but the
         * org's `name` is the canonical attribution.
         */
        organization?: string | null;
        icon_url: string | null;
        downloads: number;
        followers: number;
        categories: string[];
        client_side: string;
        server_side: string;
    }
    const projects: RawProjectsItem[] = rawProjects as RawProjectsItem[];

    /** Author + avatar tuple, sourced from either an org or a team owner. */
    interface AuthorAttribution {
        username: string;
        url: string;
        avatarUrl: string | null;
    }

    // -- Step 1: resolve organizations -------------------------------------
    //
    // For projects with an `organization` field set we use the org's name
    // and icon as the attribution. This matches modrinth.com — Geyser
    // displays "Created by GeyserMC", not whichever user happens to be the
    // first team member. Without this branch org-owned projects fall
    // through to the team-owner path which often has no usable owner
    // (orgs don't always populate `team` members) and render as
    // "Unknown author".
    //
    // Important: organizations live on Modrinth's v3 API only. v2 has no
    // /organization or /organizations routes at all — every call 404s.
    // The bulk v3 endpoint /v3/organizations?ids=[…] works, so we batch
    // every project's org id into a single request. We pass an absolute
    // URL so axios bypasses our v2 baseURL just for this one call.
    const orgIds = [
        ...new Set(projects.map((p) => p.organization).filter((o): o is string => !!o)),
    ];
    const orgAttributions = new Map<string, AuthorAttribution>();
    if (orgIds.length > 0) {
        try {
            const { data: orgsRaw } = await modrinthClient().get<
                Array<{ id: string; slug: string; name: string; icon_url?: string | null }>
            >('https://api.modrinth.com/v3/organizations', {
                params: { ids: JSON.stringify(orgIds) },
            });
            for (const org of orgsRaw ?? []) {
                orgAttributions.set(org.id, {
                    username: org.name,
                    url: `https://modrinth.com/organization/${org.slug}`,
                    avatarUrl: org.icon_url ?? null,
                });
            }
        } catch (err) {
            // Best-effort — fall through to team lookup if the bulk org
            // call fails. Worst case the user still sees "Unknown" but we
            // don't crash the whole identification pipeline.
            console.warn('Could not fetch Modrinth organizations:', err);
        }
    }

    // -- Step 2: resolve team owners ---------------------------------------
    //
    // For projects WITHOUT an `organization` field we fall back to the
    // legacy team-owner lookup. The `team` field on a project is just an
    // ID; the owner's display name needs a second hop through `/teams`.
    // We only fetch teams whose project doesn't already have an org
    // resolved — saves a roundtrip on heavily org-owned servers.
    const teamIds = [
        ...new Set(
            projects
                .filter((p) => !(p.organization && orgAttributions.has(p.organization)))
                .map((p) => p.team)
                .filter((t): t is string => !!t),
        ),
    ];
    const teamOwners = new Map<string, AuthorAttribution>();
    if (teamIds.length > 0) {
        try {
            const { data: teamsRaw } = await modrinthClient().get<
                Array<
                    Array<{
                        team_id: string;
                        is_owner?: boolean;
                        role?: string;
                        ordering?: number;
                        user: { username: string; avatar_url?: string | null };
                    }>
                >
            >('/teams', { params: { ids: JSON.stringify(teamIds) } });

            for (const members of teamsRaw ?? []) {
                if (!Array.isArray(members) || members.length === 0) continue;
                // Pick the owner — explicit `is_owner` flag wins, then role
                // text starting with "owner", then the lowest `ordering`,
                // then just the first member. This mirrors how Modrinth's
                // own UI surfaces a single attribution per project.
                const owner =
                    members.find((m) => m.is_owner) ??
                    members.find((m) => m.role?.toLowerCase().startsWith('owner')) ??
                    members.slice().sort((a, b) => (a.ordering ?? 0) - (b.ordering ?? 0))[0]!;
                teamOwners.set(owner.team_id, {
                    username: owner.user.username,
                    url: `https://modrinth.com/user/${owner.user.username}`,
                    avatarUrl: owner.user.avatar_url ?? null,
                });
            }
        } catch (err) {
            // Author/avatar enrichment is best-effort. If /teams fails the
            // rows still render — they just show no author.
            console.warn('Could not fetch team owners for installed mods:', err);
        }
    }

    const projectSummaries = new Map<string, ReturnType<typeof summaryFromHit>>();
    for (const p of projects) {
        const projectType: 'mod' | 'datapack' = p.project_type === 'datapack' ? 'datapack' : 'mod';
        // Org attribution wins when present — that's the canonical owner
        // for org-owned projects. Team owner is the fallback for
        // user-owned projects. We intentionally use a plain `if` chain
        // rather than `??` because `p.organization && ...` would short-
        // circuit to an empty string for a falsy organization id and
        // poison the chained fallback.
        let author: AuthorAttribution | undefined;
        if (p.organization) author = orgAttributions.get(p.organization);
        if (!author && p.team) author = teamOwners.get(p.team);
        projectSummaries.set(p.id, {
            id: `modrinth:${p.id}`,
            projectId: p.id,
            provider: 'modrinth',
            projectType,
            slug: p.slug,
            title: p.title,
            description: p.description,
            author: author?.username ?? '',
            authorUrl: author?.url ?? null,
            authorAvatarUrl: author?.avatarUrl ?? null,
            iconUrl: p.icon_url ?? null,
            downloads: p.downloads,
            follows: p.followers,
            categories: p.categories,
            clientSide: (p.client_side as 'required' | 'optional' | 'unsupported') ?? 'unknown',
            serverSide: (p.server_side as 'required' | 'optional' | 'unsupported') ?? 'unknown',
            projectUrl: `https://modrinth.com/${projectType}/${p.slug}`,
        });
    }

    const out: IdentifiedJar[] = [];
    for (const [sha1, version] of versionByHash.entries()) {
        const project = projectSummaries.get(version.projectId);
        if (project) out.push({ sha1, project, version });
    }
    return out;
};

/** Fetch tag lists (loaders, game versions) — used by the filter UI. */
export const listLoaders = async (): Promise<Array<{ id: string; name: string; iconUrl?: string }>> => {
    const { data } = await modrinthClient().get('/tag/loader');
    return (data as Array<{ name: string; icon?: string; supported_project_types: string[] }>).map((l) => ({
        id: l.name.toLowerCase(),
        name: l.name,
    }));
};

export const listGameVersions = async (): Promise<
    Array<{ id: string; type: 'release' | 'snapshot' | 'beta' | string; releaseDate?: string }>
> => {
    const { data } = await modrinthClient().get('/tag/game_version');
    return (data as Array<{ version: string; version_type: string; date_released: string }>).map((v) => ({
        id: v.version,
        type: v.version_type,
        releaseDate: v.date_released,
    }));
};
