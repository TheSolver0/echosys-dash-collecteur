import { useState,type Dispatch, type SetStateAction } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Map, Users, Truck, UserCog, FileDown, LogOut, Leaf, ChevronLeft, ChevronRight, ClipboardList, History, MessageCircle
} from "lucide-react";

import { useAuth } from "../context/AuthContext";


const NAV = [
  { to: "/",           icon: LayoutDashboard, label: "Dashboard",      section: "Principal" },
  { to: "/missions",   icon: ClipboardList,   label: "Missions",       badge: true },
  { to: "/carte",      icon: Map,             label: "Carte" },
  { to: "/historique", icon: History,         label: "Historique",     section: "Suivi" },
  { to: "/messages",   icon: MessageCircle,   label: "Messages" },
];


interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: Dispatch<SetStateAction<boolean>>;
}

export default function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
  return (
    <aside 
  className={`fixed left-0 top-0 h-screen bg-[#1E2D24] flex flex-col z-20 transition-all duration-300 ease-in-out 
    ${isCollapsed ? "w-20 max-md:-left-20" : "w-64 max-md:-left-64"} 
    md:translate-x-0`} 
>
      {/* Bouton de switch */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-10 bg-[#40916C] text-white rounded-full p-1 border-2 border-[#1E2D24] hover:scale-110 transition-transform"
      >
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {/* Logo */}
      <div className={`flex items-center gap-3 px-6 py-5 border-b border-white/10 overflow-hidden ${isCollapsed ? "justify-center px-0" : ""}`}>
        <div className="min-w-[36px] w-9 h-9 rounded-xl bg-[#40916C] flex items-center justify-center">
          <Leaf size={20} className="text-white" />
        </div>
        {!isCollapsed && (
          <div className="whitespace-nowrap">
            <p className="text-white font-black text-lg leading-none">ECHOSYS</p>
            <p className="text-[#74C69D] text-xs font-medium">Dashboard Collecteur  </p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto overflow-x-hidden">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            title={isCollapsed ? label : ""} // Tooltip quand réduit
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-600 transition-all ${
                isCollapsed ? "justify-center" : ""
              } ${
                isActive
                  ? "bg-[#40916C] text-white font-bold"
                  : "text-white/60 hover:bg-white/10 hover:text-white"
              }`
            }
          >
            <Icon size={18} className="min-w-[18px]" />
            {!isCollapsed && <span className="whitespace-nowrap">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={() => { localStorage.clear(); window.location.href = "/login"; }}
          title={isCollapsed ? "Déconnexion" : ""}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white/50 hover:bg-red-500/10 hover:text-red-400 transition-all ${
            isCollapsed ? "justify-center" : ""
          }`}
        >
          <LogOut size={18} className="min-w-[18px]" />
          {!isCollapsed && <span className="whitespace-nowrap">Déconnexion</span>}
        </button>
      </div>
    </aside>
  );
}