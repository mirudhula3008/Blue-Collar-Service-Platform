import { getLocale, translate } from '../context/LanguageContext';

export const formatPrice = (amount) =>
  amount == null ? '—' : `₹${Number(amount).toLocaleString('en-IN')}`;

export const formatPriceRange = (min, max) => {
  if (min == null) return translate('worker.priceOnRequest');
  return min === max ? formatPrice(min) : `${formatPrice(min)} – ${formatPrice(max)}`;
};

export const formatDate = (value) =>
  new Date(value).toLocaleDateString(getLocale(), { day: 'numeric', month: 'short', year: 'numeric' });

export const formatDateTime = (value) =>
  new Date(value).toLocaleString(getLocale(), { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });

// Language-aware distance: pass t() from useLanguage. 901 → "901 m", 2300 → "2.3 km".
export const formatDistanceShort = (metres, t) =>
  metres < 1000 ? `${Math.round(metres)} ${t('common.m')}` : `${(metres / 1000).toFixed(1)} ${t('common.km')}`;
