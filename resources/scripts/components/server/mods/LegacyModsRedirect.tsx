import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { ServerContext } from '@/state/server';

/**
 * Legacy URL redirector for all the previous URL shapes the mods feature
 * used to live at. The current URL layout is:
 *   - /server/:id/mods               → installed list
 *   - /server/:id/discover           → discovery
 *   - /server/:id/discover/project/:id → project detail
 *
 * Anything still pointing at an older path lands here and gets one-shot
 * replace-navigated to the right place so old bookmarks, in-app NavLinks
 * (anything we miss in a rename sweep), and external links continue to
 * work. Returns null so it doesn't paint anything during the redirect.
 */
const LegacyModsRedirect = () => {
    const serverId = ServerContext.useStoreState((state) => state.server.data?.id);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (!serverId) return;
        const path = location.pathname;
        const base = `/server/${serverId}`;
        const installedRe = new RegExp(`^/server/[^/]+/mods/installed(/.*)?$`);
        const modsBrowseRe = new RegExp(`^/server/[^/]+/mods/browse(/.*)?$`);
        // /browse and /browse/project/:id were a previous incarnation of
        // /discover — redirect them on too.
        const browseProjectRe = new RegExp(`^/server/[^/]+/browse/project/(.+)$`);
        const browseRe = new RegExp(`^/server/[^/]+/browse(/.*)?$`);
        const modsProjectRe = new RegExp(`^/server/[^/]+/mods/project/(.+)$`);

        let target: string | null = null;
        if (installedRe.test(path)) {
            target = path.replace(/\/mods\/installed/, '/mods');
        } else if (modsBrowseRe.test(path)) {
            target = path.replace(/\/mods\/browse/, '/discover');
        } else if (browseProjectRe.test(path)) {
            const m = browseProjectRe.exec(path);
            target = `${base}/discover/project/${m![1]}`;
        } else if (browseRe.test(path)) {
            target = path.replace(/\/browse/, '/discover');
        } else {
            const projectMatch = modsProjectRe.exec(path);
            if (projectMatch) {
                target = `${base}/discover/project/${projectMatch[1]}`;
            }
        }

        if (target && target !== path) {
            navigate(target + location.search + location.hash, { replace: true });
        }
    }, [serverId, location.pathname, location.search, location.hash, navigate]);

    return null;
};

export default LegacyModsRedirect;
