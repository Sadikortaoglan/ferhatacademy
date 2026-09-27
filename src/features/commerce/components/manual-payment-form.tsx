"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminRecordManualPayment } from "@/features/commerce/actions/orders";

export function ManualPaymentForm({ orderId, defaultAmount }: { orderId: string; defaultAmount?: number }) {
  const te = useTranslations("enums");
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState(defaultAmount != null ? String(defaultAmount) : "");
  const [method, setMethod] = useState("BANK_TRANSFER");
  const [note, setNote] = useState("");
  const router = useRouter();

  const handle = async () => {
    setLoading(true);
    try {
      await adminRecordManualPayment(orderId, { method, amount: parseInt(amount), adminNote: note });
      router.refresh();
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Yöntem</Label>
          <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="BANK_TRANSFER">{te("paymentMethod.BANK_TRANSFER")}</option>
            <option value="CASH">{te("paymentMethod.CASH")}</option>
            <option value="ADMIN_MANUAL">{te("paymentMethod.ADMIN_MANUAL")}</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Tutar (kuruş)</Label>
          <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="249900" />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Not</Label>
        <Input value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      <Button size="sm" onClick={handle} disabled={loading || !amount}>
        {loading ? "..." : "Ödeme Kaydet ve Onayla"}
      </Button>
    </div>
  );
}
