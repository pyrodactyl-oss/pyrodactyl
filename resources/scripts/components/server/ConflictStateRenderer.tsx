import ScreenBlock from '@/components/elements/ScreenBlock';

import { ServerContext } from '@/state/server';

import Spinner from '../elements/Spinner';

const ConflictStateRenderer = () => {
    const status = ServerContext.useStoreState((state) => state.server.data?.status || null);
    const isTransferring = ServerContext.useStoreState((state) => state.server.data?.isTransferring);
    const isNodeUnderMaintenance = ServerContext.useStoreState((state) => state.server.data?.isNodeUnderMaintenance);

    return status === 'installing' || status === 'install_failed' || status === 'reinstall_failed' ? (
        <div className={'flex h-full flex-col items-center justify-center'}>
            <Spinner size={'large'} />
            <div className='mt-4 flex flex-col text-center'>
                <label className='font-bold text-lg text-neutral-100'>Server is Installing</label>
                <label className='mt-1 font-semibold text-md text-neutral-500'>
                    Your server should be ready soon, for more details visit the home page.
                </label>
            </div>
        </div>
    ) : status === 'suspended' ? (
        <ScreenBlock message={'This server is suspended and cannot be accessed.'} title={'Server Suspended'} />
    ) : isNodeUnderMaintenance ? (
        <ScreenBlock
            message={'The node of this server is currently under maintenance.'}
            title={'Node under Maintenance'}
        />
    ) : (
        <ScreenBlock
            message={
                isTransferring
                    ? 'Your server is being transferred to a new node, please check back later.'
                    : 'Your server is currently being restored from a backup, please check back in a few minutes.'
            }
            title={isTransferring ? 'Transferring' : 'Restoring from Backup'}
        />
    );
};

export default ConflictStateRenderer;
