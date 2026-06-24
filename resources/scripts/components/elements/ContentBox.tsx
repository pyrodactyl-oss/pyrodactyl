import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import FlashMessageRender from '@/components/FlashMessageRender';

type Props = Readonly<
    React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> & {
        title?: string;
        borderColor?: string;
        showFlashes?: string | boolean;
        showLoadingOverlay?: boolean;
    }
>;

const ContentBox = ({ title, showFlashes, showLoadingOverlay, children, ...props }: Props) => (
    <div className='rounded-xl border-[1px] border-mocha-400 bg-mocha-500 p-8 shadow-xs' {...props}>
        {title && <h2 className={'mb-4 font-extrabold text-2xl'}>{title}</h2>}
        {showFlashes && <FlashMessageRender byKey={typeof showFlashes === 'string' ? showFlashes : undefined} />}
        <div>
            <SpinnerOverlay visible={showLoadingOverlay} />
            {children}
        </div>
    </div>
);

export default ContentBox;
