"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createOrder, enrollFree, reportPayment } from "@/features/commerce/actions/orders";

interface CheckoutFormProps {
  productId: string;
  locale: string;
  isFree: boolean;
  bankName: string;
  iban: string;
  accountHolder: string;
  paymentInstructions: string;
}

export function CheckoutForm({ productId, locale, isFree, bankName, iban, accountHolder, paymentInstructions }: CheckoutFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<"method" | "bank_details" | "done">("method");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderRef, setOrderRef] = useState<string | null>(null);
  const [transferRef, setTransferRef] = useState("");
  const [userNote, setUserNote] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFreeEnroll = async () => {
    setLoading(true);
    try {
      await enrollFree(productId);
      router.push(`/${locale}/dashboard/courses`);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleBankTransfer = async () => {
    setLoading(true);
    try {
      const order = await createOrder(productId, locale);
      setOrderId(order.id);
      setOrderRef(order.reference);
      setStep("bank_details");
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleReportPayment = async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      await reportPayment(orderId, { method: "BANK_TRANSFER", transferReference: transferRef, userNote });
      setStep("done");
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (isFree) {
    return (
      <Button onClick={handleFreeEnroll} disabled={loading} className="w-full" size="lg">
        {loading ? "..." : (locale === "tr" ? "Ücretsiz Katıl" : "Enroll Free")}
      </Button>
    );
  }

  if (step === "done") {
    return (
      <div className="border border-border rounded-xl p-6 bg-surface text-center space-y-2">
        <p className="font-bold text-lg">{locale === "tr" ? "Ödemeniz bildirildi" : "Payment reported"}</p>
        <p className="text-muted-foreground text-sm">
          {locale === "tr" ? "Referans:" : "Reference:"} <span className="font-mono font-bold">{orderRef}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          {locale === "tr" ? "Ödemeniz onaylandıktan sonra erişiminiz aktif edilecektir." : "Your access will be activated once payment is confirmed."}
        </p>
        <Button variant="outline" onClick={() => router.push(`/${locale}/dashboard/purchases`)} className="mt-4">
          {locale === "tr" ? "Satın Aldıklarım" : "My Purchases"}
        </Button>
      </div>
    );
  }

  if (step === "bank_details") {
    return (
      <div className="space-y-6">
        <div className="border border-border rounded-xl p-6 bg-surface space-y-3">
          <h2 className="font-bold">{locale === "tr" ? "Banka Havale / EFT Bilgileri" : "Bank Transfer Details"}</h2>
          <div className="text-sm space-y-1">
            {bankName && <p><span className="text-muted-foreground">{locale === "tr" ? "Banka:" : "Bank:"}</span> {bankName}</p>}
            {accountHolder && <p><span className="text-muted-foreground">{locale === "tr" ? "Hesap Sahibi:" : "Account Holder:"}</span> {accountHolder}</p>}
            {iban && <p><span className="text-muted-foreground">IBAN:</span> <span className="font-mono">{iban}</span></p>}
            <p className="mt-2 font-medium text-yellow-600 dark:text-yellow-400">
              {locale === "tr" ? "Açıklama:" : "Description:"} <span className="font-mono">{orderRef}</span>
            </p>
          </div>
          {paymentInstructions && <p className="text-sm text-muted-foreground">{paymentInstructions}</p>}
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{locale === "tr" ? "Havale referans no (opsiyonel)" : "Transfer reference (optional)"}</Label>
            <Input value={transferRef} onChange={(e) => setTransferRef(e.target.value)} placeholder={locale === "tr" ? "Banka dekont numarası..." : "Bank receipt number..."} />
          </div>
          <div className="space-y-2">
            <Label>{locale === "tr" ? "Not (opsiyonel)" : "Note (optional)"}</Label>
            <Input value={userNote} onChange={(e) => setUserNote(e.target.value)} />
          </div>
          <Button onClick={handleReportPayment} disabled={loading} className="w-full">
            {loading ? "..." : (locale === "tr" ? "Ödemeyi Yaptım" : "I Made the Payment")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="font-bold">{locale === "tr" ? "Ödeme Yöntemi" : "Payment Method"}</h2>
      <Button onClick={handleBankTransfer} disabled={loading} variant="outline" className="w-full justify-start h-auto p-4">
        <div className="text-left">
          <div className="font-semibold">{locale === "tr" ? "Havale / EFT" : "Bank Transfer"}</div>
          <div className="text-sm text-muted-foreground">{locale === "tr" ? "Banka havalesi ile ödeme yapın" : "Pay via bank transfer"}</div>
        </div>
      </Button>
    </div>
  );
}
