'use client';

import { useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PLATFORM_COLORS, PLATFORM_NAMES } from '@/lib/dashboard/platform-config';
import type { DateRange } from '@/lib/dashboard/use-dashboard-data';

interface Props {
  connectedPlatforms: string[];
  selectedPlatforms: Set<string>;
  onTogglePlatform: (slug: string) => void;
  onSelectAll: () => void;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  /** Optional: callback when a specific date is tapped */
  onDateSelect?: (date: string) => void;
  selectedDate?: string;
}

const RANGE_OPTIONS: { label: string; value: DateRange }[] = [
  { label: 'Today', value: 'today' },
  { label: '3D', value: '3d' },
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
  { label: 'MTD', value: 'mtd' },
  { label: 'YTD', value: 'ytd' },
  { label: '90D', value: '90d' },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function buildCalendarDays(centerDate: Date, count: number): Date[] {
  const half = Math.floor(count / 2);
  const dates: Date[] = [];
  for (let i = -half; i <= half; i++) {
    const d = new Date(centerDate);
    d.setDate(d.getDate() + i);
    dates.push(d);
  }
  return dates;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

export function PlatformFilterBar({
  connectedPlatforms,
  selectedPlatforms,
  onTogglePlatform,
  onSelectAll,
  dateRange,
  onDateRangeChange,
}: Props) {
  const isAllSelected = selectedPlatforms.size === 0;
  const scrollRef = useRef<HTMLDivElement>(null);

  const today = useMemo(() => new Date(), []);

  // Build visible month tabs and day strip
  const calendarData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Show 5 months centered on current
    const months = [];
    for (let i = -2; i <= 2; i++) {
      const m = new Date(currentYear, currentMonth + i, 1);
      months.push({ label: MONTHS[m.getMonth()], month: m.getMonth(), year: m.getFullYear(), date: m });
    }

    // Build 7 days for the day strip (centered on today)
    const days = buildCalendarDays(now, 6);

    return { months, days, currentMonth, currentYear };
  }, []);

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' });
  };

  return (
    <div className="mb-3 space-y-2.5">
      {/* Row 1: Month tabs + Day strip */}
      <div
        className="rounded-xl py-2.5 px-3"
        style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
      >
        {/* Month tabs */}
        <div className="flex items-center gap-1 mb-2">
          {calendarData.months.map((m) => {
            const isActive = m.month === calendarData.currentMonth && m.year === calendarData.currentYear;
            return (
              <button
                key={`${m.year}-${m.month}`}
                className="px-3 py-0.5 rounded-md text-[11px] font-semibold transition-all"
                style={{
                  background: isActive ? 'var(--accent)' : 'transparent',
                  color: isActive ? 'white' : 'var(--text-tertiary)',
                }}
              >
                {m.label}
              </button>
            );
          })}
        </div>

        {/* Day strip */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => scroll('left')}
            className="p-0.5 rounded-md flex-shrink-0"
            style={{ color: 'var(--text-quaternary)' }}
          >
            <ChevronLeft size={14} />
          </button>

          <div ref={scrollRef} className="flex items-center gap-1 overflow-hidden flex-1">
            {calendarData.days.map((d) => {
              const isToday = isSameDay(d, today);
              const dateStr = toDateStr(d);
              return (
                <button
                  key={dateStr}
                  onClick={() => {
                    // Clicking a specific day sets range to 'today' behavior for that date
                    if (isToday) {
                      onDateRangeChange('today');
                    }
                  }}
                  className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all flex-shrink-0 min-w-[44px]"
                  style={{
                    background: isToday ? 'var(--accent)' : 'transparent',
                    color: isToday ? 'white' : 'var(--text-secondary)',
                  }}
                >
                  <span className="text-[9px] font-medium uppercase">{DAYS[d.getDay()]}</span>
                  <span className="text-sm font-bold">{d.getDate()}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => scroll('right')}
            className="p-0.5 rounded-md flex-shrink-0"
            style={{ color: 'var(--text-quaternary)' }}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Row 2: Platform pills + Range presets */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Platform pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={onSelectAll}
            className="rounded-full px-3 py-1 text-[10px] font-semibold transition-all"
            style={{
              background: isAllSelected ? 'var(--accent)' : 'var(--fill-quaternary)',
              color: isAllSelected ? 'white' : 'var(--text-secondary)',
            }}
          >
            All
          </button>

          {connectedPlatforms.map((slug) => {
            const active = selectedPlatforms.has(slug);
            const color = PLATFORM_COLORS[slug] ?? '#888';
            return (
              <button
                key={slug}
                onClick={() => onTogglePlatform(slug)}
                className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-medium transition-all"
                style={{
                  background: active ? `color-mix(in srgb, ${color} 15%, transparent)` : 'var(--fill-quaternary)',
                  color: active ? color : 'var(--text-tertiary)',
                  border: active ? `1.5px solid ${color}` : '1.5px solid transparent',
                }}
              >
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: color, boxShadow: active ? `0 0 6px ${color}` : 'none' }}
                />
                {PLATFORM_NAMES[slug] ?? slug}
              </button>
            );
          })}
        </div>

        {/* Range presets */}
        <div className="flex items-center gap-0.5 rounded-lg p-0.5" style={{ background: 'var(--fill-quaternary)' }}>
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onDateRangeChange(opt.value)}
              className="rounded-md px-2 py-1 text-[10px] font-semibold transition-all"
              style={{
                background: dateRange === opt.value ? 'var(--accent)' : 'transparent',
                color: dateRange === opt.value ? 'white' : 'var(--text-tertiary)',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
