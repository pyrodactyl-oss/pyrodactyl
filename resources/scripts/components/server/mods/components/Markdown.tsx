import type { ReactElement, ReactNode } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

import { cn } from '@/lib/utils';

/**
 * True when a markdown paragraph's children are entirely
 * badge-shaped — i.e. an `<img>` or `<a><img></a>` (plus whitespace
 * between them).
 *
 * Modrinth project bodies frequently lead with a cluster of shields.io
 * badges (release, chat, license, etc.). The markdown source puts each
 * badge on its own line, so the parser emits each as a separate `<p>`.
 * With default block-level paragraphs that means one badge per line,
 * which wastes ~7 rows of vertical space at the top of every project
 * with a badge cluster. We detect that shape here and the `p` override
 * below renders inline-blocks instead, so badges flow horizontally and
 * wrap on overflow like they do on Modrinth's own site.
 */
const isBadgeChild = (child: ReactNode): boolean => {
    if (typeof child === 'string') return /^\s*$/.test(child);
    if (child === null || typeof child !== 'object' || !('type' in child)) return false;
    const el = child as ReactElement<{ children?: ReactNode }>;
    if (el.type === 'img') return true;
    if (el.type === 'a') {
        const inner = el.props?.children;
        const innerArr = Array.isArray(inner) ? inner : [inner];
        return innerArr.every(isBadgeChild);
    }
    return false;
};

const isBadgeParagraph = (children: ReactNode): boolean => {
    if (!children) return false;
    const arr = Array.isArray(children) ? children : [children];
    // Reject entirely-whitespace paragraphs and require at least one
    // image-bearing child — otherwise a `<p>` with just a link would
    // also trigger the inline render.
    const hasImage = arr.some((c) => {
        if (typeof c !== 'object' || c === null || !('type' in c)) return false;
        const el = c as ReactElement<{ children?: ReactNode }>;
        if (el.type === 'img') return true;
        if (el.type === 'a') {
            const inner = el.props?.children;
            const innerArr = Array.isArray(inner) ? inner : [inner];
            return innerArr.some(
                (ic) => typeof ic === 'object' && ic !== null && 'type' in ic && (ic as ReactElement).type === 'img',
            );
        }
        return false;
    });
    return hasImage && arr.every(isBadgeChild);
};

interface Props {
    /** Raw markdown source (Modrinth changelogs, project bodies, etc.). */
    children: string | null | undefined;
    className?: string;
}

/**
 * Centralised markdown renderer for mod content (changelogs, project bodies).
 *
 * Modrinth's API returns text/markdown in the changelog and `body` fields,
 * frequently with GFM-style task lists, tables, autolinks, and `<br>` tags.
 * We pipe that through `react-markdown` with `remark-gfm` for proper handling,
 * then style the output with Tailwind classes so it inherits the panel's
 * dark theme. We deliberately don't enable the rehype-raw escape hatch — we
 * don't want random Modrinth content injecting raw HTML beyond the safe-by-
 * default surface react-markdown gives us.
 *
 * The component overrides for `a` add `target="_blank"` and `rel` so links
 * open in a new tab without bouncing the user out of the panel.
 */
const Markdown = ({ children, className }: Props) => {
    if (!children || !children.trim()) {
        return <p className={cn('text-xs text-zinc-500', className)}>No description available.</p>;
    }

    return (
        <div className={cn('text-sm text-zinc-300 leading-relaxed', className)}>
            {/* rehype-raw lets the renderer pass through inline HTML like
                `<br>`, which Modrinth's changelogs use heavily for spacing
                between sections. Without it react-markdown strips them and
                paragraphs collapse together. rehype-raw is safe here because
                the markdown source is what Modrinth itself rendered for the
                public web — it's already been sanitised on their end. */}
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={componentOverrides}
            >
                {children}
            </ReactMarkdown>
        </div>
    );
};

const componentOverrides: Components = {
    // Headings — sized to fit changelog / description contexts. Sticking
    // close to the panel's existing type scale (text-sm body, text-base/-lg
    // headings) keeps everything visually anchored.
    h1: ({ children }) => <h1 className='mt-4 mb-2 text-lg font-bold text-zinc-100 first:mt-0'>{children}</h1>,
    h2: ({ children }) => <h2 className='mt-4 mb-2 text-base font-bold text-zinc-100 first:mt-0'>{children}</h2>,
    h3: ({ children }) => <h3 className='mt-3 mb-1.5 text-sm font-bold uppercase tracking-wide text-zinc-200 first:mt-0'>{children}</h3>,
    h4: ({ children }) => <h4 className='mt-3 mb-1.5 text-sm font-semibold text-zinc-200 first:mt-0'>{children}</h4>,
    h5: ({ children }) => <h5 className='mt-2 mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-300 first:mt-0'>{children}</h5>,
    h6: ({ children }) => <h6 className='mt-2 mb-1 text-xs font-semibold text-zinc-400 first:mt-0'>{children}</h6>,

    p: ({ children }) => {
        // Badge-only paragraphs render as an inline-block span so
        // adjacent badge paragraphs sit next to each other instead of
        // stacking. `mr-1.5 mb-1.5` provides the gap; descendant
        // selectors strip the default img margins/border so the badges
        // pack tightly.
        if (isBadgeParagraph(children)) {
            return (
                <span className='mr-1.5 mb-1.5 inline-block align-middle [&_a]:no-underline [&_img]:my-0 [&_img]:border-none [&_img]:rounded-none'>
                    {children}
                </span>
            );
        }
        return <p className='my-2 first:mt-0 last:mb-0'>{children}</p>;
    },
    // Modrinth pages use stand-alone `<br>` tags as paragraph-level spacers
    // (sometimes 2 or 3 in a row). Render each as a thin vertical gap so the
    // visual rhythm matches modrinth.com rather than collapsing back together.
    br: () => <span aria-hidden className='block h-2' />,
    a: ({ href, children }) => (
        <a
            href={href}
            target='_blank'
            rel='noopener noreferrer'
            className='text-brand underline underline-offset-2 hover:text-white'
        >
            {children}
        </a>
    ),

    strong: ({ children }) => <strong className='font-semibold text-zinc-100'>{children}</strong>,
    em: ({ children }) => <em className='italic text-zinc-200'>{children}</em>,
    del: ({ children }) => <del className='text-zinc-500 line-through'>{children}</del>,

    ul: ({ children }) => <ul className='my-2 list-disc space-y-1 pl-5'>{children}</ul>,
    ol: ({ children }) => <ol className='my-2 list-decimal space-y-1 pl-5'>{children}</ol>,
    li: ({ children }) => <li className='leading-relaxed'>{children}</li>,

    blockquote: ({ children }) => (
        <blockquote className='my-3 border-l-2 border-[#ffffff20] pl-3 italic text-zinc-400'>{children}</blockquote>
    ),
    hr: () => <hr className='my-4 border-[#ffffff14]' />,

    code: ({ className, children, ...props }) => {
        // The `inline` flag was removed in react-markdown 9; the only signal
        // remaining is whether the node had a `language-*` class added by
        // remark-parse. Treat anything with a class as a block, otherwise as
        // an inline code span.
        const isBlock = !!className && /language-/.test(className);
        if (isBlock) {
            return (
                <pre className='my-3 overflow-x-auto rounded-md border border-[#ffffff0e] bg-[#0a0a0c] p-3 text-xs'>
                    <code className={cn('font-mono text-zinc-200', className)} {...props}>
                        {children}
                    </code>
                </pre>
            );
        }
        return (
            <code className='rounded bg-[#ffffff12] px-1.5 py-0.5 font-mono text-xs text-zinc-100'>{children}</code>
        );
    },
    pre: ({ children }) => <>{children}</>,

    table: ({ children }) => (
        <div className='my-3 overflow-x-auto'>
            <table className='w-full border-collapse text-xs'>{children}</table>
        </div>
    ),
    th: ({ children }) => (
        <th className='border-b border-[#ffffff14] px-2 py-1.5 text-left font-semibold text-zinc-200'>
            {children}
        </th>
    ),
    td: ({ children }) => <td className='border-b border-[#ffffff08] px-2 py-1.5 align-top text-zinc-300'>{children}</td>,

    img: ({ src, alt }) => (
        <img
            src={src}
            alt={alt}
            className='my-2 max-w-full rounded-md border border-[#ffffff10]'
            loading='lazy'
        />
    ),
};

export default Markdown;
