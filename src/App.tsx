import React, { useState, useMemo } from "react";
import { PaymentHistory } from "./components/PaymentHistory";
import { PixModal } from "./components/PixModal";
import { DeleteConfirmModal } from "./components/DeleteConfirmModal";
import { ClearHistoryConfirmModal } from "./components/ClearHistoryConfirmModal";
import { GoalSummary } from "./components/GoalSummary";
import { GoalForm } from "./components/GoalForm";
import { GoalSelector } from "./components/GoalSelector";
import { GoalSectionTabs } from "./components/GoalSectionTabs";
import { BottomNav } from "./components/BottomNav";
import { AppHeader } from "./components/AppHeader";
import { Dashboard } from "./components/Dashboard";
import { PaymentCalendar } from "./components/PaymentCalendar";
import { LoanCalculator } from "./components/LoanCalculator";
import { EarlySettlementModal } from "./components/EarlySettlementModal";
import { calculateGoal } from "./lib/calculations";
import { generateExportText } from "./lib/export";
import { usePayment } from "./hooks/usePayment";
import { useConfetti } from "./hooks/useConfetti";
import { useGoalData } from "./hooks/useGoalData";
import { useGoalState } from "./hooks/useGoalState";
import {
  formatCurrency,
  getFreqLabel,
  getMotivationalMessage,
  handleCurrencyChange,
} from "./lib/utils";
import { useAppNavigation } from "./hooks/useAppNavigation";

export default function App() {
  const {
    activeTab,
    setActiveTab,
    isEditing,
    setIsEditing,
    isDropdownOpen,
    setIsDropdownOpen,
    showDeleteConfirm,
    setShowDeleteConfirm,
    showClearHistoryConfirm,
    setShowClearHistoryConfirm,
    toastMessage,
    showToast,
    handleClearHistoryClick,
    handleDeleteGoal,
  } = useAppNavigation();

  const [currentGoalId, setCurrentGoalId] = useState<string>("");
  const [currentSection, setCurrentSection] = useState<"metas" | "emprestimos">("metas");
  const [showCalculator, setShowCalculator] = useState(false);
  const [showEarlySettlement, setShowEarlySettlement] = useState(false);

  const goalState = useGoalState();
  const { triggerConfetti } = useConfetti();
  const {
    category,
    setCategory,
    interestRate,
    setInterestRate,
    itemName,
    setItemName,
    totalValue,
    setTotalValue,
    months,
    setMonths,
    durationUnit,
    setDurationUnit,
    deadlineType,
    setDeadlineType,
    excludeSundays,
    setExcludeSundays,
    endDate,
    setEndDate,
    contributionP1,
    setContributionP1,
    goalType,
    setGoalType,
    savedP1,
    setSavedP1,
    savedP2,
    setSavedP2,
    paymentsHistory,
    setPaymentsHistory,
    nameP1,
    setNameP1,
    nameP2,
    setNameP2,
    phoneP1,
    setPhoneP1,
    phoneP2,
    setPhoneP2,
    pixKeyP1,
    setPixKeyP1,
    pixKeyP2,
    setPixKeyP2,
    frequencyP1,
    setFrequencyP1,
    frequencyP2,
    setFrequencyP2,
    dueDayP1,
    setDueDayP1,
    dueDayP2,
    setDueDayP2,
    startDate,
    setStartDate,
    remindersEnabled,
    setRemindersEnabled,
    applyLateFees,
    setApplyLateFees,
    clearGoalData,
    populateGoalData,
  } = goalState;

  const {
    showPixModal,
    setShowPixModal,
    currentPayer,
    setCurrentPayer,
    pixAmount,
    setPixAmount,
    pixCode,
    setPixCode,
    isGeneratingPix,
    copied,
    paymentSuccess,
    qrCodeBase64,
    isManualPayment,
    setIsManualPayment,
    paymentMethod,
    setPaymentMethod,
    isConfirmingPayment,
    handleGeneratePix,
    handleConfirmPayment,
    copyPixCode,
  } = usePayment({
    currentGoalId,
    pixKeyP1,
    pixKeyP2,
    nameP1,
    nameP2,
    showToast,
    onPaymentSuccess: () => {
      fetch(`/api/goal/${currentGoalId}`)
        .then((r) => {
          if (!r.ok || !r.headers.get("content-type")?.includes("application/json")) throw new Error("Invalid response");
          return r.json();
        })
        .then((goalData) => {
          if (goalData.savedP1 !== undefined) setSavedP1(goalData.savedP1.toString());
          if (goalData.savedP2 !== undefined) setSavedP2(goalData.savedP2.toString());
          if (goalData.payments !== undefined) setPaymentsHistory(goalData.payments);
        })
        .catch(console.error);
    },
  });

  const contributionP2 = 100 - (Number(contributionP1) || 0);

  const results = useMemo(() => {
    return calculateGoal({
      applyLateFees,
      totalValue,
      category,
      interestRate,
      startDate,
      endDate,
      excludeSundays,
      deadlineType,
      months,
      durationUnit,
      frequencyP1,
      frequencyP2,
      savedP1,
      savedP2,
      goalType,
      contributionP1,
      dueDayP1,
      dueDayP2,
      payments: paymentsHistory,
    });
  }, [
    totalValue, months, durationUnit, deadlineType, contributionP1,
    savedP1, savedP2, frequencyP1, frequencyP2, contributionP2,
    paymentsHistory, dueDayP1, dueDayP2, startDate, endDate, excludeSundays,
  ]);

  const {
    goalsList,
    handleSaveGoals,
    confirmClearHistory,
    confirmDeleteGoal,
    handleDeletePaymentItem,
  } = useGoalData(
    currentGoalId,
    setCurrentGoalId,
    currentSection,
    setCurrentSection,
    goalState,
    results,
    triggerConfetti,
    showToast,
  );

  const handleExportText = (): string => {
    return generateExportText({
      category,
      goalType,
      itemName,
      nameP1,
      nameP2,
      contributionP1,
      contributionP2,
      results,
    });
  };

  const handleCreateNewGoal = () => {
    clearGoalData(currentSection);
    setCurrentGoalId("");
    if (currentSection === "emprestimos") setCategory("loan");
    else setCategory("saving");
    setIsEditing(true);
    setActiveTab("inicio");
  };

  const filteredGoalsList = goalsList.filter((g) =>
    currentSection === "emprestimos" ? g.category === "loan" : g.category !== "loan",
  );

  const handleSelectGoalFromDashboard = (id: string, section: "metas" | "emprestimos") => {
    setCurrentSection(section);
    setCurrentGoalId(id);
    setActiveTab("inicio");
  };

  const handleEarlySettlement = async (amountP1: number, amountP2: number) => {
    const payments = [];
    if (amountP1 > 0) {
      payments.push(
        fetch("/api/manual-pay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ goalId: currentGoalId, payerId: "P1", amount: amountP1, method: "dinheiro" }),
        })
      );
    }
    if (amountP2 > 0) {
      payments.push(
        fetch("/api/manual-pay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ goalId: currentGoalId, payerId: "P2", amount: amountP2, method: "dinheiro" }),
        })
      );
    }
    await Promise.all(payments);
    const res = await fetch(`/api/goal/${currentGoalId}`);
    if (res.ok) {
      const data = await res.json();
      if (data.savedP1 !== undefined) setSavedP1(data.savedP1.toString());
      if (data.savedP2 !== undefined) setSavedP2(data.savedP2.toString());
      if (data.payments !== undefined) setPaymentsHistory(data.payments);
    }
    showToast("Quitação registrada com sucesso!", "success");
    triggerConfetti();
  };

  const isDashboardTab = activeTab === "dashboard";

  return (
    <>
      <div className="min-h-screen w-full flex justify-center font-sans selection:bg-sky-500/30 text-white relative">
        <div className="mesh-gradient"></div>
        <div className="w-full max-w-6xl min-h-screen relative pb-24 overflow-x-hidden flex flex-col mx-auto px-2 sm:px-6 md:px-8 z-0">
          {toastMessage && (
            <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-lg text-white text-sm font-medium transition-all w-11/12 max-w-sm text-center ${toastMessage.type === "success" ? "bg-emerald-500/90 backdrop-blur border border-emerald-400/20" : "bg-rose-500/90 backdrop-blur border border-rose-400/20"}`}>
              {toastMessage.text}
            </div>
          )}          {/* Dashboard tab: full-screen overlay */}
          {isDashboardTab && !isEditing ? (
            <div 
              key="dashboard"
              className="flex-1 p-4 md:p-8 animate-in fade-in duration-300"
            >
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-white">Painel Geral</h1>
                <p className="text-slate-400 text-sm mt-1">Visão consolidada de todos seus compromissos</p>
              </div>
              <Dashboard 
                goalsList={goalsList}
                formatCurrency={formatCurrency}
                onSelectGoal={handleSelectGoalFromDashboard}
              />
            </div>
          ) : (
            <div 
              key="main-content"
              className="w-full animate-in fade-in duration-300"
            >
              {!isEditing && (
                <GoalSectionTabs
                  currentSection={currentSection}
                  setCurrentSection={setCurrentSection}
                  setCategory={setCategory}
                  goalsList={goalsList}
                  setCurrentGoalId={setCurrentGoalId}
                  clearGoalData={() => clearGoalData(currentSection)}
                />
              )}

              {isEditing && (
                <GoalForm
                  goalType={goalType}
                  setGoalType={setGoalType}
                  category={category}
                  setCategory={setCategory}
                  interestRate={interestRate}
                  setInterestRate={setInterestRate}
                  applyLateFees={applyLateFees}
                  setApplyLateFees={setApplyLateFees}
                  itemName={itemName}
                  setItemName={setItemName}
                  totalValue={totalValue}
                  setTotalValue={setTotalValue}
                  months={months}
                  setMonths={setMonths}
                  durationUnit={durationUnit}
                  setDurationUnit={setDurationUnit}
                  deadlineType={deadlineType}
                  setDeadlineType={setDeadlineType}
                  excludeSundays={excludeSundays}
                  setExcludeSundays={setExcludeSundays}
                  startDate={startDate}
                  setStartDate={setStartDate}
                  endDate={endDate}
                  setEndDate={setEndDate}
                  nameP1={nameP1}
                  setNameP1={setNameP1}
                  nameP2={nameP2}
                  setNameP2={setNameP2}
                  pixKeyP1={pixKeyP1}
                  setPixKeyP1={setPixKeyP1}
                  pixKeyP2={pixKeyP2}
                  setPixKeyP2={setPixKeyP2}
                  phoneP1={phoneP1}
                  setPhoneP1={setPhoneP1}
                  phoneP2={phoneP2}
                  setPhoneP2={setPhoneP2}
                  contributionP1={contributionP1}
                  setContributionP1={setContributionP1}
                  frequencyP1={frequencyP1}
                  setFrequencyP1={setFrequencyP1}
                  frequencyP2={frequencyP2}
                  setFrequencyP2={setFrequencyP2}
                  dueDayP1={dueDayP1}
                  setDueDayP1={setDueDayP1}
                  dueDayP2={dueDayP2}
                  setDueDayP2={setDueDayP2}
                  formatCurrency={formatCurrency}
                  handleCurrencyChange={handleCurrencyChange}
                  onCancel={() => setIsEditing(false)}
                  onSave={async () => {
                    await handleSaveGoals();
                    setIsEditing(false);
                  }}
                />
              )}

              <div className={`flex-1 p-4 md:p-8 space-y-6 flex flex-col ${isEditing ? "hidden" : ""}`}>
                <AppHeader
                  currentSection={currentSection}
                  goalType={goalType}
                  handleCreateNewGoal={handleCreateNewGoal}
                />

                <GoalSelector
                  currentGoalId={currentGoalId}
                  setCurrentGoalId={setCurrentGoalId}
                  filteredGoalsList={filteredGoalsList}
                  currentSection={currentSection}
                  setIsEditing={setIsEditing}
                  isDropdownOpen={isDropdownOpen}
                  setIsDropdownOpen={setIsDropdownOpen}
                />

                {activeTab === "inicio" && (
                  <div className={`grid grid-cols-1 md:grid-cols-12 gap-6 ${isEditing ? "hidden" : ""}`}>
                    <div className="md:col-span-12 lg:col-span-12 space-y-6">
                      <GoalSummary
                        isEditing={isEditing}
                        setIsEditing={setIsEditing}
                        handleDeleteGoal={handleDeleteGoal}
                        setShowPixModal={setShowPixModal}
                        setCurrentPayer={setCurrentPayer}
                        goalType={goalType}
                        category={category}
                        interestRate={interestRate}
                        results={results}
                        savedP1={results.sP1.toString()}
                        savedP2={results.sP2.toString()}
                        nameP1={nameP1}
                        nameP2={nameP2}
                        contributionP1={contributionP1}
                        contributionP2={contributionP2}
                        frequencyP1={results.actualFreqP1 || frequencyP1}
                        frequencyP2={results.actualFreqP2 || frequencyP2}
                        startDate={startDate}
                        endDate={endDate}
                        excludeSundays={excludeSundays}
                        phoneP1={phoneP1}
                        phoneP2={phoneP2}
                        pixKeyP1={pixKeyP1}
                        pixKeyP2={pixKeyP2}
                        itemName={itemName}
                        months={months}
                        durationUnit={durationUnit}
                        formatCurrency={formatCurrency}
                        getFreqLabel={getFreqLabel}
                        handleExportText={handleExportText}
                        showToast={showToast}
                        remindersEnabled={remindersEnabled}
                        setRemindersEnabled={setRemindersEnabled}
                        handleSaveGoals={handleSaveGoals}
                        motivationalMessage={getMotivationalMessage(results.progressPercent)}
                        onShowCalculator={() => setShowCalculator(true)}
                        onShowEarlySettlement={() => setShowEarlySettlement(true)}
                      />
                    </div>
                  </div>
                )}

                {activeTab === "calendario" && (
                  <PaymentCalendar
                    startDate={startDate}
                    frequencyP1={results.actualFreqP1 || frequencyP1}
                    frequencyP2={results.actualFreqP2 || frequencyP2}
                    dueDayP1={Number(dueDayP1)}
                    dueDayP2={Number(dueDayP2)}
                    nameP1={nameP1}
                    nameP2={nameP2}
                    paymentsHistory={paymentsHistory}
                    excludeSundays={!!excludeSundays}
                    goalType={goalType}
                    results={results}
                    formatCurrency={formatCurrency}
                  />
                )}

                {activeTab === "historico" && (
                  <div className="mb-24">
                    <PaymentHistory
                      goalType={goalType}
                      paymentsHistory={paymentsHistory}
                      nameP1={nameP1}
                      nameP2={nameP2}
                      phoneP1={phoneP1}
                      phoneP2={phoneP2}
                      formatCurrency={formatCurrency}
                      progressPercent={results.progressPercent}
                      handleClearHistory={handleClearHistoryClick}
                      installmentP1={results.baseInstallmentP1 || results.installmentP1}
                      installmentP2={results.baseInstallmentP2 || results.installmentP2}
                      totalPeriodsP1={results.totalPeriodsP1}
                      totalPeriodsP2={results.totalPeriodsP2}
                      handleDeletePayment={handleDeletePaymentItem}
                      allGoals={goalsList}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          <BottomNav
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isEditing={isEditing}
          />

          <DeleteConfirmModal
            showDeleteConfirm={showDeleteConfirm}
            setShowDeleteConfirm={setShowDeleteConfirm}
            confirmDeleteGoal={() => confirmDeleteGoal(setShowDeleteConfirm)}
          />

          <ClearHistoryConfirmModal
            showClearHistoryConfirm={showClearHistoryConfirm}
            setShowClearHistoryConfirm={setShowClearHistoryConfirm}
            confirmClearHistory={() => confirmClearHistory(setShowClearHistoryConfirm)}
          />

          <PixModal
            showPixModal={showPixModal}
            setShowPixModal={setShowPixModal}
            currentPayer={currentPayer}
            nameP1={nameP1}
            nameP2={nameP2}
            pixAmount={pixAmount}
            setPixAmount={setPixAmount}
            installmentP1={results.installmentP1}
            installmentP2={results.installmentP2}
            remainingP1={results.remainingP1}
            remainingP2={results.remainingP2}
            applyLateFees={applyLateFees}
            isLateP1={results.isLateP1}
            isLateP2={results.isLateP2}
            daysToNextP1={results.daysToNextP1}
            daysToNextP2={results.daysToNextP2}
            interestRate={Number(interestRate)}
            pixCode={pixCode}
            setPixCode={setPixCode}
            qrCodeBase64={qrCodeBase64}
            isGeneratingPix={isGeneratingPix}
            paymentSuccess={paymentSuccess}
            copied={copied}
            copyPixCode={copyPixCode}
            handleGeneratePix={handleGeneratePix}
            handleConfirmPayment={handleConfirmPayment}
            isConfirmingPayment={isConfirmingPayment}
            isManualPayment={isManualPayment}
            setIsManualPayment={setIsManualPayment}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            formatCurrency={formatCurrency}
            handleCurrencyChange={handleCurrencyChange}
          />
        </div>
      </div>

      {showCalculator && (
        <LoanCalculator
          onClose={() => setShowCalculator(false)}
          initialValue={totalValue}
          initialRate={interestRate}
          formatCurrency={formatCurrency}
          handleCurrencyChange={handleCurrencyChange}
        />
      )}

      {showEarlySettlement && (
        <EarlySettlementModal
          onClose={() => setShowEarlySettlement(false)}
          remaining={results.total - results.saved}
          totalValue={results.total}
          savedAmount={results.saved}
          formatCurrency={formatCurrency}
          nameP1={nameP1}
          nameP2={nameP2}
          goalType={goalType}
          onConfirm={handleEarlySettlement}
        />
      )}
    </>
  );
}
