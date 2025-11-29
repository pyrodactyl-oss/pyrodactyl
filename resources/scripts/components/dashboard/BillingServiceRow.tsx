import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

type BillingStatus = 'active' | 'past_due' | 'canceled' | 'trialing' | 'incomplete' | 'paused';

export type BillingService = {
    id: string;
    externalId?: string;
    name: string;
    planName?: string;
    priceAmount: number;
    currency: string;
    interval: 'day' | 'week' | 'month' | 'year';
    status: BillingStatus;
    nextRenewalAt?: string;
    manageUrl?: string; // used only by the Manage button now
    canCancel?: boolean;
    canResume?: boolean;
    priceFormatted?: string;
};

const formatMoney = (amount: number, currency: string) =>
    new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);

const intervalLabel = (i: BillingService['interval']) => (i === 'month' ? 'mo' : i === 'year' ? 'yr' : i);

const StatusIndicatorBox = styled.div<{ $status: BillingStatus | undefined }>`
    background: #ffffff11;
    border: 1px solid #ffffff12;
    transition: all 250ms ease-in-out;
    padding: 1.75rem 2rem;
    cursor: default; /* no pointer cursor since row is not clickable */
    border-radius: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: relative;

    &:hover {
        border: 1px solid #ffffff19;
        background: #ffffff19;
        transition-duration: 0ms;
    }

    & .status-bar {
        width: 12px;
        height: 12px;
        min-width: 12px;
        min-height: 12px;
        background-color: #ffffff11;
        z-index: 20;
        border-radius: 9999px;
        transition: all 250ms ease-in-out;

        box-shadow: ${({ $status }) =>
            !$status || $status === 'canceled'
                ? '0 0 12px 1px #C74343'
                : $status === 'active' || $status === 'trialing'
                  ? '0 0 12px 1px #43C760'
                  : '0 0 12px 1px #c7aa43'};

        background: ${({ $status }) =>
            !$status || $status === 'canceled'
                ? `linear-gradient(180deg, #C74343 0%, #C74343 100%)`
                : $status === 'active' || $status === 'trialing'
                  ? `linear-gradient(180deg, #91FFA9 0%, #43C760 100%)`
                  : `linear-gradient(180deg, #c7aa43 0%, #c7aa43 100%)`};
    }
`;

const cardClass =
    'h-full hidden sm:flex items-center justify-between border-[1px] border-[#ffffff12] shadow-md rounded-lg w-fit whitespace-nowrap px-4 py-2 text-sm gap-4';

const cardStyle = {
    background: 'radial-gradient(124.75% 124.75% at 50.01% -10.55%, rgb(36, 36, 36) 0%, rgb(20, 20, 20) 100%)',
    minWidth: '360px',
} as const;

function statusLabel(status: BillingStatus) {
    switch (status) {
        case 'active':
            return 'Active';
        case 'trialing':
            return 'Trial';
        case 'past_due':
            return 'Past Due';
        case 'canceled':
            return 'Canceled';
        case 'paused':
            return 'Paused';
        case 'incomplete':
            return 'Incomplete';
        default:
            return status;
    }
}

export function BillingServiceRow({
    service,
    className,
    isEditMode = false,
    onCancel,
    onResume,
}: {
    service: BillingService;
    className?: string;
    isEditMode?: boolean;
    onCancel?: (serviceId: string) => Promise<void> | void;
    onResume?: (serviceId: string) => Promise<void> | void;
}) {
    const price = service.priceFormatted ?? formatMoney(service.priceAmount, service.currency.toUpperCase());

    const planText = service.planName ? service.planName : 'Standard';
    const intervalText = intervalLabel(service.interval);

    const nextRenewal = service.nextRenewalAt
        ? new Date(service.nextRenewalAt).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
          })
        : undefined;

    const handleCancel = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (!onCancel) return;
        await onCancel(service.id);
    };

    const handleResume = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (!onResume) return;
        await onResume(service.id);
    };

    return (
        <StatusIndicatorBox
            className={className}
            $status={service.status}
            style={isEditMode ? { pointerEvents: 'none' } : undefined}
        >
            <div className='flex items-center'>
                <div className='flex flex-col'>
                    <div className='flex items-center gap-2'>
                        <p className='text-xl tracking-tight font-bold break-words'>{service.name}</p>
                        <div className='status-bar' />
                        <span className='ml-2 text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-white/80'>
                            {statusLabel(service.status)}
                        </span>
                    </div>

                    <div className='mt-1 flex items-center gap-2 text-sm text-[#ffffff66]'>
                        <span>
                            {planText} • {price}/{intervalText}
                        </span>
                        {nextRenewal && (
                            <>
                                <span className='opacity-60'>•</span>
                                <span>Renews on {nextRenewal}</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div style={cardStyle} className={cardClass}>
                <div className='flex items-center justify-between w-full gap-3'>
                    <span className='text-xs text-zinc-300'>
                        {service.status === 'past_due'
                            ? 'Payment required'
                            : service.status === 'canceled'
                              ? 'Subscription canceled'
                              : service.status === 'trialing'
                                ? 'Trial in progress'
                                : 'Manage your subscription'}
                    </span>

                    <div className='flex items-center gap-2'>
                        {service.status !== 'canceled' && (
                            <Link
                                to={service.manageUrl || '#'}
                                onClick={(e) => {
                                    if (!service.manageUrl) e.preventDefault();
                                }}
                                className='inline-flex items-center gap-2 rounded-full bg-[#3f3f46] hover:bg-[#52525b] text-white px-3 py-1.5 text-xs font-semibold transition-colors'
                                aria-label='Manage subscription'
                            >
                                Manage
                            </Link>
                        )}
                        {service.canCancel && service.status !== 'canceled' && (
                            <button
                                onClick={handleCancel}
                                className='inline-flex items-center gap-2 rounded-full bg-[#3f3f46] hover:bg-[#52525b] text-white px-3 py-1.5 text-xs font-semibold transition-colors'
                            >
                                Cancel
                            </button>
                        )}
                        {service.canResume && service.status === 'paused' && (
                            <button
                                onClick={handleResume}
                                className='inline-flex items-center gap-2 rounded-full bg-[#3f3f46] hover:bg-[#52525b] text-white px-3 py-1.5 text-xs font-semibold transition-colors'
                            >
                                Resume
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </StatusIndicatorBox>
    );
}
