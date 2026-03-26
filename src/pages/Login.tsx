import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Leaf, Lock, Phone, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext.tsx";

const BASE_URL = "http://192.168.1.106:3000";

export default function Login() {
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth(); 

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, pin }),
      });
      if (!res.ok) throw new Error("Identifiants incorrects");
      const data = await res.json();
      console.log("Login réussi :", data);  
      
      const resUser = await fetch(`${BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${data.accessToken}` },
      });
      if (!resUser.ok) throw new Error('Erreur récupération profil');
      const user = await resUser.json();
      console.log("Rôle de l'utilisateur :", user?.role);

      if (!res.ok) throw new Error('Erreur récupération profil');
     

      if (!user || !["COLLECTEUR"].includes(user.role)) {
        throw new Error("Accès réservé à la Communauté Urbaine");
      }
      

      login(data.accessToken, user); 
      navigate("/");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    // overflow-hidden empêche tout scroll parasite (X et Y)
    <div className="fixed inset-0 bg-[#1E2D24] flex items-center justify-center p-6 overflow-hidden">
      
      {/* Cercles décoratifs avec point d'ancrage fixe pour éviter le scroll */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#40916C] rounded-full opacity-20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-[#52B788] rounded-full opacity-10 blur-2xl pointer-events-none" />

      <div className="w-full max-w-[400px] relative z-10">
        {/* Logo Section */}
        <div className="text-center mb-10 transform transition-all">
          <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-[#40916C] to-[#2D6A4F] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-[#40916C]/20 border border-white/10">
            <Leaf size={38} className="text-white" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter mb-1">ECHOSYS</h1>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
            <span className="w-1.5 h-1.5 rounded-full bg-[#74C69D] animate-pulse" />
            <p className="text-[#74C69D] text-xs font-bold uppercase tracking-widest">Collecteur</p>
          </div>
        </div>

        {/* Card avec effet Glassmorphism léger */}
        <div className="bg-white rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
          <div className="mb-8">
            <h2 className="text-2xl font-black text-[#1E2D24]">Bon retour </h2>
            <p className="text-gray-400 text-sm mt-1 font-medium">Connectez-vous à votre espace</p>
          </div>

          {error && (
            <div className="mb-6 px-4 py-3 bg-red-50 border-l-4 border-red-500 rounded-r-xl text-xs text-red-600 font-bold animate-shake">
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-[#1E2D24] uppercase tracking-wider ml-1">
                Téléphone
              </label>
              <div className="relative group">
                <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#40916C] transition-colors" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="6XXXXXXXX"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 border-2 border-transparent text-sm font-bold focus:bg-white focus:border-[#40916C]/30 outline-none transition-all placeholder:text-gray-300"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-[#1E2D24] uppercase tracking-wider ml-1">
                Code Secret
              </label>
              <div className="relative group">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#40916C] transition-colors" />
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 border-2 border-transparent text-sm font-bold focus:bg-white focus:border-[#40916C]/30 outline-none transition-all placeholder:text-gray-300"
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
              </div>
            </div>

            <button
              onClick={handleLogin}
              disabled={loading || !phone || !pin}
              className="w-full relative overflow-hidden group py-4 rounded-2xl bg-[#1E2D24] text-white font-black text-sm shadow-xl hover:bg-[#2D6A4F] transition-all duration-300 disabled:opacity-30 mt-4 active:scale-95"
            >
              <div className="flex items-center justify-center gap-2">
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>Accéder au Dashboard</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </div>
            </button>
          </div>
        </div>

        <p className="text-center text-white/20 text-[10px] mt-8 font-medium tracking-widest uppercase">
          Douala Urban Community • Security Standard
        </p>
      </div>
    </div>
  );
}