import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  ZoomIn, ZoomOut, Locate,
  Trash2, AlertTriangle, BarChart2, X, Building2,
} from "lucide-react";
import Header from "../components/Header.tsx";
import { api, zonesApi } from "../api/client";
import type { District, DistrictStats, Mission } from "../types";

// ─── Fix icônes Leaflet avec Vite ────────────────────────────────────────────
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const makeIcon = (color: string, emoji: string) =>
  L.divIcon({
    className: "",
    html: `<div style="
      background:${color};width:34px;height:34px;border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);border:3px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,0.35);
      display:flex;align-items:center;justify-content:center;
    "><span style="transform:rotate(45deg);font-size:14px;line-height:1">${emoji}</span></div>`,
    iconSize:    [34, 34],
    iconAnchor:  [17, 34],
    popupAnchor: [0, -36],
  });

const ICONS = {
  district: makeIcon("#40916C", "🗑️"),
  alerte:   makeIcon("#E63946", "⚠️"),
  collecte: makeIcon("#2D6A4F", "✅"),
};

type LayerKey = "districts" | "signalements" | "zones";

// ─── Contrôles de zoom ───────────────────────────────────────────────────────
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

const getTauxColor = (taux: number) => {
  if (taux >= 80) return "#40916C";
  if (taux >= 60) return "#95C96E";
  if (taux >= 40) return "#F4A261";
  return "#E63946";
};

const fmtTonnage = (kg: number) =>
  kg >= 1000 ? `${(kg / 1000).toFixed(1)} t` : `${kg} kg`;

// ─── Page principale ─────────────────────────────────────────────────────────
export default function MapPage() {
  const [activeLayers, setActiveLayers] = useState<Set<LayerKey>>(
    new Set(["districts", "signalements", "zones"])
  );
  const [loading, setLoading]                   = useState(true);
  const [districts, setDistricts]               = useState<District[]>([]);
  const [missions, setMissions]                 = useState<Mission[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [districtStats, setDistrictStats]       = useState<DistrictStats | null>(null);
  const [statsLoading, setStatsLoading]         = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [communesData, missionsData] = await Promise.all([
        zonesApi.listCommunes(),
        api.get<Mission[]>("/reports/my-missions"),
      ]);

      // Aplatir les districts depuis toutes les communes
      const allDistricts: District[] = (communesData as any[]).flatMap((c: any) =>
        (c.districts ?? []).map((d: any) => ({
          ...d,
          commune: { id: c.id, name: c.name, communauteUrbaine: c.communauteUrbaine },
        }))
      );
      setDistricts(allDistricts);
      setMissions(missionsData);
    } catch {
      // Fallback silencieux
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDistrictClick = async (d: District) => {
    setSelectedDistrict(d);
    setDistrictStats(null);
    setStatsLoading(true);
    try {
      const stats = await zonesApi.districtStats<DistrictStats>(d.id);
      setDistrictStats(stats);
    } catch {
      // stats indisponibles
    } finally {
      setStatsLoading(false);
    }
  };

  const toggleLayer = (key: LayerKey) => {
    setActiveLayers(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  // Missions avec coordonnées = signalements sur la carte
  const alertMissions = missions.filter(
    m => m.status !== "RESOLVED" && m.status !== "REJECTED" && m.latitude && m.longitude
  );

  // Seuls les districts qui ont des coordonnées peuvent être affichés
  const mappableDistricts = districts.filter(d => d.latitude && d.longitude);

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Carte de Douala"
        subtitle="Suivi en temps réel · OpenStreetMap"
        onRefresh={fetchData}
        loading={loading}
      />

      {/* ── KPI bar ── */}
      <div className="flex gap-3 px-6 py-3 bg-white border-b border-gray-100 overflow-x-auto flex-shrink-0">
        {[
          { icon: Building2,     color: "#2D6A4F", label: "Communes",       value: [...new Set(districts.map(d => d.communeId))].length },
          { icon: Trash2,        color: "#40916C", label: "Quartiers",      value: districts.length },
          { icon: AlertTriangle, color: "#E63946", label: "Signalements",   value: alertMissions.length },
          { icon: BarChart2,     color: "#1B4332", label: "Avec GPS",       value: mappableDistricts.length },
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

        {/* Contrôles calques */}
        <div className="absolute top-4 left-4 z-[1000] bg-white rounded-2xl shadow-lg border border-gray-100 p-3 flex flex-col gap-1.5 min-w-[155px]">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider px-1 mb-0.5">Calques</p>
          {([
            { key: "districts",    emoji: "🗑️", label: "Quartiers"    },
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

          {/* Zones (cercles colorés par taux si stats disponibles) */}
          {activeLayers.has("zones") && mappableDistricts.map(d => (
            <Circle key={`zone-${d.id}`}
              center={[d.latitude!, d.longitude!]}
              radius={400}
              pathOptions={{
                color:       "#40916C",
                fillColor:   "#40916C",
                fillOpacity: 0.13,
                weight:      1.5,
              }}
              eventHandlers={{ click: () => handleDistrictClick(d) }}
            />
          ))}

          {/* Markers quartiers */}
          {activeLayers.has("districts") && mappableDistricts.map(d => (
            <Marker key={`d-${d.id}`}
              position={[d.latitude!, d.longitude!]}
              icon={ICONS.district}
              eventHandlers={{ click: () => handleDistrictClick(d) }}>
              <Popup>
                <div className="min-w-[160px]">
                  <p className="font-black text-[#1E2D24] text-sm">{d.name}</p>
                  <p className="text-xs text-gray-500">
                    {d.commune?.name ?? "—"}
                    {d.commune?.communauteUrbaine ? ` · ${d.commune.communauteUrbaine.name}` : ""}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Signalements = missions actives avec GPS */}
          {activeLayers.has("signalements") && alertMissions.map(m => (
            <Marker key={`m-${m.id}`}
              position={[m.latitude!, m.longitude!]}
              icon={ICONS.alerte}>
              <Popup>
                <div className="min-w-[160px]">
                  <p className="font-black text-red-600 text-sm">⚠️ {m.category}</p>
                  <p className="text-xs text-gray-600">
                    📍 {m.district?.name ?? m.location ?? "—"}
                    {m.district?.commune ? ` · ${m.district.commune.name}` : ""}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">Priorité : {m.priority}</p>
                </div>
              </Popup>
            </Marker>
          ))}

          <ZoomControls />
        </MapContainer>

        {/* Panneau latéral district sélectionné */}
        {selectedDistrict && (
          <div className="absolute top-4 right-4 z-[1000] w-68 bg-white rounded-2xl shadow-xl border border-gray-100 p-4" style={{ width: 270 }}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0 pr-2">
                <p className="font-black text-[#1E2D24] text-sm truncate">{selectedDistrict.name}</p>
                <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                  {selectedDistrict.commune?.name ?? "—"}
                  {selectedDistrict.commune?.communauteUrbaine
                    ? ` · ${selectedDistrict.commune.communauteUrbaine.name}`
                    : ""}
                </p>
              </div>
              <button onClick={() => { setSelectedDistrict(null); setDistrictStats(null); }}
                className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition flex-shrink-0">
                <X size={12} />
              </button>
            </div>

            {statsLoading ? (
              <div className="text-xs text-gray-400 text-center py-8">Chargement des stats...</div>
            ) : districtStats ? (
              <>
                {/* Taux de collecte */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500 font-medium">Taux de collecte</span>
                    <span className="font-black" style={{ color: getTauxColor(districtStats.collectionRate) }}>
                      {districtStats.collectionRate}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${districtStats.collectionRate}%`,
                        background: getTauxColor(districtStats.collectionRate),
                      }} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-[#f0faf5] rounded-xl p-2.5 text-center">
                    <p className="text-[16px] font-black text-[#40916C]">{districtStats.collectionsCount}</p>
                    <p className="text-[10px] text-gray-400 font-medium">Collections</p>
                  </div>
                  <div className="bg-[#f0faf5] rounded-xl p-2.5 text-center">
                    <p className="text-[15px] font-black text-[#40916C]">{fmtTonnage(districtStats.tonnage)}</p>
                    <p className="text-[10px] text-gray-400 font-medium">Tonnage</p>
                  </div>
                  <div className="bg-[#f0faf5] rounded-xl p-2.5 text-center">
                    <p className="text-[16px] font-black text-[#40916C]">{districtStats.binsCount}</p>
                    <p className="text-[10px] text-gray-400 font-medium">Bacs actifs</p>
                  </div>
                  <div className={`rounded-xl p-2.5 text-center ${districtStats.pendingMissions > 0 ? "bg-red-50" : "bg-[#f0faf5]"}`}>
                    <p className={`text-[16px] font-black ${districtStats.pendingMissions > 0 ? "text-red-500" : "text-[#40916C]"}`}>
                      {districtStats.pendingMissions > 0 ? districtStats.pendingMissions : "✅"}
                    </p>
                    <p className="text-[10px] text-gray-400 font-medium">
                      {districtStats.pendingMissions > 0 ? "En attente" : "Tout bon"}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-xs text-gray-400 text-center py-4">Stats indisponibles</div>
            )}

            <a href="/zones"
              className="block w-full py-2 bg-[#1E2D24] text-white text-xs font-bold rounded-xl hover:bg-[#40916C] transition text-center">
              Voir rapport complet →
            </a>
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
