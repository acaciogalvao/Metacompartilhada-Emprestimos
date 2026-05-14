import React from "react";
import { Home, List, Calendar, LayoutDashboard } from "lucide-react";
import type { AppTab } from "../hooks/useAppNavigation";

interface BottomNavProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  isEditing: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  isEditing,
}) => {
  if (isEditing) return null;

  const tabs: { id: AppTab; icon: React.ReactNode; label: string }[] = [
    { id: "inicio", icon: <Home className="w-5 h-5" />, label: "Início" },
    { id: "calendario", icon: <Calendar className="w-5 h-5" />, label: "Calendário" },
    { id: "historico", icon: <List className="w-5 h-5" />, label: "Histórico" },
    { id: "dashboard", icon: <LayoutDashboard className="w-5 h-5" />, label: "Painel" },
  ];

  return (
    <div className="fixed bottom-0 md:bottom-6 md:left-[5%] md:w-[90%] left-0 w-full glass-card border-x-0 md:border-x border-b-0 md:border-b border-t border-white/10 flex justify-around items-center p-3 md:p-4 z-40 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] md:pb-4 shadow-lg shadow-black/20 md:rounded-2xl rounded-none rounded-t-3xl">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex flex-col items-center gap-1 w-full transition-colors ${
            activeTab === tab.id
              ? "text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          {tab.icon}
          <span className="text-[9px] font-bold uppercase tracking-widest">{tab.label}</span>
        </button>
      ))}
    </div>
  );
};
