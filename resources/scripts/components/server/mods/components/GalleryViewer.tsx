import { Calendar, ChevronLeft, ChevronRight, Xmark } from '@gravity-ui/icons';
import { useCallback, useEffect, useState } from 'react';

import { ModGalleryItem } from '@/api/server/mods/types';

import Markdown from './Markdown';

interface Props {
    /** Gallery items from `project.gallery`. */
    items: ModGalleryItem[];
}

/** Format an ISO timestamp as "February 7, 2023" for the per-card caption. */
const formatGalleryDate = (iso: string): string => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
};

/**
 * Project gallery viewer.
 *
 * Two visual modes, matching how the Modrinth web app displays them:
 *
 *   1. **Inline strip** — a horizontal, scrollable row of thumbnails
 *      with the featured image first. Renders at the top of the
 *      Description tab so it's the first thing the user sees on a
 *      project that has screenshots.
 *
 *   2. **Lightbox** — clicking a thumbnail opens a full-screen overlay
 *      with the image at max size, prev/next arrows, escape-to-close,
 *      and an optional caption pulled from the item's title +
 *      description. Keyboard arrows step through the gallery.
 *
 * Items with `featured: true` float to the front of the strip — this
 * mirrors Modrinth's "primary image" convention so users land on the
 * canonical screenshot first when scrolling.
 *
 * The viewer is a no-op (renders null) when the project has no gallery
 * items, so the caller can always include it unconditionally without
 * wrapping in its own truthy check.
 */
const GalleryViewer = ({ items }: Props) => {
    // Reorder so featured items come first, but otherwise preserve the
    // author's intended ordering. We compute this every render — there's
    // no point memoising for a list this small.
    const ordered = [...items].sort((a, b) => Number(!!b.featured) - Number(!!a.featured));

    /** Index of the currently-open lightbox image, or null when closed. */
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const close = useCallback(() => setOpenIndex(null), []);
    const prev = useCallback(
        () => setOpenIndex((i) => (i === null ? null : (i - 1 + ordered.length) % ordered.length)),
        [ordered.length],
    );
    const next = useCallback(
        () => setOpenIndex((i) => (i === null ? null : (i + 1) % ordered.length)),
        [ordered.length],
    );

    // Keyboard nav: Esc closes; ← / → steps. Only attached while the
    // lightbox is open so we don't intercept arrow keys when the user is
    // navigating the rest of the page.
    useEffect(() => {
        if (openIndex === null) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') close();
            else if (e.key === 'ArrowLeft') prev();
            else if (e.key === 'ArrowRight') next();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [openIndex, close, prev, next]);

    if (ordered.length === 0) return null;
    const open = openIndex !== null ? ordered[openIndex] : null;

    return (
        <>
            {/* Responsive thumbnail grid — 1 col on phones, 2 on md, 3 on
                lg+. Each card renders the image at a fixed aspect ratio
                with the upload date beneath, matching modrinth.com's
                project Gallery tab. Clicking opens the lightbox. */}
            <div
                role='list'
                aria-label='Project gallery'
                className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'
            >
                {ordered.map((item, idx) => (
                    <button
                        key={item.url}
                        type='button'
                        role='listitem'
                        onClick={() => setOpenIndex(idx)}
                        className='group flex flex-col overflow-hidden rounded-xl border border-[#ffffff10] bg-[#ffffff05] text-left transition hover:border-brand/60'
                        aria-label={item.title || `Gallery image ${idx + 1}`}
                    >
                        {/* Image area — fixed aspect so a portrait/
                            landscape mix doesn't make the grid look
                            ragged. object-cover crops to fill. */}
                        <div className='aspect-video w-full overflow-hidden bg-black'>
                            <img
                                src={item.url}
                                alt={item.title ?? ''}
                                loading='lazy'
                                className='h-full w-full object-cover transition group-hover:scale-[1.02]'
                            />
                        </div>
                        {/* Caption strip below the image — title (if
                            any) on its own line, then the calendar +
                            upload date. Matches Modrinth's per-card
                            caption styling. */}
                        <div className='flex flex-col gap-1 px-3 py-2'>
                            {item.title && (
                                <span className='truncate text-sm font-semibold text-zinc-100'>
                                    {item.title}
                                </span>
                            )}
                            {item.created && (
                                <span className='inline-flex items-center gap-1.5 text-xs text-zinc-400'>
                                    <Calendar width={12} height={12} />
                                    {formatGalleryDate(item.created)}
                                </span>
                            )}
                        </div>
                    </button>
                ))}
            </div>

            {/* Lightbox overlay. Fixed-position full-screen, clicking the
                backdrop (but not the image itself) closes. We attach
                onClick to the backdrop and stopPropagation on the
                content so backdrop dismiss works intuitively. */}
            {open && (
                <div
                    role='dialog'
                    aria-modal='true'
                    aria-label={open.title || 'Gallery image'}
                    className='fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur'
                    onClick={close}
                >
                    <button
                        type='button'
                        onClick={(e) => {
                            e.stopPropagation();
                            close();
                        }}
                        aria-label='Close gallery'
                        className='absolute top-4 right-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-zinc-200 transition hover:bg-black/80 hover:text-white'
                    >
                        <Xmark width={18} height={18} />
                    </button>

                    {ordered.length > 1 && (
                        <button
                            type='button'
                            onClick={(e) => {
                                e.stopPropagation();
                                prev();
                            }}
                            aria-label='Previous image'
                            className='absolute left-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-zinc-200 transition hover:bg-black/80 hover:text-white'
                        >
                            <ChevronLeft width={20} height={20} />
                        </button>
                    )}
                    {ordered.length > 1 && (
                        <button
                            type='button'
                            onClick={(e) => {
                                e.stopPropagation();
                                next();
                            }}
                            aria-label='Next image'
                            className='absolute right-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-zinc-200 transition hover:bg-black/80 hover:text-white'
                        >
                            <ChevronRight width={20} height={20} />
                        </button>
                    )}

                    <div
                        className='flex max-h-[90vh] max-w-[90vw] flex-col items-center gap-3'
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Lightbox image uses rawUrl (the full-quality
                            original from the CDN) so users can actually
                            see the screenshot detail. The thumbnail
                            grid above stays on the cheap CDN-resized
                            `url` so the page itself loads fast. Falls
                            back to url if the provider didn't expose a
                            separate raw asset. */}
                        <img
                            src={open.rawUrl ?? open.url}
                            alt={open.title ?? ''}
                            loading='eager'
                            className='max-h-[78vh] max-w-full rounded-lg border border-[#ffffff15] object-contain'
                        />
                        {(open.title || open.description) && (
                            <div className='w-full max-w-2xl rounded-lg border border-[#ffffff15] bg-[#0d0d10]/80 px-4 py-3 backdrop-blur'>
                                {open.title && (
                                    <h3 className='text-sm font-semibold text-zinc-100'>{open.title}</h3>
                                )}
                                {open.description && (
                                    <div className='mt-1 text-xs text-zinc-300'>
                                        {/* Markdown for parity with how
                                            Modrinth displays caption text,
                                            which often has links + line
                                            breaks. */}
                                        <Markdown>{open.description}</Markdown>
                                    </div>
                                )}
                                <p className='mt-2 text-[10px] uppercase tracking-wide text-zinc-500'>
                                    Image {openIndex !== null ? openIndex + 1 : ''} of {ordered.length}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default GalleryViewer;
