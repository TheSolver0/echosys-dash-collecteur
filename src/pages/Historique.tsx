import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, MapPin, Clock } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import Header from "../components/Header";
import { CATEGORY_LABEL } from "../components/MissionBadge";
import { api } from "../api/client";
import type { Mission } from "../types";

export default function HistoriquePage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await api.get<Mission[]>("/reports/my-missions");
      setMissions(data.filter((m) => m.status === "RESOLVED" || m.status === "REJECTED"));
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Historique" subtitle="Missions terminées et rejetées" onRefresh={fetchData} loading={loading} />

      <div className="flex-1 overflow-y-auto p-7">
        {loading ? (
          <div className="text-sm text-gray-400 text-center py-12">Chargement...</div>
        ) : missions.length === 0 ? (
          <div className="text-sm text-gray-400 text-center py-12">Aucune mission dans l'historique</div>
        ) : (
          <div className="flex flex-col gap-2 max-w-3xl">
            {missions.map((m) => (
              <div key={m.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                {m.status === "RESOLVED" ? (
                  <CheckCircle2 size={20} className="text-green-500 flex-shrink-0" />
                ) : (
                  <XCircle size={20} className="text-red-400 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{CATEGORY_LABEL[m.category] ?? m.category}</p>
                  <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-0.5">
                    <span className="flex items-center gap-1"><MapPin size={10} />{m.location ?? "—"}</span>
                    <span className="flex items-center gap-1">
                      <Clock size={10} />
                      {format(new Date(m.updatedAt), "d MMM yyyy", { locale: fr })}
                    </span>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-1 rounded-md flex-shrink-0 ${
                    m.status === "RESOLVED" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"
                  }`}
                >
                  {m.status === "RESOLVED" ? "TERMINÉE" : "REJETÉE"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
