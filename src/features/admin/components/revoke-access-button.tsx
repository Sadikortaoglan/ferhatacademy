"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { revokeAccess } from "@/features/admin/actions/access";
import { Button } from "@/components/ui/button";

export function RevokeAccessButton({ entitlementId }: { entitlementId: string }) {
  const t = useTranslations("admin");
  const [loading, setLoading] = useState(false);

  const handleRevoke = async () => {
    if (!confirm(t("confirmRevoke"))) return;
    setLoading(true);
    try {
      await revokeAccess(entitlementId);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-danger hover:text-danger"
      disabled={loading}
      onClick={handleRevoke}
    >
      {loading ? "..." : t("revokeAccess")}
    </Button>
  );
}
