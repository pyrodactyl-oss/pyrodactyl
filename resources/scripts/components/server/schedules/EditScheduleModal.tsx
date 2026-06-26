import ModalContext from '@/context/ModalContext';
import { TZDate } from '@date-fns/tz';
import { Link, TriangleExclamation } from '@gravity-ui/icons';
import ExpressionDescriptor, { toString } from 'cronstrue';
import { es } from 'cronstrue/locales/es';
import { format } from 'date-fns';
import { useStoreState } from 'easy-peasy';
import { Form, Formik, FormikHelpers } from 'formik';
import { useContext, useEffect, useMemo } from 'react';

import FlashMessageRender from '@/components/FlashMessageRender';
import ActionButton from '@/components/elements/ActionButton';
import Field from '@/components/elements/Field';
import FormikSwitchV2 from '@/components/elements/FormikSwitchV2';
import ItemContainer from '@/components/elements/ItemContainer';

import asModal from '@/hoc/asModal';

import i18n from '@/lib/i18n';

import { httpErrorToHuman } from '@/api/http';
import createOrUpdateSchedule from '@/api/server/schedules/createOrUpdateSchedule';
import { Schedule } from '@/api/server/schedules/getServerSchedules';

import { ServerContext } from '@/state/server';

import useFlash from '@/plugins/useFlash';

if (es) {
    ExpressionDescriptor.locales.es = new es();
}

interface Props {
    schedule?: Schedule;
}

interface Values {
    name: string;
    dayOfWeek: string;
    month: string;
    dayOfMonth: string;
    hour: string;
    minute: string;
    enabled: boolean;
    onlyWhenOnline: boolean;
}

const getTimezoneInfo = (serverTimezone: string) => {
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const now = new Date();

    const userOffsetString = format(now, 'xxx');
    let serverOffsetString: string;
    let offsetDifferenceMinutes = 0;

    let isServerTimezoneValid = true;
    try {
        const serverDate = new TZDate(now, serverTimezone);
        const userDate = new TZDate(now, userTimezone);
        serverOffsetString = format(serverDate, 'xxx');

        // offset difference in minutes
        const serverOffsetValue = serverDate.getTimezoneOffset();
        const userOffsetValue = userDate.getTimezoneOffset();

        // + values mean behind UTC
        // - values mean ahead of UTC
        offsetDifferenceMinutes = userOffsetValue - serverOffsetValue;
    } catch {
        serverOffsetString = i18n.t('server:schedules.unknown');
        isServerTimezoneValid = false;
    }

    let differenceDescription = '';
    if (!isServerTimezoneValid) {
        differenceDescription = i18n.t('server:schedules.unknown_difference');
    } else if (offsetDifferenceMinutes === 0) {
        differenceDescription = i18n.t('server:schedules.same_time');
    } else {
        const offsetDifferenceHours = offsetDifferenceMinutes / 60;
        const absDifferenceHours = Math.abs(offsetDifferenceHours);
        const isAhead = offsetDifferenceMinutes > 0;

        if (absDifferenceHours === Math.floor(absDifferenceHours)) {
            // whole hours
            const unit =
                absDifferenceHours === 1
                    ? i18n.t('server:schedules.timezone_hour')
                    : i18n.t('server:schedules.timezone_hours');
            differenceDescription = `${absDifferenceHours} ${unit} ${isAhead ? i18n.t('server:schedules.ahead_of') : i18n.t('server:schedules.behind')}`;
        } else {
            // hours & minutes
            const hours = Math.floor(absDifferenceHours);
            const minutes = Math.abs(offsetDifferenceMinutes % 60);

            if (hours > 0) {
                differenceDescription = `${hours}${i18n.t('server:console.hours_short')} ${minutes}${i18n.t('server:console.minutes_short')} ${isAhead ? i18n.t('server:schedules.ahead_of') : i18n.t('server:schedules.behind')}`;
            } else {
                const unit =
                    minutes === 1
                        ? i18n.t('server:schedules.timezone_minute')
                        : i18n.t('server:schedules.timezone_minutes');
                differenceDescription = `${minutes} ${unit} ${isAhead ? i18n.t('server:schedules.ahead_of') : i18n.t('server:schedules.behind')}`;
            }
        }
    }

    return {
        user: { timezone: userTimezone, offset: userOffsetString },
        server: { timezone: serverTimezone, offset: serverOffsetString },
        difference: differenceDescription,
        isDifferent: userTimezone !== serverTimezone,
        hasOffsetDifference: !isServerTimezoneValid || offsetDifferenceMinutes !== 0,
    };
};

const formatTimezoneDisplay = (timezone: string, offset: string) => {
    return `${timezone} (${offset})`;
};

const getCronDescription = (
    minute: string,
    hour: string,
    dayOfMonth: string,
    month: string,
    dayOfWeek: string,
): string => {
    try {
        // Build cron expression: minute hour dayOfMonth month dayOfWeek
        const cronExpression = `${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`;
        const description = toString(cronExpression, {
            throwExceptionOnParseError: false,
            verbose: true,
            locale: i18n.language === 'es' ? 'es' : undefined,
        });

        // Check if cronstrue returned an error message
        if (
            description ===
            'An error occurred when generating the expression description. Check the cron expression syntax.'
        ) {
            return i18n.t('server:schedules.invalid_cron');
        }

        return description;
    } catch {
        return i18n.t('server:schedules.invalid_cron');
    }
};

const EditScheduleModal = ({ schedule }: Props) => {
    const { addError, clearFlashes } = useFlash();
    const { dismiss, setPropOverrides } = useContext(ModalContext);

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const appendSchedule = ServerContext.useStoreActions((actions) => actions.schedules.appendSchedule);
    const serverTimezone = useStoreState(
        (state) => state.settings.data?.timezone || i18n.t('server:schedules.unknown'),
    );

    const timezoneInfo = useMemo(() => {
        return getTimezoneInfo(serverTimezone);
    }, [serverTimezone]);

    useEffect(() => {
        setPropOverrides({
            title: schedule ? i18n.t('server:schedules.edit_schedule') : i18n.t('server:schedules.create_new_schedule'),
        });
    }, []);

    useEffect(() => {
        return () => {
            clearFlashes('schedule:edit');
        };
    }, []);

    const submit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes('schedule:edit');
        createOrUpdateSchedule(uuid, {
            id: schedule?.id,
            name: values.name,
            cron: {
                minute: values.minute,
                hour: values.hour,
                dayOfWeek: values.dayOfWeek,
                month: values.month,
                dayOfMonth: values.dayOfMonth,
            },
            onlyWhenOnline: values.onlyWhenOnline,
            isActive: values.enabled,
        })
            .then((schedule) => {
                setSubmitting(false);
                appendSchedule(schedule);
                dismiss();
            })
            .catch((error) => {
                console.error(error);

                setSubmitting(false);
                addError({ key: 'schedule:edit', message: httpErrorToHuman(error) });
            });
    };

    return (
        <Formik
            onSubmit={submit}
            initialValues={
                {
                    name: schedule?.name || '',
                    minute: schedule?.cron.minute || '*/5',
                    hour: schedule?.cron.hour || '*',
                    dayOfMonth: schedule?.cron.dayOfMonth || '*',
                    month: schedule?.cron.month || '*',
                    dayOfWeek: schedule?.cron.dayOfWeek || '*',
                    enabled: schedule?.isActive ?? true,
                    onlyWhenOnline: schedule?.onlyWhenOnline ?? true,
                } as Values
            }
        >
            {({ isSubmitting, values }) => {
                const cronDescription = getCronDescription(
                    values.minute,
                    values.hour,
                    values.dayOfMonth,
                    values.month,
                    values.dayOfWeek,
                );

                return (
                    <Form>
                        <FlashMessageRender byKey={'schedule:edit'} />
                        <Field
                            name={'name'}
                            label={i18n.t('server:schedules.schedule_name')}
                            description={i18n.t('server:schedules.schedule_name_desc')}
                        />
                        <div className={`grid grid-cols-2 sm:grid-cols-5 gap-4 mt-6`}>
                            <Field name={'minute'} label={i18n.t('server:schedules.minute')} />
                            <Field name={'hour'} label={i18n.t('server:schedules.hour')} />
                            <Field name={'dayOfWeek'} label={i18n.t('server:schedules.day_of_week')} />
                            <Field name={'dayOfMonth'} label={i18n.t('server:schedules.day_of_month')} />
                            <Field name={'month'} label={i18n.t('server:schedules.month')} />
                        </div>

                        <div className={`mt-3 p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50`}>
                            <p className={`text-sm text-zinc-200 font-medium`}>{cronDescription}</p>
                        </div>

                        <p className={`text-zinc-400 text-xs mt-2`}>{i18n.t('server:schedules.cron_description')}</p>

                        {timezoneInfo.isDifferent && (
                            <div className={'bg-blue-900/20 border border-blue-400/30 rounded-lg p-4 my-2'}>
                                <div className={'flex items-start gap-3'}>
                                    <TriangleExclamation
                                        width={22}
                                        height={22}
                                        fill='currentColor'
                                        className={'text-blue-400 mt-0.5 flex-shrink-0 h-5 w-5'}
                                    />
                                    <div className={'text-sm'}>
                                        <p className={'text-blue-100 font-medium mb-1'}>
                                            {i18n.t('server:schedules.timezone_info')}
                                        </p>
                                        <p className={'text-blue-200/80 text-xs mb-2'}>
                                            {i18n.t('server:schedules.timezone_note')}
                                            {timezoneInfo.hasOffsetDifference && (
                                                <span className={'text-blue-100 font-medium'}>
                                                    {' '}
                                                    {i18n.t('server:schedules.server_is')} {timezoneInfo.difference}{' '}
                                                    {i18n.t('server:schedules.your_timezone')}
                                                </span>
                                            )}
                                        </p>
                                        <div className={'mt-2 text-xs space-y-1'}>
                                            <div className={'text-blue-200/60'}>
                                                {i18n.t('server:schedules.your_timezone')}
                                                <span className={'font-mono'}>
                                                    {' '}
                                                    {formatTimezoneDisplay(
                                                        timezoneInfo.user.timezone,
                                                        timezoneInfo.user.offset,
                                                    )}
                                                </span>
                                            </div>
                                            <div className={'text-blue-200/60'}>
                                                {i18n.t('server:schedules.server_timezone')}
                                                <span className={'font-mono'}>
                                                    {' '}
                                                    {formatTimezoneDisplay(
                                                        timezoneInfo.server.timezone,
                                                        timezoneInfo.server.offset,
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className='gap-3 my-6 flex flex-col'>
                            <a href='https://crontab.guru/' target='_blank' rel='noreferrer'>
                                <ItemContainer
                                    description={i18n.t('server:schedules.crontab_guru_desc')}
                                    title={i18n.t('server:schedules.crontab_guru')}
                                    // defaultChecked={showCheatsheet}
                                    // onChange={() => setShowCheetsheet((s) => !s)}
                                    labelClasses='cursor-pointer'
                                >
                                    <Link width={22} height={22} fill='currentColor' className={`px-5 h-5 w-5`} />
                                </ItemContainer>
                            </a>
                            {/* This table would be pretty awkward to make look nice
                            Maybe there could be an element for a dropdown later? */}
                            {/* {showCheatsheet && (
                            <div className={`block md:flex w-full`}>
                                <ScheduleCheatsheetCards />
                            </div>
                        )} */}
                            <FormikSwitchV2
                                name={'onlyWhenOnline'}
                                description={i18n.t('server:schedules.only_when_online_desc')}
                                label={i18n.t('server:schedules.only_when_online')}
                            />
                            <FormikSwitchV2
                                name={'enabled'}
                                description={i18n.t('server:schedules.auto_execute_desc')}
                                label={i18n.t('server:schedules.schedule_enabled')}
                            />
                        </div>
                        <div className={`mb-6 text-right`}>
                            <ActionButton
                                variant='primary'
                                className={'w-full sm:w-auto'}
                                type={'submit'}
                                disabled={isSubmitting}
                            >
                                {schedule
                                    ? i18n.t('server:schedules.save_changes')
                                    : i18n.t('server:schedules.create_schedule')}
                            </ActionButton>
                        </div>
                    </Form>
                );
            }}
        </Formik>
    );
};

export default asModal<Props>()(EditScheduleModal);
