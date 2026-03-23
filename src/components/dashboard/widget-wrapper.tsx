'use client';

import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';
import { MoreHorizontal, Minimize2, Maximize2, Move, ChevronUp, ChevronDown } from 'lucide-react';

// ── Persist widget state in localStorage ──────────────────────────

interface WidgetState {
  collapsed: boolean;
  size: 'normal' | 'wide';
  order: number;
}

const STORAGE_KEY = 'karbon-widget-prefs';

function loadWidgetState(widgetId: string): WidgetState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const all = JSON.parse(raw);
    return all[widgetId] ?? null;
  } catch {
    return null;
  }
}

function saveWidgetState(widgetId: string, state: Partial<WidgetState>) {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all = raw ? JSON.parse(raw) : {};
    all[widgetId] = { ...(all[widgetId] ?? {}), ...state };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // silently fail
  }
}

// ── Widget Wrapper Component ──────────────────────────────────────

interface WidgetWrapperProps {
  widgetId: string;
  title?: string;
  children: ReactNode;
  defaultCollapsed?: boolean;
  className?: string;
}

export function WidgetWrapper({
  widgetId,
  title,
  children,
  defaultCollapsed = false,
  className = '',
}: WidgetWrapperProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [menuOpen, setMenuOpen] = useState(false);
  const [size, setSize] = useState<'normal' | 'wide'>('normal');
  const menuRef = useRef<HTMLDivElement>(null);

  // Load persisted state
  useEffect(() => {
    const saved = loadWidgetState(widgetId);
    if (saved) {
      setCollapsed(saved.collapsed);
      setSize(saved.size ?? 'normal');
    }
  }, [widgetId]);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const toggleCollapse = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      saveWidgetState(widgetId, { collapsed: next });
      return next;
    });
    setMenuOpen(false);
  }, [widgetId]);

  const toggleSize = useCallback(() => {
    setSize((prev) => {
      const next = prev === 'normal' ? 'wide' : 'normal';
      saveWidgetState(widgetId, { size: next });
      return next;
    });
    setMenuOpen(false);
  }, [widgetId]);

  return (
    <div
      className={`relative ${size === 'wide' ? 'col-span-full' : ''} ${className}`}
      style={{ transition: 'all 0.2s ease' }}
    >
      {/* Menu trigger — top right */}
      <div className="absolute top-2 right-2 z-10" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((prev) => !prev)}
          className="flex items-center justify-center w-6 h-6 rounded-md transition-all opacity-0 group-hover:opacity-100 hover:opacity-100"
          style={{
            background: menuOpen ? 'var(--fill-tertiary)' : 'transparent',
            color: 'var(--text-tertiary)',
            opacity: menuOpen ? 1 : undefined,
          }}
          onMouseEnter={(e) => { (e.target as HTMLElement).style.opacity = '1'; }}
          onMouseLeave={(e) => { if (!menuOpen) (e.target as HTMLElement).style.opacity = '0.3'; }}
        >
          <MoreHorizontal size={14} />
        </button>

        {/* Dropdown menu */}
        {menuOpen && (
          <div
            className="absolute right-0 mt-1 rounded-xl py-1 min-w-[140px] shadow-lg"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--separator)',
              zIndex: 50,
            }}
          >
            <button
              onClick={toggleCollapse}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-[11px] font-medium transition-colors hover:bg-[var(--fill-quaternary)]"
              style={{ color: 'var(--text-secondary)' }}
            >
              {collapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
              {collapsed ? 'Expand' : 'Minimize'}
            </button>
            <button
              onClick={toggleSize}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-[11px] font-medium transition-colors hover:bg-[var(--fill-quaternary)]"
              style={{ color: 'var(--text-secondary)' }}
            >
              {size === 'wide' ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
              {size === 'wide' ? 'Normal Size' : 'Full Width'}
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div
        className="group"
        style={{
          overflow: 'hidden',
          maxHeight: collapsed ? '36px' : '2000px',
          transition: 'max-height 0.3s ease',
        }}
      >
        {/* Collapsed bar */}
        {collapsed && title && (
          <button
            onClick={toggleCollapse}
            className="flex items-center gap-2 w-full px-3.5 py-2 rounded-2xl text-[11px] font-semibold"
            style={{
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-tertiary)',
            }}
          >
            <ChevronDown size={12} />
            {title}
          </button>
        )}
        {!collapsed && children}
      </div>
    </div>
  );
}
