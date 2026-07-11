// million-ignore
// Million.js auto-mode breaks controlled inputs the same way it broke
// the search bars on DiscoverList/ModsList — the in-panel search input
// stops firing onChange per-keystroke. Opt this file out so the standard
// React onChange pattern works.
import { Check, ChevronDown, Magnifier, Xmark } from '@gravity-ui/icons';
import clsx from 'clsx';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/elements/DropdownMenu';

/**
 * One selectable option in a {@link FilterDropdown} panel.
 *
 * - `value` is the canonical id the parent stores in its selection set.
 * - `label` is the rendered text. Defaults to `value` when omitted, which
 *   covers the common case where the value is already display-ready (e.g.
 *   "1.21.x", "fabric").
 * - `searchKeywords` extends the list of strings the search input matches
 *   against. The label is always searched; this is for adding alternate
 *   spellings or aliases (e.g. "neoforge" matching "neo forge").
 * - `badge` renders as a small uppercase tag on the right of the option
 *   row (e.g. "server" to flag the panel's own server-default value, or
 *   "snapshot" to mark non-release game versions).
 */
export interface FilterDropdownOption {
    value: string;
    label?: string;
    searchKeywords?: string[];
    badge?: string;
}

type CommonProps = {
    /** Trigger button label (e.g. "Platform", "Game versions"). */
    label: string;
    /** Source list of selectable options. Order is preserved. */
    options: FilterDropdownOption[];
    /**
     * When true, renders a search input pinned to the top of the panel.
     * Filters the visible options client-side by case-insensitive substring
     * against the label + any `searchKeywords`. Worth enabling whenever the
     * option list might exceed ~10 entries (e.g. game versions).
     */
    showSearch?: boolean;
    /** Placeholder for the search input. Only used when `showSearch` is true. */
    searchPlaceholder?: string;
    /**
     * Optional toggle pinned to the top of the panel (above the search input),
     * visible even when the option list scrolls. Designed for the "Show all
     * versions" affordance Modrinth uses to flip between release-only and
     * full-history option lists. Parent controls both the visual state
     * (`stickyToggle.checked`) and the supplied option list.
     */
    stickyToggle?: {
        label: string;
        checked: boolean;
        onChange: (next: boolean) => void;
    };
    /** Optional className for the trigger button — lets the caller tweak width / flex behaviour. */
    triggerClassName?: string;
    /** Width of the panel in px. Defaults to 256. */
    panelWidth?: number;
    /** Optional empty-state label shown when no options match the search. */
    emptyLabel?: string;
    /**
     * When true, the trigger renders without the right-aligned chevron and
     * the trigger label slot shows the currently-selected option's label
     * instead of a static title — useful for single-select cases like
     * "Game version: 1.21.5 ▾" where the value IS the affordance.
     */
    renderSelectionInTrigger?: boolean;
    /**
     * Override the trigger's brand-tinted "this filter is active" styling.
     * Default behaviour highlights whenever ≥1 option is selected, which is
     * wrong for filters that come pre-seeded with the server's natural
     * default — the user hasn't actually overridden anything yet. Parent
     * can pass `highlight={selection !== naturalDefault}` so the button
     * stays neutral until the user explicitly diverges.
     */
    highlight?: boolean;
};

type MultiProps = CommonProps & {
    mode?: 'multi';
    /** Currently-selected option values. Parent owns the state. */
    selected: Set<string>;
    /** Called whenever the selection set changes. Parent replaces its state with the returned Set. */
    onChange: (next: Set<string>) => void;
};

type SingleProps = CommonProps & {
    mode: 'single';
    /** Currently-selected option value, or null when nothing is selected. */
    value: string | null;
    /** Called when the user picks an option. */
    onChange: (next: string) => void;
};

type Props = MultiProps | SingleProps;

/**
 * Trigger-button + popover panel for multi-select / single-select
 * filtering, modelled on Modrinth's "Platform ⌄" / "Game versions ⌄"
 * dropdowns.
 *
 * The shell is the project-wide Radix `DropdownMenu` (Root + Trigger +
 * Content + Portal), which means this component shares the same open-
 * state coordination as every other dropdown on the page: opening one
 * dropdown auto-closes whatever else was open, click-outside / Escape
 * dismissal is handled centrally, and the popper positions itself in a
 * portal so it can escape clipping parents. Earlier drafts of this
 * component hand-rolled all of that, which let a Categories / Sort
 * dropdown stay open underneath an open Type / Loader / MC dropdown
 * because the two systems didn't know about each other.
 *
 * What we DON'T reuse from the shared DropdownMenu:
 *  - `DropdownMenuItem`. Radix's Items auto-close the menu on every
 *    interaction by default — sensible for one-shot menu actions, wrong
 *    for a multi-select panel where the user wants to tick several rows
 *    without the popover snapping shut after each click. Option rows
 *    here are plain `<button>` elements so a click on a row never
 *    triggers Radix's auto-close logic; we manually close on single-
 *    select picks via the controlled `onOpenChange` setter.
 *  - Radix's keyboard roving-focus ring. Items participate in it; plain
 *    buttons don't, which means the option list doesn't fight the
 *    search input for arrow-key handling.
 *
 * Behaviour:
 *  - Click trigger → opens the panel below.
 *  - Click outside, press Escape, or click the trigger again → closes
 *    (Radix handles all three via the controlled `open` state).
 *  - Checking / unchecking an option toggles its membership in
 *    `selected` (multi) or replaces `value` and closes the panel
 *    (single).
 *  - The trigger label shows a `(N)` counter when the parent has
 *    anything selected so it's obvious the filter is "armed" without
 *    expanding it.
 */
const FilterDropdown = (props: Props) => {
    const {
        label,
        options,
        showSearch = false,
        searchPlaceholder = 'Search…',
        stickyToggle,
        triggerClassName,
        panelWidth = 256,
        emptyLabel = 'No matches.',
        renderSelectionInTrigger = false,
        highlight: highlightOverride,
    } = props;
    const isMulti = (props.mode ?? 'multi') === 'multi';
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const searchInputRef = useRef<HTMLInputElement | null>(null);
    const reactId = useId();

    // Reset the in-panel search query whenever the panel is closed so
    // re-opening it doesn't surprise the user with a stale filter. The
    // option list itself stays stable across opens.
    useEffect(() => {
        if (!open) setQuery('');
        else if (showSearch) {
            // Auto-focus the search input when the panel opens. Matches
            // Modrinth's web UI where the cursor jumps straight into the
            // search field. Use rAF so the input exists in the DOM by
            // the time we try to focus. Radix already fires its own
            // auto-focus on the Content; we steal it back to the search.
            requestAnimationFrame(() => searchInputRef.current?.focus());
        }
    }, [open, showSearch]);

    // Visible option list = full list filtered by the in-panel search.
    // Computed via useMemo because some option lists (game versions for a
    // popular project) can run into the hundreds and we re-render on every
    // keystroke.
    const visibleOptions = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return options;
        return options.filter((opt) => {
            const haystack = [opt.label ?? opt.value, opt.value, ...(opt.searchKeywords ?? [])]
                .join(' ')
                .toLowerCase();
            return haystack.includes(q);
        });
    }, [options, query]);

    const isSelected = useCallback(
        (value: string): boolean => {
            if (props.mode === 'single') return props.value === value;
            return props.selected.has(value);
        },
        [props],
    );

    const pickValue = useCallback(
        (value: string) => {
            if (props.mode === 'single') {
                props.onChange(value);
                setOpen(false);
                return;
            }
            const next = new Set(props.selected);
            if (next.has(value)) next.delete(value);
            else next.add(value);
            props.onChange(next);
        },
        [props],
    );

    const selectedCount = isMulti ? (props as MultiProps).selected.size : (props as SingleProps).value ? 1 : 0;
    // Highlight = "should this trigger render in brand-red to signal an
    // active filter?". If the parent supplied `highlight` explicitly,
    // honour it (used for filters that come pre-seeded with the server's
    // natural default). Otherwise fall back to "anything selected" — the
    // sensible default for filters that start empty.
    const highlight = highlightOverride ?? selectedCount > 0;
    const currentSingleLabel = useMemo(() => {
        if (props.mode !== 'single' || !props.value) return null;
        const match = options.find((o) => o.value === props.value);
        return match?.label ?? props.value;
    }, [props, options]);

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            {/* Trigger button — same h-9 px-3 shell as the previously
                bespoke triggers. Visual states:
                  * neutral (default) — no override / nothing changed
                  * brand-red — `highlight` flagged (parent has decided
                    the current selection diverges from the natural
                    default; e.g. user picked a non-server MC version)
                  * open — slightly hotter background so the user can see
                    which trigger they're currently expanding
                Wrapped in `<DropdownMenuTrigger asChild>` so Radix wires
                its own click handler + a11y attributes onto our button
                without injecting an extra wrapper element. */}
            <DropdownMenuTrigger asChild>
                <button
                    type='button'
                    className={clsx(
                        'inline-flex h-9 items-center gap-2 rounded-md border px-3 text-xs outline-hidden transition',
                        open
                            ? 'border-brand/60 bg-[#ffffff14] text-white'
                            : highlight
                              ? 'border-brand/50 bg-brand/10 text-brand hover:bg-brand/15'
                              : 'border-[#ffffff14] bg-[#0d0d10] text-zinc-100 hover:border-brand/60',
                        triggerClassName,
                    )}
                >
                    {renderSelectionInTrigger && props.mode === 'single' ? (
                        <>
                            <span
                                className={clsx(
                                    'text-[10px] uppercase tracking-wide',
                                    highlight ? 'text-brand/70' : 'text-zinc-500',
                                )}
                            >
                                {label}
                            </span>
                            <span
                                className={clsx(
                                    'truncate font-medium',
                                    highlight ? 'text-brand' : 'text-zinc-100',
                                )}
                            >
                                {currentSingleLabel ?? '—'}
                            </span>
                        </>
                    ) : (
                        <span className='font-semibold'>{label}</span>
                    )}
                    {isMulti && selectedCount > 0 && (
                        <span
                            className={clsx(
                                'inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold',
                                highlight ? 'bg-brand/30 text-brand' : 'bg-[#ffffff18] text-zinc-200',
                            )}
                        >
                            {selectedCount}
                        </span>
                    )}
                    <ChevronDown
                        width={12}
                        height={12}
                        className={clsx(
                            'shrink-0 text-zinc-400 transition-transform',
                            open && 'rotate-180',
                        )}
                    />
                </button>
            </DropdownMenuTrigger>
            {/* DropdownMenuContent already supplies the radial-gradient
                + backdrop-blur surface, soft shadow, no border, rounded
                corners, and `data-[state]` animation classes. We only
                override:
                  * `p-0` so we can run our own per-section padding
                    (the header, the scrolling option list, the toggle
                    footer each have different padding requirements).
                  * `flex max-h-[26rem] flex-col` so the panel's a flex
                    column whose middle slot scrolls — the header and
                    footer pin to the panel edges naturally without
                    needing `sticky`, which would put them back inside
                    the scroll viewport and re-trigger the stacked-
                    transparency artifact at the edges. */}
            <DropdownMenuContent
                align='start'
                sideOffset={8}
                role='listbox'
                aria-multiselectable={isMulti ? 'true' : undefined}
                aria-label={label}
                onCloseAutoFocus={(event) => event.preventDefault()}
                style={{ width: panelWidth }}
                className='flex max-h-[26rem] flex-col p-0'
            >
                {showSearch && (
                    <div className='border-b border-[#ffffff10] p-2'>
                        <div className='relative'>
                            <Magnifier
                                width={12}
                                height={12}
                                className='absolute top-1/2 left-2.5 -translate-y-1/2 text-zinc-500'
                            />
                            {/* Uncontrolled — matches the files-page
                                search bar pattern. Controlled inputs get
                                mangled by Million.js auto-mode in
                                production builds and stop firing
                                onChange per-keystroke. Browser owns the
                                visible value; React just reads it via
                                the change event. */}
                            <input
                                ref={searchInputRef}
                                type='text'
                                defaultValue=''
                                onChange={(e) => setQuery(e.currentTarget.value)}
                                placeholder={searchPlaceholder}
                                className='w-full rounded-md border border-[#ffffff14] bg-black/30 py-1.5 pl-7 pr-7 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-brand/60 focus:outline-none'
                            />
                            {query && (
                                <button
                                    type='button'
                                    onClick={() => {
                                        // Uncontrolled input — clear its
                                        // DOM value imperatively, then
                                        // sync state + restore focus so
                                        // the user can keep typing
                                        // immediately.
                                        if (searchInputRef.current) {
                                            searchInputRef.current.value = '';
                                        }
                                        setQuery('');
                                        searchInputRef.current?.focus();
                                    }}
                                    aria-label='Clear search'
                                    className='absolute top-1/2 right-1.5 -translate-y-1/2 rounded p-0.5 text-zinc-500 hover:bg-[#ffffff14] hover:text-white'
                                >
                                    <Xmark width={10} height={10} />
                                </button>
                            )}
                        </div>
                    </div>
                )}

                <div className='min-h-0 flex-1 overflow-y-auto p-1'>
                    {visibleOptions.length === 0 ? (
                        <p className='px-3 py-4 text-center text-xs text-zinc-500'>{emptyLabel}</p>
                    ) : (
                        visibleOptions.map((opt) => {
                            const active = isSelected(opt.value);
                            /* Row styling mirrors DropdownMenuItem
                               (font-bold, rounded-lg, hover-on-tinted
                               bg) so the row hover / focus look matches
                               the rest of the Pyrodactyl dropdowns.
                               Plain `<button>` (not Radix's Item) so a
                               click never triggers the Item's built-in
                               auto-close — we control closing ourselves
                               via the controlled `open` setter. */
                            return (
                                <button
                                    key={opt.value}
                                    type='button'
                                    role='option'
                                    aria-selected={active}
                                    onClick={() => pickValue(opt.value)}
                                    className={clsx(
                                        'flex w-full items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-left text-sm font-bold transition focus:bg-[#ffffff33] focus:outline-none',
                                        active
                                            ? 'bg-brand/15 text-white hover:bg-brand/20'
                                            : 'text-zinc-200 hover:bg-[#ffffff14] hover:text-white',
                                    )}
                                >
                                    <span className='flex min-w-0 items-center gap-2'>
                                        {/* In multi mode each row shows
                                            a checkbox; in single mode
                                            the check glyph still
                                            indicates the current pick
                                            but without the box
                                            outline. */}
                                        {isMulti ? (
                                            <span
                                                className={clsx(
                                                    'inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border transition',
                                                    active
                                                        ? 'border-brand bg-brand text-white'
                                                        : 'border-[#ffffff22] bg-transparent',
                                                )}
                                            >
                                                {active && <Check width={10} height={10} />}
                                            </span>
                                        ) : (
                                            <span className='inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center text-brand'>
                                                {active && <Check width={12} height={12} />}
                                            </span>
                                        )}
                                        <span className='truncate'>{opt.label ?? opt.value}</span>
                                    </span>
                                    {opt.badge && (
                                        <span className='ml-2 shrink-0 rounded bg-[#ffffff10] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-zinc-400'>
                                            {opt.badge}
                                        </span>
                                    )}
                                </button>
                            );
                        })
                    )}
                </div>

                {/* Toggle footer. Sits outside the scroll viewport so it
                    stays pinned at the panel bottom without needing
                    position:sticky. */}
                {stickyToggle && (
                    <div className='border-t border-[#ffffff10] p-2'>
                        <label
                            htmlFor={`${reactId}-toggle`}
                            className='flex cursor-pointer items-center justify-between gap-3 rounded-md px-2 py-1.5 text-xs font-semibold text-zinc-200 transition hover:bg-[#ffffff08]'
                        >
                            <span>{stickyToggle.label}</span>
                            <span
                                className={clsx(
                                    'relative inline-flex h-4 w-7 shrink-0 rounded-full transition',
                                    stickyToggle.checked ? 'bg-brand' : 'bg-[#ffffff20]',
                                )}
                            >
                                <span
                                    className={clsx(
                                        'absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform',
                                        stickyToggle.checked ? 'translate-x-3.5' : 'translate-x-0.5',
                                    )}
                                />
                            </span>
                            <input
                                id={`${reactId}-toggle`}
                                type='checkbox'
                                className='sr-only'
                                checked={stickyToggle.checked}
                                onChange={(e) => stickyToggle.onChange(e.currentTarget.checked)}
                            />
                        </label>
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default FilterDropdown;
