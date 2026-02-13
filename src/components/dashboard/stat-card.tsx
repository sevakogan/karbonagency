interface StatCardProps {
  label: string;
  value: string | number;
  trend?: string;
}

export default function StatCard({ label, value, trend }: StatCardProps) {
  return (
    <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.02]">
      <p className="text-xs text-white/40 font-medium mb-1">{label}</p>
      <p className="text-2xl font-black">{value}</p>
      {trend && (
        <p className="text-xs text-green-400 mt-1">{trend}</p>
      )}
    </div>
  );
}
