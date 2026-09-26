"use client";

import { useState, useTransition } from "react";
import { createNavItem, updateNavItem, deleteNavItem, reorderNavItems } from "./actions";

type NavItem = {
  id: string;
  key: string;
  labelTr: string;
  labelEn: string;
  href: string;
  position: number;
  enabled: boolean;
  showInNavbar: boolean;
  showInFooter: boolean;
  openInNewTab: boolean;
  icon: string | null;
};

const inputClass =
  "w-full rounded border border-border bg-background px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40";

function NavItemRow({
  item,
  locale,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  item: NavItem;
  locale: string;
  onUpdate: (item: NavItem) => void;
  onDelete: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [edit, setEdit] = useState({
    labelTr: item.labelTr,
    labelEn: item.labelEn,
    href: item.href,
    enabled: item.enabled,
    showInNavbar: item.showInNavbar,
    showInFooter: item.showInFooter,
    openInNewTab: item.openInNewTab,
    icon: item.icon ?? "",
  });

  function handleSave() {
    startTransition(async () => {
      const updated = await updateNavItem(locale, item.id, { ...edit, icon: edit.icon || undefined });
      onUpdate({ ...item, ...updated });
      setExpanded(false);
    });
  }

  function handleDelete() {
    if (!confirm(`"${item.labelTr}" menü öğesini silmek istediğine emin misin?`)) return;
    startTransition(async () => {
      await deleteNavItem(locale, item.id);
      onDelete(item.id);
    });
  }

  function handleToggleEnabled() {
    startTransition(async () => {
      const updated = await updateNavItem(locale, item.id, { enabled: !item.enabled });
      onUpdate({ ...item, ...updated });
    });
  }

  return (
    <div className={`rounded-xl border transition-colors ${item.enabled ? "border-border" : "border-border/40 bg-muted/20 opacity-60"}`}>
      <div className="flex items-center gap-2.5 px-4 py-2.5">
        {/* Reorder */}
        <div className="flex flex-col gap-0.5 shrink-0">
          <button onClick={() => onMoveUp(item.id)} className="text-muted-foreground hover:text-foreground text-[10px] leading-none">▲</button>
          <button onClick={() => onMoveDown(item.id)} className="text-muted-foreground hover:text-foreground text-[10px] leading-none">▼</button>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground">{item.labelTr}</span>
            <span className="text-xs font-mono text-muted-foreground">{item.href}</span>
            <div className="flex gap-1">
              {item.showInNavbar && (
                <span className="rounded-full bg-primary/10 text-primary text-[10px] font-semibold px-1.5 py-0.5">Navbar</span>
              )}
              {item.showInFooter && (
                <span className="rounded-full bg-muted text-muted-foreground text-[10px] font-semibold px-1.5 py-0.5">Footer</span>
              )}
              {item.openInNewTab && (
                <span className="rounded-full bg-muted text-muted-foreground text-[10px] px-1.5 py-0.5">↗ Yeni sekme</span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleToggleEnabled}
            disabled={isPending}
            className={`text-xs font-medium ${item.enabled ? "text-muted-foreground hover:text-danger" : "text-success hover:underline"}`}
          >
            {item.enabled ? "Gizle" : "Göster"}
          </button>
          <button onClick={() => setExpanded((p) => !p)} className="text-xs text-primary hover:underline">
            {expanded ? "Kapat" : "Düzenle"}
          </button>
          <button onClick={handleDelete} disabled={isPending} className="text-xs text-danger hover:underline">Sil</button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border px-4 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-muted-foreground">Etiket (TR)</label>
              <input className={inputClass} value={edit.labelTr} onChange={(e) => setEdit((p) => ({ ...p, labelTr: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-muted-foreground">Etiket (EN)</label>
              <input className={inputClass} value={edit.labelEn} onChange={(e) => setEdit((p) => ({ ...p, labelEn: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-muted-foreground">URL / Yol</label>
              <input className={inputClass} value={edit.href} onChange={(e) => setEdit((p) => ({ ...p, href: e.target.value }))} placeholder="/kurslar" />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-muted-foreground">İkon (emoji veya isim)</label>
              <input className={inputClass} value={edit.icon} onChange={(e) => setEdit((p) => ({ ...p, icon: e.target.value }))} placeholder="opsiyonel" />
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            {(
              [
                { key: "enabled", label: "Aktif" },
                { key: "showInNavbar", label: "Navbar'da göster" },
                { key: "showInFooter", label: "Footer'da göster" },
                { key: "openInNewTab", label: "Yeni sekmede aç" },
              ] as { key: keyof typeof edit; label: string }[]
            ).map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={edit[key] as boolean}
                  onChange={(e) => setEdit((p) => ({ ...p, [key]: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm text-foreground">{label}</span>
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setExpanded(false)} className="rounded border border-border px-3 py-1.5 text-xs text-muted-foreground">İptal</button>
            <button onClick={handleSave} disabled={isPending} className="rounded bg-primary px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
              {isPending ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AddNavItemForm({ locale, defaultPosition, onAdded }: { locale: string; defaultPosition: number; onAdded: (item: NavItem) => void }) {
  const [show, setShow] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState({
    key: "",
    labelTr: "",
    labelEn: "",
    href: "",
    position: defaultPosition,
    enabled: true,
    showInNavbar: true,
    showInFooter: false,
    openInNewTab: false,
  });

  function handleAdd() {
    if (!data.labelTr || !data.href) return;
    const key = data.key || data.labelTr.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 40);
    setError(null);
    startTransition(async () => {
      try {
        const item = await createNavItem(locale, { ...data, key });
        onAdded(item as NavItem);
        setShow(false);
        setData({ key: "", labelTr: "", labelEn: "", href: "", position: defaultPosition + 1, enabled: true, showInNavbar: true, showInFooter: false, openInNewTab: false });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Hata");
      }
    });
  }

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="w-full rounded-xl border-2 border-dashed border-border py-3 text-sm font-semibold text-muted-foreground hover:border-primary hover:text-primary transition-colors"
      >
        + Menü Öğesi Ekle
      </button>
    );
  }

  return (
    <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 space-y-3">
      <p className="text-sm font-bold text-foreground">Yeni Menü Öğesi</p>
      {error && <p className="text-xs text-danger">{error}</p>}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-muted-foreground">Etiket (TR) *</label>
          <input className={inputClass} placeholder="Kurslar" value={data.labelTr} onChange={(e) => setData((p) => ({ ...p, labelTr: e.target.value }))} />
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-muted-foreground">Etiket (EN) *</label>
          <input className={inputClass} placeholder="Courses" value={data.labelEn} onChange={(e) => setData((p) => ({ ...p, labelEn: e.target.value }))} />
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-muted-foreground">URL / Yol *</label>
          <input className={inputClass} placeholder="/kurslar" value={data.href} onChange={(e) => setData((p) => ({ ...p, href: e.target.value }))} />
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-muted-foreground">Key (opsiyonel)</label>
          <input className={inputClass} placeholder="otomatik" value={data.key} onChange={(e) => setData((p) => ({ ...p, key: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "-") }))} />
        </div>
      </div>
      <div className="flex flex-wrap gap-4">
        {(
          [
            { key: "showInNavbar", label: "Navbar'da" },
            { key: "showInFooter", label: "Footer'da" },
            { key: "openInNewTab", label: "Yeni sekme" },
          ] as { key: keyof typeof data; label: string }[]
        ).map(({ key, label }) => (
          <label key={key} className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={data[key] as boolean} onChange={(e) => setData((p) => ({ ...p, [key]: e.target.checked }))} />
            <span className="text-xs text-foreground">{label}</span>
          </label>
        ))}
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={() => setShow(false)} className="rounded border border-border px-3 py-1.5 text-xs text-muted-foreground">İptal</button>
        <button onClick={handleAdd} disabled={isPending || !data.labelTr || !data.href} className="rounded bg-primary px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
          {isPending ? "Ekleniyor..." : "Ekle"}
        </button>
      </div>
    </div>
  );
}

interface Props {
  locale: string;
  initialItems: NavItem[];
}

export function NavEditor({ locale, initialItems }: Props) {
  const [items, setItems] = useState<NavItem[]>(initialItems);
  const [isPending, startTransition] = useTransition();

  function handleUpdate(updated: NavItem) {
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  }

  function handleDelete(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function handleMoveUp(id: string) {
    const idx = items.findIndex((i) => i.id === id);
    if (idx <= 0) return;
    const newOrder = [...items];
    [newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]];
    const withPos = newOrder.map((i, p) => ({ ...i, position: p }));
    setItems(withPos);
    startTransition(async () => { await reorderNavItems(locale, withPos.map((i) => i.id)); });
  }

  function handleMoveDown(id: string) {
    const idx = items.findIndex((i) => i.id === id);
    if (idx >= items.length - 1) return;
    const newOrder = [...items];
    [newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]];
    const withPos = newOrder.map((i, p) => ({ ...i, position: p }));
    setItems(withPos);
    startTransition(async () => { await reorderNavItems(locale, withPos.map((i) => i.id)); });
  }

  const navbarItems = items.filter((i) => i.showInNavbar);
  const footerItems = items.filter((i) => i.showInFooter);
  const hiddenItems = items.filter((i) => !i.enabled);

  return (
    <div className="space-y-6">
      {/* Live summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-surface px-4 py-3 text-center">
          <p className="text-2xl font-black text-foreground">{navbarItems.length}</p>
          <p className="text-xs text-muted-foreground">Navbar öğesi</p>
        </div>
        <div className="rounded-xl border border-border bg-surface px-4 py-3 text-center">
          <p className="text-2xl font-black text-foreground">{footerItems.length}</p>
          <p className="text-xs text-muted-foreground">Footer öğesi</p>
        </div>
        <div className="rounded-xl border border-border bg-surface px-4 py-3 text-center">
          <p className="text-2xl font-black text-foreground">{hiddenItems.length}</p>
          <p className="text-xs text-muted-foreground">Gizli öğe</p>
        </div>
      </div>

      {/* Item list */}
      <div className="space-y-2">
        {items.map((item) => (
          <NavItemRow
            key={item.id}
            item={item}
            locale={locale}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
          />
        ))}
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">Henüz menü öğesi yok.</p>
        )}
      </div>

      <AddNavItemForm
        locale={locale}
        defaultPosition={items.length}
        onAdded={(item) => setItems((prev) => [...prev, item])}
      />

      <p className="text-xs text-muted-foreground">
        {isPending ? "Kaydediliyor..." : `${items.length} toplam öğe — ${navbarItems.length} navbar, ${footerItems.length} footer`}
      </p>
    </div>
  );
}
