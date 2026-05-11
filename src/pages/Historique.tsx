import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, MapPin, Clock } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import Header from "../components/Header";
import { CATEGORY_LABEL } from "../components/MissionBadge";
import { api } from "../api/client";
import type { Mission } from "../types";

function ZoneBreadcrumb({ mission }: { mission: Mission }) {
  const parts: string[] = [];
  if (mission.district?.name)                         parts.push(mission.district.name);
  if (mission.district?.commune?.name)                parts.push(mission.district.commune.name);
  if (mission.district?.commune?.communauteUrbaine?.name) parts.push(mission.district.commune.communauteUrbaine.name);
  if (parts.length === 0 && mission.location)         parts.push(mission.location);
  if (parts.length === 0)                             return <span>—</span>;
  return (
    <span className="flex items-center gap-1 flex-wrap">
      {parts.map((p, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <span className="text-gray-300">›</span>}
          <span>{p}</span>
        </span>
      ))}
    </span>
  );
}

export default function HistoriquePage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState<"ALL" | "RESOLVED" | "REJECTED">("ALL");

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await api.get("/reports/my-missions");
      setMissions(data);
    } catch {
      // Fallback vide
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const terminated = missions.filter(
    m => m.status === "RESOLVED" || m.status === "REJECTED"
  );

  const displayed = filter === "ALL"
    ? terminated
    : terminated.filter(m => m.status === filter);

  // Totaux pour résumé
  const totalResolved  = terminated.filter(m => m.status === "RESOLVED").length;
  const totalRejected  = terminated.filter(m => m.status === "REJECTED").length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Historique" subtitle="Missions terminées et rejetées" onRefresh={fetchData} loading={loading} />

      <div className="flex-1 overflow-y-auto p-7">

        {/* ── Résumé rapide ── */}
        {!loading && terminated.length > 0 && (
          <div className="flex gap-3 mb-5">
            <div className="flex-1 bg-green-50 border border-green-100 rounded-2xl p-4 text-center">
              <p className="text-2xl font-black text-green-600">{totalResolved}</p>
              <p className="text-xs text-green-700 font-medium mt-0.5">Terminées</p>
            </div>
            <div className="flex-1 bg-red-50 border border-red-100 rounded-2xl p-4 text-center">
              <p className="text-2xl font-black text-red-500">{totalRejected}</p>
              <p className="text-xs text-red-600 font-medium mt-0.5">Rejetées</p>
            </div>
            <div className="flex-1 bg-[#f0faf5] border border-[#d0e9dd] rounded-2xl p-4 text-center">
              <p className="text-2xl font-black text-[#40916C]">
                {terminated.length > 0 ? Math.round((totalResolved / terminated.length) * 100) : 0}%
              </p>
              <p className="text-xs text-[#2D6A4F] font-medium mt-0.5">Taux succès</p>
            </div>
          </div>
        )}

        {/* ── Filtres ── */}
        <div className="flex gap-2 mb-4">
          {([
            { key: "ALL",      label: "Tout" },
            { key: "RESOLVED", label: "Terminées" },
            { key: "REJECTED", label: "Rejetées" },
          ] as { key: typeof filter; label: string }[]).map(({ key, label }) => (
            <button key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filter === key
                  ? "bg-[#1E2D24] text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* ── Liste ── */}
        {loading ? (
          <div className="text-sm text-gray-400 text-center py-12">Chargement...</div>
        ) : displayed.length === 0 ? (
          <div className="text-sm text-gray-400 text-center py-12">Aucune mission dans l'historique</div>
        ) : (
          <div className="flex flex-col gap-2 max-w-3xl">
            {displayed.map(m => (
              <div key={m.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  {m.status === "RESOLVED" ? (
                    <CheckCircle2 size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-bold truncate">{CATEGORY_LABEL[m.category] ?? m.category}</p>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-md flex-shrink-0 ${
                        m.status === "RESOLVED" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"
                      }`}>
                        {m.status === "RESOLVED" ? "TERMINÉE" : "REJETÉE"}
                      </span>
                    </div>

                    {/* Zone hiérarchique */}
                    <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-1">
                      <MapPin size={10} className="flex-shrink-0" />
                      <ZoneBreadcrumb mission={m} />
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {format(new Date(m.updatedAt), "d MMM yyyy · HH:mm", { locale: fr })}
                      </span>
                      <span className="text-gray-300">·</span>
                      <span>{formatDistanceToNow(new Date(m.updatedAt), { locale: fr, addSuffix: true })}</span>
                    </div>
                  </div>
                </div>

                {/* Photo de preuve si disponible */}
                {m.status === "RESOLVED" && m.proofPhotoUrl && (
                  <div className="mt-3 pl-8">
                    <img src={m.proofPhotoUrl} alt="Preuve" className="w-full max-w-xs rounded-xl object-cover h-28 border border-gray-100" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
