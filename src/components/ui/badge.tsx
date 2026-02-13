interface BadgeProps {
  variant: "new" | "contacted" | "qualified" | "converted" | "lost" | "draft" | "active" | "paused" | "completed";
  children: React.ReactNode;
}

const variantStyles: Record<BadgeProps["variant"], string> = {
  new: "bg-blue-50 text-blue-700 border-blue-200",
  contacted: "bg-yellow-50 text-yellow-700 border-yellow-200",
  qualified: "bg-purple-50 text-purple-700 border-purple-200",
  converted: "bg-green-50 text-green-700 border-green-200",
  lost: "bg-red-50 text-red-700 border-red-200",
  draft: "bg-gray-50 text-gray-700 border-gray-200",
  active: "bg-green-50 text-green-700 border-green-200",
  paused: "bg-yellow-50 text-yellow-700 border-yellow-200",
  completed: "bg-blue-50 text-blue-700 border-blue-200",
};

export default function Badge({ variant, children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium ${variantStyles[variant]}`}
    >
      {children}
    </span>
  );
}
