import {
    Alert02Icon,
    CancelCircleIcon,
    CheckmarkCircle02Icon,
    InformationCircleIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useStoreState } from 'easy-peasy';
import { Fragment } from 'react';

import type { FlashMessageType } from '@/components/MessageBox';

import { cn } from '@/lib/utils';

type Props = Readonly<{
    byKey?: string;
}>;

const StatusContainer = ({ text, type }: { text: string; type?: FlashMessageType }) => {
    const getIcon = () => {
        switch (type) {
            case 'error':
                return <HugeiconsIcon className='size-5' icon={CancelCircleIcon} />;
            case 'warning':
                return <HugeiconsIcon className='size-5' icon={Alert02Icon} />;
            case 'success':
                return <HugeiconsIcon className='size-5' icon={CheckmarkCircle02Icon} />;
            case 'info':
                return <HugeiconsIcon className='size-5' icon={InformationCircleIcon} />;
            default:
                return null;
        }
    };

    return (
        <div
            className={cn(
                'flex flex-row items-center gap-2',
                type === 'error'
                    ? 'text-red-400'
                    : type === 'warning'
                      ? 'text-yellow-400'
                      : type === 'success'
                        ? 'text-green-400'
                        : type === 'info'
                          ? 'text-blue-400'
                          : '',
            )}
            role='alert'
        >
            {getIcon()}
            {text}
        </div>
    );
};
StatusContainer.displayName = 'StatusContainer';

const FlashStatusContainer = ({ byKey }: Props) => {
    const flashes = useStoreState((state) =>
        state.flashes.items.filter((flash) => (byKey ? flash.key === byKey : true)),
    );

    return flashes.length
        ? flashes.map((flash, index) => (
              <Fragment key={flash.id || flash.type + flash.message}>
                  {index > 0 && <></>}
                  <StatusContainer text={flash.message} type={flash.type} />
              </Fragment>
          ))
        : null;
};

export default FlashStatusContainer;
