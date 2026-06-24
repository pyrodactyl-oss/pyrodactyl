'use client';

import Flags from './flags/index';

const Flag = (props: { code: keyof typeof Flags | string; width?: number; alt?: string; height?: number }) => (
    <img
        alt={props.alt || `${props.code} flag`}
        className='mr-2 inline-block'
        height={props.height || 20}
        src={Flags[props.code.toUpperCase() as keyof typeof Flags]}
        width={props.width || 20}
    />
);

export default Flag;
