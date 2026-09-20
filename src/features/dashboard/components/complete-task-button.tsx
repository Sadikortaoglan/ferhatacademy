"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { completeAssignmentItem } from "@/features/dashboard/actions/assignments";

export function CompleteTaskButton({ itemId }: { itemId: string }) {
  const [loading, setLoading] = useState(false);

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        try {
          await completeAssignmentItem(itemId);
        } finally {
          setLoading(false);
        }
      }}
    >
      <CheckCircle2 className="h-4 w-4 mr-2" />
      {loading ? "..." : "Tamamla"}
    </Button>
  );
}
