import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface PaymentCalendarProps {
  startDate: string;
  frequencyP1: string;
  frequencyP2: string;
  dueDayP1: number;
  dueDayP2: number;
  nameP1: string;
  nameP2: string;
  paymentsHistory: any[];
  excludeSundays: boolean;
  goalType: "individual" | "shared";
  results: any;
  formatCurrency: (v: number) => string;
}

function computeDueDates(
  startDate: string,
  freq: string,
  dueDay: number,
  excludeSundays: boolean,
  monthYear: { year: number; month: number }
): number[] {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const { year, month } = monthYear;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dueDays: number[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    if (d < start) continue;

    let isDue = false;
    if (freq === "daily") {
      if (excludeSundays && d.getDay() === 0) continue;
      isDue = d > start;
    } else if (freq === "weekly") {
      const effectiveDueDay = excludeSundays && dueDay === 0 ? 1 : dueDay;
      isDue = d.getDay() === effectiveDueDay && d > start;
    } else if (freq === "monthly") {
      isDue = d.getDate() === dueDay && (d.getMonth() > start.getMonth() || d.getFullYear() > start.getFullYear());
      if (excludeSundays && isDue && d.getDay() === 0) {
        isDue = false;
        dueDays.push(day + 1 <= daysInMonth ? day + 1 : day);
        continue;
      }
    }

    if (isDue) dueDays.push(day);
  }
  return dueDays;
}

export function PaymentCalendar({
  startDate,
  frequencyP1,
  frequencyP2,
  dueDayP1,
  dueDayP2,
  nameP1,
  nameP2,
  paymentsHistory,
  excludeSundays,
  goalType,
  results,
  formatCurrency,
}: PaymentCalendarProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const monthYear = { year: viewYear, month: viewMonth };
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();

  const dueDaysP1 = useMemo(() => computeDueDates(startDate, frequencyP1, dueDayP1, excludeSundays, monthYear), [startDate, frequencyP1, dueDayP1, excludeSundays, viewYear, viewMonth]);
  const dueDaysP2 = useMemo(() => goalType === "shared" ? computeDueDates(startDate, frequencyP2, dueDayP2, excludeSundays, monthYear) : [], [startDate, frequencyP2, dueDayP2, excludeSundays, goalType, viewYear, viewMonth]);

  const paidDays = useMemo(() => {
    const set = new Set<string>();
    paymentsHistory.forEach((p) => {
      const d = new Date(p.date);
      if (d.getFullYear() === viewYear && d.getMonth() === viewMonth) {
        set.add(`${d.getDate()}-${p.payerId}`);
      }
    });
    return set;
  }, [paymentsHistory, viewYear, viewMonth]);

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const getDayStatus = (day: number) => {
    const date = new Date(viewYear, viewMonth, day);
    const isToday = date.toDateString() === today.toDateString();
    const isPast = date < today && !isToday;
    const isDueP1 = dueDaysP1.includes(day);
    const isDueP2 = dueDaysP2.includes(day);
    const paidP1 = paidDays.has(`${day}-P1`);
    const paidP2 = paidDays.has(`${day}-P2`);
    return { isToday, isPast, isDueP1, isDueP2, paidP1, paidP2 };
  };

  return (
    <div className="space-y-4 pb-24">
      <Card className="glass-card border-0">
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-white/10 transition-colors text-slate-400 hover:text-white">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="font-bold text-white text-lg">{monthNames[viewMonth]} {viewYear}</h3>
            <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-white/10 transition-colors text-slate-400 hover:text-white">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Week days header */}
          <div className="grid grid-cols-7 mb-2">
            {weekDays.map(d => (
              <div key={d} className="text-center text-[10px] font-bold text-slate-500 uppercase py-1">{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-y-1">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const { isToday, isPast, isDueP1, isDueP2, paidP1, paidP2 } = getDayStatus(day);
              const hasDue = isDueP1 || isDueP2;
              const hasPaid = paidP1 || paidP2;

              return (
                <div key={day} className="flex flex-col items-center py-1">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium relative
                    ${isToday ? "ring-2 ring-sky-400 text-sky-300 font-bold" : ""}
                    ${hasPaid ? "bg-emerald-500/30 text-emerald-300" : ""}
                    ${hasDue && !hasPaid && !isPast ? "bg-amber-500/20 text-amber-300" : ""}
                    ${hasDue && !hasPaid && isPast ? "bg-rose-500/20 text-rose-400" : ""}
                    ${!hasDue && !hasPaid && !isToday ? "text-slate-400" : ""}
                  `}>
                    {day}
                    {hasDue && (
                      <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                        {isDueP1 && <div className={`w-1 h-1 rounded-full ${paidP1 ? "bg-emerald-400" : isPast ? "bg-rose-400" : "bg-amber-400"}`} />}
                        {isDueP2 && <div className={`w-1 h-1 rounded-full ${paidP2 ? "bg-emerald-400" : isPast ? "bg-rose-400" : "bg-amber-400"}`} />}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <div className="w-3 h-3 rounded-full bg-emerald-500/50" /> Pago
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <div className="w-3 h-3 rounded-full bg-amber-500/30" /> Vencimento futuro
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <div className="w-3 h-3 rounded-full bg-rose-500/30" /> Vencimento atrasado
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <div className="w-3 h-3 rounded-full ring-2 ring-sky-400" /> Hoje
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Due date summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card-subtle p-4 rounded-2xl">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm mb-2">
            {nameP1.charAt(0).toUpperCase()}
          </div>
          <p className="text-sm font-semibold text-white">{nameP1}</p>
          <p className="text-xs text-slate-400 mt-1">
            {results.daysToNextP1 > 0
              ? `Próximo em ${results.daysToNextP1} dia${results.daysToNextP1 > 1 ? "s" : ""}`
              : results.daysToNextP1 === 0 ? "Vence hoje!"
              : `Atrasado ${Math.abs(results.daysToNextP1)} dia${Math.abs(results.daysToNextP1) > 1 ? "s" : ""}`}
          </p>
          <p className="text-sm font-bold text-emerald-400 mt-1">{formatCurrency(results.installmentP1 || 0)}</p>
        </div>
        {goalType === "shared" && (
          <div className="glass-card-subtle p-4 rounded-2xl">
            <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-sm mb-2">
              {nameP2.charAt(0).toUpperCase()}
            </div>
            <p className="text-sm font-semibold text-white">{nameP2}</p>
            <p className="text-xs text-slate-400 mt-1">
              {results.daysToNextP2 > 0
                ? `Próximo em ${results.daysToNextP2} dia${results.daysToNextP2 > 1 ? "s" : ""}`
                : results.daysToNextP2 === 0 ? "Vence hoje!"
                : `Atrasado ${Math.abs(results.daysToNextP2)} dia${Math.abs(results.daysToNextP2) > 1 ? "s" : ""}`}
            </p>
            <p className="text-sm font-bold text-purple-400 mt-1">{formatCurrency(results.installmentP2 || 0)}</p>
          </div>
        )}
      </div>
    </div>
  );
}
