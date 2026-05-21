import deleteFiles from '@/api/server/files/deleteFiles';
import { pullFile } from '@/api/server/files/pullFile';
import renameFiles from '@/api/server/files/renameFiles';
import { getProject, listVersions } from '@/api/server/mods/modrinth';
import { ModFile, ModVersion, ProjectType } from '@/api/server/mods/types';

/** Pick the file that Wings should download from a version's file list. */
export const primaryFile = (version: ModVersion): ModFile | null => {
    if (version.files.length === 0) return null;
    return version.files.find((f) => f.primary) ?? version.files[0]!;
};

/** Ensure a directory path begins with `/` — matches the rest of the file API. */
const absDir = (dir: string): string => (dir.startsWith('/') ? dir : `/${dir}`);

export interface InstallOptions {
    serverUuid: string;
    modsDirectory: string;
    version: ModVersion;
    /** Filename to overwrite (for updates). Will be deleted after successful pull. */
    replacePath?: string;
}

/**
 * Install or update a single mod. Order matters: we pull the new jar first
 * and only delete the old one on success, so an interrupted update doesn't
 * leave the server with no jar at all.
 */
export const installMod = async (opts: InstallOptions): Promise<void> => {
    const file = primaryFile(opts.version);
    if (!file) {
        throw new Error(`Mod version ${opts.version.versionNumber} has no downloadable file.`);
    }

    await pullFile(opts.serverUuid, {
        url: file.url,
        directory: absDir(opts.modsDirectory),
        filename: file.filename,
        foreground: true,
    });

    if (opts.replacePath && !opts.replacePath.endsWith(`/${file.filename}`)) {
        // Only delete the old jar if its name differs from the new one —
        // otherwise the pull just overwrote it.
        const parts = opts.replacePath.split('/');
        const oldFilename = parts.pop()!;
        const dir = parts.join('/') || opts.modsDirectory;
        await deleteFiles(opts.serverUuid, absDir(dir), [oldFilename]);
    }
};

export interface RemoveOptions {
    serverUuid: string;
    /** Path relative to the server root, e.g. "mods/sodium.jar". */
    path: string;
}

export const removeMod = async (opts: RemoveOptions): Promise<void> => {
    const parts = opts.path.split('/');
    const filename = parts.pop()!;
    const dir = parts.join('/') || '/';
    await deleteFiles(opts.serverUuid, absDir(dir), [filename]);
};

export const removeMods = async (serverUuid: string, paths: string[]): Promise<void> => {
    const byDir = new Map<string, string[]>();
    for (const path of paths) {
        const parts = path.split('/');
        const filename = parts.pop();
        if (!filename) continue;
        const dir = absDir(parts.join('/') || '/');
        byDir.set(dir, [...(byDir.get(dir) ?? []), filename]);
    }

    for (const [dir, files] of byDir.entries()) {
        await deleteFiles(serverUuid, dir, files);
    }
};

export const setModEnabled = async ({
    serverUuid,
    path,
    enabled,
}: {
    serverUuid: string;
    path: string;
    enabled: boolean;
}): Promise<string> => {
    const parts = path.split('/');
    const filename = parts.pop()!;
    const dir = absDir(parts.join('/') || '/');
    const currentlyDisabled = filename.toLowerCase().endsWith('.disabled');
    const targetName = enabled
        ? filename.replace(/\.disabled$/i, '')
        : currentlyDisabled
          ? filename
          : `${filename}.disabled`;

    if (targetName === filename) return path;

    await renameFiles(serverUuid, dir, [{ from: filename, to: targetName }]);
    return [...parts, targetName].join('/');
};

export interface SwitchVersionOptions {
    serverUuid: string;
    modsDirectory: string;
    /** Path of the jar currently installed, e.g. "mods/sodium.jar" or "mods/sodium.jar.disabled". */
    fromPath: string;
    version: ModVersion;
}

/**
 * Swap one version of an already-installed mod for another. Wraps installMod so
 * the old jar is only removed once the new one is on disk, then re-applies the
 * `.disabled` suffix if the original jar was disabled — Modrinth ships clean
 * `.jar` filenames so without this step a version switch silently re-enables a
 * mod the user had intentionally turned off.
 *
 * Returns the new on-disk path so callers can update their state without
 * waiting for a full re-scan.
 */
export const switchVersion = async (opts: SwitchVersionOptions): Promise<string> => {
    const file = primaryFile(opts.version);
    if (!file) {
        throw new Error(`Mod version ${opts.version.versionNumber} has no downloadable file.`);
    }

    const wasDisabled = opts.fromPath.toLowerCase().endsWith('.disabled');

    await installMod({
        serverUuid: opts.serverUuid,
        modsDirectory: opts.modsDirectory,
        version: opts.version,
        replacePath: opts.fromPath,
    });

    const installedPath = `${opts.modsDirectory.replace(/^\/+|\/+$/g, '')}/${file.filename}`;
    if (!wasDisabled) return installedPath;

    return setModEnabled({
        serverUuid: opts.serverUuid,
        path: installedPath,
        enabled: false,
    });
};

/**
 * Look up a compatible version for a project, then install it. Used by the
 * dependency-resolution flow where we only know the project ID up-front.
 *
 * When `datapacksDirectory` is provided we look up the dependency's project
 * type and route datapack deps to that directory instead of `mods/`. Most
 * real-world dependencies are libraries (mods), but a datapack occasionally
 * lists another datapack as a hard dep and getting that right matters.
 */
export const installLatestForProject = async (args: {
    serverUuid: string;
    modsDirectory: string;
    datapacksDirectory?: string;
    projectId: string;
    loader: string;
    gameVersion: string;
}): Promise<ModVersion> => {
    let projectType: ProjectType = 'mod';
    if (args.datapacksDirectory) {
        try {
            const project = await getProject(args.projectId);
            projectType = project.projectType;
        } catch {
            // If we can't resolve the project, fall back to treating it as a
            // mod — that's the dominant case and a wrong directory is still
            // recoverable by the user.
        }
    }

    const isDatapack = projectType === 'datapack';
    const versions = await listVersions(args.projectId, {
        // Datapacks have no loader on Modrinth — filtering by loader returns
        // an empty version list for them. Send loaders only for mods.
        loaders: isDatapack ? [] : [args.loader],
        gameVersions: [args.gameVersion],
    });
    if (versions.length === 0) {
        throw new Error(`No compatible version found for ${args.projectId}.`);
    }
    const version = versions[0]!;
    const targetDirectory =
        isDatapack && args.datapacksDirectory ? args.datapacksDirectory : args.modsDirectory;
    await installMod({
        serverUuid: args.serverUuid,
        modsDirectory: targetDirectory,
        version,
    });
    return version;
};
