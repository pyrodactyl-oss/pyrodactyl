import type { JSX, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { ServerError } from '@/components/elements/ScreenBlock';

import { usePermissions } from '@/plugins/usePermissions';

interface Props {
    children?: ReactNode;
    permission?: string | string[];
}

function PermissionRoute({ children, permission }: Props): JSX.Element {
    const { t } = useTranslation('strings');
    const can = usePermissions(permission || []);

    if (permission === undefined || permission === null) {
        return <>{children}</>;
    }

    if (can.filter((p) => p).length > 0) {
        return <>{children}</>;
    }

    return <ServerError title={t('errors.access_denied')} message={t('errors.access_denied_description')} />;
}

export default PermissionRoute;
