import { useState } from 'react';

import { BillingInvoice, BillingInvoiceRow } from '@/components/dashboard/BillingInvoiceRow';
import { BillingService, BillingServiceRow } from '@/components/dashboard/BillingServiceRow';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import PageContentBlock from '@/components/elements/PageContentBlock';
import { PageListContainer } from '@/components/elements/pages/PageList';

const BillingContainer = () => {
    // Placeholder demo data; replace with your API data
    const [services, setServices] = useState<BillingService[]>([
        {
            id: 'sub_123',
            externalId: 'sub_123',
            name: 'Minecraft Server - 4GB',
            planName: 'Plus',
            priceAmount: 9.99,
            priceFormatted: '$9.99',
            currency: 'USD',
            interval: 'month',
            status: 'active',
            nextRenewalAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 20).toISOString(),
            manageUrl: '/billing/services/sub_123',
            canCancel: true,
        },
        {
            id: 'sub_456',
            externalId: 'sub_456',
            name: 'Web Hosting - Personal',
            planName: 'Starter',
            priceAmount: 4.0,
            priceFormatted: '$4.00',
            currency: 'USD',
            interval: 'month',
            status: 'past_due',
            nextRenewalAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString(),
            manageUrl: '/billing/services/sub_456',
            canCancel: true,
        },
    ]);

    const [invoices] = useState<BillingInvoice[]>([
        {
            id: 'inv_001',
            number: '0001',
            date: new Date().toISOString(),
            amount: 9.99,
            currency: 'USD',
            status: 'paid',
            downloadUrl: '#',
        },
        {
            id: 'inv_002',
            number: '0002',
            date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
            amount: 4.0,
            currency: 'USD',
            status: 'open',
            downloadUrl: '#',
        },
    ]);

    const onCancel = async (id: string) => {
        // Wire to your billing API here (e.g., POST /api/billing/subscriptions/:id/cancel)
        setServices((prev) => prev.map((s) => (s.id === id ? { ...s, status: 'canceled', canCancel: false } : s)));
    };

    const onResume = async (id: string) => {
        // Wire to your billing API here (e.g., POST /api/billing/subscriptions/:id/resume)
        setServices((prev) => prev.map((s) => (s.id === id ? { ...s, status: 'active', canCancel: true } : s)));
    };

    return (
        <div
            className='transform-gpu skeleton-anim-2 mb-3 sm:mb-4'
            style={{
                animationDelay: '50ms',
                animationTimingFunction:
                    'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
            }}
        >
            <PageContentBlock title={'Billing'} showFlashKey={'billing'}>
                <div
                    className='transform-gpu skeleton-anim-2 mb-3 sm:mb-4'
                    style={{
                        animationDelay: '50ms',
                        animationTimingFunction:
                            'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                    }}
                >
                    <MainPageHeader title='Active Services' />
                    <PageListContainer className='p-4 flex flex-col gap-3'>
                        {services.length === 0 ? (
                            <div className='p-4 text-sm text-white/70'>No active services yet.</div>
                        ) : (
                            services.map((s) => (
                                <BillingServiceRow key={s.id} service={s} onCancel={onCancel} onResume={onResume} />
                            ))
                        )}
                    </PageListContainer>
                </div>

                <div aria-hidden className='mt-16 mb-16 bg-[#ffffff33] min-h-[1px] w-full'></div>

                <div
                    className='transform-gpu skeleton-anim-2 mb-3 sm:mb-4'
                    style={{
                        animationDelay: '50ms',
                        animationTimingFunction:
                            'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                    }}
                >
                    <MainPageHeader title='Billing & Invoices' />
                    <PageListContainer className='p-4 flex flex-col gap-3'>
                        {invoices.length === 0 ? (
                            <div className='p-4 text-sm text-white/70'>No invoices yet.</div>
                        ) : (
                            invoices.map((inv) => <BillingInvoiceRow key={inv.id} invoice={inv} />)
                        )}
                    </PageListContainer>
                </div>
            </PageContentBlock>
        </div>
    );
};

export default BillingContainer;
