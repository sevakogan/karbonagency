'use client';

import { type ReactNode, useState, useRef, useEffect } from 'react';

const WIDGET_PREFS_KEY = 'karbon-widget-prefs';
const WIDGET_TABS = ['Dashboard', 'Marketing', 'Lifeline'] as const;

function readPrefs(): Record<string, any> {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(WIDGET_PREFS_KEY) ?? '{}'); } catch { return {}; }
}

function writePref(id: string, patch: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  try {
    const p = readPrefs();
    p[id] = { ...(p[id] ?? {}), ...patch };
    localStorage.setItem(WIDGET_PREFS_KEY, JSON.stringify(p));
  } catch { /* ignore */ }
}

interface SectionHeaderV2Props {
  icon: ReactNode;
  title: string;
  right?: ReactNode;
  /** Controls whether section body is shown. Parent must honor this. */
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  currentTab?: string;
  sectionId?: string;
}

export function SectionHeaderV2({ icon, title, right, collapsed, onToggleCollapse, currentTab = 'Dashboard', sectionId }: SectionHeaderV2Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [moveSubmenu, setMoveSubmenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const resolvedId = sectionId ?? `section-${title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setMoveSubmenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const moveToTab = (tab: string) => {
    setMenuOpen(false);
    setMoveSubmenu(false);
    writePref(resolvedId, { hiddenOn: currentTab, movedTo: tab });
    window.dispatchEvent(new CustomEvent('widget-moved', { detail: { widgetId: resolvedId, from: currentTab, to: tab } }));
  };

  return (
    <div className="group" style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      marginBottom: 12,
    }}>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: onToggleCollapse ? 'pointer' : undefined }}
        onClick={onToggleCollapse}
      >
        <span style={{ color: 'var(--accent)', display: 'flex' }}>{icon}</span>
        <span style={{
          fontSize: 13, fontWeight: 700, letterSpacing: 0.5,
          color: 'var(--text-primary)', textTransform: 'uppercase' as const,
        }}>
          {collapsed ? `\u25B6 ${title}` : title}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {right && <div>{right}</div>}
        {/* Widget menu */}
        <div ref={menuRef} className="relative">
          <button
            onClick={() => { setMenuOpen((p) => !p); setMoveSubmenu(false); }}
            className="flex items-center justify-center w-5 h-5 rounded-md transition-opacity opacity-0 group-hover:opacity-60 hover:!opacity-100"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <circle cx="2" cy="6" r="1.2" />
              <circle cx="6" cy="6" r="1.2" />
              <circle cx="10" cy="6" r="1.2" />
            </svg>
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 mt-1 rounded-xl py-1 min-w-[150px] shadow-lg z-50"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--separator)' }}
            >
              {onToggleCollapse && (
                <button
                  onClick={() => { onToggleCollapse(); setMenuOpen(false); }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-[11px] font-medium transition-colors hover:bg-[var(--fill-quaternary)]"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {collapsed ? '\u25BC Expand' : '\u25B2 Minimize'}
                </button>
              )}
              {/* Divider */}
              <div className="h-px mx-2 my-1" style={{ background: 'var(--separator)' }} />
              {/* Move to tab */}
              <div className="relative">
                <button
                  onClick={() => setMoveSubmenu((p) => !p)}
                  className="flex items-center justify-between gap-2 w-full px-3 py-1.5 text-[11px] font-medium transition-colors hover:bg-[var(--fill-quaternary)]"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <span>{'\u21C4'} Move to...</span>
                  <span style={{ fontSize: 8 }}>{'\u25B6'}</span>
                </button>
                {moveSubmenu && (
                  <div
                    className="absolute left-full top-0 ml-1 rounded-xl py-1 min-w-[110px] shadow-lg z-50"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--separator)' }}
                  >
                    {WIDGET_TABS.filter((t) => t !== currentTab).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => moveToTab(tab)}
                        className="flex items-center gap-2 w-full px-3 py-1.5 text-[11px] font-medium transition-colors hover:bg-[var(--fill-quaternary)]"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
