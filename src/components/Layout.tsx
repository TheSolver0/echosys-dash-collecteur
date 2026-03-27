import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar.tsx";

export default function Layout() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-[#f0f4f8] overflow-hidden">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      
      <main className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 
        ${isCollapsed ? "ml-20" : "ml-64"} 
        max-md:ml-0`}> {/* Sur mobile (max-md), on annule la marge gauche */}
        
        <div className="flex-1 overflow-y-auto">
          {/* Bouton Menu Burger optionnel pour mobile ici si tu veux */}
          <Outlet />
        </div>
      </main>
    </div>
  );
}