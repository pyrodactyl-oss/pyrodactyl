import ScreenBlock from '@/components/elements/ScreenBlock';

import i18n from '@/lib/i18n';

import { ServerContext } from '@/state/server';

import Spinner from '../elements/Spinner';

const ConflictStateRenderer = () => {
    const status = ServerContext.useStoreState((state) => state.server.data?.status || null);
    const isTransferring = ServerContext.useStoreState((state) => state.server.data?.isTransferring || false);
    const isNodeUnderMaintenance = ServerContext.useStoreState(
        (state) => state.server.data?.isNodeUnderMaintenance || false,
    );

    return status === 'installing' || status === 'install_failed' || status === 'reinstall_failed' ? (
        <div className={'flex flex-col items-center justify-center h-full'}>
            <Spinner size={'large'} />
            <div className='flex flex-col mt-4 text-center'>
                <label className='text-neutral-100 text-lg font-bold'>{i18n.t('server:conflict.installing')}</label>
                <label className='text-neutral-500 text-md font-semibold mt-1'>
                    {i18n.t('server:conflict.installing_description')}
                </label>
            </div>
        </div>
    ) : status === 'suspended' ? (
        <ScreenBlock
            title={i18n.t('server:conflict.suspended')}
            message={i18n.t('server:conflict.suspended_message')}
        />
    ) : isNodeUnderMaintenance ? (
        <ScreenBlock
            title={i18n.t('server:conflict.maintenance')}
            message={i18n.t('server:conflict.maintenance_message')}
        />
    ) : (
        <ScreenBlock
            title={isTransferring ? i18n.t('server:conflict.transferring') : i18n.t('server:conflict.restoring')}
            message={
                isTransferring
                    ? i18n.t('server:conflict.transferring_message')
                    : i18n.t('server:conflict.restoring_message')
            }
        />
    );
};

export default ConflictStateRenderer;
