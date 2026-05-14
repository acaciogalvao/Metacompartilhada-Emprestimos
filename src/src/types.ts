/**
 * Módulo de definições de tipos (types.ts).
 * Declara todas as interfaces e tipagens (TypeScript) utilizadas 
 * globalmente pela aplicação para garantir consistência de dados.
 */
export type DurationUnit = "days" | "weeks" | "months";
export type DeadlineType = "duration" | "dates";
export type GoalType = "individual" | "shared";
export type Frequency = "daily" | "weekly" | "monthly";
export type PaymentMethod = "pix" | "dinheiro";
export type Payer = "P1" | "P2";

export interface Payment {
  _id: string;
  amount: number;
  method: PaymentMethod;
  payerId: Payer;
  date: string;
}

export interface Goal {
  _id: string;
  type: GoalType;
  category: string;
  interestRate: number;
  itemName: string;
  totalValue: number;
  months: number;
  durationUnit: DurationUnit;
  deadlineType: DeadlineType;
  excludeSundays: boolean;
  startDate: string;
  endDate: string;
  contributionP1: number;
  nameP1: string;
  nameP2: string;
  phoneP1: string;
  phoneP2: string;
  pixKeyP1: string;
  pixKeyP2: string;
  frequencyP1: Frequency;
  frequencyP2: Frequency;
  dueDayP1: number;
  dueDayP2: number;
  savedP1: number;
  savedP2: number;
  payments: Payment[];
  remindersEnabled: boolean;
}

export interface CalculationResults {
  startDate: string;
  endDate: string;
  baseTotal: number;
  total: number;
  time: number;
  saved: number;
  sP1: number;
  sP2: number;
  remaining: number;
  progressPercent: number;
  totalP1: number;
  totalP2: number;
  remainingP1: number;
  remainingP2: number;
  actualFreqP1: Frequency;
  actualFreqP2: Frequency;
  baseInstallmentP1: number;
  baseInstallmentP2: number;
  installmentP1: number;
  installmentP2: number;
  monthlyP1: number;
  monthlyP2: number;
  monthlyTotal: number;
  weeklyP1: number;
  weeklyP2: number;
  weeklyTotal: number;
  dailyP1: number;
  dailyP2: number;
  dailyTotal: number;
  totalPeriodsP1: number;
  paidPeriodsCountP1: number;
  totalPeriodsP2: number;
  paidPeriodsCountP2: number;
  chartData: any[];
  isLateP1: boolean;
  isLateP2: boolean;
  daysToNextP1: number;
  daysToNextP2: number;
}
