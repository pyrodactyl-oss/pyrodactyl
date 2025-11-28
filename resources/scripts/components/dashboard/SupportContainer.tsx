import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/elements/Accordion';
import { cn } from '@/lib/utils';

type Faq = {
    q: string;
    a: React.ReactNode;
};

const faqs: Faq[] = [
    {
        q: 'How do I create a server?',
        a: 'Go to Your Servers > Create Server, choose an egg, location, and resources, then confirm.',
    },
    {
        q: 'Why can’t my server start?',
        a: 'Common causes: insufficient memory/disk, missing startup variables, or the node is under maintenance. Check the console and allocations first.',
    },
    {
        q: 'How do I enable 2FA?',
        a: 'Open Settings > Multi-Factor Authentication. Scan the QR code with your authenticator app and enter the code.',
    },
    {
        q: 'How does billing work?',
        a: 'Open Billing to view balance and invoices. Add funds there. Some charges may be prorated depending on your plan.',
    },
];

const SupportContainer = () => {
    return (
        <div
            className='m-15 transform-gpu skeleton-anim-2'
            style={{
                animationDelay: '50ms',
                animationTimingFunction:
                    'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
            }}
        >
            <div className='flex items-center gap-4 flex-wrap min-w-0 flex-1'>
                <h1 className='text-2xl sm:text-3xl md:text-4xl lg:text-[52px] font-extrabold leading-[98%] tracking-[-0.02em] sm:tracking-[-0.06em] md:tracking-[-0.14rem] break-words mb-6'>
                    Frequently Asked Questions
                </h1>
            </div>

            <div className='w-full h-full min-h-full flex-1 flex flex-col px-2 sm:px-0'>
                <div
                    className='transform-gpu skeleton-anim-2'
                    style={{
                        animationDelay: '50ms',
                        animationTimingFunction:
                            'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                    }}
                >
                    <Accordion
                        type='single'
                        collapsible
                        className='flex flex-col'
                        // defaultValue="item-0" // uncomment if you want the first item open by default
                    >
                        {faqs.map((item, i) => (
                            <AccordionItem
                                key={i}
                                value={`item-${i}`}
                                className={cn(
                                    // Base look: subtle divider lines that match your DS
                                    'border-white/10',
                                    // Optional: add background hover to the trigger via trigger class
                                )}
                            >
                                <AccordionTrigger className='px-4 py-4 hover:underline'>
                                    <span className='text-white text-sm'>{item.q}</span>
                                </AccordionTrigger>
                                <AccordionContent className='px-4 text-zinc-300'>{item.a}</AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                    <div className='flex items-center gap-4 flex-wrap min-w-0 flex-1'>
                        <h1 className='text-md font-semibold leading-[98%] mt-6'>
                            For more information, visit our{' '}
                            <a href='/docs' className='text-blue-500 underline'>
                                documentation
                            </a>
                        </h1>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SupportContainer;
