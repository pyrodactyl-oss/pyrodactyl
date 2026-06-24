import styled from 'styled-components';

import Code from './elements/Code';

export type FlashMessageType = 'success' | 'info' | 'warning' | 'error';

interface Props {
    children: string;
    title?: string;
    type?: FlashMessageType;
}

const Container = styled.div<{ $type?: FlashMessageType }>``;
Container.displayName = 'MessageBox.Container';

const MessageBox = ({ title, children, type }: Props) => (
    <Container
        $type={type}
        className='mb-4 flex flex-col gap-2 rounded-2xl border-[2px] border-brand/70 bg-black p-4'
        role={'alert'}
    >
        {title && <h2 className='font-bold text-xl'>{title}</h2>}
        <Code>{children}</Code>
    </Container>
);
MessageBox.displayName = 'MessageBox';

export default MessageBox;
