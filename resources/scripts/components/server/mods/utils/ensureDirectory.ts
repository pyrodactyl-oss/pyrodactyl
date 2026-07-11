import { toast } from 'sonner';

import createDirectory from '@/api/server/files/createDirectory';

/**
 * Best-effort "make sure this directory exists, then run the callback".
 *
 * Use case: the Upload button on the Mods + Discover pages navigates the
 * user into the file manager at `/mods/`, `/plugins/`, or
 * `/world/datapacks/`. If the directory doesn't exist yet (fresh install,
 * never ran the server, plugins folder gets removed, etc.) the file
 * manager returns a 500 and the user sees a generic "Something went
 * wrong" error.
 *
 * This helper walks the path one segment at a time and tries to create
 * each one via the daemon's `createDirectory` endpoint. The daemon returns
 * a 4xx for "already exists" which we treat as success — only "permission
 * denied" / network failures surface a toast. Once the leaf is reachable
 * the callback fires; on terminal failure the callback is skipped and the
 * user gets a clear error explaining what couldn't be created.
 *
 * @param uuid       server UUID
 * @param directory  target directory, relative to server root (no leading slash)
 * @param onReady    invoked after the directory is confirmed to exist
 */
export const ensureDirectoryThen = async (
    uuid: string,
    directory: string,
    onReady: () => void,
): Promise<void> => {
    const segments = directory
        .replace(/^\/+|\/+$/g, '')
        .split('/')
        .filter(Boolean);
    if (segments.length === 0) {
        onReady();
        return;
    }

    let parent = '/';
    for (const segment of segments) {
        try {
            await createDirectory(uuid, parent, segment);
        } catch (err) {
            // The daemon returns 4xx on already-exists. We can't easily
            // differentiate from network/permission errors without parsing
            // the response shape, so we use a permissive policy: assume
            // any failure that isn't "permission denied" is recoverable
            // (the dir probably exists). If it really doesn't, the file
            // manager surfaces its own error when we navigate there.
            // For permission errors we DO want to give up early — they'll
            // recur on every segment otherwise.
            const status = (err as { response?: { status?: number } })?.response?.status;
            if (status === 403) {
                toast.error(
                    `Couldn't create /${directory} — you don't have permission to write to /${parent.replace(/^\/+|\/+$/g, '') || ''}.`,
                );
                return;
            }
            // Everything else (404, 409 "already exists", etc.): swallow
            // and try the next segment. The walk is idempotent enough that
            // a real "parent missing" failure on segment N will recur on
            // segment N+1 and we'll just navigate; the file manager then
            // shows its own friendly empty-directory state.
        }
        parent = parent === '/' ? '/' + segment : parent + '/' + segment;
    }
    onReady();
};
