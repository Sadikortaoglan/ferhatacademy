"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export interface AdminTab {
  id: string;
  label: string;
}

interface AdminTabsProps {
  tabs: AdminTab[];
  basePath: string;
  defaultTab?: string;
}

export function AdminTabs({ tabs, basePath, defaultTab }: AdminTabsProps) {
  const searchParams = useSearchParams();
  const active = searchParams.get("tab") ?? defaultTab ?? tabs[0]?.id;

  return (
    <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={`${basePath}?tab=${tab.id}`}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
            active === tab.id
              ? "bg-surface text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
