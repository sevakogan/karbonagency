'use client';

import { useMemo, useRef, useState, useCallback, useEffect } from 'react';
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
  onCustomDateRange: (start: string, end: string) => void;
  customStart?: string;
  customEnd?: string;
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
const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isInRange(dateStr: string, start?: string, end?: string): boolean {
  if (!start || !end) return false;
  const lo = start <= end ? start : end;
  const hi = start <= end ? end : start;
  return dateStr >= lo && dateStr <= hi;
}

export function PlatformFilterBar({
  connectedPlatforms,
  selectedPlatforms,
  onTogglePlatform,
  onSelectAll,
  dateRange,
  onDateRangeChange,
  onCustomDateRange,
  customStart,
  customEnd,
}: Props) {
  const isAllSelected = selectedPlatforms.size === 0;
  const scrollRef = useRef<HTMLDivElement>(null);

  // Drag state for range selection
  const [dragStart, setDragStart] = useState<string | null>(null);
  const [dragEnd, setDragEnd] = useState<string | null>(null);
  const isDragging = useRef(false);

  const today = useMemo(() => new Date(), []);

  // Build ~35 days: 4 weeks back + rest of current week
  const calendarDays = useMemo(() => {
    const days: Date[] = [];
    // 28 days back (4 weeks) through 3 days forward
    for (let i = -28; i <= 3; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  }, [today]);

  // Unique months that appear in the day strip
  const monthTabs = useMemo(() => {
    const seen = new Map<string, { label: string; month: number; year: number }>();
    for (const d of calendarDays) {
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!seen.has(key)) {
        seen.set(key, { label: MONTHS[d.getMonth()], month: d.getMonth(), year: d.getFullYear() });
      }
    }
    return [...seen.values()];
  }, [calendarDays]);

  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // Which dates are highlighted
  const activeStart = dragStart ?? customStart;
  const activeEnd = dragEnd ?? customEnd;

  const handleDayMouseDown = useCallback((dateStr: string) => {
    isDragging.current = true;
    setDragStart(dateStr);
    setDragEnd(dateStr);
  }, []);

  const handleDayMouseEnter = useCallback((dateStr: string) => {
    if (isDragging.current) {
      setDragEnd(dateStr);
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    if (isDragging.current && dragStart) {
      const start = dragStart;
      const end = dragEnd ?? dragStart;
      const lo = start <= end ? start : end;
      const hi = start <= end ? end : start;

      if (lo === hi) {
        // Single day click
        onCustomDateRange(lo, lo);
      } else {
        // Range drag
        onCustomDateRange(lo, hi);
      }
    }
    isDragging.current = false;
    setDragStart(null);
    setDragEnd(null);
  }, [dragStart, dragEnd, onCustomDateRange]);

  // Auto-scroll to today (near the end) on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, []);

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' });
  };

  return (
    <div className="mb-3 space-y-2.5" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      {/* Calendar strip — full width */}
      <div
        className="py-2 px-6 -mx-4 sm:-mx-6 select-none"
        style={{
          background: 'var(--glass-bg)',
          borderBottom: '1px solid var(--glass-border)',
          borderTop: '1px solid var(--glass-border)',
        }}
      >
        {/* Month tabs */}
        <div className="flex items-center justify-center gap-1 mb-2">
          {monthTabs.map((m) => {
            const isActive = m.month === currentMonth && m.year === currentYear;
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

        {/* Day strip — click + drag to select */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => scroll('left')}
            className="p-0.5 rounded-md flex-shrink-0"
            style={{ color: 'var(--text-quaternary)' }}
          >
            <ChevronLeft size={14} />
          </button>

          <div ref={scrollRef} className="flex items-center gap-1 overflow-x-auto flex-1 scrollbar-hide">
            {calendarDays.map((d, idx) => {
              const dateStr = toDateStr(d);
              const isToday = isSameDay(d, today);

              // Show month divider when month changes
              const prevDate = idx > 0 ? calendarDays[idx - 1] : null;
              const showMonthDivider = prevDate && prevDate.getMonth() !== d.getMonth();

              // Highlight logic
              const inDragRange = dragStart ? isInRange(dateStr, dragStart, dragEnd ?? dragStart) : false;
              const inCustomRange = dateRange === 'custom' && !dragStart && isInRange(dateStr, customStart, customEnd);
              const isSelected = inDragRange || inCustomRange;
              const isRangeEnd = dateStr === activeStart || dateStr === activeEnd;

              // Tile styles
              let bg = 'var(--fill-quaternary)';
              let textColor = 'var(--text-secondary)';
              let border = '1.5px solid transparent';
              let shadow = 'none';

              if (isSelected && isRangeEnd) {
                bg = 'var(--accent)';
                textColor = 'white';
                shadow = '0 2px 8px color-mix(in srgb, var(--accent) 40%, transparent)';
              } else if (isSelected) {
                bg = 'color-mix(in srgb, var(--accent) 18%, var(--fill-quaternary))';
                textColor = 'var(--text-primary)';
              }

              // Today ring — always visible
              if (isToday) {
                border = isSelected
                  ? '1.5px solid rgba(255,255,255,0.6)'
                  : '1.5px solid var(--accent)';
                if (!isSelected) {
                  shadow = '0 0 0 1px var(--accent), 0 0 8px color-mix(in srgb, var(--accent) 25%, transparent)';
                }
              }

              return (
                <span key={dateStr} className="flex items-center">
                  {showMonthDivider && (
                    <span
                      className="flex-shrink-0 mx-1.5 px-1 py-3 text-[8px] font-bold uppercase"
                      style={{ color: 'var(--text-quaternary)' }}
                    >
                      {MONTHS[d.getMonth()]}
                    </span>
                  )}
                  <button
                    onMouseDown={() => handleDayMouseDown(dateStr)}
                    onMouseEnter={() => handleDayMouseEnter(dateStr)}
                    className="flex flex-col items-center justify-center gap-0.5 flex-shrink-0 cursor-pointer transition-all duration-150"
                    style={{
                      background: bg,
                      color: textColor,
                      border,
                      boxShadow: shadow,
                      width: 40,
                      height: 44,
                      minWidth: 40,
                      borderRadius: 10,
                    }}
                  >
                    <span className="text-[7px] font-medium uppercase leading-none opacity-70">{DAYS_SHORT[d.getDay()]}</span>
                    <span className="text-[13px] font-bold leading-none">{d.getDate()}</span>
                  </button>
                </span>
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

      {/* Platform pills + Range presets */}
      <div className="flex flex-wrap items-center justify-between gap-2">
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
