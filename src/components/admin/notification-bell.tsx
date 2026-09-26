"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import Link from "next/link";
import { markNotificationRead, markAllRead, getRecentNotifications } from "@/app/[locale]/admin/notifications/actions";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  entityType: string | null;
  entityId: string | null;
  createdAt: Date;
  readAt: Date | null;
};

interface Props {
  initialCount: number;
  initialNotifications: Notification[];
  locale: string;
}

function timeAgo(date: Date, locale: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (locale === "tr") {
    if (mins < 1) return "az önce";
    if (mins < 60) return `${mins} dk önce`;
    if (hours < 24) return `${hours} sa önce`;
    return `${days} gün önce`;
  }
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export function NotificationBell({ initialCount, initialNotifications, locale }: Props) {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Poll every 30s for new notifications
  useEffect(() => {
    const id = setInterval(async () => {
      const fresh = await getRecentNotifications(10);
      setNotifications(fresh as Notification[]);
      setCount(fresh.filter((n) => !n.readAt).length);
    }, 30000);
    return () => clearInterval(id);
  }, []);

  function handleMarkRead(id: string) {
    startTransition(async () => {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date() } : n))
      );
      setCount((c) => Math.max(0, c - 1));
    });
  }

  function handleMarkAllRead() {
    startTransition(async () => {
      await markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date() })));
      setCount(0);
    });
  }

  const notifPath = `/${locale}/admin/notifications`;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={locale === "tr" ? `Bildirimler${count > 0 ? `, ${count} okunmamış` : ""}` : `Notifications${count > 0 ? `, ${count} unread` : ""}`}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-primary/60 focus:outline-none"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 w-80 rounded-xl border border-border bg-background shadow-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">
              {locale === "tr" ? "Bildirimler" : "Notifications"}
            </h3>
            {count > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={isPending}
                className="text-xs text-primary hover:underline disabled:opacity-50"
              >
                {locale === "tr" ? "Tümünü okundu işaretle" : "Mark all read"}
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-border">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                {locale === "tr" ? "Bildirim yok" : "No notifications"}
              </p>
            ) : (
              notifications.map((n) => {
                const href =
                  n.entityType === "Application" && n.entityId
                    ? `/${locale}/admin/applications/${n.entityId}`
                    : notifPath;
                return (
                  <div
                    key={n.id}
                    className={`relative px-4 py-3 hover:bg-surface transition-colors ${!n.readAt ? "bg-primary/4" : ""}`}
                  >
                    <Link
                      href={href}
                      onClick={() => {
                        if (!n.readAt) handleMarkRead(n.id);
                        setOpen(false);
                      }}
                      className="block"
                    >
                      <div className="flex items-start gap-2.5">
                        {!n.readAt && (
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                        )}
                        <div className={!n.readAt ? "" : "ml-4"}>
                          <p className="text-xs font-semibold text-foreground leading-tight">{n.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {timeAgo(n.createdAt, locale)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })
            )}
          </div>

          <div className="border-t border-border px-4 py-2">
            <Link
              href={notifPath}
              onClick={() => setOpen(false)}
              className="block text-center text-xs text-primary hover:underline py-1"
            >
              {locale === "tr" ? "Tüm bildirimleri gör" : "View all notifications"}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
