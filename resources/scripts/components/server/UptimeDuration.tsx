import i18n from '@/lib/i18n';

const UptimeDuration = ({ uptime }: { uptime: number }) => {
    const uptimeDiv = uptime / 1000;
    const days = Math.floor(uptimeDiv / (24 * 60 * 60));
    const hours = Math.floor((Math.floor(uptimeDiv) / 60 / 60) % 24);
    const remainder = Math.floor(uptimeDiv - hours * 60 * 60);
    const minutes = Math.floor((remainder / 60) % 60);
    const seconds = remainder % 60;

    if (days > 0) {
        return (
            <>
                {days}
                {i18n.t('server:console.days_short')} {hours}
                {i18n.t('server:console.hours_short')} {minutes}
                {i18n.t('server:console.minutes_short')}
            </>
        );
    }

    return (
        <>
            {hours}
            {i18n.t('server:console.hours_short')} {minutes}
            {i18n.t('server:console.minutes_short')} {seconds}
            {i18n.t('server:console.seconds_short')}
        </>
    );
};

export default UptimeDuration;
