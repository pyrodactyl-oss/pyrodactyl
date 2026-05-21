import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import FlashMessageRender from '@/components/FlashMessageRender';
import Can from '@/components/elements/Can';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import StartupContainer from '@/components/server/startup/StartupContainer';

import ShellContainer from '../shell/ShellContainer';
import ReinstallServerBox from './ReinstallServerBox';
import RenameServerBox from './RenameServerBox';
import ServerConnectionCard from './ServerConnectionCard';
import ServerResourcesCard from './ServerResourcesCard';

/**
 * Consolidated Settings page.
 *
 * Single unified page that replaces the previous three sidebar entries —
 * Startup, Settings, Software. Drops section labels and rebuilds around
 * the questions a user actually asks when they open Settings:
 *
 *   1. "What software am I running, and how do I change it?"        → Software card (top)
 *   2. "What's this server called?" + "What's its UUID?"             → Identity card (UUID inline)
 *   3. "How do I (or my players) connect to it?"                     → Connection card
 *   4. "What resources does it have?" + "What node am I on?"          → Resources card (Node inline)
 *   5. "How does it start up, and what env vars drive it?"           → Startup section
 *   6. "What if I need to wipe + reinstall?"                         → Danger zone
 *
 * Software wizard behaviour: the Change Software flow is a popout
 * modal layered on top of this page (handled inside ShellContainer
 * itself, see its render). The previous draft tried to swap between two
 * separate ShellContainer subtrees ("inline overview" vs. "full-page
 * wizard") which unmounted + re-mounted ShellContainer when the user
 * clicked Change Software — and re-mounting reset its internal
 * `currentStep` state, trapping the user on the overview.
 *
 * Legacy URLs (/startup, /shell) redirect to the corresponding section
 * anchor here; see routes.ts + LegacyRedirects.tsx for the wiring.
 */
const SettingsContainer = () => {
    const location = useLocation();

    // On mount, if the user arrived via a deep-link anchor (e.g.
    // /settings#startup from a legacy redirect or a toast action),
    // scroll the matching section into view. Tiny setTimeout so refs
    // are in the DOM before we call scrollIntoView.
    useEffect(() => {
        if (!location.hash) return;
        const t = setTimeout(() => {
            const id = location.hash.replace(/^#/, '');
            document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
        return () => clearTimeout(t);
    }, [location.hash]);

    return (
        <ServerContentBlock title='Settings'>
            <FlashMessageRender byKey='settings' />

            <MainPageHeader direction='column' title='Settings'>
                <p className='text-sm text-neutral-400 leading-relaxed'>
                    Everything that controls how this server runs and what software it runs — in one place.
                </p>
            </MainPageHeader>

            <div className='flex flex-col gap-5'>
                {/* Software hero card — top of page because "what am I
                    running" is the single most-asked question on Settings.
                    The Change Software flow opens as a modal layered over
                    the rest of the Settings page. */}
                <div id='software'>
                    <ShellContainer embedded />
                </div>

                {/* Identity */}
                <Can action='settings.rename'>
                    <RenameServerBox />
                </Can>

                {/* Connection — game address + SFTP + Launch button */}
                <Can action='file.sftp'>
                    <ServerConnectionCard />
                </Can>

                {/* Resources — memory / CPU / disk tiles */}
                <ServerResourcesCard />

                {/* Startup command + docker image + env vars */}
                <div id='startup'>
                    <StartupContainer embedded />
                </div>

                {/* Danger zone */}
                <Can action='settings.reinstall'>
                    <ReinstallServerBox />
                </Can>
            </div>
        </ServerContentBlock>
    );
};

export default SettingsContainer;
