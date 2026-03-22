'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  Search, LayoutGrid, Table, ChevronDown, ChevronLeft, ChevronRight,
  Download, MessageSquare, Phone, Mail, Star,
} from 'lucide-react';
import { CustomerExpanded } from './customer-expanded';
import type { MarketingFilters, CustomerRecord } from './marketing-command-center';

interface CustomerListProps {
  customers: CustomerRecord[];
  loading: boolean;
  totalCount: number;
  filters: MarketingFilters;
  onFilterChange: <K extends keyof MarketingFilters>(key: K, value: MarketingFilters[K]) => void;
}

type ViewMode = 'card' | 'table';

const SORT_OPTIONS = [
  { label: 'Lifetime Spend', value: 'lifetime_spend' },
  { label: 'Total Bookings', value: 'total_bookings' },
  { label: 'Last Visit', value: 'days_since_last' },
  { label: 'Name', value: 'name' },
  { label: '30d Spend', value: 'thirty_day_spend' },
];

const STATUS_DOT: Record<string, { color: string; label: string }> = {
  active: { color: '#22c55e', label: 'Active' },
  medium_risk: { color: '#fbbf24', label: 'Med Risk' },
  high_risk: { color: '#f97316', label: 'High Risk' },
  churned: { color: '#ef4444', label: 'Churned' },
};

const PAGE_SIZE = 20;

function Sparkline({ data }: { data: number[] }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const barCount = data.length;
  const barW = 100 / barCount;

  return (
    <svg viewBox="0 0 100 20" className="w-20 h-4" preserveAspectRatio="none">
      {data.map((v, i) => {
        const h = (v / max) * 18;
        return (
          <rect
            key={i}
            x={i * barW + 0.5}
            y={20 - h}
            width={Math.max(barW - 1, 1)}
            height={h}
            rx={0.5}
            fill="var(--system-blue)"
            opacity={0.7}
          />
        );
      })}
    </svg>
  );
}

function daysAgoText(days: number): string {
  if (days === 0) return 'Today';
  if (days === 1) return '1d ago';
  return `${days}d ago`;
}

function CustomerCard({
  customer,
  selected,
  expanded,
  onSelect,
  onExpand,
}: {
  customer: CustomerRecord;
  selected: boolean;
  expanded: boolean;
  onSelect: () => void;
  onExpand: () => void;
}) {
  const dot = STATUS_DOT[customer.status];

  return (
    <div>
      <button
        type="button"
        onClick={onExpand}
        className="w-full text-left rounded-2xl p-3.5 backdrop-blur-xl transition-all duration-200"
        style={{
          background: expanded ? 'var(--glass-bg-thick)' : 'var(--glass-bg)',
          backdropFilter: 'blur(var(--glass-blur)) saturate(var(--glass-saturate))',
          WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(var(--glass-saturate))',
          border: expanded
            ? '1px solid var(--glass-border-strong)'
            : '1px solid var(--glass-border)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <label className="mt-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={selected}
              onChange={onSelect}
              className="w-3.5 h-3.5 rounded accent-[var(--accent)]"
            />
          </label>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: dot.color }} />
              <span className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                {customer.name}
              </span>
              <span className="ml-auto text-xs font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                ${(customer.lifetime_spend ?? 0).toLocaleString()}
              </span>
              <span className="text-[10px] tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                {customer.total_bookings} visits
              </span>
            </div>

            <div className="flex items-center gap-3 text-[10px]" style={{ color: 'var(--text-secondary)' }}>
              {customer.email && (
                <span className="flex items-center gap-0.5 truncate">
                  <Mail size={9} /> {customer.email}
                </span>
              )}
              {customer.phone && (
                <span className="flex items-center gap-0.5">
                  <Phone size={9} /> {customer.phone}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 mt-1 text-[10px]" style={{ color: 'var(--text-secondary)' }}>
              <span>Last visit: {daysAgoText(customer.days_since_last)}</span>
              {customer.next_predicted_date && (
                <span>
                  Next: {new Date(customer.next_predicted_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              )}
              {(customer.coupon_codes ?? []).length > 0 && (
                <span className="flex items-center gap-0.5">
                  <Star size={9} /> {customer.coupon_codes[0]}
                </span>
              )}
              <span className="ml-auto">
                <Sparkline data={customer.monthly_spend} />
              </span>
            </div>
          </div>
        </div>
      </button>

      {/* Expanded detail (inline) */}
      {expanded && (
        <div className="mt-1">
          <CustomerExpanded customer={customer} />
        </div>
      )}
    </div>
  );
}

function CompactTableRow({
  customer,
  selected,
  onSelect,
  onExpand,
}: {
  customer: CustomerRecord;
  selected: boolean;
  onSelect: () => void;
  onExpand: () => void;
}) {
  const dot = STATUS_DOT[customer.status];

  return (
    <tr
      className="cursor-pointer transition-colors"
      onClick={onExpand}
      style={{ borderBottom: '1px solid var(--separator)' }}
    >
      <td className="py-2 px-2" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={selected}
          onChange={onSelect}
          className="w-3.5 h-3.5 rounded accent-[var(--accent)]"
        />
      </td>
      <td className="py-2 px-2">
        <span className="w-2 h-2 rounded-full inline-block" style={{ background: dot.color }} />
      </td>
      <td className="py-2 px-2 text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
        {customer.name}
      </td>
      <td className="py-2 px-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
        {customer.email}
      </td>
      <td className="py-2 px-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
        {customer.phone}
      </td>
      <td className="py-2 px-2 text-xs font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>
        ${(customer.lifetime_spend ?? 0).toLocaleString()}
      </td>
      <td className="py-2 px-2 text-xs tabular-nums" style={{ color: 'var(--text-secondary)' }}>
        {customer.total_bookings}
      </td>
      <td className="py-2 px-2 text-xs tabular-nums" style={{ color: 'var(--text-secondary)' }}>
        ${(customer.thirty_day_spend ?? 0).toLocaleString()}
      </td>
      <td className="py-2 px-2 text-xs tabular-nums" style={{ color: 'var(--text-secondary)' }}>
        {daysAgoText(customer.days_since_last)}
      </td>
      <td className="py-2 px-2 text-xs tabular-nums" style={{ color: 'var(--text-secondary)' }}>
        {customer.avg_gap_days}d
      </td>
      <td className="py-2 px-2">
        <Sparkline data={customer.monthly_spend} />
      </td>
    </tr>
  );
}

export function CustomerList({ customers, loading, totalCount, filters, onFilterChange }: CustomerListProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState(filters.search);

  const sort = filters.sort;
  const order = filters.order;
  const onSortChange = useCallback((key: string) => {
    if (sort === key) {
      onFilterChange('order', order === 'desc' ? 'asc' : 'desc');
    } else {
      onFilterChange('sort', key);
      onFilterChange('order', 'desc');
    }
  }, [sort, order, onFilterChange]);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      onFilterChange('search', searchInput);
    }, 300);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [searchInput, onFilterChange]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (selectedIds.size === customers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(customers.map((c) => c.id)));
    }
  }, [customers, selectedIds.size]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const handleExportCsv = useCallback(() => {
    const selected = customers.filter((c) => selectedIds.has(c.id));
    const rows = selected.length > 0 ? selected : customers;
    const headers = ['Name', 'Email', 'Phone', 'Status', 'Lifetime Spend', 'Bookings', 'Last Visit (days)'];
    const csv = [
      headers.join(','),
      ...rows.map((c) =>
        [c.name, c.email, c.phone, c.status, c.lifetime_spend, c.total_bookings, c.days_since_last].join(',')
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customers.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [customers, selectedIds]);

  return (
    <div className="flex flex-col gap-2">
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div
          className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 flex-1 max-w-xs"
          style={{
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
          }}
        >
          <Search size={13} style={{ color: 'var(--text-secondary)' }} />
          <input
            type="text"
            placeholder="Search customers..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="bg-transparent text-xs outline-none flex-1"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>

        {/* Sort */}
        <div
          className="flex items-center gap-1 rounded-xl px-2.5 py-1.5"
          style={{
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
          }}
        >
          <select
            value={filters.sort}
            onChange={(e) => onFilterChange('sort', e.target.value)}
            className="bg-transparent text-[10px] font-medium outline-none appearance-none pr-4"
            style={{ color: 'var(--text-secondary)' }}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => onFilterChange('order', filters.order === 'asc' ? 'desc' : 'asc')}
            className="p-0.5"
          >
            <ChevronDown
              size={12}
              style={{
                color: 'var(--text-tertiary)',
                transform: filters.order === 'asc' ? 'rotate(180deg)' : undefined,
                transition: 'transform 0.15s ease',
              }}
            />
          </button>
        </div>

        {/* View mode toggle */}
        <div
          className="flex rounded-xl overflow-hidden"
          style={{ border: '1px solid var(--glass-border)' }}
        >
          <button
            type="button"
            onClick={() => setViewMode('card')}
            className="px-2.5 py-1.5"
            style={{
              background: viewMode === 'card' ? 'var(--accent-muted)' : 'var(--glass-bg)',
              color: viewMode === 'card' ? 'var(--accent)' : 'var(--text-tertiary)',
            }}
          >
            <LayoutGrid size={13} />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className="px-2.5 py-1.5"
            style={{
              background: viewMode === 'table' ? 'var(--accent-muted)' : 'var(--glass-bg)',
              color: viewMode === 'table' ? 'var(--accent)' : 'var(--text-tertiary)',
            }}
          >
            <Table size={13} />
          </button>
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div
          className="flex items-center gap-3 rounded-xl px-3 py-2"
          style={{
            background: 'var(--accent-muted)',
            border: '1px solid var(--accent-glass)',
          }}
        >
          <span className="text-[10px] font-semibold" style={{ color: 'var(--accent)' }}>
            {selectedIds.size} selected
          </span>
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-lg transition-colors"
            style={{ color: 'var(--accent)', background: 'var(--glass-bg)' }}
          >
            <Download size={10} /> Export CSV
          </button>
          <button
            type="button"
            disabled
            className="flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-lg opacity-50 cursor-not-allowed"
            style={{ color: 'var(--text-tertiary)', background: 'var(--glass-bg)' }}
            title="Coming Soon"
          >
            <MessageSquare size={10} /> Send SMS
          </button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="skeleton h-20 rounded-2xl"
            />
          ))}
        </div>
      ) : customers.length === 0 ? (
        <div
          className="rounded-2xl p-8 text-center"
          style={{
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
          }}
        >
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            No customers found matching your filters.
          </p>
        </div>
      ) : viewMode === 'card' ? (
        <div className="space-y-2">
          {customers.map((c) => (
            <CustomerCard
              key={c.id}
              customer={c}
              selected={selectedIds.has(c.id)}
              expanded={expandedId === c.id}
              onSelect={() => toggleSelect(c.id)}
              onExpand={() => toggleExpand(c.id)}
            />
          ))}
        </div>
      ) : (
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--separator)' }}>
                  <th className="py-2 px-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === customers.length && customers.length > 0}
                      onChange={selectAll}
                      className="w-3.5 h-3.5 rounded accent-[var(--accent)]"
                    />
                  </th>
                  {[
                    { label: 'St', key: 'status' },
                    { label: 'Name', key: 'name' },
                    { label: 'Email', key: 'email' },
                    { label: 'Phone', key: 'phone' },
                    { label: 'Lifetime', key: 'lifetime_spend' },
                    { label: 'Visits', key: 'total_bookings' },
                    { label: '30d', key: 'thirty_day_spend' },
                    { label: 'Last', key: 'days_since_last' },
                    { label: 'Avg Gap', key: 'avg_gap_days' },
                    { label: 'Trend', key: '' },
                  ].map((col) => (
                    <th
                      key={col.label}
                      className="py-2 px-2 text-[9px] font-semibold uppercase tracking-wider select-none"
                      style={{ color: sort === col.key ? 'var(--accent)' : 'var(--text-secondary)', cursor: col.key ? 'pointer' : 'default' }}
                      onClick={() => col.key && onSortChange(col.key)}
                    >
                      {col.label}
                      {sort === col.key && <span className="ml-0.5">{order === 'desc' ? '↓' : '↑'}</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <CompactTableRow
                    key={c.id}
                    customer={c}
                    selected={selectedIds.has(c.id)}
                    onSelect={() => toggleSelect(c.id)}
                    onExpand={() => toggleExpand(c.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalCount > PAGE_SIZE && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            disabled={filters.page <= 1}
            onClick={() => onFilterChange('page', filters.page - 1)}
            className="p-1.5 rounded-lg transition-colors disabled:opacity-30"
            style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
          >
            <ChevronLeft size={14} style={{ color: 'var(--text-secondary)' }} />
          </button>
          <span className="text-[10px] font-medium tabular-nums" style={{ color: 'var(--text-secondary)' }}>
            Page {filters.page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={filters.page >= totalPages}
            onClick={() => onFilterChange('page', filters.page + 1)}
            className="p-1.5 rounded-lg transition-colors disabled:opacity-30"
            style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
          >
            <ChevronRight size={14} style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>
      )}
    </div>
  );
}
