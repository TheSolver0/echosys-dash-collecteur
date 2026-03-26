import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, MapPin, Clock, CheckCircle2, PlayCircle,
  PackageOpen, RefreshCw, Camera, LocateFixed, X, ChevronRight,
  Inbox, Zap
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import Header from "../components/Header";
import { MissionBadge, PriorityBar, CATEGORY_LABEL } from "../components/MissionBadge";
import { api } from "../api/client";
import type { Mission, MissionStatus } from "../types";

// ─── Types locaux ────────────────────────────────────────────────────────────

type TabId = "my-missions" | "available";

interface ResolveState {
  missionId: number;
  photo: File | null;
  photoPreview: string | null;
  lat: number | null;
  lng: number | null;
  locating: boolean;
  submitting: boolean;
  error: string | null;
}

// ─── Constantes ──────────────────────────────────────────────────────────────

const MY_FILTERS: { label: string; value: MissionStatus | "ALL" }[] = [
  { label: "Toutes",    value: "ALL" },
  { label: "Assignées", value: "ASSIGNED" },
  { label: "En cours",  value: "IN_PROGRESS" },
  { label: "Terminées", value: "RESOLVED" },
];

// ─── Sous-composant : carte de mission ───────────────────────────────────────

interface MissionCardProps {
  mission: Mission;
  tab: TabId;
  onTake: (id: number) => Promise<void>;
  onAccept: (id: number) => Promise<void>;
  onResolveOpen: (id: number) => void;
  onClick: (id: number) => void;
  actionLoading: number | null;
}

function MissionCard({
  mission: m,
  tab,
  onTake,
  onAccept,
  onResolveOpen,
  onClick,
  actionLoading,
}: MissionCardProps) {
  const busy = actionLoading === m.id;

  return (
    <div
      onClick={() => onClick(m.id)}
      className="group bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3 shadow-sm hover:shadow-md hover:border-gray-200 transition-all cursor-pointer select-none"
    >
      <PriorityBar priority={m.priority} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-bold truncate">
            {CATEGORY_LABEL[m.category] ?? m.category}
          </p>
          <span className="text-[10px] font-bold text-gray-300">#{m.id}</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-gray-400">
          <span className="flex items-center gap-1">
            <MapPin size={10} /> {m.location ?? "Position inconnue"}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={10} />
            {formatDistanceToNow(new Date(m.createdAt), { locale: fr, addSuffix: true })}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        {/* ── Actions selon onglet + statut ── */}
        {tab === "available" && m.status === "PENDING" && (
          <ActionButton
            icon={<PackageOpen size={12} />}
            label="Prendre"
            color="bg-forest"
            busy={busy}
            onClick={() => onTake(m.id)}
          />
        )}

        {tab === "my-missions" && m.status === "ASSIGNED" && (
          <ActionButton
            icon={<PlayCircle size={12} />}
            label="Démarrer"
            color="bg-fern"
            busy={busy}
            onClick={() => onAccept(m.id)}
          />
        )}

        {tab === "my-missions" && m.status === "IN_PROGRESS" && (
          <ActionButton
            icon={<CheckCircle2 size={12} />}
            label="Résoudre"
            color="bg-forest"
            busy={busy}
            onClick={() => onResolveOpen(m.id)}
          />
        )}

        <MissionBadge status={m.status} />

        <ChevronRight
          size={14}
          className="text-gray-300 group-hover:text-gray-400 transition-colors ml-0.5"
        />
      </div>
    </div>
  );
}

// ─── Bouton d'action inline ───────────────────────────────────────────────────

function ActionButton({
  icon, label, color, busy, onClick,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
  busy: boolean;
  onClick: () => void;
}) {
  return (
    <button
      disabled={busy}
      onClick={onClick}
      className={`flex items-center gap-1.5 text-[11px] font-bold text-white px-3 py-1.5 rounded-lg transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${color}`}
    >
      {busy ? (
        <RefreshCw size={11} className="animate-spin" />
      ) : (
        icon
      )}
      {label}
    </button>
  );
}

// ─── Modale Résolution ────────────────────────────────────────────────────────

function ResolveModal({
  state,
  onClose,
  onPhotoChange,
  onLocate,
  onSubmit,
}: {
  state: ResolveState;
  onClose: () => void;
  onPhotoChange: (file: File) => void;
  onLocate: () => void;
  onSubmit: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* En-tête */}
        <div className="px-6 pt-6 pb-4 flex items-start justify-between border-b border-gray-100">
          <div>
            <p className="text-xs font-bold text-fern uppercase tracking-widest mb-0.5">
              Clôturer la mission
            </p>
            <h2 className="text-lg font-black tracking-tight">
              Résolution #{state.missionId}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Corps */}
        <div className="px-6 py-5 flex flex-col gap-4">

          {/* Photo */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
              Photo de preuve <span className="text-red-400">*</span>
            </label>
            {state.photoPreview ? (
              <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-gray-200">
                <img
                  src={state.photoPreview}
                  alt="Preuve"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm border border-gray-200 text-xs font-bold px-2.5 py-1 rounded-lg hover:bg-white transition-colors flex items-center gap-1"
                >
                  <Camera size={11} /> Changer
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full h-36 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 hover:border-fern hover:bg-[#f0faf5] transition-all group"
              >
                <Camera size={22} className="text-gray-300 group-hover:text-fern transition-colors" />
                <span className="text-xs font-semibold text-gray-400 group-hover:text-fern transition-colors">
                  Appuyer pour prendre une photo
                </span>
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onPhotoChange(f);
              }}
            />
          </div>

          {/* GPS */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
              Position GPS <span className="text-red-400">*</span>
            </label>
            {state.lat && state.lng ? (
              <div className="flex items-center justify-between bg-[#f0faf5] border border-[#d1fae5] rounded-xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-fern animate-pulse" />
                  <span className="text-xs font-bold text-forest">
                    {state.lat.toFixed(5)}, {state.lng.toFixed(5)}
                  </span>
                </div>
                <button
                  onClick={onLocate}
                  className="text-[11px] font-bold text-fern hover:text-forest transition-colors"
                >
                  Recapturer
                </button>
              </div>
            ) : (
              <button
                onClick={onLocate}
                disabled={state.locating}
                className="w-full flex items-center gap-2.5 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 hover:border-fern hover:bg-[#f0faf5] transition-all disabled:opacity-60 group"
              >
                {state.locating ? (
                  <RefreshCw size={14} className="text-fern animate-spin" />
                ) : (
                  <LocateFixed size={14} className="text-gray-400 group-hover:text-fern transition-colors" />
                )}
                <span className="text-xs font-semibold text-gray-500 group-hover:text-forest transition-colors">
                  {state.locating ? "Localisation en cours…" : "Capturer ma position"}
                </span>
              </button>
            )}
          </div>

          {/* Erreur */}
          {state.error && (
            <p className="text-xs font-semibold text-red-500 bg-red-50 rounded-xl px-3 py-2.5">
              {state.error}
            </p>
          )}
        </div>

        {/* Pied */}
        <div className="px-6 pb-6 flex gap-2.5">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onSubmit}
            disabled={!state.photo || !state.lat || state.submitting}
            className="flex-1 py-3 rounded-xl bg-forest text-white text-sm font-bold hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {state.submitting ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <CheckCircle2 size={14} />
            )}
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function MissionsPage() {
  const navigate = useNavigate();

  const [tab, setTab] = useState<TabId>("my-missions");
  const [myMissions, setMyMissions] = useState<Mission[]>([]);
  const [available, setAvailable] = useState<Mission[]>([]);
  const [filter, setFilter] = useState<MissionStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Modale résolution
  const [resolveState, setResolveState] = useState<ResolveState | null>(null);

  // ── Fetch ──
  const fetchData = async () => {
    setLoading(true);
    try {
      const [mine, avail] = await Promise.all([
        api.get("/reports/my-missions"),
        api.get("/reports/available"),
      ]);
      setMyMissions(mine);
      setAvailable(avail);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ── Actions ──
  const handleTake = async (id: number) => {
    setActionLoading(id);
    try {
      await api.patch(`/reports/${id}/take`, {});
      await fetchData();
      setTab("my-missions"); // bascule vers mes missions après prise
    } catch {
    } finally {
      setActionLoading(null);
    }
  };

  const handleAccept = async (id: number) => {
    setActionLoading(id);
    try {
      await api.patch(`/reports/${id}/accept`, {});
      await fetchData();
    } catch {
    } finally {
      setActionLoading(null);
    }
  };

  const openResolve = (id: number) => {
    setResolveState({
      missionId: id,
      photo: null,
      photoPreview: null,
      lat: null,
      lng: null,
      locating: false,
      submitting: false,
      error: null,
    });
  };

  const handlePhotoChange = (file: File) => {
    const preview = URL.createObjectURL(file);
    setResolveState((s) => s ? { ...s, photo: file, photoPreview: preview } : s);
  };

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setResolveState((s) => s ? { ...s, error: "Géolocalisation non disponible" } : s);
      return;
    }
    setResolveState((s) => s ? { ...s, locating: true, error: null } : s);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setResolveState((s) =>
          s ? { ...s, lat: pos.coords.latitude, lng: pos.coords.longitude, locating: false } : s
        );
      },
      () => {
        setResolveState((s) =>
          s ? { ...s, locating: false, error: "Impossible de récupérer la position" } : s
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleResolveSubmit = async () => {
    if (!resolveState?.photo || !resolveState.lat) return;
    setResolveState((s) => s ? { ...s, submitting: true, error: null } : s);
    try {
      const form = new FormData();
      form.append("photo", resolveState.photo);
      form.append("latitude", String(resolveState.lat));
      form.append("longitude", String(resolveState.lng ?? 0));

      const token = localStorage.getItem("accessToken");
      const res = await fetch(
        `http://192.168.1.107:3000/reports/${resolveState.missionId}/resolve`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        }
      );
      if (!res.ok) throw new Error(`Erreur ${res.status}`);

      setResolveState(null);
      await fetchData();
    } catch (err: any) {
      setResolveState((s) =>
        s ? { ...s, submitting: false, error: err.message ?? "Erreur lors de la résolution" } : s
      );
    }
  };

  // ── Filtrage ──
  const missions = tab === "my-missions" ? myMissions : available;

  const filtered = missions.filter((m) => {
    const matchStatus =
      tab === "available" || filter === "ALL" || m.status === filter;
    const matchSearch =
      !search ||
      (CATEGORY_LABEL[m.category] ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (m.location ?? "").toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  // ── Compteurs ──
  const myCount = myMissions.filter((m) =>
    m.status === "ASSIGNED" || m.status === "IN_PROGRESS"
  ).length;
  const availCount = available.length;

  // ── Render ──
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Missions" onRefresh={fetchData} loading={loading} />

      <div className="flex-1 overflow-y-auto p-7 flex flex-col gap-5">

        {/* ── Onglets ── */}
        <div className="flex gap-2">
          <TabButton
            active={tab === "my-missions"}
            icon={<Zap size={13} />}
            label="Mes missions"
            count={myCount}
            onClick={() => { setTab("my-missions"); setFilter("ALL"); }}
          />
          <TabButton
            active={tab === "available"}
            icon={<Inbox size={13} />}
            label="Disponibles"
            count={availCount}
            accent
            onClick={() => setTab("available")}
          />
        </div>

        {/* ── Search + filtres (mes missions seulement) ── */}
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={tab === "my-missions" ? "Rechercher une mission…" : "Rechercher par catégorie ou lieu…"}
              className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm font-medium outline-none focus:border-fern focus:ring-2 focus:ring-fern/10 transition-all"
            />
          </div>

          {tab === "my-missions" && (
            <div className="flex gap-2 flex-wrap">
              {MY_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    filter === f.value
                      ? "bg-forest text-white border-forest"
                      : "bg-white text-gray-500 border-gray-200 hover:border-fern hover:text-forest"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Liste ── */}
        {loading ? (
          <LoadingSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState tab={tab} />
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((m) => (
              <MissionCard
                key={m.id}
                mission={m}
                tab={tab}
                onTake={handleTake}
                onAccept={handleAccept}
                onResolveOpen={openResolve}
                onClick={(id) => navigate(`/missions/${id}`)}
                actionLoading={actionLoading}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Modale résolution ── */}
      {resolveState && (
        <ResolveModal
          state={resolveState}
          onClose={() => setResolveState(null)}
          onPhotoChange={handlePhotoChange}
          onLocate={handleLocate}
          onSubmit={handleResolveSubmit}
        />
      )}
    </div>
  );
}

// ─── Helpers UI ───────────────────────────────────────────────────────────────

function TabButton({
  active, icon, label, count, accent, onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  count: number;
  accent?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border flex-1 justify-center ${
        active
          ? "bg-forest text-white border-forest shadow-sm"
          : "bg-white text-gray-500 border-gray-200 hover:border-fern hover:text-forest"
      }`}
    >
      {icon}
      {label}
      {count > 0 && (
        <span
          className={`text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
            active
              ? "bg-white/20 text-white"
              : accent
              ? "bg-orange-100 text-orange-500"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3 animate-pulse"
        >
          <div className="w-[3px] h-9 rounded-full bg-gray-100" />
          <div className="flex-1 flex flex-col gap-2">
            <div className="h-3 w-32 bg-gray-100 rounded-full" />
            <div className="h-2.5 w-48 bg-gray-100 rounded-full" />
          </div>
          <div className="h-5 w-20 bg-gray-100 rounded-md" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ tab }: { tab: TabId }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
        {tab === "available" ? (
          <Inbox size={22} className="text-gray-300" />
        ) : (
          <CheckCircle2 size={22} className="text-gray-300" />
        )}
      </div>
      <p className="text-sm font-bold text-gray-400">
        {tab === "available" ? "Aucune mission disponible" : "Aucune mission trouvée"}
      </p>
      <p className="text-xs text-gray-300 text-center max-w-[200px]">
        {tab === "available"
          ? "Toutes les missions ont été prises en charge"
          : "Modifiez vos filtres ou actualisez la liste"}
      </p>
    </div>
  );
}