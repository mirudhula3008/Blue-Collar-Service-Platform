import { useState } from 'react';
import { formatPrice } from '../utils/format';
import { useLanguage } from '../context/LanguageContext';

// Rounds the axis maximum up to a clean value (1, 2, 2.5, 5 × 10^n).
function niceMax(value) {
  if (value <= 0) return 1000;
  const exp = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * exp >= value);
  return step * exp;
}

const compact = (n) => (n >= 1000 ? `₹${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : `₹${n}`);

/**
 * Single-series bar chart of earnings per period.
 * data: [{ label, earnings, net, jobs }]
 * One hue (Service Blue), no legend (the card title names the series), recessive
 * grid, 4px rounded bar tops on the baseline, per-bar hover/focus tooltip, and a
 * screen-reader table of the same numbers.
 */
export default function EarningsChart({ data, height = 224 }) {
  const { t } = useLanguage();
  const [active, setActive] = useState(null);
  const max = niceMax(Math.max(...data.map((d) => d.earnings), 0));
  const ticks = [max, max / 2, 0];
  const peak = data.reduce((best, d, i) => (d.earnings > (data[best]?.earnings ?? -1) ? i : best), 0);
  const allZero = data.every((d) => d.earnings === 0);

  return (
    <div>
      <div className="relative flex" style={{ height }}>
        {/* Y axis labels */}
        <div className="flex w-12 flex-none flex-col justify-between pb-6 pr-2 text-right text-[11px] tabular-nums text-slate-400" aria-hidden="true">
          {ticks.map((tick) => (
            <span key={tick} className="-translate-y-1/2 first:translate-y-0 last:translate-y-0">
              {compact(tick)}
            </span>
          ))}
        </div>

        <div className="relative min-w-0 flex-1">
          {/* Gridlines */}
          <div className="pointer-events-none absolute inset-x-0 bottom-6 top-0 flex flex-col justify-between" aria-hidden="true">
            {ticks.map((tick) => (
              <div key={tick} className={`border-t ${tick === 0 ? 'border-slate-300' : 'border-dashed border-slate-200'}`} />
            ))}
          </div>

          {/* Bars */}
          <div className="absolute inset-0 flex items-end gap-1.5 sm:gap-3" role="img" aria-label={`${t('nav.earnings')}: ${data.map((d) => `${d.label} ${formatPrice(d.earnings)}`).join(', ')}`}>
            {data.map((d, i) => {
              const pct = (d.earnings / max) * 100;
              const isActive = active === i;
              return (
                <div
                  key={d.label}
                  className="group relative flex h-full flex-1 flex-col justify-end pb-6 outline-none"
                  tabIndex={0}
                  onMouseEnter={() => setActive(i)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                  aria-label={`${d.label}: ${t('earnings.earnedJobs', { amount: formatPrice(d.earnings), count: d.jobs })}`}
                >
                  {/* Selective direct label: the peak bar only */}
                  {i === peak && !allZero && !isActive && (
                    <span className="mb-1 text-center text-[11px] font-semibold tabular-nums text-slate-600">{compact(d.earnings)}</span>
                  )}
                  <div
                    className={`mx-auto w-full max-w-[44px] rounded-t transition-colors ${
                      d.earnings === 0 ? 'bg-slate-200' : isActive ? 'bg-blue-700' : 'bg-blue-600 group-hover:bg-blue-700'
                    }`}
                    style={{ height: d.earnings === 0 ? 2 : `${Math.max(pct, 1.5)}%` }}
                  />
                  <span className="absolute inset-x-0 bottom-0 truncate text-center text-[11px] text-slate-500">{d.label}</span>

                  {isActive && (
                    <div
                      className="pointer-events-none absolute left-1/2 z-10 w-40 -translate-x-1/2 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-lift"
                      // Sit just above the bar: bar % is of the plot area, which excludes the 24px label strip.
                      style={{ bottom: `calc(${Math.max(pct, 2) / 100} * (100% - 24px) + 32px)` }}
                      role="tooltip"
                    >
                      <p className="text-xs font-semibold text-slate-500">{d.label}</p>
                      <p className="mt-1 text-base font-bold tabular-nums text-navy">{formatPrice(d.earnings)}</p>
                      <p className="text-xs tabular-nums text-slate-500">
                        {t('earnings.tooltip', { net: formatPrice(d.net), count: d.jobs })}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {allZero && <p className="mt-2 text-center text-sm text-slate-400">{t('earnings.noneInPeriod')}</p>}

      <table className="sr-only">
        <caption>{t('earnings.overTime')}</caption>
        <thead>
          <tr>
            <th>{t('earnings.col.date')}</th>
            <th>{t('nav.earnings')}</th>
            <th>{t('earnings.col.youGet')}</th>
            <th>{t('nav.jobs')}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.label}>
              <td>{d.label}</td>
              <td>{formatPrice(d.earnings)}</td>
              <td>{formatPrice(d.net)}</td>
              <td>{d.jobs}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
