import { useEffect, useMemo } from 'react';
import HeaderCentered from '@/components/dashboard/header/HeaderCentered';
import { useHeader } from '@/contexts/HeaderContext';
import { ServerContext } from '@/state/server';
import PowerButtons from './PowerButtons';
import ServerDetailsHeader from './ServerDetailsHeader';
import { StatusPillHeader } from './StatusPillHeader';

interface headerProps {
    powerButtons?: boolean;
}

const ServerHeader = (props: headerProps) => {
    const name = ServerContext.useStoreState((state) => state.server.data?.name);
    const { setHeaderActions, clearHeaderActions } = useHeader();

    const buttonsSection = useMemo(
        () => (
            <PowerButtons className={`flex items-center justify-center gap-2 ${props.powerButtons ? '' : 'hidden'}`} />
        ),
        [props.powerButtons],
    );

    const statusSection = useMemo(
        () => (
            <HeaderCentered className='flex items-center gap-6'>
                <div className='flex items-center gap-3'>
                    <StatusPillHeader />
                    <span className='min-w-0 truncate xl:max-w-[20vw]'>{name}</span>
                </div>

                <div className='h-6 border-gray-200 border-l' />
                <ServerDetailsHeader />
            </HeaderCentered>
        ),
        [name],
    );

    useEffect(() => {
        setHeaderActions([statusSection, buttonsSection]);
        return () => clearHeaderActions();
    }, [setHeaderActions, clearHeaderActions, statusSection, buttonsSection]);

    return null;
};

export default ServerHeader;
