import Link from "next/link";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BreadcrumbItem {
  readonly label: string;
  readonly href?: string;
}

interface BreadcrumbProps {
  readonly items: readonly BreadcrumbItem[];
}

// ---------------------------------------------------------------------------
// Separator
// ---------------------------------------------------------------------------

function ChevronSeparator() {
  return (
    <svg
      className="w-3.5 h-3.5 text-gray-300 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm mb-1">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <span key={`${item.label}-${index}`} className="flex items-center gap-2">
            {index > 0 && <ChevronSeparator />}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? "text-gray-700 font-medium" : "text-gray-400"}>
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
