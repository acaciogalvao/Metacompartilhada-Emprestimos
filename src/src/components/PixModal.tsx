/**
 * Componente PixModal.
 * Modal que gerencia o fluxo de pagamento.
 * Exibe opções para gerar um código Pix (Copia e Cola/QR Code) 
 * ou registrar um pagamento manual (simulação ou de fora do app).
 */
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  X,
  Copy,
  CheckCircle2,
  Zap,
  CheckSquare,
  QrCode,
  Banknote,
} from "lucide-react";

interface PixModalProps {
  showPixModal: boolean;
  setShowPixModal: (show: boolean) => void;
  currentPayer: "P1" | "P2";
  nameP1: string;
  nameP2: string;
  pixAmount: string;
  setPixAmount: (amount: string) => void;
  installmentP1?: number;
  installmentP2?: number;
  remainingP1?: number;
  remainingP2?: number;
  pixCode: string;
  setPixCode: (code: string) => void;
  qrCodeBase64: string;
  isGeneratingPix: boolean;
  paymentSuccess: boolean;
  copied: boolean;
  copyPixCode: () => void;
  handleGeneratePix: () => void;
  handleConfirmPayment: () => void;
  isConfirmingPayment: boolean;
  isManualPayment: boolean;
  setIsManualPayment: (isManual: boolean) => void;
  paymentMethod: "pix" | "dinheiro";
  setPaymentMethod: (method: "pix" | "dinheiro") => void;
  formatCurrency: (value: number) => string;
  handleCurrencyChange: (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<string>>,
  ) => void;
}

export function PixModal({
  showPixModal,
  setShowPixModal,
  currentPayer,
  nameP1,
  nameP2,
  pixAmount,
  setPixAmount,
  installmentP1 = 0,
  installmentP2 = 0,
  remainingP1 = 0,
  remainingP2 = 0,
  pixCode,
  setPixCode,
  qrCodeBase64,
  isGeneratingPix,
  paymentSuccess,
  copied,
  copyPixCode,
  handleGeneratePix,
  handleConfirmPayment,
  isConfirmingPayment,
  isManualPayment,
  setIsManualPayment,
  paymentMethod,
  setPaymentMethod,
  formatCurrency,
  handleCurrencyChange,
}: PixModalProps) {
  const payerName = currentPayer === "P1" ? nameP1 : nameP2;
  const installmentAmount =
    currentPayer === "P1" ? installmentP1 : installmentP2;
  const remainingAmount = currentPayer === "P1" ? remainingP1 : remainingP2;

  // Ensure we don't pay more than remaining
  useEffect(() => {
    if (
      showPixModal &&
      Number(pixAmount) > remainingAmount &&
      remainingAmount > 0
    ) {
      setPixAmount(remainingAmount.toFixed(2));
    }
  }, [pixAmount, remainingAmount, setPixAmount, showPixModal]);

  // Auto-generate PIX if amount changes and it's valid
  useEffect(() => {
    if (
      showPixModal &&
      pixAmount &&
      Number(pixAmount) > 0 &&
      !isGeneratingPix &&
      !pixCode &&
      !paymentSuccess
    ) {
      if (paymentMethod === "pix") {
        const timeoutId = setTimeout(() => {
          handleGeneratePix();
        }, 1000);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [pixAmount, showPixModal, paymentMethod]);

  if (!showPixModal) return null;

  const currentInstallments =
    Math.round(Number(pixAmount) / installmentAmount) || 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50 sm:items-center">
      <div className="glass-card w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl animate-in slide-in-from-bottom-full sm:zoom-in duration-300 flex flex-col max-h-[90vh] pb-6 border border-white/10">
        <div className="p-6 pb-2">
          <div className="flex justify-between items-center mb-1">
            <h2 className="text-xl font-bold text-white">
              Registrar Pagamento
            </h2>
            <button
              onClick={() => {
                setShowPixModal(false);
                setPixCode("");
                setPixAmount("");
              }}
              className="text-slate-400 hover:text-white transition-colors bg-white/5 rounded-full p-1"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-sm text-slate-400 mb-4">
            Pagador:{" "}
            <span className="font-semibold text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]">
              {payerName}
            </span>
          </p>

          <div className="flex flex-col gap-4 mb-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 shadow-sm flex items-center">
              <span className="text-2xl font-medium text-slate-500 mr-2">
                R$
              </span>
              <Input
                type="text"
                inputMode="numeric"
                value={
                  pixAmount === ""
                    ? ""
                    : formatCurrency(Number(pixAmount)).replace("R$", "").trim()
                }
                onChange={(e) => {
                  setPixCode("");
                  handleCurrencyChange(e, setPixAmount);
                }}
                className="text-4xl font-bold text-white border-none shadow-none focus-visible:ring-0 p-0 h-auto bg-transparent placeholder-slate-600"
                placeholder="0,00"
              />
            </div>

            <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-3 shadow-sm">
              <label className="text-sm text-slate-400 font-bold uppercase tracking-wider">
                Qtd. Parcelas
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (currentInstallments > 1) {
                      setPixAmount(
                        (installmentAmount * (currentInstallments - 1)).toFixed(
                          2,
                        ),
                      );
                      setPixCode("");
                    } else {
                      setPixAmount("0.00");
                      setPixCode("");
                    }
                  }}
                  className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center font-bold hover:bg-white/20 transition-colors text-lg"
                >
                  -
                </button>
                <span className="text-2xl font-bold text-sky-400 w-8 text-center flex-shrink-0">
                  {installmentAmount > 0 ? currentInstallments : 0}
                </span>
                <button
                  onClick={() => {
                    if (installmentAmount <= 0) return;
                    const nextValue =
                      installmentAmount * (currentInstallments + 1);
                    if (nextValue <= remainingAmount) {
                      setPixAmount(nextValue.toFixed(2));
                      setPixCode("");
                    } else if (remainingAmount > 0) {
                      setPixAmount(remainingAmount.toFixed(2));
                      setPixCode("");
                    }
                  }}
                  className="w-10 h-10 rounded-full shadow-[0_0_10px_rgba(56,189,248,0.2)] bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold hover:bg-sky-500/30 transition-colors text-lg border border-sky-500/30"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => {
                setPixAmount(installmentAmount.toFixed(2));
                setPixCode("");
              }}
              className={`flex-shrink-0 px-4 py-2 rounded-full border text-sm font-bold flex items-center transition-colors ${Number(pixAmount) === installmentAmount && Number(pixAmount) > 0 ? "bg-sky-500/20 border-sky-500/30 text-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.2)]" : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white"}`}
            >
              <Zap className="w-4 h-4 mr-2" />1 Parcela:{" "}
              {formatCurrency(installmentAmount)}
            </button>
            <button
              onClick={() => {
                setPixAmount(remainingAmount.toFixed(2));
                setPixCode("");
              }}
              className={`flex-shrink-0 px-4 py-2 rounded-full border text-sm font-bold flex items-center transition-colors ${Number(pixAmount) === remainingAmount && Number(pixAmount) > 0 ? "bg-sky-500/20 border-sky-500/30 text-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.2)]" : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white"}`}
            >
              <CheckSquare className="w-4 h-4 mr-2" />
              Quitar tudo: {formatCurrency(remainingAmount)}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 border-t border-white/10 pt-6">
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setPaymentMethod("pix")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all duration-300 ${paymentMethod === "pix" ? "bg-sky-500/20 text-sky-400 border border-sky-500/50 shadow-[0_0_15px_rgba(56,189,248,0.2)]" : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10"}`}
            >
              <QrCode className="w-5 h-5" /> Pix
            </button>
            <button
              onClick={() => setPaymentMethod("dinheiro")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all duration-300 ${paymentMethod === "dinheiro" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]" : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10"}`}
            >
              <Banknote className="w-5 h-5" /> Dinheiro
            </button>
          </div>

          <div className="text-center relative mb-4">
            <span className="bg-slate-900 px-3 text-xs text-slate-400 font-bold uppercase tracking-widest relative z-10 border border-white/10 rounded-full py-1 shadow-sm">
              Detalhes do Pagamento
            </span>
            <div className="absolute top-1/2 left-0 w-full h-px bg-white/10"></div>
          </div>

          {paymentSuccess ? (
            <div className="flex flex-col items-center justify-center py-8 text-emerald-400 space-y-4">
              <CheckCircle2 className="w-16 h-16 animate-bounce drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              <p className="text-xl font-bold shadow-emerald-400 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-sky-400">
                Pagamento Confirmado!
              </p>
              <p className="text-sm text-slate-400 text-center">
                O valor já foi adicionado à sua meta.
              </p>
              <Button
                variant="outline"
                className="w-full text-white border-white/10 bg-white/5 hover:bg-white/10 mt-4 rounded-xl"
                onClick={() => setShowPixModal(false)}
              >
                Fechar
              </Button>
            </div>
          ) : qrCodeBase64 ? (
            <div className="flex flex-col items-center mt-2">
              <p className="text-sm text-slate-400 mb-6">
                Escaneie para pagar para{" "}
                <span className="font-semibold text-white">{payerName}</span>
              </p>

              <div className="bg-white p-2 rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.1)] border border-white/20 mb-6 inline-block relative">
                <img
                  src={`data:image/png;base64,${qrCodeBase64}`}
                  alt="QR Code Pix"
                  className="w-48 h-48 rounded-xl"
                />
              </div>

              <div className="bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold px-6 py-2 rounded-full mb-8 text-lg shadow-[0_0_15px_rgba(56,189,248,0.1)]">
                {formatCurrency(Number(pixAmount))}
              </div>

              <div className="w-full space-y-3">
                <Button
                  variant="outline"
                  className="w-full h-12 rounded-xl text-sky-400 bg-sky-500/10 border-sky-500/20 hover:bg-sky-500/20 transition-colors font-bold shadow-sm hover:shadow-[0_0_15px_rgba(56,189,248,0.2)]"
                  onClick={copyPixCode}
                >
                  {copied ? (
                    <CheckCircle2 className="w-5 h-5 mr-2 text-emerald-400" />
                  ) : (
                    <Copy className="w-5 h-5 mr-2" />
                  )}
                  {copied ? "Copiado!" : "Copiar código Pix (copia e cola)"}
                </Button>

                <Button
                  disabled={isConfirmingPayment}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-sky-400 to-indigo-500 hover:from-sky-300 hover:to-indigo-400 text-white font-bold text-lg shadow-[0_0_20px_rgba(56,189,248,0.3)] border-none disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleConfirmPayment}
                >
                  {isConfirmingPayment ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2"></div>
                  ) : (
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                  )}
                  Confirmar {formatCurrency(Number(pixAmount))}
                </Button>
              </div>
            </div>
          ) : isGeneratingPix ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-8 h-8 border-4 border-white/10 border-t-sky-400 rounded-full animate-spin drop-shadow-[0_0_5px_rgba(56,189,248,0.5)]"></div>
              <p className="text-slate-400 text-sm font-medium">
                Gerando QR Code...
              </p>
            </div>
          ) : paymentMethod === "dinheiro" ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Banknote className="w-16 h-16 text-emerald-500 mb-4 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-in zoom-in duration-500" />
              <p className="text-slate-300 text-sm mb-6">
                Você está confirmando que o valor foi entregue em dinheiro para{" "}
                <span className="font-semibold text-white">{payerName}</span>.
              </p>
              <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold px-6 py-2 rounded-full mb-8 text-lg shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                {formatCurrency(Number(pixAmount) || 0)}
              </div>
              <Button
                disabled={
                  !pixAmount || Number(pixAmount) <= 0 || isConfirmingPayment
                }
                className="w-full h-14 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 text-white font-bold text-lg shadow-[0_0_20px_rgba(16,185,129,0.3)] border-none disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleConfirmPayment}
              >
                {isConfirmingPayment ? (
                  <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2"></div>
                ) : (
                  <CheckCircle2 className="w-6 h-6 mr-2" />
                )}
                Confirmar Pagamento
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center h-48 border-2 border-dashed border-white/10 bg-white/5 rounded-2xl shadow-inner">
              <QrCode className="w-12 h-12 text-slate-500 mb-2 drop-shadow-sm" />
              <p className="text-slate-400 text-sm max-w-[200px]">
                Insira o valor acima e aguarde para gerar o Pix
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
