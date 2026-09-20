"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { adminUpdateApplicationStatus } from "@/features/commerce/actions/applications";

export function ApplicationStatusButtons({ appId, currentStatus }: { appId: string; currentStatus: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const update = async (status: "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "WAITLISTED") => {
    setLoading(true);
    try { await adminUpdateApplicationStatus(appId, status); router.refresh(); }
    finally { setLoading(false); }
  };

  if (currentStatus === "APPROVED" || currentStatus === "REJECTED" || currentStatus === "CANCELLED") {
    return <span className="text-xs text-muted-foreground">{currentStatus}</span>;
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {currentStatus !== "UNDER_REVIEW" && (
        <Button size="sm" variant="outline" onClick={() => update("UNDER_REVIEW")} disabled={loading}>İncele</Button>
      )}
      <Button size="sm" onClick={() => update("APPROVED")} disabled={loading}>Onayla</Button>
      <Button size="sm" variant="outline" onClick={() => update("REJECTED")} disabled={loading}>Reddet</Button>
      <Button size="sm" variant="outline" onClick={() => update("WAITLISTED")} disabled={loading}>Beklet</Button>
    </div>
  );
}
