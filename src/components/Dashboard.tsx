import { useMemo } from "react";
import { TrendingUp, TrendingDown, DollarSign, AlertCircle, Calendar, CheckCircle2, PieChart as PieChartIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface DashboardProps {
  goalsList: any[];
  formatCurrency: (v: number) => string;
  onSelectGoal: (id: string, section: "metas" | "emprestimos") => void;
}

function getNextDueDate(goal: any): Date | null {
  const start = new Date(goal.startDate || Date.now());
  start.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const freq = goal.frequencyP1 || "monthly";
  const dueDay = goal.dueDayP1 ?? 5;

  const d = new Date(start);
  if (freq === "daily") {
    d.setDate(d.getDate() + 1);
    while (d <= today) d.setDate(d.getDate() + 1);
    return d;
  }
  if (freq === "weekly") {
    const diff = (dueDay - d.getDay() + 7) % 7 + 7;
    d.setDate(d.getDate() + diff);
    while (d <= today) d.setDate(d.getDate() + 7);
    return d;
  }
  // monthly
  d.setDate(1);
  d.setMonth(start.getMonth() + 1);
  d.setDate(dueDay);
  while (d <= today) {
    d.setMonth(d.getMonth() + 1);
    const m = d.getMonth();
    d.setDate(dueDay);
    if (d.getMonth() !== m) d.setDate(0);
  }
  return d;
}

function getGoalTotal(g: any): number {
  const isLoan = g.category === "loan";
  const rate = (g.interestRate || 0) / 100;
  if (!isLoan || rate <= 0) return g.totalValue || 0;
  
  if (g.applyLateFees) {
    let timeValue = Number(g.months) || 1;
    let totalMonths = timeValue;
    if (g.durationUnit === "days") totalMonths = timeValue / 30.4166;
    if (g.durationUnit === "weeks") totalMonths = timeValue / 4.3333;
    const n = totalMonths > 0 ? totalMonths : 1;
    const pmt = (g.totalValue || 0) * (rate * Math.pow(1 + rate, n)) / (Math.pow(1 + rate, n) - 1);
    return pmt * n;
  } else {
    return (g.totalValue || 0) * (1 + rate);
  }
}

export function Dashboard({ goalsList, formatCurrency, onSelectGoal }: DashboardProps) {
  const loans = goalsList.filter((g) => g.category === "loan");
  const savings = goalsList.filter((g) => g.category !== "loan");

  const loanStats = useMemo(() => {
    const totalBruto = loans.reduce((s, g) => s + (g.totalValue || 0), 0);
    const totalComJuros = loans.reduce((s, g) => s + getGoalTotal(g), 0);
    const paid = loans.reduce((s, g) => s + (g.savedP1 || 0) + (g.savedP2 || 0), 0);
    const remaining = Math.max(0, totalComJuros - paid);
    return { count: loans.length, total: totalComJuros, paid, remaining };
  }, [loans]);

  const savingsStats = useMemo(() => {
    const total = savings.reduce((s, g) => s + (g.totalValue || 0), 0);
    const saved = savings.reduce((s, g) => s + (g.savedP1 || 0) + (g.savedP2 || 0), 0);
    const remaining = Math.max(0, total - saved);
    return { count: savings.length, total, saved, remaining };
  }, [savings]);

  const upcomingPayments = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const in7 = new Date(today);
    in7.setDate(in7.getDate() + 7);

    return goalsList
      .filter((g) => {
        const totalG = getGoalTotal(g);
        const paid = (g.savedP1 || 0) + (g.savedP2 || 0);
        return paid < totalG;
      })
      .map((g) => {
        const next = getNextDueDate(g);
        return { goal: g, nextDue: next };
      })
      .filter((x) => x.nextDue && x.nextDue >= today && x.nextDue <= in7)
      .sort((a, b) => (a.nextDue!.getTime() - b.nextDue!.getTime()));
  }, [goalsList]);

  const StatCard = ({ icon, label, value, sub, color }: any) => (
    <div className="glass-card-subtle p-2 sm:p-4 flex flex-col gap-1 sm:gap-2 justify-center">
      <div className={`flex items-center gap-1 sm:gap-2 ${color} overflow-hidden`}>
        <div className="shrink-0">{icon}</div>
        <span className="text-[9px] sm:text-xs font-bold uppercase tracking-normal sm:tracking-widest truncate">{label}</span>
      </div>
      <div className="text-sm sm:text-xl font-black text-white truncate" title={value}>{value}</div>
      {sub && <div className="text-[9px] sm:text-xs text-slate-400 truncate">{sub}</div>}
    </div>
  );

  const chartData = [
    { name: "Empréstimos", value: loanStats.total, color: "#f43f5e" }, // rose-500
    { name: "Metas", value: savingsStats.total, color: "#0ea5e9" }, // sky-500
  ].filter(d => d.value > 0);

  const COLORS = chartData.map(d => d.color);

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-300">
      <div className="uppercase tracking-widest text-[13px] font-bold text-slate-500 pl-1">Resumo Geral</div>
      
      {chartData.length > 0 && (
        <Card className="glass-card border-0 mb-6">
          <CardContent className="p-5 flex flex-col sm:flex-row items-center gap-6">
            <div className="w-40 h-40 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    stroke="none"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: 'none', borderRadius: '12px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <PieChartIcon className="w-6 h-6 text-slate-400 mb-1" />
                <span className="text-[10px] font-bold text-slate-500 uppercase">Portfólio</span>
              </div>
            </div>
            <div className="flex-1 space-y-3 w-full">
               <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl">
                 <div className="flex items-center gap-2">
                   <div className="w-3 h-3 rounded-full bg-rose-500" />
                   <span className="text-sm font-medium text-slate-300">Empréstimos</span>
                 </div>
                 <span className="text-sm font-bold text-white">{formatCurrency(loanStats.total)}</span>
               </div>
               <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl">
                 <div className="flex items-center gap-2">
                   <div className="w-3 h-3 rounded-full bg-sky-500" />
                   <span className="text-sm font-medium text-slate-300">Metas</span>
                 </div>
                 <span className="text-sm font-bold text-white">{formatCurrency(savingsStats.total)}</span>
               </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empréstimos */}
      <Card className="glass-card border-0">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-rose-500/20">
              <TrendingDown className="w-4 h-4 text-rose-400" />
            </div>
            <h3 className="font-bold text-white">Empréstimos <span className="text-slate-400 font-normal text-sm">({loanStats.count} ativo{loanStats.count !== 1 ? "s" : ""})</span></h3>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <StatCard icon={<DollarSign className="w-3.5 h-3.5" />} label="Total" value={formatCurrency(loanStats.total)} color="text-slate-400" />
            <StatCard icon={<CheckCircle2 className="w-3.5 h-3.5" />} label="Pago" value={formatCurrency(loanStats.paid)} color="text-emerald-400" />
            <StatCard icon={<AlertCircle className="w-3.5 h-3.5" />} label="Restante" value={formatCurrency(loanStats.remaining)} color="text-rose-400" />
          </div>
          {loanStats.total > 0 && (
            <div className="mt-3">
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 to-orange-400 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, (loanStats.paid / loanStats.total) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1 text-right">
                {Math.round((loanStats.paid / loanStats.total) * 100)}% quitado
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metas */}
      <Card className="glass-card border-0">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-sky-500/20">
              <TrendingUp className="w-4 h-4 text-sky-400" />
            </div>
            <h3 className="font-bold text-white">Metas <span className="text-slate-400 font-normal text-sm">({savingsStats.count} ativa{savingsStats.count !== 1 ? "s" : ""})</span></h3>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <StatCard icon={<DollarSign className="w-3.5 h-3.5" />} label="Objetivo" value={formatCurrency(savingsStats.total)} color="text-slate-400" />
            <StatCard icon={<CheckCircle2 className="w-3.5 h-3.5" />} label="Guardado" value={formatCurrency(savingsStats.saved)} color="text-sky-400" />
            <StatCard icon={<AlertCircle className="w-3.5 h-3.5" />} label="Faltando" value={formatCurrency(savingsStats.remaining)} color="text-amber-400" />
          </div>
          {savingsStats.total > 0 && (
            <div className="mt-3">
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sky-500 to-indigo-400 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, (savingsStats.saved / savingsStats.total) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1 text-right">
                {Math.round((savingsStats.saved / savingsStats.total) * 100)}% concluído
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Próximos vencimentos */}
      <div>
        <div className="uppercase tracking-widest text-[13px] font-bold text-slate-500 pl-1 mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4" /> Vencimentos nos próximos 7 dias
        </div>
        {upcomingPayments.length === 0 ? (
          <div className="glass-card-subtle p-6 text-center text-slate-400 text-sm rounded-2xl">
            Nenhum vencimento nos próximos 7 dias 🎉
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingPayments.map(({ goal, nextDue }) => {
              const isLoan = goal.category === "loan";
              const totalG = getGoalTotal(goal);
              const paidG = (goal.savedP1 || 0) + (goal.savedP2 || 0);
              const remainingG = Math.max(0, totalG - paidG);
              const daysUntil = Math.ceil((nextDue!.getTime() - Date.now()) / 86400000);
              return (
                <button
                  key={goal._id}
                  onClick={() => onSelectGoal(goal._id, isLoan ? "emprestimos" : "metas")}
                  className="w-full glass-card-subtle p-4 rounded-2xl flex items-center justify-between hover:bg-white/10 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${isLoan ? "bg-rose-500/20 text-rose-400" : "bg-sky-500/20 text-sky-400"}`}>
                      {(goal.itemName || "?").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">{goal.itemName}</p>
                      <p className="text-xs text-slate-400">
                        {nextDue!.toLocaleDateString("pt-BR")} · {daysUntil === 0 ? "hoje" : `em ${daysUntil} dia${daysUntil > 1 ? "s" : ""}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-sm ${isLoan ? "text-rose-400" : "text-sky-400"}`}>{formatCurrency(remainingG)}</p>
                    <p className="text-xs text-slate-500">{isLoan ? "restante" : "faltando"}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
