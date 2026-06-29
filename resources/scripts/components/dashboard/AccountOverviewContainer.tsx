import { ChevronDown, Globe } from '@gravity-ui/icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';

import MessageBox from '@/components/MessageBox';
import ConfigureTwoFactorForm from '@/components/dashboard/forms/ConfigureTwoFactorForm';
import UpdateEmailAddressForm from '@/components/dashboard/forms/UpdateEmailAddressForm';
import UpdatePasswordForm from '@/components/dashboard/forms/UpdatePasswordForm';
import ContentBox from '@/components/elements/ContentBox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/elements/DropdownMenu';
import PageContentBlock from '@/components/elements/PageContentBlock';

import i18n, { LANGUAGE_NAMES, loadTranslations, supportedLanguages } from '@/lib/i18n';

import updateAccountLanguage from '@/api/account/updateAccountLanguage';

import { useStoreActions, useStoreState } from '@/state/hooks';

import Code from '../elements/Code';

const AccountOverviewContainer = () => {
    const { t } = useTranslation('dashboard');
    const { state } = useLocation();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const language = useStoreState((s) => s.user.data!.language);
    const updateUserData = useStoreActions((a) => a.user.updateUserData);

    const handleLanguageChange = (newLang: string) => {
        setIsSubmitting(true);
        updateAccountLanguage(newLang)
            .then(() => loadTranslations(newLang))
            .then(() => {
                updateUserData({ language: newLang });
                i18n.changeLanguage(newLang);
            })
            .then(() => {
                toast.success(i18n.t('dashboard:language.updated'));
            })
            .catch(() => {
                toast.error(i18n.t('dashboard:language.error'));
            })
            .finally(() => setIsSubmitting(false));
    };

    return (
        <PageContentBlock title={t('your_settings')}>
            <div className='w-full h-full min-h-full flex-1 flex flex-col px-2 sm:px-0'>
                {state?.twoFactorRedirect && (
                    <div
                        className='transform-gpu skeleton-anim-2 mb-3 sm:mb-4'
                        style={{
                            animationDelay: '25ms',
                            animationTimingFunction:
                                'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                        }}
                    >
                        <MessageBox title={t('two_factor_required')} type={'error'}>
                            {t('two_factor_required_message')}
                        </MessageBox>
                    </div>
                )}

                <div className='flex flex-col w-full h-full gap-4'>
                    <div
                        className='transform-gpu skeleton-anim-2'
                        style={{
                            animationDelay: '50ms',
                            animationTimingFunction:
                                'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                        }}
                    >
                        <ContentBox title={t('email.label')} showFlashes={'account:email'}>
                            <UpdateEmailAddressForm />
                        </ContentBox>
                    </div>

                    <div
                        className='transform-gpu skeleton-anim-2'
                        style={{
                            animationDelay: '75ms',
                            animationTimingFunction:
                                'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                        }}
                    >
                        <div className='space-y-4'>
                            <ContentBox title={t('password_form.current_label')} showFlashes={'account:password'}>
                                <UpdatePasswordForm />
                            </ContentBox>
                            <ContentBox title={t('multi_factor_auth')}>
                                <ConfigureTwoFactorForm />
                            </ContentBox>
                        </div>
                    </div>

                    <div
                        className='transform-gpu skeleton-anim-2'
                        style={{
                            animationDelay: '87ms',
                            animationTimingFunction:
                                'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                        }}
                    >
                        <ContentBox title={t('language.title')} showFlashes={'account:language'}>
                            <p className='text-sm mb-4 text-zinc-300'>{t('language.description')}</p>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        className='inline-flex h-9 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md bg-[#ffffff11] px-3 py-1.5 text-sm font-medium text-[#ffffff88] transition-all hover:bg-[#ffffff23] hover:text-[#ffffff] focus-visible:outline-hidden'
                                        disabled={isSubmitting}
                                    >
                                        <Globe width={20} height={21} color='white' />
                                        <div>{LANGUAGE_NAMES[language] || language}</div>
                                        <ChevronDown width={13} height={13} color='white' />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className='z-99999' sideOffset={8}>
                                    {supportedLanguages.filter((l) => l !== language).map((lang) => (
                                        <DropdownMenuItem
                                            key={lang}
                                            onSelect={() => handleLanguageChange(lang)}
                                        >
                                            {LANGUAGE_NAMES[lang]}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </ContentBox>
                    </div>

                    <div
                        className='transform-gpu skeleton-anim-2'
                        style={{
                            animationDelay: '100ms',
                            animationTimingFunction:
                                'linear(0,0.01,0.04 1.6%,0.161 3.3%,0.816 9.4%,1.046,1.189 14.4%,1.231,1.254 17%,1.259,1.257 18.6%,1.236,1.194 22.3%,1.057 27%,0.999 29.4%,0.955 32.1%,0.942,0.935 34.9%,0.933,0.939 38.4%,1 47.3%,1.011,1.017 52.6%,1.016 56.4%,1 65.2%,0.996 70.2%,1.001 87.2%,1)',
                        }}
                    >
                        <ContentBox title={t('panel_version')}>
                            <p className='text-sm mb-4 text-zinc-300'>{t('version_info')}</p>
                            <div className='flex flex-col gap-4'>
                                <Code>
                                    {t('version')}: {import.meta.env.VITE_PYRODACTYL_VERSION} -{' '}
                                    {import.meta.env.VITE_BRANCH_NAME}
                                </Code>
                                <Code>
                                    {t('commit')}: {import.meta.env.VITE_COMMIT_HASH.slice(0, 7)}
                                </Code>
                            </div>
                        </ContentBox>
                    </div>
                </div>
            </div>
        </PageContentBlock>
    );
};

export default AccountOverviewContainer;
