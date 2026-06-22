import i18n from '@/lib/i18n';
import Can from '@/components/elements/Can';
import { ServerError } from '@/components/elements/ScreenBlock';

export interface RequireServerPermissionProps {
    permissions: string | string[];
    children?: React.ReactNode;
}

const RequireServerPermission: React.FC<RequireServerPermissionProps> = ({ children, permissions }) => {
    return (
        <Can
            action={permissions}
            renderOnError={
                <ServerError
                    title={i18n.t('strings:errors.access_denied')}
                    message={i18n.t('strings:errors.access_denied_description')}
                />
            }
        >
            {children}
        </Can>
    );
};

export default RequireServerPermission;
