import {
    ArrowDownToLine,
    ArrowUpRightFromSquare,
    Check,
    ClockArrowRotateLeft,
    HeartFill,
    House,
    Plus,
} from '@gravity-ui/icons';
import clsx from 'clsx';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';

import { ModSummary } from '@/api/server/mods/types';

interface Props {
    mod: ModSummary;
    /** Whether this mod is already in the server's mods/ directory. */
    installed: boolean;
    detailPath: string;
    onInstall: () => void;
    busy?: boolean;
    actionsDisabled?: boolean;
    disabledReason?: string;
    /**
     * Tags the parent has already filtered by (loader pick + selected
     * categories, lower-cased). Card hides these from the visible
     * pill row — showing them on every card would be redundant — and
     * tucks them into the +N overflow popover instead.
     */
    hiddenTags?: Set<string>;
}

const formatCount = (n: number): string => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toString();
};

/**
 * Map common Modrinth category/loader slugs to brand-coloured chip
 * styling, mirroring modrinth.com's tag palette so users get the same
 * visual cues they're used to. Anything not in this list falls through
 * to a neutral grey chip.
 */
const TAG_COLORS: Record<string, string> = {
    fabric: 'text-[#dbb69b] border-[#dbb69b]/30 bg-[#dbb69b]/10',
    neoforge: 'text-[#f78c44] border-[#f78c44]/30 bg-[#f78c44]/10',
    forge: 'text-[#8a92d3] border-[#8a92d3]/30 bg-[#8a92d3]/10',
    quilt: 'text-[#c483d9] border-[#c483d9]/30 bg-[#c483d9]/10',
    paper: 'text-[#f7c844] border-[#f7c844]/30 bg-[#f7c844]/10',
    spigot: 'text-[#f7c844] border-[#f7c844]/30 bg-[#f7c844]/10',
    bukkit: 'text-[#f7c844] border-[#f7c844]/30 bg-[#f7c844]/10',
};

const CHIP_BASE_CLASS =
    'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide whitespace-nowrap';

const ChipPill = ({ tag, className = '' }: { tag: string; className?: string }) => {
    const colorClass = TAG_COLORS[tag.toLowerCase()];
    return (
        <span
            className={`${CHIP_BASE_CLASS} ${colorClass ?? 'border-[#ffffff14] bg-[#ffffff0a] text-zinc-300'} ${className}`}
        >
            {tag}
        </span>
    );
};

const formatRelative = (iso?: string): string => {
    if (!iso) return '—';
    const ms = Date.now() - new Date(iso).getTime();
    if (Number.isNaN(ms)) return iso;
    const min = Math.floor(ms / 60_000);
    if (min < 1) return 'just now';
    if (min < 60) return `${min} minute${min === 1 ? '' : 's'} ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr} hour${hr === 1 ? '' : 's'} ago`;
    const days = Math.floor(hr / 24);
    if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
    if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) === 1 ? '' : 's'} ago`;
    if (days < 365) return `${Math.floor(days / 30)} month${Math.floor(days / 30) === 1 ? '' : 's'} ago`;
    const yrs = Math.floor(days / 365);
    return `${yrs} year${yrs === 1 ? '' : 's'} ago`;
};

/**
 * Chip row with overflow auto-collapse into a +N popover.
 *
 * Two-pass strategy: render the full tag list invisibly (`opacity-0`)
 * so the browser performs natural flex-wrap, then measure `offsetTop`
 * on each child to find the row break. The visible render slices off
 * everything that didn't fit on row 1 and adds a +N pill that opens
 * a popover showing every hidden tag (active filters + overflow) as
 * its real coloured chip.
 *
 * A ResizeObserver re-runs the measurement when the container width
 * changes so the count stays accurate at every viewport.
 */
const ChipRow = ({ tags, hiddenTags, className }: { tags: string[]; hiddenTags?: Set<string>; className?: string }) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const measureRef = useRef<HTMLDivElement | null>(null);
    const [visibleCount, setVisibleCount] = useState<number>(tags.length);
    const [popoverOpen, setPopoverOpen] = useState(false);

    const { displayable, alwaysHidden } = useMemo(() => {
        const ah: string[] = [];
        const disp: string[] = [];
        for (const t of tags) {
            if (hiddenTags && hiddenTags.has(t.toLowerCase())) ah.push(t);
            else disp.push(t);
        }
        return { displayable: disp, alwaysHidden: ah };
    }, [tags, hiddenTags]);

    useLayoutEffect(() => {
        const measure = () => {
            const measureEl = measureRef.current;
            if (!measureEl) return;
            const children = Array.from(measureEl.children) as HTMLElement[];
            if (children.length === 0) {
                setVisibleCount(0);
                return;
            }
            const firstTop = children[0]!.offsetTop;
            const firstSecondRow = children.findIndex((c) => c.offsetTop > firstTop);
            if (firstSecondRow === -1) {
                setVisibleCount(children.length);
                return;
            }
            // One fewer than the natural fit, so the +N pill itself
            // has space on row 1 without pushing another chip down.
            setVisibleCount(Math.max(0, firstSecondRow - 1));
        };

        measure();
        const ro = new ResizeObserver(measure);
        if (containerRef.current) ro.observe(containerRef.current);
        return () => ro.disconnect();
    }, [displayable]);

    if (tags.length === 0) return null;

    const visible = displayable.slice(0, visibleCount);
    const overflow = displayable.slice(visibleCount);
    const popoverTags = [...alwaysHidden, ...overflow];

    return (
        <div ref={containerRef} className={`relative w-full ${className ?? ''}`}>
            <div
                ref={measureRef}
                aria-hidden
                className='pointer-events-none absolute inset-0 flex flex-wrap gap-1.5 opacity-0'
            >
                {displayable.map((tag) => (
                    <span key={`m-${tag}`} className={CHIP_BASE_CLASS}>
                        {tag}
                    </span>
                ))}
            </div>

            {/* All chips + the +N pill flow left-to-right with no
                spacer between them. Earlier draft put the +N inside
                a `shrink-0` sibling of a `flex-1` chip-clipper —
                which pushed +N to the far right of the chip row
                even though it logically belongs right after the
                last visible chip. Removing the flex-1 lets the chip
                strip take its natural width and +N sits flush against
                the trailing visible chip. The whole row uses
                `overflow-hidden min-w-0` so chips that don't fit
                (e.g. when measurement is slightly off) clip
                gracefully at the row edge rather than spilling out
                of the card. */}
            <div className='flex flex-nowrap items-center gap-1.5 min-w-0 overflow-hidden'>
                {visible.map((tag) => (
                    <ChipPill key={tag} tag={tag} />
                ))}
                {popoverTags.length > 0 && (
                    <PlusNPill tags={popoverTags} open={popoverOpen} setOpen={setPopoverOpen} />
                )}
            </div>
        </div>
    );
};

/**
 * +N overflow pill — renders inline next to the visible chips, opens
 * a popover on hover showing every hidden tag as its real coloured
 * pill. The popover is rendered into a Portal at document.body so the
 * chip row above can use `overflow-hidden` (to clip overflow chips)
 * without also clipping the popover. Position is updated on every
 * open + on window resize/scroll so the popover always stays anchored
 * beneath the trigger.
 *
 * Two subtleties make hover-to-reveal here trickier than a typical
 * tooltip:
 *
 *   1. The popover is portaled to document.body, so it isn't a child
 *      of the trigger wrapper. The 6px gap between trigger and popover
 *      sits inside the wrapper's bounding box for the trigger but
 *      OUTSIDE the popover. A naive `onMouseLeave` on the wrapper would
 *      fire the moment the cursor enters that gap, closing the popover
 *      before the cursor reaches it. We solve that by tracking the
 *      hovered state of trigger and popover separately and only
 *      closing when neither is hovered.
 *
 *   2. Even with that fix, the cursor traversing the 6px gap visits
 *      neither element for one frame. To survive that, we schedule the
 *      close on a short timer that gets cancelled the instant the
 *      cursor lands on the popover. An earlier draft also set
 *      `pointer-events-none` on the popover for tooltip-style
 *      "ignore the cursor" semantics — but that suppressed the
 *      popover's own onMouseEnter, so the popover went straight
 *      from "opening" to "closing" without the cursor ever
 *      registering on it. Removed.
 */
const PlusNPill = ({
    tags,
    open,
    setOpen,
}: {
    tags: string[];
    open: boolean;
    setOpen: (v: boolean) => void;
}) => {
    const btnRef = useRef<HTMLButtonElement | null>(null);
    const [coords, setCoords] = useState<{ left: number; top: number } | null>(null);

    // Close-hand timer. ~140ms is enough for the cursor to cross the
    // 6px gap between trigger and popover without the popover
    // disappearing mid-transit; short enough that an actually-left
    // popover dismisses without feeling sticky.
    const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const scheduleClose = useCallback(() => {
        if (closeTimer.current) clearTimeout(closeTimer.current);
        closeTimer.current = setTimeout(() => setOpen(false), 140);
    }, [setOpen]);
    const cancelClose = useCallback(() => {
        if (closeTimer.current) {
            clearTimeout(closeTimer.current);
            closeTimer.current = null;
        }
    }, []);
    // Clean up any pending close on unmount so a card scrolling out of
    // the viewport mid-hover doesn't leak its timer.
    useEffect(() => () => cancelClose(), [cancelClose]);

    // Re-measure the trigger every time the popover opens, and again
    // on scroll/resize while open. Using `position: fixed` on the
    // portal element means the coordinates are relative to the
    // viewport, so scroll updates are required to keep the popover
    // visually anchored.
    useLayoutEffect(() => {
        if (!open) return;
        const place = () => {
            const el = btnRef.current;
            if (!el) return;
            const r = el.getBoundingClientRect();
            setCoords({ left: r.left + r.width / 2, top: r.bottom + 6 });
        };
        place();
        const onScroll = () => place();
        window.addEventListener('scroll', onScroll, true);
        window.addEventListener('resize', onScroll);
        return () => {
            window.removeEventListener('scroll', onScroll, true);
            window.removeEventListener('resize', onScroll);
        };
    }, [open]);

    // Reset coords on close so a stale position doesn't flash next time.
    useEffect(() => {
        if (!open) setCoords(null);
    }, [open]);

    const openNow = useCallback(() => {
        cancelClose();
        setOpen(true);
    }, [cancelClose, setOpen]);

    return (
        <span className='relative inline-flex'>
            <button
                ref={btnRef}
                type='button'
                aria-label={`Show ${tags.length} more tag${tags.length === 1 ? '' : 's'}`}
                aria-expanded={open}
                onClick={(e) => e.stopPropagation()}
                onMouseEnter={openNow}
                onMouseLeave={scheduleClose}
                onFocus={openNow}
                onBlur={scheduleClose}
                className={`${CHIP_BASE_CLASS} border-[#ffffff14] bg-[#ffffff0a] text-zinc-300 cursor-default hover:bg-[#ffffff14] hover:text-white`}
            >
                +{tags.length}
            </button>
            {open && coords && createPortal(
                // Portal to document.body so the popover isn't clipped
                // by the chip row's `overflow-hidden`. Positioned with
                // `position: fixed` based on the trigger's live bounding
                // box (see useLayoutEffect above for scroll/resize sync).
                <div
                    role='tooltip'
                    style={{
                        position: 'fixed',
                        left: coords.left,
                        top: coords.top,
                        transform: 'translateX(-50%)',
                        zIndex: 9999,
                    }}
                    className='rounded-lg border border-[#ffffff14] bg-zinc-900 p-2 shadow-xl'
                    onMouseEnter={openNow}
                    onMouseLeave={scheduleClose}
                >
                    <div className='flex flex-wrap items-center gap-1.5 max-w-[16rem]'>
                        {tags.map((tag) => (
                            <ChipPill key={`p-${tag}`} tag={tag} />
                        ))}
                    </div>
                </div>,
                document.body,
            )}
        </span>
    );
};

/** Install / Installed pill — brand-red (matches the rest of the panel). */
const InstallPill = ({
    installed,
    busy,
    disabled,
    title,
    onClick,
}: {
    installed: boolean;
    busy?: boolean;
    disabled?: boolean;
    title?: string;
    onClick: (e: React.MouseEvent) => void;
}) => (
    <button
        type='button'
        onClick={onClick}
        disabled={installed || busy || disabled}
        title={title}
        className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border px-3 text-sm font-semibold transition-all ${
            installed
                ? // Installed state — explicitly not-allowed cursor and
                  // muted styling so it's visually obvious that the
                  // button isn't actionable any more. The `disabled`
                  // attribute alone wasn't enough of a UX signal.
                  'border-brand/30 bg-brand/5 text-brand/80 cursor-not-allowed opacity-80'
                : disabled
                  ? 'border-[#ffffff14] text-zinc-500 cursor-not-allowed'
                  : 'border-brand/60 text-brand hover:bg-brand/10'
        }`}
    >
        {installed ? <Check width={14} height={14} /> : <Plus width={14} height={14} />}
        <span>{installed ? 'Installed' : 'Install'}</span>
    </button>
);

/** Square grey icon button — same h as InstallPill — for "open on Modrinth". */
const ModrinthLinkButton = ({ href, onClick }: { href: string; onClick: (e: React.MouseEvent) => void }) => (
    <a
        href={href}
        target='_blank'
        rel='noreferrer'
        onClick={onClick}
        title='View on Modrinth'
        aria-label='View on Modrinth'
        className='inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#ffffff14] bg-[#ffffff08] text-zinc-300 transition-colors hover:border-[#ffffff20] hover:bg-[#ffffff14] hover:text-white'
    >
        <ArrowUpRightFromSquare width={14} height={14} />
    </a>
);

const DiscoverCard = ({
    mod,
    installed,
    detailPath,
    onInstall,
    busy,
    actionsDisabled,
    disabledReason,
    hiddenTags,
}: Props) => {
    const navigate = useNavigate();
    // `updated` is sourced from Modrinth's `date_modified` (or
    // `date_created` for never-edited projects) — wired through in
    // summaryFromHit. See ModSummary.updated.
    const updated = mod.updated;

    /**
     * The whole card is a click target — navigates to the mod's
     * detail page. We swallow the click on any interactive child
     * (install button, popover trigger, ext-link icon button) so
     * those actions don't double-fire as "open the detail page" too.
     */
    const onCardClick = useCallback(() => {
        navigate(detailPath);
    }, [navigate, detailPath]);
    const stopPropagation = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
    }, []);

    return (
        <div
            role='link'
            tabIndex={0}
            onClick={onCardClick}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onCardClick();
                }
            }}
            className={clsx(
                // "Spotlight" hover — instant brighten when the cursor
                // arrives (`hover:duration-0`), then a soft 150 ms decay
                // back to rest when it leaves. Matches the pattern on
                // ServerRow / file_row / ModRow so the whole
                // panel uses one hover idiom. The `from-...` / `to-...`
                // bumps brighten the linear gradient on hover-in too,
                // not just the border, so the card actually reads as
                // "highlighted" rather than just "outlined".
                'group cursor-pointer flex flex-col gap-3 rounded-xl border border-[#ffffff15] bg-linear-to-b from-[#ffffff08] to-[#ffffff05] px-5 py-4 transition',
                'hover:duration-0 hover:border-[#ffffff28] hover:from-[#ffffff14] hover:to-[#ffffff0a]',
            )}
        >
            <div className='flex items-stretch gap-3 sm:gap-4'>
                {/* Icon — fixed size so every card matches height.
                    The previous `aspect-square self-stretch min-h-16
                    max-h-32` setup pulled the icon's intrinsic size
                    from the image's natural dimensions: a mod whose
                    Modrinth icon happens to be served at full
                    resolution (e.g. Fabric API's 500×500 icon.png)
                    landed at 128px while a mod with a CDN-resized
                    96×96 thumbnail landed at 96px. That made
                    neighbouring cards visibly different heights even
                    though their content rows were identical.
                    Pinning to a fixed `w-24 h-24` (96×96) on sm+
                    decouples icon size from the image's natural
                    dimensions; phones use a smaller `w-20 h-20`
                    (80×80) to keep the card visually balanced. */}
                <div className='shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-[#ffffff11] flex items-center justify-center'>
                    {mod.iconUrl ? (
                        <img src={mod.iconUrl} alt='' className='w-full h-full object-cover' />
                    ) : (
                        <House className='w-6 h-6 text-zinc-500' fill='currentColor' />
                    )}
                </div>

                <div className='flex-1 min-w-0 flex flex-col gap-1.5'>
                    <div className='flex items-baseline gap-1.5 min-w-0'>
                        <span className='text-base font-bold text-zinc-100 truncate group-hover:underline' title={mod.title}>
                            {mod.title}
                        </span>
                        {mod.author && (
                            <span className='text-xs text-zinc-500 truncate shrink min-w-0'>
                                by {mod.author}
                            </span>
                        )}
                    </div>
                    {/* Description gets a pinned `min-h-[2rem]` (= 2
                        lines at text-xs leading) so 1-line and 2-line
                        descriptions reserve the same vertical slot.
                        Without this every card sized itself to its
                        description's natural height and the list
                        looked ragged — a 2-line card would be ~12 px
                        taller than a 1-line card. The icon's
                        self-stretch then takes the row's height,
                        so taller descriptions used to "win" and
                        their icons grew too. */}
                    <p className='text-xs text-zinc-400 line-clamp-2 min-h-[2rem] break-words'>
                        {mod.description ?? ''}
                    </p>
                    {/* Inline chip row — only shown md+. On smaller
                        viewports we render a full-width version below
                        the icon+content row so chips don't get squeezed
                        between the icon and the right-side actions.
                        `min-h-5` reserves the chip-pill height even
                        when the mod has zero categories — keeps cards
                        the same height whether or not categories were
                        returned by the API. */}
                    <div className='hidden md:block min-h-5'>
                        <ChipRow tags={mod.categories} hiddenTags={hiddenTags} />
                    </div>
                </div>

                {/* Right column — actions on top, stats in the
                    middle, date at the bottom. `justify-between`
                    distributes the three rows evenly across the
                    column's vertical height (which equals the
                    96 px icon's height via `self-stretch`), so the
                    stats actually fill the card instead of clustering
                    near the top. Stats text bumped from text-xs to
                    text-sm so it carries visual weight closer to the
                    install pill above. */}
                <div className='shrink-0 flex flex-col items-end justify-between self-stretch gap-2'>
                    <div className='flex items-center gap-1.5'>
                        <InstallPill
                            installed={installed}
                            busy={busy}
                            disabled={actionsDisabled}
                            title={actionsDisabled ? disabledReason : installed ? 'Already installed' : undefined}
                            onClick={(e) => {
                                stopPropagation(e);
                                onInstall();
                            }}
                        />
                        <ModrinthLinkButton href={mod.projectUrl} onClick={stopPropagation} />
                    </div>
                    <div className='inline-flex items-center gap-3 text-sm text-zinc-400'>
                        <span className='inline-flex items-center gap-1.5' title='Downloads'>
                            <ArrowDownToLine width={14} height={14} />
                            {formatCount(mod.downloads)}
                        </span>
                        <span className='inline-flex items-center gap-1.5' title='Followers'>
                            <HeartFill width={14} height={14} className='text-zinc-500' />
                            {formatCount(mod.follows)}
                        </span>
                    </div>
                    {updated && (
                        <span className='inline-flex items-center gap-1.5 text-sm text-zinc-500' title={`Updated ${updated}`}>
                            <ClockArrowRotateLeft width={14} height={14} />
                            {formatRelative(updated)}
                        </span>
                    )}
                </div>
            </div>

            {/* Full-width chip row — only shown below md. Mirrors the
                inline version above but spans the entire card width
                so chips don't have to compete with the icon + actions
                column for horizontal space on tablets / phones.
                `min-h-5` reserves the chip-pill height so cards stay
                a consistent height even when a mod has no categories. */}
            <div className='block md:hidden min-h-5' onClick={stopPropagation}>
                <ChipRow tags={mod.categories} hiddenTags={hiddenTags} />
            </div>
        </div>
    );
};

export default DiscoverCard;
