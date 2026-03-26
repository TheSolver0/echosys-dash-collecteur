import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Layers, Filter, ZoomIn, ZoomOut, Locate,
  Trash2, Truck, AlertTriangle, CheckCircle2,
  MapPin, BarChart2, X, RefreshCw
} from "lucide-react";
import Header from "../components/Header.tsx";


// ─── Fix icônes Leaflet avec Vite/Webpack ───────────────────────────────────
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ─── Icônes personnalisées ───────────────────────────────────────────────────
const makeIcon = (color: string, emoji: string) =>
  L.divIcon({
    className: "",
    html: `<div style="
      background:${color};
      width:34px;height:34px;border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      border:3px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,0.35);
      display:flex;align-items:center;justify-content:center;
    "><span style="transform:rotate(45deg);font-size:14px;line-height:1">${emoji}</span></div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -36],
  });

const ICONS = {
  bac:       makeIcon("#40916C", "🗑️"),
  camion:    makeIcon("#1B4332", "🚛"),
  alerte:    makeIcon("#E63946", "⚠️"),
  collecte:  makeIcon("#2D6A4F", "✅"),
};

// ─── Données mock Douala ─────────────────────────────────────────────────────
const QUARTIERS_DOUALA = [
  { id: 1,  name: "Akwa",           lat: 4.0511,  lng: 9.7086,  bacs: 12, taux: 78, alerte: false },
  { id: 2,  name: "Bonanjo",        lat: 4.0442,  lng: 9.6981,  bacs: 8,  taux: 91, alerte: false },
  { id: 3,  name: "Bali",           lat: 4.0628,  lng: 9.7200,  bacs: 10, taux: 55, alerte: true  },
  { id: 4,  name: "Deido",          lat: 4.0712,  lng: 9.7350,  bacs: 15, taux: 62, alerte: false },
  { id: 5,  name: "New Bell",       lat: 4.0560,  lng: 9.7280,  bacs: 20, taux: 44, alerte: true  },
  { id: 6,  name: "Bonabéri",       lat: 4.0782,  lng: 9.6620,  bacs: 9,  taux: 70, alerte: false },
  { id: 7,  name: "Makepe",         lat: 4.0830,  lng: 9.7490,  bacs: 11, taux: 85, alerte: false },
  { id: 8,  name: "Logpom",         lat: 4.0950,  lng: 9.7410,  bacs: 7,  taux: 38, alerte: true  },
  { id: 9,  name: "Ndokotti",       lat: 4.0480,  lng: 9.7390,  bacs: 13, taux: 67, alerte: false },
  { id: 10, name: "Cité des Palmiers", lat: 4.1010, lng: 9.7560, bacs: 6, taux: 82, alerte: false },
];

const CAMIONS = [
  { id: "C-01", lat: 4.0530, lng: 9.7120, driver: "Paul Mbarga",    zone: "Akwa → Bonanjo",   vitesse: 24 },
  { id: "C-02", lat: 4.0690, lng: 9.7310, driver: "Jean Essomba",   zone: "Deido → New Bell", vitesse: 18 },
  { id: "C-03", lat: 4.0810, lng: 9.6680, driver: "Martin Atangana", zone: "Bonabéri",         vitesse: 31 },
  { id: "C-04", lat: 4.0920, lng: 9.7450, driver: "Eric Tchamba",   zone: "Makepe → Logpom",  vitesse: 0  },
];

const SIGNALEMENTS = [
  { id: "S-001", lat: 4.0573, lng: 9.7290, type: "Débordement",  quartier: "New Bell",  heure: "09:14" },
  { id: "S-002", lat: 4.0635, lng: 9.7215, type: "Bac manquant", quartier: "Bali",      heure: "10:02" },
  { id: "S-003", lat: 4.0953, lng: 9.7420, type: "Dépôt sauvage",quartier: "Logpom",   heure: "11:30" },
];

// ─── Composant de contrôle de zoom ──────────────────────────────────────────
function ZoomControls() {
  const map = useMap();
  return (
    <div className="absolute bottom-8 right-4 z-[1000] flex flex-col gap-1.5">
      <button onClick={() => map.zoomIn()}
        className="w-9 h-9 bg-white rounded-xl shadow-md flex items-center justify-center text-[#1E2D24] hover:bg-[#f0faf5] transition border border-gray-100">
        <ZoomIn size={16} />
      </button>
      <button onClick={() => map.zoomOut()}
        className="w-9 h-9 bg-white rounded-xl shadow-md flex items-center justify-center text-[#1E2D24] hover:bg-[#f0faf5] transition border border-gray-100">
        <ZoomOut size={16} />
      </button>
      <button onClick={() => map.setView([4.0611, 9.7197], 13)}
        className="w-9 h-9 bg-[#40916C] rounded-xl shadow-md flex items-center justify-center text-white hover:bg-[#2D6A4F] transition">
        <Locate size={16} />
      </button>
    </div>
  );
}

// ─── Types de calques ────────────────────────────────────────────────────────
type LayerKey = "bacs" | "camions" | "signalements" | "zones";

// ─── Composant principal ─────────────────────────────────────────────────────
export default function MapPage() {
  const [activeLayers, setActiveLayers] = useState<Set<LayerKey>>(
    new Set(["bacs", "camions", "signalements", "zones"])
  );
  const [loading, setLoading] = useState(false);
  const [selectedQuartier, setSelectedQuartier] = useState<typeof QUARTIERS_DOUALA[0] | null>(null);

  const toggleLayer = (key: LayerKey) => {
    setActiveLayers(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1200);
  };

  const stats = {
    bacs: QUARTIERS_DOUALA.reduce((a, q) => a + q.bacs, 0),
    camions: CAMIONS.length,
    alertes: SIGNALEMENTS.length + QUARTIERS_DOUALA.filter(q => q.alerte).length,
    tauxMoyen: Math.round(QUARTIERS_DOUALA.reduce((a, q) => a + q.taux, 0) / QUARTIERS_DOUALA.length),
  };

  const getTauxColor = (taux: number) => {
    if (taux >= 80) return "#40916C";
    if (taux >= 60) return "#95C96E";
    if (taux >= 40) return "#F4A261";
    return "#E63946";
  };

  return (
    <div className="flex flex-col h-full">
        <Header title="Carte de Douala" subtitle="Suivi en temps réel · OpenStreetMap" onRefresh={handleRefresh} loading={loading} />

      {/* ── KPI bar ── */}
      <div className="flex gap-3 px-6 py-3 bg-white border-b border-gray-100 overflow-x-auto flex-shrink-0">
        {[
          { icon: Trash2,      color: "#40916C", label: "Bacs actifs",    value: stats.bacs },
          { icon: Truck,       color: "#1B4332", label: "Camions",         value: stats.camions },
          { icon: AlertTriangle, color: "#E63946", label: "Alertes",       value: stats.alertes },
          { icon: BarChart2,   color: "#2D6A4F", label: "Taux collecte",  value: `${stats.tauxMoyen}%` },
        ].map(({ icon: Icon, color, label, value }) => (
          <div key={label} className="flex items-center gap-2.5 bg-[#f8fdf9] border border-gray-100 rounded-xl px-4 py-2 min-w-fit">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
              <Icon size={15} style={{ color }} />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-medium leading-none mb-0.5">{label}</p>
              <p className="text-[15px] font-black text-[#1E2D24] leading-none">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Carte + panneaux ── */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* Contrôles calques (gauche flottant) */}
        <div className="absolute top-4 left-4 z-[1000] bg-white rounded-2xl shadow-lg border border-gray-100 p-3 flex flex-col gap-1.5 min-w-[155px]">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider px-1 mb-0.5">Calques</p>
          {([
            { key: "bacs",         emoji: "🗑️", label: "Bacs"         },
            { key: "camions",      emoji: "🚛", label: "Camions"      },
            { key: "signalements", emoji: "⚠️", label: "Signalements" },
            { key: "zones",        emoji: "🔵", label: "Zones taux"   },
          ] as { key: LayerKey; emoji: string; label: string }[]).map(({ key, emoji, label }) => (
            <button key={key}
              onClick={() => toggleLayer(key)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeLayers.has(key)
                  ? "bg-[#1E2D24] text-white"
                  : "text-gray-400 hover:bg-gray-50"
              }`}>
              <span>{emoji}</span> {label}
            </button>
          ))}
        </div>

        {/* Carte Leaflet */}
        <MapContainer
          center={[4.0611, 9.7197]}
          zoom={13}
          zoomControl={false}
          className="flex-1 h-full"
          style={{ zIndex: 0 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* ── Zones (cercles par taux de collecte) ── */}
          {activeLayers.has("zones") && QUARTIERS_DOUALA.map(q => (
            <Circle key={`zone-${q.id}`}
              center={[q.lat, q.lng]}
              radius={400}
              pathOptions={{
                color: getTauxColor(q.taux),
                fillColor: getTauxColor(q.taux),
                fillOpacity: 0.15,
                weight: 1.5,
              }}
              eventHandlers={{ click: () => setSelectedQuartier(q) }}
            />
          ))}

          {/* ── Bacs ── */}
          {activeLayers.has("bacs") && QUARTIERS_DOUALA.map(q => (
            <Marker key={`bac-${q.id}`} position={[q.lat, q.lng]} icon={q.alerte ? ICONS.alerte : ICONS.bac}
              eventHandlers={{ click: () => setSelectedQuartier(q) }}>
              <Popup>
                <div className="min-w-[160px]">
                  <p className="font-black text-[#1E2D24] text-sm">{q.name}</p>
                  <p className="text-xs text-gray-500">{q.bacs} bacs · Taux {q.taux}%</p>
                  {q.alerte && <p className="text-xs text-red-500 font-semibold mt-1">⚠️ Alerte active</p>}
                </div>
              </Popup>
            </Marker>
          ))}

          {/* ── Camions ── */}
          {activeLayers.has("camions") && CAMIONS.map(c => (
            <Marker key={c.id} position={[c.lat, c.lng]} icon={ICONS.camion}>
              <Popup>
                <div className="min-w-[160px]">
                  <p className="font-black text-[#1E2D24] text-sm">Camion {c.id}</p>
                  <p className="text-xs text-gray-600">👤 {c.driver}</p>
                  <p className="text-xs text-gray-500">📍 {c.zone}</p>
                  <p className="text-xs mt-1">
                    {c.vitesse > 0
                      ? <span className="text-green-600 font-semibold">🟢 En route · {c.vitesse} km/h</span>
                      : <span className="text-orange-500 font-semibold">🟠 À l'arrêt</span>}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* ── Signalements ── */}
          {activeLayers.has("signalements") && SIGNALEMENTS.map(s => (
            <Marker key={s.id} position={[s.lat, s.lng]} icon={ICONS.alerte}>
              <Popup>
                <div className="min-w-[160px]">
                  <p className="font-black text-red-600 text-sm">⚠️ {s.type}</p>
                  <p className="text-xs text-gray-600">📍 {s.quartier}</p>
                  <p className="text-xs text-gray-400">🕐 {s.heure} aujourd'hui</p>
                  <p className="text-xs text-gray-400 mt-0.5">Réf : {s.id}</p>
                </div>
              </Popup>
            </Marker>
          ))}

          <ZoomControls />
        </MapContainer>

        {/* ── Panneau latéral quartier sélectionné ── */}
        {selectedQuartier && (
          <div className="absolute top-4 right-4 z-[1000] w-64 bg-white rounded-2xl shadow-xl border border-gray-100 p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-black text-[#1E2D24] text-sm">{selectedQuartier.name}</p>
                <p className="text-[10px] text-gray-400 font-medium">Quartier · Douala</p>
              </div>
              <button onClick={() => setSelectedQuartier(null)}
                className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition">
                <X size={12} />
              </button>
            </div>

            {/* Taux */}
            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500 font-medium">Taux de collecte</span>
                <span className="font-black" style={{ color: getTauxColor(selectedQuartier.taux) }}>
                  {selectedQuartier.taux}%
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${selectedQuartier.taux}%`, background: getTauxColor(selectedQuartier.taux) }} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-[#f0faf5] rounded-xl p-2.5 text-center">
                <p className="text-[18px] font-black text-[#40916C]">{selectedQuartier.bacs}</p>
                <p className="text-[10px] text-gray-400 font-medium">Bacs actifs</p>
              </div>
              <div className={`rounded-xl p-2.5 text-center ${selectedQuartier.alerte ? "bg-red-50" : "bg-[#f0faf5]"}`}>
                <p className={`text-[18px] font-black ${selectedQuartier.alerte ? "text-red-500" : "text-[#40916C]"}`}>
                  {selectedQuartier.alerte ? "⚠️" : "✅"}
                </p>
                <p className="text-[10px] text-gray-400 font-medium">
                  {selectedQuartier.alerte ? "Alerte" : "Normal"}
                </p>
              </div>
            </div>

            <button className="w-full py-2 bg-[#1E2D24] text-white text-xs font-bold rounded-xl hover:bg-[#40916C] transition">
              Voir rapport complet →
            </button>
          </div>
        )}

        {/* Légende */}
        <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur-sm rounded-xl shadow border border-gray-100 px-3 py-2 flex flex-col gap-1">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Taux collecte</p>
          {[
            { color: "#40916C", label: "≥ 80% · Bon"      },
            { color: "#95C96E", label: "60–79% · Moyen"   },
            { color: "#F4A261", label: "40–59% · Faible"  },
            { color: "#E63946", label: "< 40% · Critique" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
              <span className="text-[10px] text-gray-500">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}