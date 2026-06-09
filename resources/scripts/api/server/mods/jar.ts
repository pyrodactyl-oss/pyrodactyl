import http from '@/api/http';
import { getGlobalDaemonType } from '@/api/server/getServer';

/**
 * Compute SHA-1 of an ArrayBuffer using the browser's Web Crypto API and
 * return it as a lowercase hex string. SHA-1 is what Modrinth indexes its
 * file table by, so all consumers of this helper want the hex form.
 */
export const sha1Hex = async (buffer: ArrayBuffer): Promise<string> => {
    const digest = await crypto.subtle.digest('SHA-1', buffer);
    const bytes = new Uint8Array(digest);
    let hex = '';
    for (let i = 0; i < bytes.length; i++) {
        const byte = bytes[i]!;
        hex += byte < 16 ? '0' : '';
        hex += byte.toString(16);
    }
    return hex;
};

/**
 * Download a file from the server's filesystem (via Wings) as an ArrayBuffer.
 * Used for hashing local jars before sending the hashes to Modrinth.
 */
export const fetchFileBuffer = async (serverUuid: string, filePath: string): Promise<ArrayBuffer> => {
    const daemon = getGlobalDaemonType();
    const { data } = await http.get<ArrayBuffer>(
        `/api/client/servers/${daemon}/${serverUuid}/files/contents`,
        {
            params: { file: filePath },
            responseType: 'arraybuffer',
            // Force axios to keep the binary intact even if a default
            // transform is registered globally.
            transformResponse: (raw) => raw,
        },
    );
    return data;
};

export interface JarMetadata {
    /** Best-effort mod ID (e.g. fabric mod ID), if found. */
    modId: string | null;
    /** Display name from the manifest. */
    name: string | null;
    /** Version string from the manifest. */
    version: string | null;
    /** Which manifest the metadata came from. */
    source: 'fabric.mod.json' | 'quilt.mod.json' | 'mods.toml' | null;
}

/**
 * Parse a jar's manifest files to extract mod name/version when Modrinth
 * doesn't recognise the file. We support:
 *   - Fabric:   fabric.mod.json
 *   - Quilt:    quilt.mod.json
 *   - (Neo)Forge:  META-INF/mods.toml
 *
 * The implementation is intentionally minimal — we only need enough zip
 * support to read a few small text files at known paths, and only enough
 * TOML support to find a name and version key. No external deps.
 */
export const parseJarMetadata = async (jar: ArrayBuffer): Promise<JarMetadata> => {
    const empty: JarMetadata = { modId: null, name: null, version: null, source: null };
    const view = new DataView(jar);

    const text = await readZipMember(jar, view, 'fabric.mod.json');
    if (text !== null) {
        try {
            const parsed = JSON.parse(text) as { id?: string; name?: string; version?: string };
            return {
                modId: parsed.id ?? null,
                name: parsed.name ?? null,
                version: parsed.version ?? null,
                source: 'fabric.mod.json',
            };
        } catch {
            // fall through to other formats
        }
    }

    const quiltText = await readZipMember(jar, view, 'quilt.mod.json');
    if (quiltText !== null) {
        try {
            const parsed = JSON.parse(quiltText) as {
                quilt_loader?: { id?: string; metadata?: { name?: string }; version?: string };
            };
            const ql = parsed.quilt_loader ?? {};
            return {
                modId: ql.id ?? null,
                name: ql.metadata?.name ?? null,
                version: ql.version ?? null,
                source: 'quilt.mod.json',
            };
        } catch {
            // fall through
        }
    }

    const tomlText = await readZipMember(jar, view, 'META-INF/mods.toml');
    if (tomlText !== null) {
        return { ...parseModsToml(tomlText), source: 'mods.toml' };
    }

    return empty;
};

/**
 * Minimal mods.toml parser. The Forge/NeoForge format is line-oriented TOML,
 * but we only care about the first `[[mods]]` block and its `modId`,
 * `displayName`, and `version` keys. We deliberately don't pull in a full
 * TOML library — saves ~30kB in the bundle for one debug-only fallback.
 */
const parseModsToml = (toml: string): Omit<JarMetadata, 'source'> => {
    const lines = toml.split(/\r?\n/);
    let inModsBlock = false;
    let modId: string | null = null;
    let name: string | null = null;
    let version: string | null = null;

    const stripValue = (raw: string): string => {
        const trimmed = raw.trim();
        const m = /^"([^"]*)"$/.exec(trimmed) ?? /^'([^']*)'$/.exec(trimmed);
        return m ? m[1]! : trimmed;
    };

    for (const line of lines) {
        const t = line.trim();
        if (t.startsWith('#') || t.length === 0) continue;
        if (t === '[[mods]]') {
            if (inModsBlock) break; // already consumed first block
            inModsBlock = true;
            continue;
        }
        // A new section ends the mods block.
        if (t.startsWith('[') && inModsBlock && t !== '[[mods]]') break;

        if (!inModsBlock) continue;

        const eq = t.indexOf('=');
        if (eq === -1) continue;
        const key = t.slice(0, eq).trim();
        const value = stripValue(t.slice(eq + 1));

        if (key === 'modId' && modId === null) modId = value;
        else if (key === 'displayName' && name === null) name = value;
        else if (key === 'version' && version === null) {
            // mods.toml versions are sometimes the literal "${file.jarVersion}".
            // Caller will treat null version as "unknown".
            if (!value.startsWith('${')) version = value;
        }
    }

    return { modId, name, version };
};

// -- Minimal zip reader -----------------------------------------------------
//
// We scan the End-Of-Central-Directory record and walk the central directory
// to find the desired entry, then decompress (deflate or store) just that one.
//
// This is intentionally small and only supports the subset of zip features
// jars actually use in practice (store, deflate, no zip64, no encryption).

const SIG_EOCD = 0x06054b50;
const SIG_CD = 0x02014b50;

const readZipMember = async (
    buffer: ArrayBuffer,
    view: DataView,
    targetName: string,
): Promise<string | null> => {
    const eocdOffset = findEocd(view);
    if (eocdOffset < 0) return null;

    const cdOffset = view.getUint32(eocdOffset + 16, true);
    const cdEntries = view.getUint16(eocdOffset + 10, true);

    let p = cdOffset;
    for (let i = 0; i < cdEntries; i++) {
        if (view.getUint32(p, true) !== SIG_CD) return null;
        const compMethod = view.getUint16(p + 10, true);
        const compSize = view.getUint32(p + 20, true);
        const nameLen = view.getUint16(p + 28, true);
        const extraLen = view.getUint16(p + 30, true);
        const commentLen = view.getUint16(p + 32, true);
        const localHeaderOffset = view.getUint32(p + 42, true);

        const name = new TextDecoder('utf-8').decode(new Uint8Array(buffer, p + 46, nameLen));
        const nextEntry = p + 46 + nameLen + extraLen + commentLen;

        if (name === targetName) {
            return readLocalFile(buffer, view, localHeaderOffset, compMethod, compSize);
        }
        p = nextEntry;
    }
    return null;
};

const findEocd = (view: DataView): number => {
    // EOCD has variable-length comment at the tail; max scan is 64KB.
    const maxScan = Math.min(view.byteLength, 65_536 + 22);
    for (let i = view.byteLength - 22; i >= view.byteLength - maxScan; i--) {
        if (i < 0) break;
        if (view.getUint32(i, true) === SIG_EOCD) return i;
    }
    return -1;
};

const readLocalFile = async (
    buffer: ArrayBuffer,
    view: DataView,
    headerOffset: number,
    compMethod: number,
    compSize: number,
): Promise<string | null> => {
    // Local file header: skip past variable-length name + extra fields.
    const localNameLen = view.getUint16(headerOffset + 26, true);
    const localExtraLen = view.getUint16(headerOffset + 28, true);
    const dataStart = headerOffset + 30 + localNameLen + localExtraLen;
    const compressed = new Uint8Array(buffer, dataStart, compSize);

    if (compMethod === 0) {
        return new TextDecoder('utf-8').decode(compressed);
    }
    if (compMethod === 8) {
        // raw deflate stream — use the platform DecompressionStream which has
        // had broad browser support since 2023.
        if (typeof DecompressionStream === 'undefined') return null;
        const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
        const decompressed = await new Response(stream).arrayBuffer();
        return new TextDecoder('utf-8').decode(decompressed);
    }
    return null;
};
