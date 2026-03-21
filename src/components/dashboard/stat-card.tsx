import InfoTooltip from "@/components/ui/info-tooltip";

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: string;
  description?: string;
  formula?: string;
}

export default function StatCard({ label, value, trend, description, formula }: StatCardProps) {
  return (
    <div className="glass-card p-3">
      <p className="text-[11px] font-medium mb-0.5" style={{ color: "var(--text-secondary)" }}>
        {label}
        {description && <InfoTooltip text={description} formula={formula} />}
      </p>
      <p className="text-lg font-bold" style={{ color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>{value}</p>
      {trend && (
        <p className="text-[11px] mt-0.5" style={{ color: "var(--system-green)" }}>{trend}</p>
      )}
    </div>
  );
}
