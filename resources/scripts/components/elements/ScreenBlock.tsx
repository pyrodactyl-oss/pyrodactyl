import { Link } from 'react-router-dom';

const ScreenBlock = ({ title, message }) => (
    <>
        <div className='mx-auto flex h-full w-full max-w-3xl items-center gap-12 p-8'>
            <div className='flex max-w-sm flex-col gap-8 text-left'>
                <h1 className='font-extrabold text-[32px] leading-[98%] tracking-[-0.11rem]'>{title}</h1>
                <p className=''>{message}</p>
            </div>
        </div>
    </>
);

const ServerError = ({ title, message }) => (
    <>
        <div className='mx-auto flex h-full w-full max-w-3xl items-center gap-12 p-8'>
            <div className='flex max-w-sm flex-col gap-8 text-left'>
                <h1 className='font-extrabold text-[32px] leading-[98%] tracking-[-0.11rem]'>{title}</h1>
                <p className=''>{message}</p>
            </div>
        </div>
    </>
);

const NotFound = () => (
    <>
        <div className='mx-auto flex h-full w-full max-w-3xl items-center gap-12 p-8'>
            <div className='flex max-w-sm flex-col gap-8 text-left'>
                <h1 className='font-extrabold text-[32px] leading-[98%] tracking-[-0.11rem]'>Page Not Found</h1>
                <p className=''>
                    We couldn&apos;t find the page you&apos;re looking for. You may have lost access, or the page may
                    have been removed. Here are some helpful links instead:
                </p>
                <div className='flex flex-col gap-2'>
                    <Link className='text-brand' to={'/'}>
                        Your Servers
                    </Link>
                </div>
            </div>
            <img
                alt=''
                className='w-64 rounded-2xl'
                decoding='async'
                height='256'
                loading='lazy'
                src='https://media.tenor.com/scX-kVPwUn8AAAAC/this-is-fine.gif'
                width='256'
            />
        </div>
    </>
);

export { NotFound, ServerError };
export default ScreenBlock;
