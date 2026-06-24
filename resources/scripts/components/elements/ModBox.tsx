import * as React from 'react';

// import { cn } from '@/lib/utils';

const ModBox = React.forwardRef<React.ElementRef<'div'>, React.ComponentPropsWithoutRef<'div'>>(({ ...props }, ref) => (
    <div className='mb-4 w-full select-none text-nowrap' ref={ref} {...props} />
));

ModBox.displayName = 'ModBox';

export { ModBox };
