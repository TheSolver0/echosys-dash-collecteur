import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Clock, Camera, Navigation, CheckCircle2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { MissionBadge, CATEGORY_LABEL } from "../components/MissionBadge";
import { api } from "../api/client";
import type { Mission } from "../types";

export default function MissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [mission, setMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsError, setGpsError] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/reports/${id}`)
      .then(setMission)
      .catch(() => navigate("/missions"))
      .finally(() => setLoading(false));
  }, [id]);

  const getGPS = () => {
    setGpsError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setGpsError("Impossible d'obtenir la position GPS.")
    );
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleValidate = async () => {
    if (!photo) { setError("Veuillez ajouter une photo de preuve."); return; }
    if (!gps)   { setError("Veuillez capturer votre position GPS."); return; }
    setError("");
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("photo", photo);
      form.append("latitude",  String(gps.lat));
      form.append("longitude", String(gps.lng));
      await api.patch(`/reports/${id}/resolve`, form);
      setSuccess(true);
      setTimeout(() => navigate("/missions"), 2000);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Erreur lors de la validation.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex-1 flex items-center justify-center text-sm text-gray-400">Chargement...</div>;
  if (!mission) return null;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-7 h-16 flex items-center gap-3 flex-shrink-0">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-700 transition-colors mr-1">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="text-base font-black tracking-tight">Détail mission #{mission.id}</h1>
          <p className="text-xs text-gray-400">
            {format(new Date(mission.createdAt), "d MMMM yyyy à HH:mm", { locale: fr })}
          </p>
        </div>
        <MissionBadge status={mission.status} />
      </div>

      <div className="flex-1 overflow-y-auto p-7">
        <div className="max-w-2xl mx-auto flex flex-col gap-5">

          {/* Info mission */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h2 className="text-lg font-black mb-3">
              {CATEGORY_LABEL[mission.category] ?? mission.category}
            </h2>
            {mission.description && (
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">{mission.description}</p>
            )}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <MapPin size={14} className="text-fern flex-shrink-0" />
                <span>{mission.location ?? "Position non renseignée"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock size={14} className="text-fern flex-shrink-0" />
                <span>Signalé le {format(new Date(mission.createdAt), "d MMMM yyyy", { locale: fr })}</span>
              </div>
            </div>
            {mission.photoUrl && (
              <img
                src={mission.photoUrl}
                alt="Photo signalement"
                className="mt-4 w-full rounded-xl object-cover max-h-52 border border-gray-100"
              />
            )}
          </div>

          {/* Validation — seulement si IN_PROGRESS */}
          {mission.status === "IN_PROGRESS" && !success && (
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-black mb-1">Valider la mission</h3>
              <p className="text-xs text-gray-400 mb-4">Une photo + votre position GPS sont requises.</p>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-xs font-medium px-3 py-2 rounded-lg mb-4">
                  <AlertCircle size={13} /> {error}
                </div>
              )}

              {/* Photo */}
              <div className="mb-4">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2">
                  Photo de preuve
                </p>
                <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} className="hidden" />
                {photoPreview ? (
                  <div className="relative">
                    <img src={photoPreview} className="w-full rounded-xl object-cover max-h-48 border border-gray-100" />
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="absolute bottom-2 right-2 bg-white border border-gray-200 px-2.5 py-1 rounded-lg text-xs font-bold text-gray-600 shadow"
                    >
                      Changer
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-200 rounded-xl py-8 flex flex-col items-center gap-2 text-gray-400 hover:border-fern hover:text-fern transition-colors"
                  >
                    <Camera size={22} />
                    <span className="text-xs font-semibold">Prendre une photo</span>
                  </button>
                )}
              </div>

              {/* GPS */}
              <div className="mb-5">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2">
                  Position GPS
                </p>
                {gps ? (
                  <div className="flex items-center gap-2 bg-green-50 border border-green-100 px-3 py-2 rounded-xl text-xs font-semibold text-green-700">
                    <Navigation size={13} />
                    {gps.lat.toFixed(5)}, {gps.lng.toFixed(5)}
                  </div>
                ) : (
                  <>
                    <button
                      onClick={getGPS}
                      className="flex items-center gap-2 border border-gray-200 bg-white px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:border-fern hover:text-forest transition-colors"
                    >
                      <Navigation size={13} /> Capturer ma position
                    </button>
                    {gpsError && <p className="text-[11px] text-red-500 mt-1">{gpsError}</p>}
                  </>
                )}
              </div>

              <button
                onClick={handleValidate}
                disabled={submitting}
                className="w-full bg-gradient-to-r from-forest to-fern text-white font-bold py-2.5 rounded-xl text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {submitting ? "Envoi en cours..." : "Valider la mission"}
              </button>
            </div>
          )}

          {/* Succès */}
          {success && (
            <div className="bg-green-50 border border-green-100 rounded-2xl p-5 flex items-center gap-3">
              <CheckCircle2 size={22} className="text-green-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-black text-green-700">Mission validée !</p>
                <p className="text-xs text-green-600 mt-0.5">Redirection en cours...</p>
              </div>
            </div>
          )}

          {/* Preuve déjà soumise */}
          {mission.status === "RESOLVED" && mission.proofPhotoUrl && (
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-black mb-3">Preuve soumise</h3>
              <img src={mission.proofPhotoUrl} className="w-full rounded-xl max-h-52 object-cover border border-gray-100 mb-3" />
              {mission.proofLatitude && mission.proofLongitude && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Navigation size={12} className="text-fern" />
                  {mission.proofLatitude.toFixed(5)}, {mission.proofLongitude.toFixed(5)}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
