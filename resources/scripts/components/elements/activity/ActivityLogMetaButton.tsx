import { Code, Copy } from '@gravity-ui/icons';
import { useState } from 'react';

import ActionButton from '@/components/elements/ActionButton';
import { Dialog } from '@/components/elements/dialog';

import { formatObjectToIdentString } from '@/lib/objects';

const ActivityLogMetaButton = ({ meta }: { meta: Record<string, unknown> }) => {
    const [open, setOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(JSON.stringify(meta, null, 2));
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy metadata:', err);
        }
    };

    const metadataString = formatObjectToIdentString(meta);
    const metadataJson = JSON.stringify(meta, null, 2);

    return (
        <>
            <Dialog hideCloseIcon onClose={() => setOpen(false)} open={open} title={'Event Metadata'}>
                <div className='space-y-4'>
                    <div className='flex items-center justify-between'>
                        <h4 className='font-medium text-sm text-zinc-300'>Formatted View</h4>
                        <ActionButton
                            className='flex items-center gap-2 text-xs'
                            onClick={copyToClipboard}
                            variant='secondary'
                        >
                            <Copy height={22} width={22} />
                            {copied ? 'Copied!' : 'Copy JSON'}
                        </ActionButton>
                    </div>

                    <div className='max-h-96 overflow-auto rounded-lg border border-zinc-800 bg-zinc-900 p-4'>
                        <pre className='whitespace-pre-wrap font-mono text-sm text-zinc-300 leading-relaxed'>
                            {metadataString}
                        </pre>
                    </div>

                    <div>
                        <h4 className='mb-2 font-medium text-sm text-zinc-300'>Raw JSON</h4>
                        <div className='max-h-64 overflow-auto rounded-lg border border-zinc-800 bg-zinc-900 p-4'>
                            <pre className='whitespace-pre-wrap font-mono text-xs text-zinc-400 leading-relaxed'>
                                {metadataJson}
                            </pre>
                        </div>
                    </div>
                </div>

                <Dialog.Footer>
                    <ActionButton onClick={() => setOpen(false)} variant='secondary'>
                        Close
                    </ActionButton>
                </Dialog.Footer>
            </Dialog>

            <button
                aria-label='View additional event metadata'
                className='flex h-6 w-6 items-center justify-center rounded text-zinc-400 transition-colors duration-150 hover:bg-zinc-800/50 hover:text-zinc-100'
                onClick={() => setOpen(true)}
            >
                <Code height={22} width={22} />
            </button>
        </>
    );
};

export default ActivityLogMetaButton;
