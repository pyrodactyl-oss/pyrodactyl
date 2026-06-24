import { Link } from 'react-router-dom';

import { cn } from '@/lib/utils';

const SecondaryLink = ({
    children,
    className,
    to,
    ...props
}: {
    children: React.ReactNode;
    className?: string;
    to: string;
}) => (
    <Link
        {...props}
        className={cn(className, 'text-secondary text-sm tracking-wide underline transition-colors hover:text-primary')}
        to={to}
    >
        {children}
    </Link>
);
SecondaryLink.displayName = 'SecondaryLink';

export default SecondaryLink;
