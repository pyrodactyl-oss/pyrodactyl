import {
    Box,
    BranchesDown,
    ClockArrowRotateLeft,
    CloudArrowUpIn,
    Database,
    FolderOpen,
    Gear,
    House,
    PencilToLine,
    Persons,
    Power,
    Terminal,
} from '@gravity-ui/icons';
import { Command } from 'cmdk';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import Can from '@/components/elements/Can';

import i18n from '@/lib/i18n';

import { ServerContext } from '@/state/server';

import ModrinthLogo from '../ModrinthLogo';

const CommandMenu = () => {
    const [open, setOpen] = useState(false);
    const id = ServerContext.useStoreState((state) => state.server.data?.id);
    const navigate = useNavigate();
    // controls server power status
    const status = ServerContext.useStoreState((state) => state.status.value);
    const instance = ServerContext.useStoreState((state) => state.socket.instance);

    const cmdkPowerAction = (action: string) => {
        if (instance) {
            if (action === 'start') {
                toast.success(i18n.t('server:power.starting_toast'));
            } else if (action === 'restart') {
                toast.success(i18n.t('server:power.restarting_toast'));
            } else {
                toast.success(i18n.t('server:power.stopping_toast'));
            }
            setOpen(false);
            instance.send('set state', action === 'kill-confirmed' ? 'kill' : action);
        }
    };

    const cmdkNavigate = (url: string) => {
        navigate('/server/' + id + url);
        setOpen(false);
    };

    useEffect(() => {
        const down = (e) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    return (
        <Command.Dialog open={open} onOpenChange={setOpen} label={i18n.t('strings:global_command_menu')}>
            <Command.Input />
            <Command.List>
                <Command.Empty>{i18n.t('strings:no_results_found')}</Command.Empty>

                <Command.Group heading={i18n.t('strings:pages')}>
                    <Command.Item onSelect={() => cmdkNavigate('')}>
                        <House fill='currentColor' />
                        {i18n.t('strings:nav.home')}
                    </Command.Item>
                    <Can action={'file.*'} matchAny>
                        <Command.Item onSelect={() => cmdkNavigate('/files')}>
                            <FolderOpen fill='currentColor' />
                            {i18n.t('strings:nav.files')}
                        </Command.Item>
                    </Can>
                    <Can action={'database.*'} matchAny>
                        <Command.Item onSelect={() => cmdkNavigate('/databases')}>
                            <Database fill='currentColor' />
                            {i18n.t('strings:nav.databases')}
                        </Command.Item>
                    </Can>
                    <Can action={'backup.*'} matchAny>
                        <Command.Item onSelect={() => cmdkNavigate('/backups')}>
                            <CloudArrowUpIn fill='currentColor' />
                            {i18n.t('strings:nav.backups')}
                        </Command.Item>
                    </Can>
                    <Can action={'allocation.*'} matchAny>
                        <Command.Item onSelect={() => cmdkNavigate('/network')}>
                            <BranchesDown fill='currentColor' />
                            {i18n.t('strings:nav.networking')}
                        </Command.Item>
                    </Can>
                    <Can action={'user.*'} matchAny>
                        <Command.Item onSelect={() => cmdkNavigate('/users')}>
                            <Persons fill='currentColor' />
                            {i18n.t('strings:nav.users')}
                        </Command.Item>
                    </Can>
                    <Can action={['startup.*']} matchAny>
                        <Command.Item onSelect={() => cmdkNavigate('/startup')}>
                            <Terminal fill='currentColor' />
                            {i18n.t('strings:nav.startup')}
                        </Command.Item>
                    </Can>
                    <Can action={['schedule.*']} matchAny>
                        <Command.Item onSelect={() => cmdkNavigate('/schedules')}>
                            <ClockArrowRotateLeft fill='currentColor' />
                            {i18n.t('strings:nav.schedules')}
                        </Command.Item>
                    </Can>
                    <Can action={['settings.*', 'file.sftp']} matchAny>
                        <Command.Item onSelect={() => cmdkNavigate('/settings')}>
                            <Gear fill='currentColor' />
                            {i18n.t('strings:nav.settings')}
                        </Command.Item>
                    </Can>
                    <Can action={['activity.*']} matchAny>
                        <Command.Item onSelect={() => cmdkNavigate('/activity')}>
                            <PencilToLine fill='currentColor' />
                            {i18n.t('strings:nav.activity')}
                        </Command.Item>
                    </Can>
                    <Can action={['modrinth.*']} matchAny>
                        <Command.Item onSelect={() => cmdkNavigate('/mods')}>
                            <ModrinthLogo />
                            {i18n.t('server:modrinth.mods_plugins')}
                        </Command.Item>
                    </Can>
                    <Can action={['software.*']} matchAny>
                        <Command.Item onSelect={() => cmdkNavigate('/shell')}>
                            <Box fill='currentColor' />
                            {i18n.t('strings:nav.software')}
                        </Command.Item>
                    </Can>
                </Command.Group>
                <Command.Group heading={i18n.t('strings:server')}>
                    <Can action={'control.start'}>
                        <Command.Item disabled={status !== 'offline'} onSelect={() => cmdkPowerAction('start')}>
                            <Power fill='currentColor' />
                            {i18n.t('server:power.start')}
                        </Command.Item>
                    </Can>
                    <Can action={'control.restart'}>
                        <Command.Item disabled={!status} onSelect={() => cmdkPowerAction('restart')}>
                            <Power fill='currentColor' />
                            {i18n.t('server:power.restart')}
                        </Command.Item>
                    </Can>
                    <Can action={'control.restart'}>
                        <Command.Item disabled={status === 'offline'} onSelect={() => cmdkPowerAction('stop')}>
                            <Power fill='currentColor' />
                            {i18n.t('server:power.stop')}
                        </Command.Item>
                    </Can>
                </Command.Group>
            </Command.List>
        </Command.Dialog>
    );
};

export default CommandMenu;
