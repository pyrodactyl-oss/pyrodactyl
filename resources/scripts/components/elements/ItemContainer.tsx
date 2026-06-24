import React, { useMemo } from 'react';
import { v4 } from 'uuid';

import CopyOnClick from './CopyOnClick';

export interface ContainerProps {
    children?: React.ReactNode;
    copyDescription?: boolean;
    description: string;
    descriptionClasses?: string;
    divClasses?: string;
    icon?: React.ComponentType<{ className?: string; fill?: string }>;
    labelClasses?: string;
    title: string;
    titleClasses?: string;
}

const ItemContainer = ({
    title,
    description,
    children,
    icon,
    labelClasses,
    titleClasses,
    descriptionClasses,
    divClasses,
    copyDescription,
}: ContainerProps) => {
    const uuid = useMemo(() => v4(), []);

    return (
        <div
            className={`flex items-center justify-between gap-2 rounded-lg border-[#ffffff0e] border-[1px] bg-[#3333332a] p-4 ${divClasses}`}
        >
            {icon && (
                <div className={'hidden h-10 w-10 items-center justify-center sm:flex'}>
                    {React.createElement(icon, {
                        className: 'w-6 h-6',
                        fill: 'currentColor',
                    })}
                </div>
            )}
            <div className={'flex flex-1 flex-col'}>
                <label className={`font-bold text-md text-neutral-300 ${titleClasses} ${labelClasses}`} htmlFor={uuid}>
                    {title}
                </label>

                {/* i don't like how this duplicates the element, but idk how to get it working otherwise */}
                {copyDescription ? (
                    <CopyOnClick text={description}>
                        <label
                            className={`font-semibold text-neutral-500 text-sm ${descriptionClasses} ${labelClasses}`}
                            htmlFor={uuid}
                        >
                            {description}
                        </label>
                    </CopyOnClick>
                ) : (
                    <label
                        className={`font-semibold text-neutral-500 text-sm ${descriptionClasses} ${labelClasses}`}
                        htmlFor={uuid}
                    >
                        {description}
                    </label>
                )}
            </div>
            {children}
        </div>
    );
};
ItemContainer.displayName = 'ItemContainer';

export default ItemContainer;
