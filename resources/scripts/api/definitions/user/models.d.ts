import { Model, UUID } from '@/api/definitions';

import { SubuserPermission } from '@/state/server/subusers';

interface User extends Model {
    can(permission: SubuserPermission): boolean;
    createdAt: Date;
    email: string;
    image: string;
    permissions: SubuserPermission[];
    twoFactorEnabled: boolean;
    username: string;
    uuid: string;
}

interface SSHKey extends Model {
    createdAt: Date;
    fingerprint: string;
    name: string;
    publicKey: string;
}

interface ActivityLog extends Model<'actor'> {
    batch: UUID | null;
    description: string | null;
    event: string;
    hasAdditionalMetadata: boolean;
    id: string;
    ip: string | null;
    isApi: boolean;
    properties: Record<string, string | unknown>;
    relationships: {
        actor: User | null;
    };
    timestamp: Date;
}
