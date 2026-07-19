import { formatBytes } from '@/lib/formatters';

import { useStoreState } from '@/state/hooks';

export default () => {
    const sizeDisplay = useStoreState((state) => state.user.data?.sizeDisplay ?? 'mib');

    return (bytes: number, decimals?: number) => formatBytes(bytes, sizeDisplay === 'mib', decimals);
};
