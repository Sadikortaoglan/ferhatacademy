"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminApprovePayment, adminRejectPayment } from "@/features/commerce/actions/orders";

export function PaymentActionButtons({ paymentId }: { paymentId: string }) {
  const [loading, setLoading] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");
  const router = useRouter();

  const approve = async () => {
    setLoading(true);
    try { await adminApprovePayment(paymentId); router.refresh(); }
    finally { setLoading(false); }
  };

  const reject = async () => {
    setLoading(true);
    try { await adminRejectPayment(paymentId, note); router.refresh(); }
    finally { setLoading(false); }
  };

  if (rejecting) {
    return (
      <div className="flex gap-2 items-center">
        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Red sebebi..." className="h-8 text-sm" />
        <Button size="sm" variant="outline" onClick={reject} disabled={loading}>Reddet</Button>
        <Button size="sm" variant="ghost" onClick={() => setRejecting(false)}>İptal</Button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" onClick={approve} disabled={loading}>Onayla</Button>
      <Button size="sm" variant="outline" onClick={() => setRejecting(true)} disabled={loading}>Reddet</Button>
    </div>
  );
}
