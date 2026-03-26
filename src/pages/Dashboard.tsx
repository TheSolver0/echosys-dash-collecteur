import { useEffect, useState } from "react";
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { ClipboardList, CheckCircle2, AlertTriangle, Route, MapPin, MessageCircle } from "lucide-react";
import { format, subDays } from "date-fns";
import { fr } from "date-fns/locale";
import Header from "../components/Header";
import StatCard from "../components/StatCard";
import { MissionBadge, PriorityBar, CATEGORY_LABEL } from "../components/MissionBadge";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import type { Mission } from "../types";

const STATUS_PIE_COLOR: Record<string, string> = {
  PENDING:     "#f59e0b",
  ASSIGNED:    "#8b5cf6",
  IN_PROGRESS: "#3b82f6",
  RESOLVED:    "#22c55e",
  REJECTED:    "#ef4444",
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);

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

  // -------- Calculs --------
  const today = format(new Date(), "yyyy-MM-dd");
  const todayMissions = missions.filter((m) => m.createdAt.startsWith(today));
  const inProgress  = missions.filter((m) => m.status === "IN_PROGRESS").length;
  const pending     = missions.filter((m) => m.status === "PENDING" || m.status === "ASSIGNED").length;
  const resolved    = missions.filter((m) => m.status === "RESOLVED").length;
  const highPrio    = missions.filter((m) => m.priority === "HIGH" && m.status !== "RESOLVED").length;

  // Tendance 7 jours
  const trendData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const ds = format(date, "yyyy-MM-dd");
    const day = missions.filter((m) => m.createdAt.startsWith(ds));
    return {
      date: format(date, "EEE", { locale: fr }),
      assignées: day.length,
      complétées: day.filter((m) => m.status === "RESOLVED").length,
    };
  });

  // Statuts pour Pie
  const pieData = Object.entries(STATUS_PIE_COLOR)
    .map(([key, color]) => ({
      name: key, color,
      value: missions.filter((m) => m.status === key).length,
    }))
    .filter((d) => d.value > 0);

  // Missions actives (5 dernières non résolues)
  const activeMissions = missions
    .filter((m) => m.status !== "RESOLVED" && m.status !== "REJECTED")
    .slice(0, 5);

  const STATUS_LABEL_FR: Record<string, string> = {
    PENDING: "En attente", ASSIGNED: "Assignée", IN_PROGRESS: "En cours",
    RESOLVED: "Terminée", REJECTED: "Rejetée",
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="Tableau de bord"
        subtitle={`${user?.name} · ${format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}`}
        onRefresh={fetchData}
        loading={loading}
      />

      <div className="flex-1 overflow-y-auto p-7 flex flex-col gap-5">

        {/* -------- KPIs -------- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={ClipboardList} label="Missions du jour"    value={todayMissions.length} color="amber"  sub={`${pending} en attente · ${inProgress} en cours`} />
          <StatCard icon={CheckCircle2}  label="Complétées ce mois"  value={resolved}             color="green"  trend={12} sub="vs mois dernier" />
          <StatCard icon={AlertTriangle} label="Priorité haute"      value={highPrio}             color="red" />
          <StatCard icon={Route}         label="Km parcourus"        value="—"                    color="blue"   sub="Aujourd'hui" />
        </div>

        {/* -------- CHARTS -------- */}
        <div className="grid grid-cols-3 gap-4">
          {/* Tendance */}
          <div className="col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-black text-[#1E2D24] text-sm mb-0.5">Activité des 7 derniers jours</h3>
            <p className="text-xs text-gray-400 mb-4">Missions assignées vs complétées</p>
            {loading ? (
              <div className="h-40 flex items-center justify-center text-xs text-gray-400">Chargement...</div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gC" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#40916C" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#40916C" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }} />
                  <Area type="monotone" dataKey="assignées"  stroke="#3b82f6" strokeWidth={2.5} fill="url(#gA)" name="Assignées" />
                  <Area type="monotone" dataKey="complétées" stroke="#40916C" strokeWidth={2.5} fill="url(#gC)" name="Complétées" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Pie statuts */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-black text-[#1E2D24] text-sm mb-0.5">Statuts missions</h3>
            <p className="text-xs text-gray-400 mb-3">Répartition actuelle</p>
            {loading ? (
              <div className="h-40 flex items-center justify-center text-xs text-gray-400">Chargement...</div>
            ) : pieData.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-xs text-gray-400">Aucune donnée</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={62} paddingAngle={3} dataKey="value">
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-1.5 mt-2">
                  {pieData.map((d) => (
                    <div key={d.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                        <span className="text-gray-500 font-medium">{STATUS_LABEL_FR[d.name]}</span>
                      </div>
                      <span className="font-black text-[#1E2D24]">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* -------- MISSIONS ACTIVES -------- */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-black text-sm">Missions actives</h3>
              <p className="text-xs text-gray-400 mt-0.5">Non résolues assignées à vous</p>
            </div>
            <a href="/missions" className="text-xs font-bold text-fern hover:text-forest">Voir tout →</a>
          </div>

          {loading ? (
            <div className="text-xs text-gray-400 py-4 text-center">Chargement...</div>
          ) : activeMissions.length === 0 ? (
            <div className="text-xs text-gray-400 py-4 text-center">Aucune mission active</div>
          ) : (
            <div className="flex flex-col divide-y divide-gray-50">
              {activeMissions.map((m) => (
                <div key={m.id} className="flex items-center gap-3 py-2.5">
                  <PriorityBar priority={m.priority} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate">
                      {CATEGORY_LABEL[m.category] ?? m.category}
                      {m.location ? ` — ${m.location}` : ""}
                    </p>
                    <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5">
                      <MapPin size={10} />
                      <span>{m.location ?? "Position inconnue"}</span>
                    </div>
                  </div>
                  <MissionBadge status={m.status} />
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
