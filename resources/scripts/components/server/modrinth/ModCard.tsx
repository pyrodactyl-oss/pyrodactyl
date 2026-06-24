'use client';

import { ArrowDownToLine } from '@gravity-ui/icons';
import { Link } from 'react-router-dom';
import Button from '@/components/elements/ButtonV2';

// import { ServerContext } from '@/state/server';

import type { Mod } from './config';

interface ModCardProps {
    mod: Mod;
}

export const ModCard = ({ mod }: ModCardProps) => {
    // const eggFeatures = ServerContext.useStoreState((state) => state.server.data?.eggFeatures);
    const formatDownloads = (num: number) => {
        if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    return (
        <div className='group overflow-hidden rounded-xl border border-gray-800/70 bg-gradient-to-br from-[#090909] via-[#0f0f0f] to-[#131313] backdrop-blur-sm transition transition-all delay-50 duration-300 duration-325 hover:border-brand/60 hover:shadow-2xl hover:shadow-brand/15'>
            <div className='flex items-start space-x-5 p-6'>
                {/* Icon Container */}
                <div className='relative flex-shrink-0 transition-transform duration-300 hover:scale-105 hover:cursor-pointer'>
                    {mod.icon_url ? (
                        <div className='relative'>
                            <a href={`${mod.id}`}>
                                <img
                                    alt={mod.title}
                                    className='h-20 w-20 rounded-xl border border-gray-700/50 object-cover shadow-lg transition-transform duration-300 group-hover:scale-105'
                                    src={mod.icon_url}
                                />
                            </a>
                            <div className='absolute inset-0 rounded-xl bg-gradient-to-t from-black/30 to-transparent' />
                        </div>
                    ) : (
                        <div className='flex h-20 w-20 items-center justify-center rounded-xl border border-gray-700/30 bg-gradient-to-br from-[#131313] to-[#1a1a1a] shadow-inner'>
                            <span className='font-medium text-gray-400 text-sm'>No Icon</span>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className='min-w-0 flex-1 space-y-3'>
                    <div>
                        <Link
                            className='line-clamp-1 font-bold text-white text-xl transition-colors duration-200 hover:text-brand/50 group-hover:underline'
                            to={`${mod.id}`}
                        >
                            {mod.title}
                        </Link>
                        <p className='mt-1 font-medium text-gray-400 text-sm'>by {mod.author}</p>
                    </div>

                    <p className='line-clamp-2 text-gray-500 text-sm leading-relaxed'>{mod.description}</p>

                    {/* Stats */}
                    <div className='flex items-center space-x-6 text-sm'>
                        <div className='flex items-center space-x-2 text-gray-400'>
                            <svg className='h-4 w-4 text-brand' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path
                                    d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4'
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                />
                            </svg>
                            <span className='font-semibold text-gray-300'>
                                downloads: {formatDownloads(mod.downloads)}
                            </span>
                        </div>

                        <div className='flex items-center space-x-2 text-gray-400'>
                            <svg
                                className='h-4 w-4 text-green-400'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                            >
                                <path d='M5 13l4 4L19 7' strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} />
                            </svg>
                            <span className='font-semibold text-gray-300'>latest: {mod.latest_version}</span>
                        </div>
                    </div>
                </div>

                <div className='flex-shrink-0 self-center align-text-left'>
                    <Button className='rounded-md border-2 border-gray-500/70 transition delay-50 duration-325 hover:border-brand/50 hover:text-gray-200'>
                        <ArrowDownToLine className='px-1' height={22} width={22} />
                        Install
                    </Button>
                </div>
            </div>
        </div>
    );
};
