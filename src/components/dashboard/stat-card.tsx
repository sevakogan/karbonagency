interface StatCardProps {
  label: string;
  value: string | number;
  trend?: string;
}

export default function StatCard({ label, value, trend }: StatCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-black text-gray-900">{value}</p>
      {trend && (
        <p className="text-xs text-green-600 mt-1">{trend}</p>
      )}
    </div>
  );
}
