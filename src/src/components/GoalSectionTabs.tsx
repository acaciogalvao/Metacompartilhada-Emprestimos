/**
 * Componente GoalSectionTabs.
 * Exibe os botões de alternância globais entre as seções principais 
 * do aplicativo: "Minhas Metas" e "Empréstimos".
 */
import React from "react";
import { Goal } from "../types";

interface GoalSectionTabsProps {
  currentSection: "metas" | "emprestimos";
  setCurrentSection: (section: "metas" | "emprestimos") => void;
  setCategory: (category: string) => void;
  goalsList: Goal[];
  setCurrentGoalId: (id: string) => void;
  clearGoalData: () => void;
}

export const GoalSectionTabs: React.FC<GoalSectionTabsProps> = ({
  currentSection,
  setCurrentSection,
  setCategory,
  goalsList,
  setCurrentGoalId,
  clearGoalData,
}) => {
  return (
    <div className="flex justify-center mt-6 mb-4">
      <div className="bg-white/5 p-1 rounded-full border border-white/10 flex gap-1">
        <button
          onClick={() => {
            setCurrentSection("metas");
            setCategory("saving");
            const metas = goalsList.filter((g) => g.category !== "loan");
            if (metas.length > 0) setCurrentGoalId(metas[0]._id);
            else clearGoalData();
          }}
          className={`px-6 py-2 rounded-full text-sm font-bold tracking-wide transition-all ${currentSection === "metas" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-white"}`}
        >
          Minhas Metas
        </button>
        <button
          onClick={() => {
            setCurrentSection("emprestimos");
            setCategory("loan");
            const loans = goalsList.filter((g) => g.category === "loan");
            if (loans.length > 0) setCurrentGoalId(loans[0]._id);
            else clearGoalData();
          }}
          className={`px-6 py-2 rounded-full text-sm font-bold tracking-wide transition-all ${currentSection === "emprestimos" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-white"}`}
        >
          Empréstimos
        </button>
      </div>
    </div>
  );
};
