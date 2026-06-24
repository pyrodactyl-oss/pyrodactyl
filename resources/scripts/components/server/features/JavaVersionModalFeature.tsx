import { ChevronDown, ChevronUp } from '@gravity-ui/icons';
import { useEffect, useState } from 'react';
import setSelectedDockerImage from '@/api/server/setSelectedDockerImage';
import getServerStartup from '@/api/swr/getServerStartup';
import ActionButton from '@/components/elements/ActionButton';
// import { Options } from '@/components/elements/button/types';
import Can from '@/components/elements/Can';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@/components/elements/DropdownMenu';
import Modal from '@/components/elements/Modal';
import Spinner from '@/components/elements/Spinner';
import { SocketEvent, SocketRequest } from '@/components/server/events';
import useFlash from '@/plugins/useFlash';
import useWebsocketEvent from '@/plugins/useWebsocketEvent';
import { ServerContext } from '@/state/server';

// FIXME: use regex
const MATCH_ERRORS = [
    'minecraft 1.17 requires running the server with java 16 or above',
    'minecraft 1.18 requires running the server with java 17 or above',
    'minecraft 1.19 requires running the server with java 17 or above',
    'java.lang.unsupportedclassversionerror',
    'unsupported major.minor version',
    'has been compiled by a more recent version of the java runtime',
];

const JavaVersionModalFeature = () => {
    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [dropDownOpen, setDropDownOpen] = useState(false);
    const [selectedVersion, setSelectedVersion] = useState('');

    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const status = ServerContext.useStoreState((state) => state.status.value);
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const { instance } = ServerContext.useStoreState((state) => state.socket);

    const { data, isValidating, mutate } = getServerStartup(uuid, undefined, {
        revalidateOnMount: false,
    });

    useEffect(() => {
        if (!visible) return;

        mutate().then((value) => {
            setSelectedVersion(Object.values(value?.dockerImages || [])[0] || '');
        });
    }, [visible, mutate]);

    useWebsocketEvent(SocketEvent.CONSOLE_OUTPUT, (data) => {
        if (status === 'running') return;

        if (MATCH_ERRORS.some((p) => data.toLowerCase().includes(p.toLowerCase()))) {
            setVisible(true);
        }
    });

    const updateJava = () => {
        setLoading(true);
        clearFlashes('feature:javaVersion');

        setSelectedDockerImage(uuid, selectedVersion)
            .then(() => {
                if (status === 'offline' && instance) {
                    instance.send(SocketRequest.SET_STATE, 'restart');
                }
                setVisible(false);
            })
            .catch((error) => clearAndAddHttpError({ key: 'feature:javaVersion', error }))
            .then(() => setLoading(false));
    };

    useEffect(() => {
        clearFlashes('feature:javaVersion');
    }, [clearFlashes]);

    return (
        <Modal
            closeOnBackground={false}
            onDismissed={() => setVisible(false)}
            showSpinnerOverlay={loading}
            title='Unsupported Java Version'
            visible={visible}
        >
            <div className='flex h-full w-full flex-col gap-4'>
                {/*<FlashMessageRender key={'feature:javaVersion'} />*/}
                <p>
                    This server is currently running an unsupported version of Java and cannot be started. Please select
                    a supported version from the list below to continue starting the server.
                </p>
                <div className={'my-4 mt-6 flex flex-row items-center justify-end gap-3'}>
                    <Can action={'startup.docker-image'}>
                        <Spinner size='small' visible={!data || isValidating} />
                        <DropdownMenu onOpenChange={(open) => setDropDownOpen(open)}>
                            <DropdownMenuTrigger asChild>
                                <button
                                    className='flex h-8 cursor-pointer items-center justify-center rounded-xl border border-[#ffffff15] bg-linear-to-b from-[#ffffff10] to-[#ffffff09] px-4 font-medium text-sm text-white shadow-xs transition-colors duration-150 hover:from-[#ffffff05] hover:to-[#ffffff04]'
                                    disabled={!data}
                                >
                                    {selectedVersion
                                        .split(':')
                                        .pop()
                                        ?.split('_')
                                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                                        .join(' ') || 'Select a version'}
                                    {dropDownOpen ? (
                                        <ChevronUp className={'ml-2 h-[16px] w-[16px]'} fill={'currentColor'} />
                                    ) : (
                                        <ChevronDown className={'ml-2 h-[16px] w-[16px]'} fill={'currentColor'} />
                                    )}
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className='z-99999' sideOffset={8}>
                                <DropdownMenuRadioGroup onValueChange={setSelectedVersion} value={selectedVersion}>
                                    {data &&
                                        Object.keys(data.dockerImages).map((key) => (
                                            <DropdownMenuRadioItem key={key} value={data.dockerImages[key] || ''}>
                                                {key}
                                            </DropdownMenuRadioItem>
                                        ))}
                                </DropdownMenuRadioGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </Can>
                    {/* <Button variant={Options.Variant.Secondary} onClick={() => setVisible(false)}>
                        Cancel
                    </Button> */}
                    <Can action={'startup.docker-image'}>
                        <ActionButton className={'w-full sm:w-auto'} onClick={updateJava} variant='primary'>
                            Update
                        </ActionButton>
                    </Can>
                </div>
            </div>
        </Modal>
    );
};

export default JavaVersionModalFeature;
