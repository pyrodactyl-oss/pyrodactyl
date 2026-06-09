import http from '@/api/http';
import { getGlobalDaemonType } from '@/api/server/getServer';

export interface PullFileOptions {
    /** Server-side path the file should be placed into (no leading slash). */
    directory: string;
    /** URL Wings should download from. Must be reachable by the daemon. */
    url: string;
    /**
     * Optional override for the saved filename. When omitted, Wings derives
     * it from the URL (or the Content-Disposition header if `useHeader` is
     * set).
     */
    filename?: string;
    /** Tell Wings to honor the remote Content-Disposition header. */
    useHeader?: boolean;
    /** Synchronously block the request until the pull completes. */
    foreground?: boolean;
}

/**
 * Ask Wings to download a file from a remote URL into the server filesystem.
 *
 * Wraps the existing panel-side `POST /files/pull` endpoint, which in turn
 * forwards to the Wings daemon. This is meaningfully better than the
 * previous "download in the browser, re-upload via multipart" path: the
 * bytes never touch the user's connection, large mods aren't capped by the
 * browser's memory, and the daemon handles retries.
 *
 * Note: rate-limited at 10 requests per 5 seconds on the panel side, so
 * dependency-batch flows should serialise pulls rather than parallelising
 * them.
 */
export const pullFile = async (uuid: string, opts: PullFileOptions): Promise<void> => {
    const daemon = getGlobalDaemonType();
    await http.post(`/api/client/servers/${daemon}/${uuid}/files/pull`, {
        url: opts.url,
        directory: opts.directory,
        filename: opts.filename,
        use_header: opts.useHeader,
        foreground: opts.foreground,
    });
};
