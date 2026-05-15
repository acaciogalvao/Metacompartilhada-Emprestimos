/**
 * Hook useGoalData.
 * Responsável por buscar, salvar e deletar dados de metas no backend (API).
 * Faz também o agrupamento da lista ("polling") e gerencia operações de 
 * histórico de pagamentos.
 */
import { useState, useEffect } from "react";

export const useGoalData = (
  currentGoalId: string,
  setCurrentGoalId: (id: string) => void,
  currentSection: "metas" | "emprestimos",
  setCurrentSection: (section: "metas" | "emprestimos") => void,
  goalState: any,
  results: any,
  triggerConfetti: () => void,
  showToast: (msg: string, type?: "success" | "error") => void,
) => {
  const [goalsList, setGoalsList] = useState<any[]>([]);

  // Initial load
  useEffect(() => {
    const loadInitial = async () => {
      try {
        const res = await fetch("/api/goals");
        if (!res.ok) return;

        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          return;
        }

        const data = await res.json();
        setGoalsList(data);
        if (data.length > 0) {
          const firstGoal = data[0];
          setCurrentSection(
            firstGoal.category === "loan" ? "emprestimos" : "metas",
          );
          setCurrentGoalId(firstGoal._id);
        } else {
          goalState.clearGoalData(currentSection);
          setCurrentGoalId("");
        }
      } catch (e) {
        console.error("Error loading initial goals", e);
      }
    };
    loadInitial();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Polling and data fetching when currentGoalId changes
  useEffect(() => {
    const fetchGoalsList = async () => {
      try {
        const res = await fetch("/api/goals");
        if (!res.ok) return;

        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          return;
        }

        const data = await res.json();
        setGoalsList(data);
      } catch (e: any) {
        if (e.message === "Failed to fetch") return;
        console.error("Error loading goals list", e);
      }
    };

    const fetchGoalData = async (isInitialLoad: boolean = false) => {
      if (!currentGoalId) return;

      try {
        const res = await fetch(`/api/goal/${currentGoalId}`);
        if (!res.ok) return;

        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          return;
        }

        const data = await res.json();
        goalState.populateGoalData(data, isInitialLoad, triggerConfetti);
      } catch (e: any) {
        // Ignore network errors during polling (e.g. when server restarts)
        if (e.message === "Failed to fetch") return;
        console.error("Error loading initial data", e);
      }
    };

    if (currentGoalId) {
      fetchGoalData(true);
    }

    const interval = setInterval(() => {
      if (currentGoalId) {
        fetchGoalData(false);
      }
      fetchGoalsList();
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [currentGoalId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSaveGoals = async (overrideUpdates?: any) => {
    try {
      const updates = {
        type: goalState.goalType,
        category: goalState.category,
        interestRate: Number(goalState.interestRate),
        itemName: goalState.itemName,
        totalValue: Number(goalState.totalValue),
        months: Number(goalState.months),
        durationUnit: goalState.durationUnit,
        deadlineType: goalState.deadlineType,
        excludeSundays: goalState.excludeSundays,
        startDate: results.startDate,
        endDate: results.endDate,
        contributionP1:
          goalState.goalType === "individual"
            ? 100
            : Number(goalState.contributionP1),
        remindersEnabled: goalState.remindersEnabled,
        applyLateFees: goalState.applyLateFees,
        nameP1: goalState.nameP1,
        nameP2: goalState.nameP2,
        phoneP1: goalState.phoneP1,
        phoneP2: goalState.phoneP2,
        pixKeyP1: goalState.pixKeyP1,
        pixKeyP2: goalState.pixKeyP2,
        frequencyP1: goalState.frequencyP1,
        frequencyP2: goalState.frequencyP2,
        dueDayP1: goalState.dueDayP1,
        dueDayP2: goalState.dueDayP2,
        savedP1: currentGoalId ? results.sP1 : 0,
        savedP2: currentGoalId ? (goalState.goalType === "individual" ? 0 : results.sP2) : 0,
        ...overrideUpdates,
      };

      let res;
      if (currentGoalId) {
        res = await fetch(`/api/goal/${currentGoalId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });
      } else {
        res = await fetch("/api/goal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });
      }

      if (res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const savedGoal = await res.json();
          setCurrentGoalId(savedGoal._id);
        } else {
          const text = await res.text();
          if (text.toLowerCase().includes("<!doctype html>")) {
            throw new Error(
              "O servidor está reiniciando ou indisponível no momento. Por favor, aguarde alguns segundos e tente salvar novamente.",
            );
          }
          throw new Error(
            `Erro desconhecido do servidor (Status ${res.status}). Detalhes: ${text.substring(0, 50)}`,
          );
        }

        // Update goals list
        const listRes = await fetch("/api/goals");
        if (listRes.ok) {
          const listContentType = listRes.headers.get("content-type");
          if (listContentType && listContentType.includes("application/json")) {
            const data = await listRes.json();
            setGoalsList(data);
          }
        }
        showToast("Metas salvas com sucesso!", "success");
      } else {
        const errorData = await res.json().catch(() => ({}));
        showToast(errorData.error || "Erro ao salvar metas.", "error");
      }
    } catch (error: any) {
      console.error("Error saving goal data:", error);
      showToast(error.message || "Erro de conexão ao salvar metas.", "error");
    }
  };

  const confirmClearHistory = async (
    setShowClearHistoryConfirm: (v: boolean) => void,
  ) => {
    try {
      await Promise.all(
        goalState.paymentsHistory.map((p: any) =>
          fetch(`/api/goal/${currentGoalId}/payment/${p.paymentId}`, {
            method: "DELETE",
          }),
        ),
      );
      showToast("Histórico excluído com sucesso!", "success");

      // Reset saved amounts locally
      goalState.setSavedP1("0");
      goalState.setSavedP2("0");
      goalState.setPaymentsHistory([]);

      // Re-fetch to ensure sync
      const res = await fetch(`/api/goal/${currentGoalId}`);
      if (res.ok) {
        const data = await res.json();
        goalState.populateGoalData(data, false, triggerConfetti);
      }
    } catch (error) {
      console.error("Error clearing history:", error);
      showToast("Erro ao excluir histórico.", "error");
    } finally {
      setShowClearHistoryConfirm(false);
    }
  };

  const confirmDeleteGoal = async (
    setShowDeleteConfirm: (v: boolean) => void,
  ) => {
    try {
      await fetch(`/api/goal/${currentGoalId}`, {
        method: "DELETE",
      });

      // Update goals list
      const listRes = await fetch("/api/goals");
      if (listRes.ok) {
        const data = await listRes.json();
        setGoalsList(data);
        if (data.length > 0) {
          const matchingGoals = data.filter((g: any) =>
            currentSection === "emprestimos"
              ? g.category === "loan"
              : g.category !== "loan",
          );
          if (matchingGoals.length > 0) {
            setCurrentGoalId(matchingGoals[0]._id);
          } else {
            goalState.clearGoalData(currentSection);
            setCurrentGoalId("");
          }
        } else {
          goalState.clearGoalData(currentSection); // Clear fields if all are deleted
          setCurrentGoalId("");
        }
      }
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error("Error deleting goal:", error);
    }
  };

  const handleDeletePaymentItem = async (pid: string) => {
    if (!currentGoalId) return;
    try {
      await fetch(`/api/goal/${currentGoalId}/payment/${pid}`, {
        method: "DELETE",
      });
      const res = await fetch(`/api/goal/${currentGoalId}`);
      if (res.ok) {
        const data = await res.json();
        goalState.populateGoalData(data, false, triggerConfetti);
      }
    } catch (error) {
      console.error("Error deleting payment:", error);
    }
  };

  return {
    goalsList,
    setGoalsList,
    handleSaveGoals,
    confirmClearHistory,
    confirmDeleteGoal,
    handleDeletePaymentItem,
  };
};
