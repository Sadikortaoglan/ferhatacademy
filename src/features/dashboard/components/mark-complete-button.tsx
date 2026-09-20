"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";
import { markLessonCompleted } from "@/features/dashboard/actions/progress";

export function MarkCompleteButton({
  lessonId,
  initialCompleted,
}: {
  lessonId: string;
  initialCompleted: boolean;
}) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [loading, setLoading] = useState(false);

  if (completed) {
    return (
      <Badge variant="success" className="flex items-center gap-1.5">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Tamamlandı
      </Badge>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        try {
          await markLessonCompleted(lessonId);
          setCompleted(true);
        } finally {
          setLoading(false);
        }
      }}
    >
      <CheckCircle2 className="h-4 w-4 mr-2" />
      {loading ? "..." : "Tamamlandı Olarak İşaretle"}
    </Button>
  );
}
