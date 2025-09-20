import { useTranslations } from 'next-intl';

type IntervalFormattedProps = {
  ms: number;
  long?: boolean;
  precision?: number;
};

export const IntervalFormatted = (props: IntervalFormattedProps) => {
  const t = useTranslations();
  const { ms, long, precision } = props;

  if (ms < 60 * 1000) {
    const val = !precision ? Math.round(ms / 1000) : (ms / 1000).toFixed(precision);
    return <>{t('General.x-seconds', { x: val.toString(), long: Boolean(long).toString() })}</>;
  }

  if (ms < 60 * 60 * 1000) {
    const val = !precision ? Math.round(ms / 60000) : (ms / 60000).toFixed(precision);
    return <>{t('General.x-minutes', { x: val, long: Boolean(long).toString() })}</>;
  }

  if (ms < 24 * 60 * 60 * 1000) {
    const val = !precision ? Math.round(ms / 3600000) : (ms / 3600000).toFixed(precision);
    return <>{t('General.x-hours', { x: val, long: Boolean(long).toString() })}</>;
  }
  const val = !precision ? Math.round(ms / 86400000) : (ms / 86400000).toFixed(precision);
  return <>{t('General.x-days', { x: val, long: Boolean(long).toString() })}</>;
};
