import { RefreshCw, Navigation } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  loading?: boolean;
  children?: React.ReactNode;
}

export default function Header({ title, subtitle, onRefresh, loading, children }: HeaderProps) {
  return (
    <div className="bg-white border-b border-gray-100 px-7 h-16 flex items-center gap-3.5 flex-shrink-0">
      <div className="flex-1">
        <h1 className="text-[18px] font-black tracking-tight">{title}</h1>
        <p className="text-xs text-gray-400 font-medium">
          {subtitle ?? `Douala · ${format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}`}
        </p>
      </div>

      {children}

      <div className="flex items-center gap-1.5 bg-[#f0faf5] border border-[#d1fae5] px-3 py-1.5 rounded-full text-[11px] font-semibold text-forest">
        <span className="w-1.5 h-1.5 rounded-full bg-fern animate-pulse" />
        <Navigation size={12} />
        GPS · Actif
      </div>

      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-1.5 bg-white border border-gray-200 px-3.5 py-[7px] rounded-[10px] text-xs font-semibold text-gray-500 hover:border-fern hover:text-forest transition-all disabled:opacity-50"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Actualiser
        </button>
      )}
    </div>
  );
}
