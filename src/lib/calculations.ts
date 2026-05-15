/**
 * Módulo de cálculos (calculations.ts).
 * Contém a função `calculateGoal`, o "motor" financeiro do app.
 * Ela recebe os parâmetros da meta ou empréstimo e processa:
 * parcelas, progresso percentual, valores restantes, dados para gráficos
 * e datas de vencimento de acordo com a periodicidade escolhida.
 */
import {
  CalculationResults,
  DurationUnit,
  DeadlineType,
  GoalType,
  Frequency,
} from "../types";

interface CalculationParams {
  totalValue: string;
  category: string;
  interestRate: string;
  startDate: string;
  endDate: string;
  excludeSundays: boolean;
  deadlineType: DeadlineType;
  months: string;
  durationUnit: DurationUnit;
  frequencyP1: Frequency;
  frequencyP2: Frequency;
  savedP1: string;
  savedP2: string;
  goalType: GoalType;
  contributionP1: string;
  dueDayP1: number;
  dueDayP2: number;
  applyLateFees?: boolean;
}

export const calculateGoal = (
  params: CalculationParams,
): CalculationResults => {
  const {
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
  } = params;

  let timeValue = Number(months) || 1;
  let actualDurationUnit = durationUnit;

  const start = new Date(startDate);
  const end = new Date(endDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  const diffTime = end.getTime() - start.getTime();
  let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (excludeSundays) {
    let current = new Date(start);
    current.setDate(current.getDate() + 1);
    let sundaysCount = 0;
    while (current <= end) {
      if (current.getDay() === 0) sundaysCount++;
      current.setDate(current.getDate() + 1);
    }
    diffDays = Math.max(1, diffDays - sundaysCount);
  }

  let calculatedStartDate = start.toISOString();
  let calculatedEndDate = end.toISOString();

  if (deadlineType === "duration") {
    let daysToAdd = timeValue;
    if (actualDurationUnit === "weeks") daysToAdd = timeValue * 7;
    if (actualDurationUnit === "months")
      daysToAdd = Math.round(timeValue * 30.4166);

    let current = new Date(start);
    let added = 0;
    while (added < daysToAdd) {
      current.setDate(current.getDate() + 1);
      if (excludeSundays && current.getDay() === 0) {
        // Skip
      } else {
        added++;
      }
    }
    calculatedEndDate = current.toISOString();
  } else {
    timeValue = Math.max(1, diffDays);
    actualDurationUnit = "days";
    calculatedStartDate = start.toISOString();
    calculatedEndDate = end.toISOString();
  }

  let totalMonths = timeValue;
  if (actualDurationUnit === "days") totalMonths = timeValue / 30.4166;
  if (actualDurationUnit === "weeks") totalMonths = timeValue / 4.3333;

  const baseTotal = Number(totalValue) || 0;
  const isLoan = category === "loan";
  
  let total = baseTotal;
  if (isLoan && Number(interestRate) > 0) {
    if (params.applyLateFees) {
      const rate = Number(interestRate) / 100;
      const n = totalMonths > 0 ? totalMonths : 1;
      // Tabela Price for monthly installments
      const pmt = baseTotal * (rate * Math.pow(1 + rate, n)) / (Math.pow(1 + rate, n) - 1);
      total = pmt * n;
    } else {
      total = baseTotal * (1 + (Number(interestRate) || 0) / 100);
    }
  }

  const actualFreqP1 = frequencyP1;
  const actualFreqP2 = frequencyP2;

  const sP1 = Number(savedP1) || 0;
  const sP2 = Number(savedP2) || 0;
  const saved = sP1 + sP2;

  const remaining = Math.max(0, total - saved);
  const progressPercent = total > 0 ? Math.min(100, (saved / total) * 100) : 0;

  const contributionP1Num = Number(contributionP1) || 0;
  const actualContributionP1 =
    goalType === "individual" ? 100 : contributionP1Num;
  const actualContributionP2 =
    goalType === "individual" ? 0 : 100 - contributionP1Num;

  const totalP1 = total * (actualContributionP1 / 100);
  const totalP2 = total * (actualContributionP2 / 100);

  const remainingP1 = Math.max(0, totalP1 - sP1);
  const remainingP2 = Math.max(0, totalP2 - sP2);

  const getPeriodsCount = (rawTime: number, unit: string, freq: string) => {
    if (rawTime <= 0) return 1;
    let totalDays = rawTime;
    if (unit === "weeks") totalDays = rawTime * 7;
    if (unit === "months") totalDays = rawTime * 30.4166;

    if (freq === "daily") return Math.max(1, Math.round(totalDays));
    if (freq === "weekly") return Math.max(1, Math.round(totalDays / 7));
    return Math.max(1, Math.round(totalDays / 30.4166));
  };

  const getInstallment = (
    remainingAmount: number,
    rawTime: number,
    unit: string,
    freq: string,
  ) => {
    const periods = getPeriodsCount(rawTime, unit, freq);
    return remainingAmount / periods;
  };

  const baseInstallmentP1 = getInstallment(
    totalP1,
    timeValue,
    actualDurationUnit,
    actualFreqP1,
  );
  const baseInstallmentP2 = getInstallment(
    totalP2,
    timeValue,
    actualDurationUnit,
    actualFreqP2,
  );

  const installmentP1 = Math.min(baseInstallmentP1, remainingP1);
  const installmentP2 = Math.min(baseInstallmentP2, remainingP2);

  const totalPeriodsP1 = getPeriodsCount(
    timeValue,
    actualDurationUnit,
    actualFreqP1,
  );
  const totalPeriodsP2 = getPeriodsCount(
    timeValue,
    actualDurationUnit,
    actualFreqP2,
  );

  const paidPeriodsCountP1 =
    baseInstallmentP1 > 0 ? Math.floor(sP1 / baseInstallmentP1 + 0.05) : 0;
  const paidPeriodsCountP2 =
    baseInstallmentP2 > 0 ? Math.floor(sP2 / baseInstallmentP2 + 0.05) : 0;

  const monthlyP1 = totalMonths > 0 ? remainingP1 / totalMonths : 0;
  const monthlyP2 = totalMonths > 0 ? remainingP2 / totalMonths : 0;
  const monthlyTotal = monthlyP1 + monthlyP2;

  const weeklyP1 = monthlyP1 / 4.3333;
  const weeklyP2 = monthlyP2 / 4.3333;
  const weeklyTotal = monthlyTotal / 4.3333;

  const dailyP1 = monthlyP1 / 30.4166;
  const dailyP2 = monthlyP2 / 30.4166;
  const dailyTotal = monthlyTotal / 30.4166;

  const chartData = [];
  let currentSaved = saved;
  for (let i = 0; i <= timeValue; i++) {
    const unitLabel =
      actualDurationUnit === "days"
        ? "Dia"
        : actualDurationUnit === "weeks"
          ? "Sem"
          : "Mês";
    chartData.push({
      month: i === 0 ? "Hoje" : `${unitLabel} ${i}`,
      acumulado: currentSaved,
      meta: total,
    });
    if (actualDurationUnit === "days") currentSaved += dailyTotal;
    else if (actualDurationUnit === "weeks") currentSaved += weeklyTotal;
    else currentSaved += monthlyTotal;
  }

  const currentNow = new Date();
  const startDay = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate(),
  );
  const today = new Date(
    currentNow.getFullYear(),
    currentNow.getMonth(),
    currentNow.getDate(),
  );

  const getNextDueDate = (
    freq: string,
    paidPeriods: number,
    dueDay: number,
  ) => {
    const d = new Date(
      startDay.getFullYear(),
      startDay.getMonth(),
      startDay.getDate(),
    );
    if (freq === "daily") {
      // 1ª parcela sempre no dia seguinte ao de criação
      let added = 0;
      const targetAdds = paidPeriods + 1;
      while (added < targetAdds) {
        d.setDate(d.getDate() + 1);
        if (excludeSundays && d.getDay() === 0) {
          // pula domingo
        } else {
          added++;
        }
      }
    } else if (freq === "weekly") {
      // 1ª parcela sempre na PRÓXIMA semana (mínimo 7 dias após criação)
      // Se excludeSundays e dueDay for domingo, avança para segunda-feira
      const effectiveDueDay = excludeSundays && dueDay === 0 ? 1 : dueDay;
      const daysToFirstOccurrence = (effectiveDueDay - d.getDay() + 7) % 7;
      const daysToFirst = daysToFirstOccurrence + 7;
      d.setDate(d.getDate() + daysToFirst + paidPeriods * 7);
      // Se mesmo assim cair em domingo (por arredondamentos), avança para segunda
      if (excludeSundays && d.getDay() === 0) d.setDate(d.getDate() + 1);
    } else if (freq === "monthly") {
      // 1ª parcela sempre no MÊS SEGUINTE ao de criação
      d.setDate(1);
      d.setMonth(startDay.getMonth() + 1 + paidPeriods);
      const targetMonth = d.getMonth();
      d.setDate(dueDay);
      if (d.getMonth() !== targetMonth) d.setDate(0); // ajusta meses curtos (ex: 31 em fev)
      // Se cair em domingo e excludeSundays, avança para segunda-feira
      if (excludeSundays && d.getDay() === 0) d.setDate(d.getDate() + 1);
    }
    return d;
  };

  const isLateP1 = (() => {
    const payerTotal = totalP1;
    const payerSaved = sP1;
    if (payerSaved >= payerTotal || payerTotal === 0) return false;
    const nextDue = getNextDueDate(actualFreqP1, paidPeriodsCountP1, dueDayP1);
    return nextDue.getTime() < today.getTime();
  })();

  const isLateP2 = (() => {
    const payerTotal = totalP2;
    const payerSaved = sP2;
    if (payerSaved >= payerTotal || payerTotal === 0) return false;
    const nextDue = getNextDueDate(actualFreqP2, paidPeriodsCountP2, dueDayP2);
    return nextDue.getTime() < today.getTime();
  })();

  const daysToNextP1 = Math.ceil(
    (getNextDueDate(actualFreqP1, paidPeriodsCountP1, dueDayP1).getTime() -
      today.getTime()) /
      (1000 * 60 * 60 * 24),
  );
  const daysToNextP2 = Math.ceil(
    (getNextDueDate(actualFreqP2, paidPeriodsCountP2, dueDayP2).getTime() -
      today.getTime()) /
      (1000 * 60 * 60 * 24),
  );

  return {
    startDate: calculatedStartDate,
    endDate: calculatedEndDate,
    baseTotal,
    total,
    time: timeValue,
    saved,
    sP1,
    sP2,
    remaining,
    progressPercent,
    totalP1,
    totalP2,
    remainingP1,
    remainingP2,
    actualFreqP1,
    actualFreqP2,
    baseInstallmentP1,
    baseInstallmentP2,
    installmentP1,
    installmentP2,
    monthlyP1,
    monthlyP2,
    monthlyTotal,
    weeklyP1,
    weeklyP2,
    weeklyTotal,
    dailyP1,
    dailyP2,
    dailyTotal,
    totalPeriodsP1,
    paidPeriodsCountP1,
    totalPeriodsP2,
    paidPeriodsCountP2,
    chartData,
    isLateP1,
    isLateP2,
    daysToNextP1,
    daysToNextP2,
  };
};
