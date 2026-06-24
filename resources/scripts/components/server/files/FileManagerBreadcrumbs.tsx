import { Fragment, useEffect, useState } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { encodePathSegments } from '@/helpers';

import { ServerContext } from '@/state/server';

interface Props {
    isNewFile?: boolean;
    renderLeft?: JSX.Element;
    withinFileEditor?: boolean;
}

const FileManagerBreadcrumbs = ({ renderLeft, withinFileEditor, isNewFile }: Props) => {
    const id = ServerContext.useStoreState((state) => state.server.data!.id);
    const directory = ServerContext.useStoreState((state) => state.files.directory);

    const params = useParams<'*'>();

    const [file, setFile] = useState<string>();

    useEffect(() => {
        if (!withinFileEditor || isNewFile) {
            return;
        }

        if (withinFileEditor && params['*'] !== undefined && !isNewFile) {
            setFile(decodeURIComponent(params['*']).split('/').pop());
        }
    }, [withinFileEditor, isNewFile]);

    const breadcrumbs = (): { name: string; path?: string }[] => {
        if (directory === '.') {
            return [];
        }

        return directory
            .split('/')
            .filter((directory) => !!directory)
            .map((directory, index, dirs) => {
                if (!withinFileEditor && index === dirs.length - 1) {
                    return { name: directory };
                }

                return {
                    name: directory,
                    path: `/${dirs.slice(0, index + 1).join('/')}`,
                };
            });
    };

    return (
        <div className={'group flex grow-0 select-none items-center overflow-x-hidden text-sm'}>
            {renderLeft || <div className={'w-12'} />}
            <NavLink className={'px-1 text-zinc-200 no-underline hover:text-zinc-100'} to={`/server/${id}/files`}>
                root
            </NavLink>
            <svg
                className='h-3 w-3'
                fill='none'
                stroke='currentColor'
                strokeWidth={1.5}
                viewBox='0 0 24 24'
                xmlns='http://www.w3.org/2000/svg'
            >
                <path d='m8.25 4.5 7.5 7.5-7.5 7.5' strokeLinecap='round' strokeLinejoin='round' />
            </svg>
            {breadcrumbs().map((crumb, index) =>
                crumb.path ? (
                    <Fragment key={index}>
                        <NavLink
                            className={'px-1 text-zinc-200 no-underline hover:text-zinc-100'}
                            to={`/server/${id}/files#${encodePathSegments(crumb.path)}`}
                        >
                            {crumb.name}
                        </NavLink>
                        <svg
                            className='h-3 w-3'
                            fill='none'
                            stroke='currentColor'
                            strokeWidth={1.5}
                            viewBox='0 0 24 24'
                            xmlns='http://www.w3.org/2000/svg'
                        >
                            <path d='m8.25 4.5 7.5 7.5-7.5 7.5' strokeLinecap='round' strokeLinejoin='round' />
                        </svg>
                    </Fragment>
                ) : (
                    <span className={'px-1 text-zinc-300'} key={index}>
                        {crumb.name}
                    </span>
                ),
            )}
            {file && (
                <Fragment>
                    <span className={'px-1 text-zinc-300'}>{file}</span>
                </Fragment>
            )}
        </div>
    );
};

export default FileManagerBreadcrumbs;
