/**
 * Componente AppHeader.
 * Responsável por renderizar o cabeçalho superior da aplicação, 
 * exibindo o título correspondente à seção atual (Metas ou Empréstimos)
 * e o botão para criação de novo registro.
 */
import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { GoalType } from "../types";

interface AppHeaderProps {
  currentSection: "metas" | "emprestimos";
  goalType: GoalType;
  handleCreateNewGoal: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentSection,
  goalType,
  handleCreateNewGoal,
}) => {
  return (
    <header className="flex justify-between items-end mb-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight leading-none">
          {currentSection === "emprestimos"
            ? "Meus Empréstimos"
            : goalType === "individual"
              ? "Meta Individual"
              : "Meta Compartilhada"}
        </h1>
        <p className="text-slate-400 mt-2 uppercase text-xs tracking-widest font-semibold">
          {currentSection === "emprestimos"
            ? "Controle suas dívidas e quitações"
            : goalType === "individual"
              ? "Acompanhe o seu progresso financeiro"
              : "Dashboard de Controle Financeiro"}
        </p>
      </div>
      <div className="text-right flex items-center gap-2">
        <Button
          onClick={handleCreateNewGoal}
          className="w-10 h-10 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30 hover:bg-sky-500/30 shadow-none p-0 flex items-center justify-center shrink-0"
        >
          <Plus className="w-5 h-5" />
        </Button>
      </div>
    </header>
  );
};
