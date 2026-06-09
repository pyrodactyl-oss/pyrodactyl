import { Box } from '@gravity-ui/icons';

interface Props {
    reason: string;
}

const DetectionEmptyState = ({ reason }: Props) => {
    return (
        <div className='flex flex-col items-center justify-center min-h-[60vh] py-12 px-4'>
            <div className='text-center max-w-xl'>
                <div className='w-16 h-16 mx-auto mb-4 rounded-full bg-[#ffffff11] flex items-center justify-center'>
                    <Box className='w-8 h-8 text-zinc-400' fill='currentColor' />
                </div>
                <h3 className='text-lg font-medium text-zinc-200 mb-2'>Mod manager unavailable</h3>
                <p className='text-sm text-zinc-400 leading-relaxed'>{reason}</p>
            </div>
        </div>
    );
};

export default DetectionEmptyState;
