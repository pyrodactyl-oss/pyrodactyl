import { Navigate, useParams } from 'react-router-dom';

/**
 * Legacy URL redirectors used by `routes.ts`. The Startup and Software
 * pages were consolidated into a single Settings page; these components
 * keep external bookmarks and in-app links working by sending them to
 * the matching section anchor on /settings.
 *
 * Kept in a `.tsx` file (rather than inline in routes.ts) so the routes
 * config can remain a pure data module without picking up a JSX runtime.
 */
export const StartupRedirect = () => {
    const { id } = useParams<{ id: string }>();
    return <Navigate to={`/server/${id}/settings#startup`} replace />;
};

export const SoftwareRedirect = () => {
    const { id } = useParams<{ id: string }>();
    return <Navigate to={`/server/${id}/settings#software`} replace />;
};
