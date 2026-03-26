import type { LucideIcon } from "lucide-react";

type Color = "amber" | "green" | "red" | "blue" | "purple" | "teal";

const COLOR_MAP: Record<Color, { bg: string; icon: string }> = {
  amber:  { bg: "bg-orange-50",  icon: "text-orange-400" },
  green:  { bg: "bg-green-50",   icon: "text-green-500" },
  red:    { bg: "bg-red-50",     icon: "text-red-400" },
  blue:   { bg: "bg-blue-50",    icon: "text-blue-400" },
  purple: { bg: "bg-purple-50",  icon: "text-purple-400" },
  teal:   { bg: "bg-teal-50",    icon: "text-teal-500" },
};

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  color: Color;
  trend?: number;
}

export default function StatCard({ icon: Icon, label, value, sub, color, trend }: StatCardProps) {
  const { bg, icon } = COLOR_MAP[color];
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className={`p-[9px] rounded-[10px] ${bg} ${icon} flex-shrink-0`}>
        <Icon size={18} strokeWidth={2.5} />
      </div>
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[.8px] mb-[3px]">{label}</p>
        <div className="flex items-baseline gap-1">
          <h3 className="text-[22px] font-black text-[#1E2D24] tracking-tight leading-none">{value}</h3>
          {trend !== undefined && (
            <span className={`text-[10px] font-bold ${trend >= 0 ? "text-green-500" : "text-red-500"}`}>
              {trend >= 0 ? "↑" : "↓"}{Math.abs(trend)}%
            </span>
          )}
        </div>
        {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
