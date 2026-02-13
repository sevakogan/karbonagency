/**
 * Shared light-theme style constants for dashboard forms, cards, tables, and buttons.
 * Import these instead of duplicating Tailwind classes across 10+ files.
 */

export const formStyles = {
  label: "block text-sm font-medium text-gray-700 mb-1",
  input:
    "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500",
  select:
    "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500",
  textarea:
    "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 resize-none",
  error: "text-sm text-red-600 mt-1",
} as const;

export const cardStyles = {
  base: "rounded-xl border border-gray-200 bg-white shadow-sm",
  padded: "rounded-xl border border-gray-200 bg-white shadow-sm p-6",
  header: "text-lg font-semibold text-gray-900",
  subheader: "text-sm text-gray-500",
} as const;

export const tableStyles = {
  wrapper: "overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm",
  table: "w-full text-sm",
  thead: "border-b border-gray-200 bg-gray-50",
  th: "px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500",
  td: "px-4 py-3 text-gray-900",
  tr: "border-b border-gray-100 last:border-0",
  trHover: "border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors",
} as const;

export const buttonStyles = {
  primary:
    "inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
  secondary:
    "inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
  danger:
    "inline-flex items-center justify-center rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
  ghost:
    "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors",
} as const;
