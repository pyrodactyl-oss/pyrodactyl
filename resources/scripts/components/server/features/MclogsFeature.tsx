import { Check, Link, TriangleExclamation } from '@gravity-ui/icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import ActionButton from '@/components/elements/ActionButton';
import Modal from '@/components/elements/Modal';
import Spinner from '@/components/elements/Spinner';
import { Alert } from '@/components/elements/alert';
import { SocketEvent } from '@/components/server/events';

import i18n from '@/lib/i18n';
import { debounce, isCrashLine } from '@/lib/mclogsUtils';

import { MclogsInsight, analyzeLogs } from '@/api/mclo.gs/mclogsApi';
import getFileContents from '@/api/server/files/getFileContents';

import { ServerContext } from '@/state/server';

import useWebsocketEvent from '@/plugins/useWebsocketEvent';

class NoLogContentError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'NoLogContentError';
    }
}

const CRASH_DETECTION_DEBOUNCE = 1500; // 1.5 seconds
const MANUAL_ANALYZE_DEBOUNCE = 1000; // 1 second for manual clicks
const LOG_FILE_PATH = '/logs/latest.log';
const MAX_CONSOLE_BUFFER = 300;

// Shared analysis logic hook
const useLogAnalysis = () => {
    const [analyzing, setAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<MclogsInsight | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const [showCard, setShowCard] = useState(false);

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const status = ServerContext.useStoreState((state) => state.status.value);

    const consoleBufferRef = useRef<string[]>([]);
    const previousStatusRef = useRef(status);
    const mountedRef = useRef(true);

    // Keep console buffer trimmed and split chunks into lines
    useWebsocketEvent(SocketEvent.CONSOLE_OUTPUT, (data: string) => {
        const lines = String(data).split(/\r?\n/).filter(Boolean);
        if (lines.length === 0) return;

        consoleBufferRef.current.push(...lines);
        if (consoleBufferRef.current.length > MAX_CONSOLE_BUFFER) {
            // Trim to last MAX_CONSOLE_BUFFER lines
            consoleBufferRef.current = consoleBufferRef.current.slice(-MAX_CONSOLE_BUFFER);
        }
    });

    const analyzeCrash = useCallback(
        async (showToast = false) => {
            setAnalyzing(true);
            setError(null);

            try {
                const logContent = await getFileContents(uuid, LOG_FILE_PATH);

                if (!logContent || logContent.trim().length === 0) {
                    throw new NoLogContentError(i18n.t('server:features.mclogs.no_log_content'));
                }

                const result = await analyzeLogs(logContent);
                if (!mountedRef.current) return;

                setAnalysis(result);
                setShowCard(true);

                // Show toast notifications for manual analysis
                if (showToast) {
                    if (result.analysis?.problems?.length > 0) {
                        toast.success(
                            i18n.t('server:features.mclogs.analysis_complete', {
                                count: result.analysis.problems.length,
                            }),
                        );
                    } else {
                        toast.info(i18n.t('server:features.mclogs.analysis_no_issues'));
                    }
                }
            } catch (err) {
                if (!mountedRef.current) return;

                setError(err instanceof Error ? err : new Error(i18n.t('server:features.mclogs.analysis_failed')));
                console.error('Mclogs analysis failed:', err);

                setShowCard(true);

                const looksLikeMissingLog = err instanceof NoLogContentError;

                if (!looksLikeMissingLog && showToast) {
                    toast.error(i18n.t('server:features.mclogs.analysis_failed'));
                }
            } finally {
                if (mountedRef.current) setAnalyzing(false);
            }
        },
        [uuid],
    );

    // Debounced auto-analysis used when we detect crash indicators
    const analyzeCrashDebounced = useMemo(() => {
        const fn = debounce(() => {
            // Note: run the immediate version internally
            void analyzeCrash();
        }, CRASH_DETECTION_DEBOUNCE);

        return fn;
    }, [analyzeCrash]);

    // Monitor server status changes to detect crashes
    useEffect(() => {
        // If server just went offline, check recent console output for crash indicators
        if (previousStatusRef.current !== 'offline' && status === 'offline') {
            const hasCrashIndicators = consoleBufferRef.current.some((line) => isCrashLine(line));
            if (hasCrashIndicators) {
                analyzeCrashDebounced();
            }
        }

        // Update previous status
        previousStatusRef.current = status;
    }, [status, analyzeCrashDebounced]);

    // Manual analysis (debounced to prevent rapid clicking)
    const manualAnalyze = useMemo(() => {
        return debounce(() => {
            void analyzeCrash(true); // Show toast for manual analysis
        }, MANUAL_ANALYZE_DEBOUNCE);
    }, [analyzeCrash]);

    // Dismiss card
    const dismissCard = () => {
        setShowCard(false);
    };

    // Cleanup on unmount
    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            // Best-effort cancel if debounce util provides cancel()
            try {
                (analyzeCrashDebounced as { cancel?: () => void })?.cancel?.();
                (manualAnalyze as { cancel?: () => void })?.cancel?.();
            } catch {
                // no-op
            }
        };
    }, [analyzeCrashDebounced, manualAnalyze]);

    return {
        analyzing,
        analysis,
        error,
        showCard,
        manualAnalyze,
        dismissCard,
        consoleBufferRef,
        previousStatusRef,
        mountedRef,
        analyzeCrashDebounced,
    };
};

// Crash Analysis Card Component
export const CrashAnalysisCard = () => {
    const { analyzing, analysis, error, showCard, dismissCard } = useLogAnalysis();

    const [modalVisible, setModalVisible] = useState(false);

    if (!showCard) return null;

    const getCardMessage = () => {
        if (analyzing) {
            return i18n.t('server:features.mclogs.analyzing_crash');
        }

        if (error) {
            const looksLikeMissingLog = error instanceof NoLogContentError;

            if (looksLikeMissingLog) {
                return i18n.t('server:features.mclogs.crash_no_log');
            }
            return i18n.t('server:features.mclogs.crash_failed');
        }

        if (!analysis) {
            return i18n.t('server:features.mclogs.crash_analyzing');
        }

        const problems = analysis.analysis?.problems ?? [];
        if (problems.length > 0) {
            return i18n.t('server:features.mclogs.issues_found', { count: problems.length });
        }

        return i18n.t('server:features.mclogs.no_issues_found');
    };

    const getCardType = (): 'warning' | 'danger' => {
        if (analyzing) return 'warning';
        if (error) return 'danger';
        if (!analysis) return 'warning';
        const problems = analysis.analysis?.problems ?? [];
        return problems.length > 0 ? 'danger' : 'warning';
    };

    const canViewAnalysis = analysis && !error && !analyzing;

    return (
        <>
            <div className='bg-gradient-to-b from-[#ffffff08] to-[#ffffff05] border-[1px] border-[#ffffff12] rounded-xl p-3 sm:p-4 hover:border-[#ffffff20] transition-all duration-150 shadow-sm'>
                <Alert type={getCardType()}>
                    <div className='flex items-center justify-between gap-3'>
                        <div className='flex-1'>
                            <p className='font-medium text-sm'>{i18n.t('server:features.mclogs.crash_analysis')}</p>
                            <p className='text-sm mt-1'>{getCardMessage()}</p>
                        </div>
                        <div className='flex items-center gap-2 flex-shrink-0'>
                            {canViewAnalysis && (
                                <ActionButton variant='secondary' onClick={() => setModalVisible(true)} size='sm'>
                                    {i18n.t('server:features.mclogs.view_details')}
                                </ActionButton>
                            )}
                            <ActionButton variant='secondary' onClick={dismissCard} size='sm'>
                                {i18n.t('server:features.mclogs.dismiss')}
                            </ActionButton>
                        </div>
                    </div>
                </Alert>
            </div>

            {/* Analysis Modal */}
            {modalVisible && (
                <AnalysisModal
                    visible={modalVisible}
                    onClose={() => setModalVisible(false)}
                    analysis={analysis}
                    error={error}
                    analyzing={analyzing}
                />
            )}
        </>
    );
};

// Analysis Modal Component
const AnalysisModal = ({
    visible,
    onClose,
    analysis,
    error,
    analyzing,
}: {
    visible: boolean;
    onClose: () => void;
    analysis: MclogsInsight | null;
    error: Error | null;
    analyzing: boolean;
}) => {
    const { manualAnalyze } = useLogAnalysis();

    const closeModal = () => {
        if (analyzing) return;
        onClose();
    };

    // Render loading state
    const renderLoadingState = () => (
        <div className='flex flex-col items-center justify-center py-12' aria-busy='true'>
            <Spinner size='large' />
            <h3 className='text-lg font-medium text-neutral-200 mt-4'>
                {i18n.t('server:features.mclogs.analyzing_title')}
            </h3>
            <p className='text-neutral-400 mt-2 text-center max-w-md'>
                {i18n.t('server:features.mclogs.analyzing_description')}
            </p>
        </div>
    );

    // Render error state
    const renderErrorState = () => (
        <div className='space-y-6'>
            <div className='bg-red-500/10 border border-red-500/20 rounded-lg p-4'>
                <div className='flex items-start gap-3'>
                    <TriangleExclamation
                        width={22}
                        height={22}
                        className='w-6 h-6 text-red-400 flex-shrink-0 mt-0.5'
                        fill='currentColor'
                    />
                    <div className='flex-1'>
                        <h3 className='font-semibold text-red-400 text-lg'>
                            {i18n.t('server:features.mclogs.failed_title')}
                        </h3>
                        <p className='text-neutral-300 mt-2'>{error?.message}</p>
                        {error instanceof NoLogContentError && (
                            <p className='text-neutral-400 mt-3 text-sm'>
                                {i18n.t('server:features.mclogs.failed_description')}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    // Render server information header
    const renderServerInfo = () => {
        if (!analysis) return null;

        const information = analysis.analysis?.information ?? [];
        const serverVersion = analysis.version;
        const serverType = analysis.title;

        return (
            <div className='bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6'>
                <div className='flex items-center justify-between mb-3'>
                    <h3 className='text-lg font-semibold text-blue-400'>
                        {i18n.t('server:features.mclogs.server_info')}
                    </h3>
                    <a
                        href='https://mclo.gs'
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1.5 transition-colors'
                    >
                        <Link width={22} height={22} className='w-4 h-4' />
                        {i18n.t('server:features.mclogs.powered_by')}
                    </a>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                    <div className='bg-blue-500/5 rounded-lg p-3'>
                        <p className='text-blue-400 font-medium text-sm mb-1'>
                            {i18n.t('server:features.mclogs.server_type')}
                        </p>
                        <p className='text-neutral-200'>
                            {serverType} {serverVersion}
                        </p>
                    </div>

                    {information.slice(0, 3).map((info, idx) => (
                        <div key={idx} className='bg-blue-500/5 rounded-lg p-3'>
                            <p className='text-blue-400 font-medium text-sm mb-1'>{info.label}</p>
                            <p className='text-neutral-200 break-all'>{info.value}</p>
                        </div>
                    ))}
                </div>

                {information.length > 3 && (
                    <details className='mt-3'>
                        <summary className='text-blue-400 text-sm cursor-pointer hover:text-blue-300 transition-colors'>
                            {i18n.t('server:features.mclogs.show_more', { count: information.length - 3 })}
                        </summary>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-3 mt-3'>
                            {information.slice(3).map((info, idx) => (
                                <div key={idx} className='bg-blue-500/5 rounded-lg p-3'>
                                    <p className='text-blue-400 font-medium text-sm mb-1'>{info.label}</p>
                                    <p className='text-neutral-200 break-all'>{info.value}</p>
                                </div>
                            ))}
                        </div>
                    </details>
                )}
            </div>
        );
    };

    // Render errors section
    const renderErrors = () => {
        if (!analysis) return null;

        const problems = analysis.analysis?.problems ?? [];

        if (problems.length === 0) {
            return (
                <div className='bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-6'>
                    <div className='flex items-start gap-3'>
                        <Check
                            width={22}
                            height={22}
                            className='w-6 h-6 text-green-400 flex-shrink-0 mt-0.5'
                            fill='currentColor'
                        />
                        <div>
                            <h3 className='font-semibold text-green-400 text-lg'>
                                {i18n.t('server:features.mclogs.no_issues_title')}
                            </h3>
                            <p className='text-neutral-300 mt-2'>
                                {i18n.t('server:features.mclogs.no_issues_description')}
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className='space-y-4 mb-6'>
                <h3 className='text-lg font-semibold text-red-400'>
                    {i18n.t('server:features.mclogs.issues_header', { count: problems.length })}
                </h3>

                <div className='space-y-3'>
                    {problems.map((problem, idx) => (
                        <div key={idx} className='bg-red-500/10 border border-red-500/20 rounded-lg overflow-hidden'>
                            <div className='p-4'>
                                <div className='flex items-start gap-3'>
                                    <TriangleExclamation
                                        width={22}
                                        height={22}
                                        className='w-5 h-5 text-red-400 flex-shrink-0 mt-0.5'
                                        fill='currentColor'
                                    />
                                    <div className='flex-1'>
                                        <h4 className='font-medium text-red-400 mb-2'>{problem.message}</h4>

                                        {!!problem.entry?.lines?.length && (
                                            <div className='bg-red-500/5 border border-red-500/10 rounded-lg p-3 mb-3'>
                                                <p className='text-red-400/70 text-sm mb-2 font-medium'>
                                                    {i18n.t('server:features.mclogs.error_log')}
                                                </p>
                                                <div className='max-h-40 overflow-y-auto font-mono text-sm space-y-1'>
                                                    {problem.entry.lines.map((line, lineIdx) => (
                                                        <div key={lineIdx} className='flex'>
                                                            <span className='text-red-500/50 mr-3 select-none w-10 text-right flex-shrink-0'>
                                                                {line.number}
                                                            </span>
                                                            <span className='text-red-300/90 break-all'>
                                                                {line.content}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // Render recommendations section
    const renderRecommendations = () => {
        if (!analysis) return null;

        const problems = analysis.analysis?.problems ?? [];
        const allSolutions = problems.flatMap((problem) => problem.solutions || []);

        if (allSolutions.length === 0) return null;

        return (
            <div className='space-y-4'>
                <h3 className='text-lg font-semibold text-green-400'>
                    {i18n.t('server:features.mclogs.solutions_header', { count: allSolutions.length })}
                </h3>

                <div className='bg-green-500/10 border border-green-500/20 rounded-lg p-4'>
                    <div className='space-y-3'>
                        {allSolutions.map((solution, idx) => (
                            <div key={idx} className='flex items-start gap-3'>
                                <div className='bg-green-500/20 rounded-full p-1 flex-shrink-0 mt-0.5'>
                                    <Check
                                        width={22}
                                        height={22}
                                        className='w-4 h-4 text-green-400'
                                        fill='currentColor'
                                    />
                                </div>
                                <div className='flex-1'>
                                    <p className='text-neutral-200 leading-relaxed'>{solution.message}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    // Main content renderer
    const renderContent = () => {
        if (analyzing) return renderLoadingState();
        if (error) return renderErrorState();
        if (!analysis) {
            return (
                <div className='text-center py-12'>
                    <p className='text-neutral-400'>{i18n.t('server:features.mclogs.no_data')}</p>
                </div>
            );
        }

        return (
            <div className='space-y-6'>
                {renderServerInfo()}
                {renderErrors()}
                {renderRecommendations()}
            </div>
        );
    };

    return (
        <Modal
            visible={visible}
            onDismissed={closeModal}
            closeOnBackground={!analyzing}
            title={i18n.t('server:features.mclogs.modal_title')}
            showSpinnerOverlay={false}
        >
            <div className='w-full max-w-4xl'>
                {renderContent()}

                <div className='flex justify-center gap-3 mt-8 pt-4 border-t border-neutral-700'>
                    <ActionButton variant='secondary' onClick={manualAnalyze} disabled={analyzing}>
                        {analyzing
                            ? i18n.t('server:features.mclogs.analyzing_button')
                            : i18n.t('server:features.mclogs.analyze_again')}
                    </ActionButton>
                    <ActionButton variant='primary' onClick={closeModal} disabled={analyzing}>
                        {i18n.t('strings:close')}
                    </ActionButton>
                </div>
            </div>
        </Modal>
    );
};
