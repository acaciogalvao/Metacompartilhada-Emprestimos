/**
 * Hook usePayment.
 * Gerencia a lógica do modal de geração de Pix, verificação do status
 * e tratamentos de pagamentos manuais. Conecta-se ao backend via API.
 */
import { useState, useEffect } from "react";

interface UsePaymentProps {
  currentGoalId: string;
  pixKeyP1: string;
  pixKeyP2: string;
  nameP1: string;
  nameP2: string;
  showToast: (text: string, type?: "success" | "error") => void;
  onPaymentSuccess: () => void;
}

export const usePayment = ({
  currentGoalId,
  pixKeyP1,
  pixKeyP2,
  nameP1,
  nameP2,
  showToast,
  onPaymentSuccess,
}: UsePaymentProps) => {
  const [showPixModal, setShowPixModal] = useState(false);
  const [currentPayer, setCurrentPayer] = useState<"P1" | "P2">("P1");
  const [pixAmount, setPixAmount] = useState("");
  const [pixCode, setPixCode] = useState("");
  const [isGeneratingPix, setIsGeneratingPix] = useState(false);
  const [copied, setCopied] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [qrCodeBase64, setQrCodeBase64] = useState("");
  const [isManualPayment, setIsManualPayment] = useState(true);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "dinheiro">("pix");
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);

  useEffect(() => {
    if (!pixAmount || Number(pixAmount) <= 0) {
      setPixCode("");
      setQrCodeBase64("");
      setIsGeneratingPix(false);
    }
  }, [pixAmount]);

  useEffect(() => {
    if (!paymentId || !showPixModal || paymentSuccess) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/check-payment/${paymentId}`);
        const data = await res.json();
        if (data.status === "approved") {
          setPaymentSuccess(true);
          onPaymentSuccess();

          setTimeout(() => {
            setShowPixModal(false);
            setPaymentSuccess(false);
            setPixCode("");
            setQrCodeBase64("");
            setPixAmount("");
            setPaymentId(null);
          }, 2000);
        }
      } catch (e: any) {
        if (e.message === "Failed to fetch") return;
        console.error("Error checking payment status", e);
      }
    }, 3000); // Check every 3 seconds

    return () => clearInterval(interval);
  }, [paymentId, showPixModal, paymentSuccess, onPaymentSuccess]);

  const handleGeneratePix = async () => {
    if (!currentGoalId) {
      showToast("Por favor, salve os dados antes de gerar um Pix.");
      return;
    }
    const amount = Number(pixAmount);
    if (amount <= 0) return;

    setIsGeneratingPix(true);
    try {
      const activePixKey = currentPayer === "P1" ? pixKeyP1 : pixKeyP2;

      let response;
      if (activePixKey) {
        // Option 1: Direct personal Pix key provided
        response = await fetch("/api/generate-static-pix", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount,
            pixKey: activePixKey,
            merchantName: currentPayer === "P1" ? nameP1 : nameP2,
          }),
        });

        setPaymentId(null);
        setIsManualPayment(true);
      } else {
        // Option 2: Mercado Pago backend
        response = await fetch("/api/create-pix-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount,
            goalId: currentGoalId,
            payerId: currentPayer,
          }),
        });
      }

      const data = await response.json();

      if (!response.ok || data.error) {
        showToast(
          `Erro ao gerar Pix: ${data.error || "Erro desconhecido"}`,
          "error",
        );
        return;
      }

      if (data.pixCode) {
        setPixCode(data.pixCode);
      }
      if (data.qrCodeBase64) {
        setQrCodeBase64(data.qrCodeBase64);
      }
      if (data.paymentId) {
        setPaymentId(data.paymentId);
      }
      if (data.isMock !== undefined && !activePixKey) {
        setIsManualPayment(data.isMock);
      }
    } catch (error) {
      console.error("Error generating pix:", error);
    } finally {
      setIsGeneratingPix(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!currentGoalId || isConfirmingPayment) {
      if (!currentGoalId)
        showToast("Por favor, salve os dados antes de simular um pagamento.");
      return;
    }
    const amount = Number(pixAmount);
    setIsConfirmingPayment(true);
    try {
      await fetch("/api/manual-pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          goalId: currentGoalId,
          payerId: currentPayer,
          method: paymentMethod,
        }),
      });
      setPaymentSuccess(true);
      onPaymentSuccess();

      setTimeout(() => {
        setShowPixModal(false);
        setPaymentSuccess(false);
        setPixCode("");
        setQrCodeBase64("");
        setPixAmount("");
        setPaymentId(null);
      }, 2000);
    } catch (error) {
      console.error("Error simulating payment:", error);
    } finally {
      setIsConfirmingPayment(false);
    }
  };

  const copyPixCode = () => {
    navigator.clipboard.writeText(pixCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return {
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
  };
};
