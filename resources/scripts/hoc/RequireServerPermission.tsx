import Can from '@/components/elements/Can';
import { ServerError } from '@/components/elements/ScreenBlock';

export interface RequireServerPermissionProps {
    children?: React.ReactNode;
    permissions: string | string[];
}

const RequireServerPermission: React.FC<RequireServerPermissionProps> = ({ children, permissions }) => (
    <Can
        action={permissions}
        renderOnError={
            <ServerError message={'You do not have permission to access this page.'} title={'Access Denied'} />
        }
    >
        {children}
    </Can>
);

export default RequireServerPermission;
