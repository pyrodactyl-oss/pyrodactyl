import { Xmark } from '@gravity-ui/icons';

/**
 * One active filter that should render as a chip with an X-to-remove
 * affordance. `key` is the React key (group name + value), `label` is what
 * the chip shows, and `onRemove` clears just that one filter.
 */
export interface ActiveFilter {
    key: string;
    label: string;
    onRemove: () => void;
}

interface Props {
    filters: ActiveFilter[];
    /** When at least one filter is set, the parent supplies this to clear them all. */
    onClearAll?: () => void;
}

/**
 * Modrinth-style row of currently-applied filter chips that sits beneath
 * the FilterDropdown trigger row. Renders nothing when the filter list is
 * empty so the caller can include it unconditionally without an extra
 * truthy wrapper. Order is preserved so chips appear in the same order the
 * parent passes them (typically grouped: platforms first, then game
 * versions).
 *
 * Each chip is a button — clicking the body OR the X clears that one
 * filter. That mirrors Modrinth's web UI, where the whole chip is the
 * dismiss target. We pair it with an explicit X glyph so the action is
 * still discoverable when the chip text is the only thing visible.
 */
const ActiveFilterChips = ({ filters, onClearAll }: Props) => {
    if (filters.length === 0) return null;
    return (
        <div className='flex flex-wrap items-center gap-1.5'>
            {filters.map((f) => (
                <button
                    key={f.key}
                    type='button'
                    onClick={f.onRemove}
                    className='inline-flex items-center gap-1.5 rounded-full border border-brand/40 bg-brand/15 px-2.5 py-0.5 text-[11px] font-semibold text-brand transition hover:border-brand/70 hover:bg-brand/25 hover:text-white'
                >
                    <span>{f.label}</span>
                    <Xmark width={10} height={10} />
                </button>
            ))}
            {onClearAll && (
                <button
                    type='button'
                    onClick={onClearAll}
                    className='ml-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-400 hover:text-white'
                >
                    Clear all filters
                </button>
            )}
        </div>
    );
};

export default ActiveFilterChips;
