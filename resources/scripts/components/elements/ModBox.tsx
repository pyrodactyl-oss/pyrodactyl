import type * as React from 'react';

// import { cn } from '@/lib/utils';

const ModBox = ({
    ref,
    ...props
}: React.ComponentPropsWithoutRef<'div'> & { ref?: React.RefObject<React.ElementRef<'div'> | null> }) => (
    <div className='mb-4 w-full select-none text-nowrap' ref={ref} {...props} />
);

ModBox.displayName = 'ModBox';

export { ModBox };
