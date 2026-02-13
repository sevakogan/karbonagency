interface BadgeProps {
  variant: "new" | "contacted" | "qualified" | "converted" | "lost" | "draft" | "active" | "paused" | "completed";
  children: React.ReactNode;
}

const variantStyles: Record<BadgeProps["variant"], string> = {
  new: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  contacted: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  qualified: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  converted: "bg-green-500/10 text-green-400 border-green-500/20",
  lost: "bg-red-500/10 text-red-400 border-red-500/20",
  draft: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  active: "bg-green-500/10 text-green-400 border-green-500/20",
  paused: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  completed: "bg-blue-500/10 text-blue-400 border-blue-500/20",
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
