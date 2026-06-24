import { useContext } from 'react';

import { useDeepCompareEffect } from '@/plugins/useDeepCompareEffect';

import { DialogContext } from './';

export default ({ children }: { children: React.ReactNode }) => {
    const { setFooter } = useContext(DialogContext);

    useDeepCompareEffect(() => {
        setFooter(<div className={'flex items-center justify-end gap-4 rounded-b px-6 py-4 pb-6'}>{children}</div>);
    }, [children]);

    return null;
};
