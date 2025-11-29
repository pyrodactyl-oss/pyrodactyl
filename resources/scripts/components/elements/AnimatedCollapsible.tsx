import React, { useEffect, useRef, useState } from 'react';

type Props = {
    open: boolean;
    children: React.ReactNode;
    durationMs?: number; // default 260ms
    className?: string;
};

export default function AnimatedCollapsible({ open, children, durationMs = 260, className }: Props) {
    const ref = useRef<HTMLDivElement>(null);
    const [maxHeight, setMaxHeight] = useState<string>(open ? 'none' : '0px');
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const run = async () => {
            setIsAnimating(true);

            if (open) {
                // from current (0px) to scrollHeight then to none
                el.style.maxHeight = `${el.scrollHeight}px`;
                // wait for transition to finish
                await new Promise((r) => setTimeout(r, durationMs));
                el.style.maxHeight = 'none';
            } else {
                // set fixed height before collapsing so transition can occur
                const current = el.scrollHeight;
                el.style.maxHeight = `${current}px`;
                // force reflow
                void el.offsetHeight;
                el.style.maxHeight = '0px';
                await new Promise((r) => setTimeout(r, durationMs));
            }

            setIsAnimating(false);
        };

        // When opening from 'none', set to 0 first to allow animation
        if (open && maxHeight === 'none') {
            // reset to 0 to trigger open animation
            setMaxHeight('0px');
            // next frame, run
            requestAnimationFrame(run);
        } else {
            run();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, durationMs]);

    // Keep inline style in sync with state so SSR/hydration is safe
    const style: React.CSSProperties = {
        maxHeight,
        overflow: 'hidden',
        transition: `max-height ${durationMs}ms ease`,
    };

    // Optional: fade/slide children during animation via a CSS class
    return (
        <div style={style} ref={ref} className={className}>
            {children}
        </div>
    );
}
