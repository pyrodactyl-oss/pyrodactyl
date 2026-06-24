import { For } from 'million/react';
import { useEffect, useState } from 'react';
import isEqual from 'react-fast-compare';
import createServerAllocation from '@/api/server/network/createServerAllocation';
import getServerAllocations from '@/api/swr/getServerAllocations';
import ActionButton from '@/components/elements/ActionButton';
import Can from '@/components/elements/Can';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import { PageListContainer } from '@/components/elements/pages/PageList';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import FlashMessageRender from '@/components/FlashMessageRender';
import AllocationRow from '@/components/server/network/AllocationRow';
import SubdomainManagement from '@/components/server/network/SubdomainManagement';
import { useDeepCompareEffect } from '@/plugins/useDeepCompareEffect';
import { useFlashKey } from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';

const NetworkContainer = () => {
    const [_, setLoading] = useState(false);
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const allocationLimit = ServerContext.useStoreState((state) => state.server.data?.featureLimits.allocations);
    const allocations = ServerContext.useStoreState((state) => state.server.data?.allocations, isEqual);
    const setServerFromState = ServerContext.useStoreActions((actions) => actions.server.setServerFromState);

    const { clearFlashes, clearAndAddHttpError } = useFlashKey('server:network');
    const { data, error, mutate } = getServerAllocations();

    useEffect(() => {
        mutate(allocations);
    }, [allocations, mutate]);

    useEffect(() => {
        clearAndAddHttpError(error);
    }, [error, clearAndAddHttpError]);

    useDeepCompareEffect(() => {
        if (!data) return;

        setServerFromState((state) => ({ ...state, allocations: data }));
    }, [data]);

    const onCreateAllocation = () => {
        clearFlashes();

        setLoading(true);
        createServerAllocation(uuid)
            .then((allocation) => {
                setServerFromState((s) => ({
                    ...s,
                    allocations: s.allocations.concat(allocation),
                }));
                return mutate(data?.concat(allocation), false);
            })
            .catch((error) => clearAndAddHttpError(error))
            .then(() => setLoading(false));
    };

    return (
        <ServerContentBlock title={'Network'}>
            <FlashMessageRender byKey={'server:network'} />

            <MainPageHeader direction='column' title={'Networking'}>
                <p className='text-neutral-400 text-sm leading-relaxed'>
                    Configure network settings for your server. Manage subdomains, IP addresses and ports that your
                    server can bind to for incoming connections.
                </p>
            </MainPageHeader>

            <div className='space-y-12'>
                <SubdomainManagement />

                <div className='mt-8 rounded-xl border-[#ffffff12] border-[1px] bg-gradient-to-b from-[#ffffff08] to-[#ffffff05] p-6 shadow-sm'>
                    <div className='mb-6 flex items-center justify-between'>
                        <h3 className='font-extrabold text-xl tracking-tight'>Port Allocations</h3>
                        {data && (
                            <Can action={'allocation.create'}>
                                <div className='flex items-center gap-4'>
                                    {allocationLimit === null && (
                                        <span className='rounded-lg border border-[#ffffff15] bg-[#ffffff08] px-3 py-1 text-sm text-zinc-400'>
                                            {data.length} allocations (unlimited)
                                        </span>
                                    )}
                                    {allocationLimit > 0 && (
                                        <span className='rounded-lg border border-[#ffffff15] bg-[#ffffff08] px-3 py-1 text-sm text-zinc-400'>
                                            {data.length} of {allocationLimit}
                                        </span>
                                    )}
                                    {allocationLimit === 0 && (
                                        <span className='rounded-lg border border-[#ffffff15] bg-[#ffffff08] px-3 py-1 text-red-400 text-sm'>
                                            Allocations disabled
                                        </span>
                                    )}
                                    {(allocationLimit === null ||
                                        (allocationLimit > 0 && allocationLimit > data.length)) && (
                                        <ActionButton onClick={onCreateAllocation} size='sm' variant='primary'>
                                            New Allocation
                                        </ActionButton>
                                    )}
                                </div>
                            </Can>
                        )}
                    </div>

                    {data ? (
                        data.length > 0 ? (
                            <PageListContainer data-pyro-network-container-allocations>
                                <For each={data} memo>
                                    {(allocation) => (
                                        <AllocationRow
                                            allocation={allocation}
                                            key={`${allocation.ip}:${allocation.port}`}
                                        />
                                    )}
                                </For>
                            </PageListContainer>
                        ) : (
                            <div className='flex flex-col items-center justify-center py-12'>
                                <div className='text-center'>
                                    <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#ffffff11]'>
                                        <svg className='h-6 w-6 text-zinc-400' fill='currentColor' viewBox='0 0 20 20'>
                                            <path
                                                clipRule='evenodd'
                                                d='M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                                                fillRule='evenodd'
                                            />
                                        </svg>
                                    </div>
                                    <h4 className='mb-2 font-medium text-lg text-zinc-200'>
                                        {allocationLimit === 0 ? 'Allocations unavailable' : 'No allocations found'}
                                    </h4>
                                    <p className='max-w-sm text-center text-sm text-zinc-400'>
                                        {allocationLimit === 0
                                            ? 'Network allocations cannot be created for this server.'
                                            : 'Create your first allocation to get started.'}
                                    </p>
                                </div>
                            </div>
                        )
                    ) : (
                        <div className='flex items-center justify-center py-12'>
                            <div className='flex flex-col items-center gap-3'>
                                <div className='h-6 w-6 animate-spin rounded-full border-brand border-b-2' />
                                <p className='text-neutral-400 text-sm'>Loading allocations...</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </ServerContentBlock>
    );
};

export default NetworkContainer;
