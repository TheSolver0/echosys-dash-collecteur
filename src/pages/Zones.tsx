import { useEffect, useState } from "react";
import {
  Building2, MapPin, ChevronDown, ChevronRight,
  TrendingUp, Weight, Banknote, CheckCircle2, AlertTriangle, RefreshCw,
} from "lucide-react";
import Header from "../components/Header";
import { zonesApi } from "../api/client";
import { useAuth } from "../context/AuthContext";
import type { Commune, CommuneStats, DistrictStats } from "../types";

// ─── Constantes financières ───────────────────────────────────────────────────
/** Tarif de collecte standard : 10 000 FCFA / tonne */
const FCFA_PAR_TONNE = 10_000;

const fmtTonnage = (kg: number) =>
  kg >= 1000 ? `${(kg / 1000).toFixed(2)} t` : `${kg} kg`;

const fmtFCFA = (fcfa: number) =>
  new Intl.NumberFormat("fr-FR").format(Math.round(fcfa)) + " FCFA";

const revenue = (tonneKg: number) => (tonneKg / 1000) * FCFA_PAR_TONNE;

const getTauxColor = (taux: number) => {
  if (taux >= 80) return { bg: "bg-green-50",  text: "text-green-600",  bar: "#40916C" };
  if (taux >= 60) return { bg: "bg-lime-50",   text: "text-lime-600",   bar: "#95C96E" };
  if (taux >= 40) return { bg: "bg-orange-50", text: "text-orange-500", bar: "#F4A261" };
  return               { bg: "bg-red-50",    text: "text-red-500",    bar: "#E63946" };
};

// ─── Barre de taux ────────────────────────────────────────────────────────────
function TauxBar({ taux }: { taux: number }) {
  const { bar } = getTauxColor(taux);
  return (
    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1.5">
      <div className="h-full rounded-full transition-all duration-700"
        style={{ width: `${taux}%`, background: bar }} />
    </div>
  );
}

// ─── Carte district ───────────────────────────────────────────────────────────
function DistrictCard({ stats, isMyZone }: { stats: DistrictStats; isMyZone: boolean }) {
  const { bg, text } = getTauxColor(stats.collectionRate);
  return (
    <div className={`rounded-xl border p-3.5 ${isMyZone ? "border-[#40916C] bg-[#f0faf5]" : "border-gray-100 bg-white"}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          {isMyZone && <span className="w-2 h-2 rounded-full bg-[#40916C] flex-shrink-0" />}
          <p className="text-xs font-black text-[#1E2D24] truncate">{stats.district.name}</p>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg flex-shrink-0 ${bg} ${text}`}>
          {stats.collectionRate}%
        </span>
      </div>

      <TauxBar taux={stats.collectionRate} />

      <div className="grid grid-cols-3 gap-2 mt-3">
        <div>
          <p className="text-[10px] text-gray-400 font-medium">Collections</p>
          <p className="text-sm font-black text-[#1E2D24]">{stats.collectionsCount}</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-400 font-medium">Tonnage</p>
          <p className="text-sm font-black text-[#1E2D24]">{fmtTonnage(stats.tonnage)}</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-400 font-medium">Revenus est.</p>
          <p className="text-sm font-black text-[#40916C]">
            {fmtFCFA(revenue(stats.tonnage))}
          </p>
        </div>
      </div>

      {stats.pendingMissions > 0 && (
        <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-orange-500 font-semibold">
          <AlertTriangle size={11} />
          <span>{stats.pendingMissions} mission(s) en attente</span>
        </div>
      )}
    </div>
  );
}

// ─── Carte commune (accordéon) ────────────────────────────────────────────────
function CommuneCard({ stats, myDistrictId }: { stats: CommuneStats; myDistrictId?: number }) {
  const [open, setOpen] = useState(false);
  const { text } = getTauxColor(stats.avgCollectionRate);
  const hasMyZone = stats.districts.some(d => d.district.id === myDistrictId);

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${hasMyZone ? "border-[#40916C]" : "border-gray-100"}`}>
      {/* Header commune */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition text-left"
      >
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${hasMyZone ? "bg-[#1E2D24]" : "bg-[#f0faf5]"}`}>
          <Building2 size={16} className={hasMyZone ? "text-[#74C69D]" : "text-[#40916C]"} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-black text-[#1E2D24] truncate">{stats.commune.name}</p>
            {hasMyZone && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-[#40916C] text-white flex-shrink-0">
                MA ZONE
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-400 font-medium mt-0.5">
            {stats.districts.length} quartier(s) · {stats.totalCollections} collections
          </p>
          <TauxBar taux={stats.avgCollectionRate} />
        </div>

        <div className="text-right flex-shrink-0 ml-2">
          <p className={`text-base font-black ${text}`}>{stats.avgCollectionRate}%</p>
          <p className="text-[9px] text-gray-400">taux moyen</p>
        </div>

        {open
          ? <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />
          : <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
        }
      </button>

      {/* Résumé financier commune */}
      {open && (
        <div className="px-4 pb-1">
          <div className="grid grid-cols-3 gap-2 pb-3 border-b border-gray-100">
            <div className="bg-[#f8fdf9] rounded-xl p-2.5 text-center">
              <p className="text-[10px] text-gray-400 font-medium">Tonnage total</p>
              <p className="text-sm font-black text-[#1E2D24]">{fmtTonnage(stats.totalTonnage)}</p>
            </div>
            <div className="bg-[#f8fdf9] rounded-xl p-2.5 text-center">
              <p className="text-[10px] text-gray-400 font-medium">Bacs actifs</p>
              <p className="text-sm font-black text-[#1E2D24]">{stats.totalBins}</p>
            </div>
            <div className="bg-[#f0faf5] rounded-xl p-2.5 text-center">
              <p className="text-[10px] text-[#2D6A4F] font-medium">Revenus est.</p>
              <p className="text-sm font-black text-[#40916C]">{fmtFCFA(revenue(stats.totalTonnage))}</p>
            </div>
          </div>

          {/* Districts */}
          <div className="flex flex-col gap-2 py-3">
            {stats.districts.map(d => (
              <DistrictCard
                key={d.district.id}
                stats={d}
                isMyZone={d.district.id === myDistrictId}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function ZonesPage() {
  const { user }           = useAuth();
  const [communes, setCommunes]         = useState<CommuneStats[]>([]);
  const [myStats, setMyStats]           = useState<import("../types").DistrictStats | null>(null);
  const [loading, setLoading]           = useState(true);
  const [activeTab, setActiveTab]       = useState<"toutes" | "mazone">(
    user?.districtId ? "mazone" : "toutes"
  );

  const fetchData = async () => {
    setLoading(true);
    try {
      // Récupérer toutes les communes pour construire les stats
      const communesRaw = await zonesApi.listCommunes<Commune[]>();

      // Pour chaque commune, charger ses stats
      const statsPromises = communesRaw.map(c => zonesApi.communeStats(c.id).catch(() => null));
      const statsResults  = await Promise.all(statsPromises);

      const valid = statsResults.filter(Boolean) as CommuneStats[];
      setCommunes(valid);

      // Stats de ma zone assignée
      if (user?.districtId) {
        try {
          const ds = await zonesApi.districtStats<DistrictStats>(user.districtId);
          setMyStats(ds);
        } catch {
          // optionnel
        }
      }
    } catch {
      // Fallback vide
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ── Agrégats globaux ─────────────────────────────────────────────────────────
  const totalTonnage    = communes.reduce((s, c) => s + c.totalTonnage, 0);
  const totalCollects   = communes.reduce((s, c) => s + c.totalCollections, 0);
  const avgRate         = communes.length
    ? Math.round(communes.reduce((s, c) => s + c.avgCollectionRate, 0) / communes.length)
    : 0;
  const totalRevenu     = revenue(totalTonnage);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="Zones de collecte"
        subtitle="Hiérarchie géographique · Tonnage · Finances"
        onRefresh={fetchData}
        loading={loading}
      />

      <div className="flex-1 overflow-y-auto p-7 flex flex-col gap-5">

        {/* ── KPIs globaux ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Building2,    color: "blue",  label: "Communes",       value: communes.length },
            { icon: TrendingUp,   color: "green", label: "Taux moyen",     value: `${avgRate}%` },
            { icon: Weight,       color: "amber", label: "Tonnage total",  value: fmtTonnage(totalTonnage) },
            { icon: Banknote,     color: "green", label: "Revenus est.",   value: fmtFCFA(totalRevenu) },
          ].map(({ icon: Icon, color, label, value }) => {
            const colorMap: Record<string, string> = {
              blue: "#3b82f6", green: "#40916C", amber: "#f59e0b",
            };
            const bgMap: Record<string, string> = {
              blue: "#eff6ff", green: "#f0faf5", amber: "#fffbeb",
            };
            return (
              <div key={label} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: bgMap[color] }}>
                  <Icon size={18} style={{ color: colorMap[color] }} />
                </div>
                <p className="text-xs text-gray-400 font-medium">{label}</p>
                <p className="text-xl font-black text-[#1E2D24] mt-0.5 truncate">{value}</p>
              </div>
            );
          })}
        </div>

        {/* ── Onglets ── */}
        {user?.districtId && (
          <div className="flex gap-2">
            {([
              { key: "mazone",  label: "Ma zone" },
              { key: "toutes",  label: "Toutes les zones" },
            ] as { key: typeof activeTab; label: string }[]).map(({ key, label }) => (
              <button key={key}
                onClick={() => setActiveTab(key)}
                className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
                  activeTab === key
                    ? "bg-[#1E2D24] text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}>
                {label}
              </button>
            ))}
          </div>
        )}

        {/* ── Tab : Ma zone ── */}
        {activeTab === "mazone" && user?.districtId && (
          <div className="flex flex-col gap-4">
            {/* Carte identité zone */}
            <div className="bg-gradient-to-br from-[#1E2D24] to-[#2D6A4F] rounded-2xl p-5 text-white">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                  <MapPin size={20} className="text-[#74C69D]" />
                </div>
                <div>
                  <p className="text-xs text-white/50 font-medium">Zone assignée</p>
                  <p className="text-lg font-black leading-tight">
                    {user.district?.name ?? `District #${user.districtId}`}
                  </p>
                  {user.commune && (
                    <p className="text-sm text-white/70 font-medium">{user.commune.name}</p>
                  )}
                </div>
              </div>

              {myStats ? (
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Collections",    value: String(myStats.collectionsCount) },
                    { label: "Taux collecte",  value: `${myStats.collectionRate}%`     },
                    { label: "Tonnage",        value: fmtTonnage(myStats.tonnage)      },
                    { label: "Revenus est.",   value: fmtFCFA(revenue(myStats.tonnage)) },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-white/10 rounded-xl p-3">
                      <p className="text-[10px] text-white/50 font-medium">{label}</p>
                      <p className="text-base font-black text-white mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>
              ) : loading ? (
                <p className="text-xs text-white/50 text-center py-4">Chargement stats...</p>
              ) : (
                <p className="text-xs text-white/50 text-center py-4">Stats non disponibles</p>
              )}
            </div>

            {/* Explication du tarif */}
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
              <Banknote size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-black text-amber-800">Revenus estimés</p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  Calculés sur la base de {new Intl.NumberFormat("fr-FR").format(FCFA_PAR_TONNE)} FCFA/tonne collectée.
                  Vérifier le barème exact avec l'administration.
                </p>
              </div>
            </div>

            {/* Missions en attente dans la zone */}
            {myStats && myStats.pendingMissions > 0 && (
              <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex items-center gap-3">
                <AlertTriangle size={18} className="text-orange-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-black text-orange-800">
                    {myStats.pendingMissions} mission(s) en attente dans votre zone
                  </p>
                  <p className="text-[11px] text-orange-600 mt-0.5">
                    Consultez la page Missions pour prendre en charge.
                  </p>
                </div>
                <a href="/missions"
                  className="text-[11px] font-bold text-orange-600 hover:text-orange-800 flex-shrink-0">
                  Voir →
                </a>
              </div>
            )}

            {myStats && myStats.resolvedMissions > 0 && (
              <div className="bg-green-50 border border-green-100 rounded-2xl p-4 flex items-center gap-3">
                <CheckCircle2 size={18} className="text-green-600 flex-shrink-0" />
                <p className="text-xs font-semibold text-green-800">
                  {myStats.resolvedMissions} mission(s) résolue(s) dans votre zone
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Tab : Toutes les zones ── */}
        {activeTab === "toutes" && (
          <>
            {loading ? (
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : communes.length === 0 ? (
              <div className="text-sm text-gray-400 text-center py-12 flex flex-col items-center gap-3">
                <RefreshCw size={32} className="text-gray-300" />
                <p>Aucune donnée de zone disponible</p>
                <button onClick={fetchData} className="text-xs font-bold text-[#40916C]">Réessayer</button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {communes.map(c => (
                  <CommuneCard
                    key={c.commune.id}
                    stats={c}
                    myDistrictId={user?.districtId}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
