import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Trash2,
  ArrowDownToLine,
  Receipt,
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Calendar,
  X,
  Share2,
  Download,
  User,
  CreditCard,
} from "lucide-react";
import { useState, useMemo } from "react";

interface PaymentHistoryProps {
  paymentsHistory: any[];
  nameP1: string;
  nameP2: string;
  phoneP1?: string;
  phoneP2?: string;
  formatCurrency: (value: number) => string;
  progressPercent: number;
  handleClearHistory: () => void;
  installmentP1?: number;
  installmentP2?: number;
  totalPeriodsP1?: number;
  totalPeriodsP2?: number;
  handleDeletePayment?: (paymentId: string) => void;
}

export function PaymentHistory({
  paymentsHistory,
  nameP1,
  nameP2,
  phoneP1 = "",
  phoneP2 = "",
  formatCurrency,
  progressPercent,
  handleClearHistory,
  installmentP1 = 0,
  installmentP2 = 0,
  totalPeriodsP1 = 0,
  totalPeriodsP2 = 0,
  handleDeletePayment,
}: PaymentHistoryProps) {
  const [visibleCount, setVisibleCount] = useState(5);
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedPayer, setSelectedPayer] = useState<"all" | "P1" | "P2">("all");
  const [selectedMethod, setSelectedMethod] = useState<"all" | "pix" | "dinheiro">("all");
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);

  const { availableYears, availableMonths } = useMemo(() => {
    const years = new Set<string>();
    const months = new Set<string>();
    paymentsHistory.forEach((p) => {
      const d = new Date(p.date);
      years.add(d.getFullYear().toString());
      months.add((d.getMonth() + 1).toString());
    });
    return {
      availableYears: Array.from(years).sort((a, b) => Number(b) - Number(a)),
      availableMonths: Array.from(months).sort((a, b) => Number(a) - Number(b)),
    };
  }, [paymentsHistory]);

  const paymentsWithLabels = useMemo(() => {
    const sorted = [...paymentsHistory].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    let cumulativeP1 = 0;
    let cumulativeP2 = 0;
    let fallbackCountP1 = 0;
    let fallbackCountP2 = 0;

    return sorted.map((payment) => {
      let label = "";
      const isP1 = payment.payerId === "P1";
      const installmentAmount = isP1 ? installmentP1 : installmentP2;
      const baseTotalPeriods = Math.max(1, isP1 ? totalPeriodsP1 : totalPeriodsP2);

      if (installmentAmount > 0) {
        let startPeriod = 1;
        let endPeriod = 1;
        if (isP1) {
          startPeriod = Math.floor(cumulativeP1 / installmentAmount + 0.05) + 1;
          cumulativeP1 += payment.amount;
          endPeriod = Math.floor(cumulativeP1 / installmentAmount + 0.05);
        } else {
          startPeriod = Math.floor(cumulativeP2 / installmentAmount + 0.05) + 1;
          cumulativeP2 += payment.amount;
          endPeriod = Math.floor(cumulativeP2 / installmentAmount + 0.05);
        }
        if (endPeriod < startPeriod) endPeriod = startPeriod;
        const totalPeriodsStr = String(Math.max(baseTotalPeriods, endPeriod)).padStart(2, "0");
        if (startPeriod === endPeriod) {
          label = `${startPeriod.toString().padStart(2, "0")}/${totalPeriodsStr}`;
        } else {
          const parts: string[] = [];
          for (let i = startPeriod; i <= endPeriod; i++) parts.push(i.toString().padStart(2, "0"));
          label = `${parts.join("-")}/${totalPeriodsStr}`;
        }
      } else if (payment.amount >= 0) {
        let currentIdx = 0;
        if (isP1) { fallbackCountP1++; currentIdx = fallbackCountP1; }
        else { fallbackCountP2++; currentIdx = fallbackCountP2; }
        const totalPeriodsStr = String(Math.max(baseTotalPeriods, currentIdx)).padStart(2, "0");
        label = `${currentIdx.toString().padStart(2, "0")}/${totalPeriodsStr}`;
      }

      return { ...payment, installmentLabel: label };
    });
  }, [paymentsHistory, installmentP1, installmentP2, totalPeriodsP1, totalPeriodsP2]);

  const filteredPayments = useMemo(() => {
    return paymentsWithLabels
      .filter((payment) => {
        const d = new Date(payment.date);
        const paymentMonth = (d.getMonth() + 1).toString();
        const paymentYear = d.getFullYear().toString();
        const isManualOrDinheiro =
          payment.paymentId?.startsWith("mock_") ||
          payment.paymentId?.startsWith("manual_") ||
          payment.paymentId?.startsWith("pag:") ||
          payment.paymentId?.startsWith("pag_") ||
          payment.paymentId?.startsWith("dinheiro_");
        const effectiveMethod = isManualOrDinheiro ? "dinheiro" : "pix";

        const monthMatch = selectedMonth === "all" || paymentMonth === selectedMonth;
        const yearMatch = selectedYear === "all" || paymentYear === selectedYear;
        const payerMatch = selectedPayer === "all" || payment.payerId === selectedPayer;
        const methodMatch = selectedMethod === "all" || effectiveMethod === selectedMethod;

        return monthMatch && yearMatch && payerMatch && methodMatch;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [paymentsWithLabels, selectedMonth, selectedYear, selectedPayer, selectedMethod]);

  const displayedPayments = filteredPayments.slice(0, visibleCount);
  const hasMore = visibleCount < filteredPayments.length;

  const monthNames = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

  const sendReceiptOnWhatsApp = (payment: any) => {
    const isP1 = payment.payerId === "P1";
    const payerName = isP1 ? nameP1 : nameP2;
    const dateStr = new Date(payment.date).toLocaleDateString("pt-BR");
    const timeStr = new Date(payment.date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    let text = `🧾 *COMPROVANTE DE PAGAMENTO*\n\n`;
    text += `*Titular:* ${payerName}\n`;
    text += `*Data:* ${dateStr} às ${timeStr}\n`;
    text += `*Valor Pago:* ${formatCurrency(payment.amount)}\n`;
    text += `*Forma de Pagto:* ${payment.method === "dinheiro" ? "Dinheiro / Espécie" : "Pix"}\n`;
    if (payment.installmentLabel) text += `*Parcelas Pagas:* ${payment.installmentLabel}\n`;
    text += `\n*Código da Transação:*\n${payment.paymentId?.replace("mock_", "pag_")?.replace("pag:", "pag_")}\n\n`;
    text += `✅ *Pagamento Confirmado*\n\n`;
    text += `📝 _Segue acima o comprovante de pagamento_`;

    const encodedText = encodeURIComponent(text);
    const phone = isP1 ? phoneP1 : phoneP2;
    const cleanPhone = phone ? phone.replace(/\D/g, "") : "";
    if (cleanPhone) {
      window.open(`https://api.whatsapp.com/send?phone=55${cleanPhone}&text=${encodedText}`, "_blank");
    } else {
      window.open(`https://api.whatsapp.com/send?text=${encodedText}`, "_blank");
    }
  };

  const downloadReceipt = (payment: any) => {
    const isP1 = payment.payerId === "P1";
    const payerName = isP1 ? nameP1 : nameP2;
    const dateStr = new Date(payment.date).toLocaleDateString("pt-BR");
    const timeStr = new Date(payment.date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const isManual =
      payment.paymentId?.startsWith("mock_") ||
      payment.paymentId?.startsWith("manual_") ||
      payment.paymentId?.startsWith("pag:") ||
      payment.paymentId?.startsWith("pag_") ||
      payment.paymentId?.startsWith("dinheiro_");
    const transactionId = payment.paymentId?.replace("mock_", "pag_")?.replace("pag:", "pag_");

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<title>Comprovante de Pagamento</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #f5f5f5; display: flex; justify-content: center; padding: 40px 20px; }
  .receipt { background: #fff; border-radius: 16px; padding: 40px; max-width: 420px; width: 100%; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
  .header { text-align: center; margin-bottom: 32px; border-bottom: 2px dashed #e5e7eb; padding-bottom: 24px; }
  .header h1 { font-size: 13px; font-weight: 700; color: #6b7280; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 4px; }
  .header h2 { font-size: 18px; font-weight: 800; color: #111827; margin-bottom: 16px; }
  .amount-box { background: #ecfdf5; border: 2px solid #a7f3d0; border-radius: 12px; padding: 16px; display: inline-block; }
  .amount { font-size: 32px; font-weight: 900; color: #059669; }
  .status { display: inline-flex; align-items: center; gap: 6px; background: #d1fae5; color: #065f46; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; margin-top: 12px; }
  .row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
  .row:last-child { border-bottom: none; }
  .row .label { color: #6b7280; }
  .row .value { font-weight: 600; color: #111827; }
  .transaction { background: #f9fafb; border-radius: 8px; padding: 10px 14px; margin-top: 16px; font-family: monospace; font-size: 11px; color: #6b7280; word-break: break-all; }
  .footer { text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; }
  @media print { body { padding: 0; background: #fff; } .receipt { box-shadow: none; border-radius: 0; max-width: 100%; } }
</style>
</head>
<body>
<div class="receipt">
  <div class="header">
    <h1>Metacompartilhada Empréstimos</h1>
    <h2>Comprovante de Pagamento</h2>
    <div class="amount-box"><div class="amount">${formatCurrency(payment.amount)}</div></div>
    <div><span class="status">✓ ${isManual ? "Concluído" : "Pix Confirmado"}</span></div>
  </div>
  <div class="row"><span class="label">Titular</span><span class="value">${payerName}</span></div>
  <div class="row"><span class="label">Data</span><span class="value">${dateStr}</span></div>
  <div class="row"><span class="label">Horário</span><span class="value">${timeStr}</span></div>
  <div class="row"><span class="label">Forma de Pagamento</span><span class="value">${payment.method === "dinheiro" ? "Dinheiro / Espécie" : "Pix"}</span></div>
  ${payment.installmentLabel ? `<div class="row"><span class="label">Parcela</span><span class="value">${payment.installmentLabel}</span></div>` : ""}
  <div class="transaction">ID: ${transactionId}</div>
  <div class="footer">Gerado automaticamente · ${new Date().toLocaleDateString("pt-BR")}</div>
</div>
<script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  };

  const resetFilters = () => {
    setSelectedMonth("all");
    setSelectedYear("all");
    setSelectedPayer("all");
    setSelectedMethod("all");
    setVisibleCount(5);
  };

  const hasActiveFilters = selectedMonth !== "all" || selectedYear !== "all" || selectedPayer !== "all" || selectedMethod !== "all";

  return (
    <>
      <Card className="shadow-sm border-0 bg-transparent">
        <CardHeader className="pb-4 px-2">
          <div className="space-y-1">
            <CardTitle className="text-xl text-white flex items-center gap-2">
              <span className="bg-sky-500/20 p-2 rounded-xl text-sky-400">
                <Receipt className="w-5 h-5" />
              </span>
              Extrato
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Acompanhe todos os depósitos feitos
            </CardDescription>
          </div>
          <div className="flex gap-2 self-start sm:self-auto flex-wrap mt-2">
            {progressPercent >= 100 && paymentsHistory.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="text-pink-400 border-pink-400/20 hover:bg-pink-400/10 bg-transparent"
                onClick={handleClearHistory}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Limpar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-2">
          {paymentsHistory.length > 0 && (
            <div className="space-y-2 mb-6">
              {/* Row 1: Month/Year filters */}
              <div className="flex gap-2 bg-white/5 p-2 rounded-2xl shadow-sm border border-white/10 overflow-x-auto scrollbar-hide">
                <div className="flex items-center gap-2 pl-2 flex-shrink-0">
                  <Calendar className="w-4 h-4 text-slate-400" />
                </div>
                <select
                  className="bg-white/10 border-none text-white text-sm font-medium rounded-xl p-2 outline-none appearance-none px-4 flex-shrink-0"
                  value={selectedMonth}
                  onChange={(e) => { setSelectedMonth(e.target.value); setVisibleCount(5); }}
                >
                  <option value="all" className="bg-slate-900 text-white">Mês (Todos)</option>
                  {availableMonths.map((m) => (
                    <option key={m} value={m} className="bg-slate-900 text-white">{monthNames[Number(m) - 1]}</option>
                  ))}
                </select>
                <select
                  className="bg-white/10 border border-white/5 text-white text-sm rounded-lg p-1.5 outline-none appearance-none px-4 flex-shrink-0"
                  value={selectedYear}
                  onChange={(e) => { setSelectedYear(e.target.value); setVisibleCount(5); }}
                >
                  <option value="all" className="bg-slate-900 text-white">Ano (Todos)</option>
                  {availableYears.map((y) => (
                    <option key={y} value={y} className="bg-slate-900 text-white">{y}</option>
                  ))}
                </select>
              </div>

              {/* Row 2: Payer/Method filters */}
              <div className="flex gap-2 bg-white/5 p-2 rounded-2xl shadow-sm border border-white/10 overflow-x-auto scrollbar-hide">
                <div className="flex items-center gap-2 pl-2 flex-shrink-0">
                  <User className="w-4 h-4 text-slate-400" />
                </div>
                {(["all", "P1", "P2"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => { setSelectedPayer(v); setVisibleCount(5); }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex-shrink-0 transition-colors ${
                      selectedPayer === v ? "bg-sky-500 text-white" : "bg-white/10 text-slate-300 hover:bg-white/20"
                    }`}
                  >
                    {v === "all" ? "Todos" : v === "P1" ? nameP1 : nameP2}
                  </button>
                ))}
                <div className="w-px h-6 bg-white/10 self-center flex-shrink-0" />
                <div className="flex items-center gap-2 flex-shrink-0">
                  <CreditCard className="w-4 h-4 text-slate-400" />
                </div>
                {(["all", "pix", "dinheiro"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => { setSelectedMethod(v); setVisibleCount(5); }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex-shrink-0 transition-colors ${
                      selectedMethod === v ? "bg-sky-500 text-white" : "bg-white/10 text-slate-300 hover:bg-white/20"
                    }`}
                  >
                    {v === "all" ? "Qualquer forma" : v === "pix" ? "Pix" : "Dinheiro"}
                  </button>
                ))}
                {hasActiveFilters && (
                  <button
                    onClick={resetFilters}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold flex-shrink-0 text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 transition-colors ml-auto"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {filteredPayments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 glass-card-subtle mt-4">
              <Clock className="w-8 h-8 text-slate-500 mb-3" />
              <p className="text-slate-400 font-medium text-center">
                Nenhum pagamento encontrado para este filtro.
              </p>
              {paymentsHistory.length === 0 && (
                <p className="text-slate-500 text-sm text-center">Seus depósitos aparecerão aqui.</p>
              )}
            </div>
          ) : (
            <div className="mt-4">
              <div className="relative">
                <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-white/10" />
                <div className="space-y-6">
                  {displayedPayments.map((payment, index) => {
                    const isP1 = payment.payerId === "P1";
                    const payerName = isP1 ? nameP1 : nameP2;
                    const paymentDate = new Date(payment.date);
                    const isManual =
                      payment.paymentId?.startsWith("mock_") ||
                      payment.paymentId?.startsWith("manual_") ||
                      payment.paymentId?.startsWith("pag:") ||
                      payment.paymentId?.startsWith("pag_") ||
                      payment.paymentId?.startsWith("dinheiro_");

                    return (
                      <div
                        key={payment.paymentId || index}
                        className="relative flex gap-4 cursor-pointer group"
                        onClick={() => setSelectedPayment(payment)}
                      >
                        <div className="relative z-10 flex-shrink-0">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg border-[3px] border-[#0f172a] shadow-sm transition-transform group-hover:scale-105 ${isP1 ? "bg-emerald-500/20 text-emerald-400" : "bg-purple-500/20 text-purple-400"}`}>
                            {payerName.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div className="flex-1 glass-card-subtle p-4 group-hover:bg-white/10 transition-all relative overflow-hidden">
                          <div className={`absolute top-0 left-0 w-1 h-full ${isP1 ? "bg-emerald-400" : "bg-purple-400"}`} />
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 ml-2">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-white">{payerName}</span>
                                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 font-bold flex items-center gap-1 border border-sky-500/20">
                                  <CheckCircle2 className="w-3 h-3" />
                                  {isManual ? "Concluído" : "Pix"}
                                </span>
                                {payment.installmentLabel && (
                                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold flex items-center border border-emerald-500/20">
                                    {payment.installmentLabel}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-400 flex items-center gap-1 flex-wrap">
                                <span className="capitalize">
                                  {paymentDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}{" "}
                                  às{" "}
                                  {paymentDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                                </span>
                              </div>
                            </div>
                            <div className="text-left sm:text-right flex-shrink-0">
                              <span className="font-black text-xl text-emerald-400 flex items-center sm:justify-end gap-1.5 bg-emerald-500/10 sm:bg-transparent px-3 py-1 sm:p-0 rounded-lg w-fit">
                                <ArrowDownToLine className="w-4 h-4 text-emerald-500" />
                                <span>+ {formatCurrency(payment.amount)}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {hasMore && (
                <div className="mt-8 flex justify-center">
                  <Button
                    variant="outline"
                    className="bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border-white/10 rounded-full px-6 shadow-sm z-10 relative"
                    onClick={() => setVisibleCount((prev) => prev + 5)}
                  >
                    <ChevronDown className="w-4 h-4 mr-2" />
                    Ver mais pagamentos ({filteredPayments.length - visibleCount})
                  </Button>
                </div>
              )}

              {visibleCount > 5 && !hasMore && filteredPayments.length > 5 && (
                <div className="mt-8 flex justify-center">
                  <Button
                    variant="ghost"
                    className="text-slate-400 hover:bg-white/10 hover:text-white rounded-full px-6 z-10 relative"
                    onClick={() => setVisibleCount(5)}
                  >
                    <ChevronUp className="w-4 h-4 mr-2" />
                    Recolher histórico
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Details Modal */}
      {selectedPayment && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]"
          onClick={() => setSelectedPayment(null)}
        >
          <div
            className="glass-card w-full max-w-sm rounded-2xl shadow-xl animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-white/10 flex justify-between items-center">
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                <Receipt className="w-5 h-5 text-sky-400" />
                Detalhes do Pagamento
              </h3>
              <button
                onClick={() => setSelectedPayment(null)}
                className="text-slate-400 hover:text-white bg-white/5 rounded-full p-1 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex justify-center mb-6">
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-2xl flex items-center gap-3 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                  <div className="bg-emerald-500/20 p-2 rounded-full">
                    <ArrowDownToLine className="w-6 h-6 text-emerald-400" />
                  </div>
                  <span className="text-3xl font-black">{formatCurrency(selectedPayment.amount)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-slate-400 text-sm">Pagador</span>
                  <span className="font-semibold text-white">{selectedPayment.payerId === "P1" ? nameP1 : nameP2}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-slate-400 text-sm">Data e Hora</span>
                  <span className="font-medium text-slate-300 text-sm">
                    {new Date(selectedPayment.date).toLocaleDateString("pt-BR")}{" "}
                    às{" "}
                    {new Date(selectedPayment.date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-slate-400 text-sm">Forma</span>
                  <span className="font-medium text-slate-300 text-sm">
                    {selectedPayment.method === "dinheiro" ? "Dinheiro" : "Pix"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-slate-400 text-sm">Status</span>
                  <span className="text-sky-400 font-medium text-sm flex items-center gap-1 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-4 h-4" />{" "}
                    {selectedPayment.paymentId?.startsWith("mock_") ||
                    selectedPayment.paymentId?.startsWith("manual_") ||
                    selectedPayment.paymentId?.startsWith("pag:") ||
                    selectedPayment.paymentId?.startsWith("pag_") ||
                    selectedPayment.paymentId?.startsWith("dinheiro_")
                      ? "Concluído"
                      : "Pix Confirmado"}
                  </span>
                </div>
                {selectedPayment.installmentLabel && (
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-slate-400 text-sm">Parcela</span>
                    <span className="text-emerald-400 font-medium text-sm">{selectedPayment.installmentLabel}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-400 text-sm">ID da Transação</span>
                  <span
                    className="font-mono text-xs text-slate-500 bg-white/5 px-2 py-1 rounded max-w-[150px] truncate"
                    title={selectedPayment.paymentId?.replace("mock_", "pag_")?.replace("pag:", "pag_")}
                  >
                    {selectedPayment.paymentId?.replace("mock_", "pag_")?.replace("pag:", "pag_")}
                  </span>
                </div>

                <div className="pt-2 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-colors"
                      onClick={() => sendReceiptOnWhatsApp(selectedPayment)}
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      WhatsApp
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full border-sky-500/30 text-sky-400 hover:bg-sky-500/10 bg-transparent rounded-xl transition-colors"
                      onClick={() => downloadReceipt(selectedPayment)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Imprimir
                    </Button>
                  </div>

                  {handleDeletePayment && (
                    <>
                      {paymentToDelete === selectedPayment.paymentId ? (
                        <div className="w-full bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 space-y-2 mt-2">
                          <p className="text-sm text-rose-400 text-center font-medium">Tem certeza que deseja excluir?</p>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              className="flex-1 hover:bg-white/5 text-slate-300 transition-colors"
                              onClick={() => setPaymentToDelete(null)}
                            >
                              Cancelar
                            </Button>
                            <Button
                              className="flex-1 bg-rose-500 hover:bg-rose-600 text-white transition-colors shadow-[0_0_10px_rgba(244,63,94,0.3)]"
                              onClick={() => {
                                handleDeletePayment(selectedPayment.paymentId);
                                setSelectedPayment(null);
                                setPaymentToDelete(null);
                              }}
                            >
                              Excluir
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          className="w-full text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                          onClick={() => setPaymentToDelete(selectedPayment.paymentId)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir pagamento
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
