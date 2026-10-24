export const formatPrice = (amount) =>
  amount == null ? '—' : `₹${Number(amount).toLocaleString('en-IN')}`;

export const formatPriceRange = (min, max) => {
  if (min == null) return 'Price on request';
  return min === max ? formatPrice(min) : `${formatPrice(min)} – ${formatPrice(max)}`;
};

export const formatDistance = (metres) => {
  if (metres == null) return '';
  return metres < 1000 ? `${Math.round(metres)} m away` : `${(metres / 1000).toFixed(1)} km away`;
};

export const formatDate = (value) =>
  new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

// Language-aware distance: pass t() from useLanguage. 901 → "901 m", 2300 → "2.3 km".
export const formatDistanceShort = (metres, t) =>
  metres < 1000 ? `${Math.round(metres)} ${t('common.m')}` : `${(metres / 1000).toFixed(1)} ${t('common.km')}`;
