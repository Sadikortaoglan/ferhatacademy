import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  className?: string;
  text?: string;
}

export function LoadingState({ className, text }: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12",
        className
      )}
    >
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      {text && (
        <p className="text-sm text-muted-foreground mt-2">{text}</p>
      )}
    </div>
  );
}
