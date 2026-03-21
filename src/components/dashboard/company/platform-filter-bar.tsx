'use client';

import { useMemo, useRef, useState, useCallback } from 'react';
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

  // Build 14 days centered on today
  const calendarDays = useMemo(() => {
    const days: Date[] = [];
    for (let i = -6; i <= 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  }, [today]);

  // Month tabs
  const monthTabs = useMemo(() => {
    const now = new Date();
    const tabs = [];
    for (let i = -2; i <= 2; i++) {
      const m = new Date(now.getFullYear(), now.getMonth() + i, 1);
      tabs.push({ label: MONTHS[m.getMonth()], month: m.getMonth(), year: m.getFullYear() });
    }
    return tabs;
  }, []);

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

          <div ref={scrollRef} className="flex items-center justify-around overflow-hidden flex-1">
            {calendarDays.map((d) => {
              const dateStr = toDateStr(d);
              const isToday = isSameDay(d, today);

              // Highlight logic: dragging range OR committed custom range
              const inDragRange = dragStart ? isInRange(dateStr, dragStart, dragEnd ?? dragStart) : false;
              const inCustomRange = dateRange === 'custom' && !dragStart && isInRange(dateStr, customStart, customEnd);
              const isSelected = inDragRange || inCustomRange;
              const isRangeEnd = dateStr === activeStart || dateStr === activeEnd;

              let bg = 'transparent';
              let color = 'var(--text-secondary)';

              if (isSelected && isRangeEnd) {
                bg = 'var(--accent)';
                color = 'white';
              } else if (isSelected) {
                bg = 'color-mix(in srgb, var(--accent) 20%, transparent)';
                color = 'var(--text-primary)';
              } else if (isToday && dateRange !== 'custom') {
                bg = 'color-mix(in srgb, var(--accent) 12%, transparent)';
                color = 'var(--accent)';
              }

              return (
                <button
                  key={dateStr}
                  onMouseDown={() => handleDayMouseDown(dateStr)}
                  onMouseEnter={() => handleDayMouseEnter(dateStr)}
                  className="flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-xl transition-colors flex-shrink-0 min-w-[40px] cursor-pointer"
                  style={{ background: bg, color }}
                >
                  <span className="text-[8px] font-medium uppercase">{DAYS_SHORT[d.getDay()]}</span>
                  <span className="text-sm font-bold leading-none">{d.getDate()}</span>
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
