import { useEffect } from 'react';

const HostingContainer = () => {
    useEffect(() => {
        document.title = 'Hosting | Pyrodactyl';
    }, []);

    return (
        <div className='relative w-full h-full overflow-y-auto overflow-x-hidden rounded-md bg-[#08080875] p-8'>
            <div className='max-w-[120rem] w-full mx-auto'>
                <h1 className='text-2xl font-bold text-white mb-4'>Hosting</h1>
                <p className='text-gray-400'>Hosting page content goes here.</p>
            </div>
        </div>
    );
};

export default HostingContainer;
