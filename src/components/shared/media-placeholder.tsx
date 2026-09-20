import { cn } from "@/lib/utils";
import { Camera } from "lucide-react";

interface MediaPlaceholderProps {
  aspectRatio?: "video" | "square" | "portrait";
  label?: string;
  className?: string;
  bgClassName?: string;
  showIcon?: boolean;
}

const aspectClasses = {
  video: "aspect-video",
  square: "aspect-square",
  portrait: "aspect-[3/4]",
};

export function MediaPlaceholder({
  aspectRatio = "video",
  label,
  className,
  bgClassName = "bg-[hsl(var(--color-dark-surface,220_18%_12%))]",
  showIcon = true,
}: MediaPlaceholderProps) {
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-xl flex items-center justify-center",
        aspectClasses[aspectRatio],
        bgClassName,
        className
      )}
    >
      {showIcon && (
        <div className="flex flex-col items-center gap-2 text-[hsl(220_15%_40%)]">
          <Camera className="h-10 w-10" />
          {label && (
            <span className="text-xs text-center px-4 leading-snug">{label}</span>
          )}
        </div>
      )}
    </div>
  );
}
