import { useMemo } from 'react';
import { formatTime, toDateKey } from '../utils/bookings';

const DAYS_SHOWN = 14;
const FIRST_HOUR = 8;
const LAST_HOUR = 20; // last slot starts at 20:00
const SLOT_MINUTES = 30;

function buildSlots() {
  const slots = [];
  for (let h = FIRST_HOUR; h <= LAST_HOUR; h++) {
    for (let m = 0; m < 60; m += SLOT_MINUTES) {
      if (h === LAST_HOUR && m > 0) break;
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return slots;
}

const SLOTS = buildSlots();

/**
 * Pick a day (next 14 days) and a 30-minute slot between 8 AM and 8 PM.
 * value: { date: 'YYYY-MM-DD', time: 'HH:MM' }
 */
export default function DateTimePicker({ value, onChange }) {
  const days = useMemo(() => {
    const today = new Date();
    return Array.from({ length: DAYS_SHOWN }, (_, i) => {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
      return { key: toDateKey(d), date: d, isToday: i === 0 };
    });
  }, []);

  // Hide slots that have already passed today (with a 1-hour buffer).
  const now = new Date();
  const isToday = value.date === days[0].key;
  const minMinutes = now.getHours() * 60 + now.getMinutes() + 60;
  const available = SLOTS.filter((t) => {
    if (!isToday) return true;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m >= minMinutes;
  });

  return (
    <div className="space-y-4">
      <div>
        <span className="text-sm font-medium text-slate-700">Date</span>
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1" role="listbox" aria-label="Choose a date">
          {days.map((d) => {
            const selected = value.date === d.key;
            return (
              <button
                key={d.key}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => onChange({ date: d.key, time: '' })}
                className={`flex w-16 flex-none flex-col items-center rounded-xl border px-2 py-2 text-sm transition ${
                  selected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-blue-400'
                }`}
              >
                <span className={`text-xs ${selected ? 'text-blue-100' : 'text-slate-400'}`}>
                  {d.isToday ? 'Today' : d.date.toLocaleDateString('en-IN', { weekday: 'short' })}
                </span>
                <span className="text-lg font-semibold">{d.date.getDate()}</span>
                <span className={`text-xs ${selected ? 'text-blue-100' : 'text-slate-400'}`}>
                  {d.date.toLocaleDateString('en-IN', { month: 'short' })}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {value.date && (
        <div>
          <span className="text-sm font-medium text-slate-700">Time</span>
          {available.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No slots left today. Please pick another day.</p>
          ) : (
            <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5" role="listbox" aria-label="Choose a time">
              {available.map((t) => {
                const selected = value.time === t;
                return (
                  <button
                    key={t}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => onChange({ ...value, time: t })}
                    className={`rounded-lg border px-2 py-2 text-sm font-medium transition ${
                      selected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-blue-400'
                    }`}
                  >
                    {formatTime(t)}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
