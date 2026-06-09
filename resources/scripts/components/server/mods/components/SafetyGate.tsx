import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { ServerContext } from '@/state/server';

/**
 * Hook that exposes the server's live power state alongside a derived
 * "is the in-memory jar set live?" flag.
 *
 * Note: the panel previously blocked all mutating actions when the server
 * wasn't `offline`. We've since relaxed that — the JVM happily lets you
 * rename, delete, and overwrite jar files while it's running. None of those
 * changes take effect until the server restarts (the JVM only re-reads the
 * mods/ directory at startup), so we surface a small "restart needed"
 * indicator + a one-shot toast instead of locking the UI.
 */
export const useServerIsSafe = (): { safe: boolean; status: string | null } => {
    const status = ServerContext.useStoreState((state) => state.status.value);
    // `safe` is retained for backward compatibility with call sites that
    // want to gate destructive UI like the bulk-delete button when the
    // server isn't offline. New code should prefer reading `status` and
    // deciding context-by-context.
    const safe = status === 'offline';
    return { safe, status };
};

/**
 * Persistent "restart needed" flag, scoped per server UUID. The flag
 * survives navigation between Mods and Discover (separate containers /
 * state providers) by living in localStorage, and clears automatically
 * the moment the server transitions back to offline.
 *
 * `mark()` should be called after every successful jar mutation. Callers
 * don't need to check status themselves — the helper no-ops when the
 * server is already offline. The first call per (server, run) pair also
 * fires a single toast so the user is notified the instant they cause
 * the need.
 */
const restartFlagKey = (uuid: string): string => `pyrodactyl:mods:restart-needed:${uuid}`;

export const useRestartNeeded = (
    uuid: string | undefined,
    status: string | null,
): { restartNeeded: boolean; mark: () => void } => {
    const [restartNeeded, setRestartNeeded] = useState<boolean>(false);

    useEffect(() => {
        if (!uuid) return;
        try {
            setRestartNeeded(window.localStorage.getItem(restartFlagKey(uuid)) === '1');
        } catch {
            // localStorage can throw in Safari private mode etc. Default to
            // false in that case — worst case the user doesn't see the
            // indicator, which is no worse than the old block.
            setRestartNeeded(false);
        }
    }, [uuid]);

    // Clear the flag when the server actually restarts (status returns to
    // offline). Whatever changes were pending have either been applied or
    // are about to be on the next start.
    useEffect(() => {
        if (!uuid || status !== 'offline' || !restartNeeded) return;
        try {
            window.localStorage.removeItem(restartFlagKey(uuid));
        } catch {
            // Same fallback.
        }
        setRestartNeeded(false);
    }, [uuid, status, restartNeeded]);

    const mark = () => {
        if (!uuid || status === 'offline') return;
        let wasMarked = false;
        try {
            wasMarked = window.localStorage.getItem(restartFlagKey(uuid)) === '1';
            window.localStorage.setItem(restartFlagKey(uuid), '1');
        } catch {
            // Best-effort persistence.
        }
        setRestartNeeded(true);
        // Fire the warning toast exactly once per (server, run) pair. The
        // localStorage check naturally dedupes across page navigation —
        // marking the flag from Mods and then doing another action from
        // Discover will only toast the first time.
        if (!wasMarked) {
            toast.warning('Server restart required to apply mod changes.', {
                description: 'The running JVM uses the mods it loaded at startup.',
            });
        }
    };

    return { restartNeeded, mark };
};
