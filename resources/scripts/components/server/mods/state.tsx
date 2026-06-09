import { ReactNode, createContext, useCallback, useContext, useMemo, useState } from 'react';

import { IdentifiedJar } from '@/api/server/mods/types';

export type InstalledEntry =
    | {
          kind: 'identified';
          /** Path of the jar relative to the server root, e.g. "mods/sodium.jar". */
          path: string;
          sha1: string | null;
          enabled: boolean;
          identified: IdentifiedJar;
      }
    | {
          kind: 'unidentified';
          path: string;
          sha1: string | null;
          enabled: boolean;
          /** Metadata read from manifest files inside the jar, when available. */
          name: string | null;
          version: string | null;
          modId: string | null;
      };

interface ModsState {
    installed: InstalledEntry[];
    /** Truthy while the Installed tab is refreshing. */
    installedLoading: boolean;
    /** Last refresh error, if any. */
    installedError: string | null;
    setInstalled: (entries: InstalledEntry[]) => void;
    setInstalledLoading: (loading: boolean) => void;
    setInstalledError: (message: string | null) => void;
    /** Computed set of installed mod IDs (e.g. "modrinth:AANobbMI"). */
    installedModIds: Set<string>;
    /**
     * Refresh nonce. Bumping this triggers the Installed tab to re-fetch.
     * Used after install/update/remove operations.
     */
    refreshNonce: number;
    bumpRefresh: () => void;
}

const Ctx = createContext<ModsState | null>(null);

export const useModsState = (): ModsState => {
    const v = useContext(Ctx);
    if (!v) throw new Error('useModsState must be used inside <ModsStateProvider>');
    return v;
};

export const ModsStateProvider = ({ children }: { children: ReactNode }) => {
    const [installed, setInstalledRaw] = useState<InstalledEntry[]>([]);
    const [installedLoading, setInstalledLoading] = useState(false);
    const [installedError, setInstalledError] = useState<string | null>(null);
    const [refreshNonce, setRefreshNonce] = useState(0);

    const setInstalled = useCallback((entries: InstalledEntry[]) => setInstalledRaw(entries), []);
    const bumpRefresh = useCallback(() => setRefreshNonce((n) => n + 1), []);

    const installedModIds = useMemo(() => {
        const set = new Set<string>();
        for (const e of installed) {
            if (e.kind === 'identified') set.add(e.identified.project.id);
        }
        return set;
    }, [installed]);

    const value: ModsState = {
        installed,
        installedLoading,
        installedError,
        installedModIds,
        refreshNonce,
        setInstalled,
        setInstalledLoading,
        setInstalledError,
        bumpRefresh,
    };

    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};
