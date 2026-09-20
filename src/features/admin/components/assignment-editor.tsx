"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  updateAssignment,
  addAssignmentItem,
  deleteAssignmentItem,
  reorderAssignmentItems,
} from "@/features/admin/actions/assignments";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ChevronUp, ChevronDown, Trash2, Plus, CheckCircle2, Circle } from "lucide-react";

type ItemLesson = {
  id: string;
  translations: { locale: string; title: string }[];
};

type AssignmentItem = {
  id: string;
  position: number;
  type: string;
  title: string | null;
  instructions: string | null;
  isRequired: boolean;
  lessonId: string | null;
  lesson: ItemLesson | null;
};

type AssignmentData = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  userId: string;
  items: AssignmentItem[];
};

interface Props {
  assignment: AssignmentData;
  availableLessons: { id: string; moduleTitle: string; translations: { locale: string; title: string }[] }[];
  locale: string;
}

function ItemRow({
  item,
  locale,
  isFirst,
  isLast,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  item: AssignmentItem;
  locale: string;
  isFirst: boolean;
  isLast: boolean;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const title =
    item.title ??
    item.lesson?.translations.find((t) => t.locale === locale)?.title ??
    item.lesson?.translations[0]?.title ??
    "—";

  return (
    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border last:border-0 bg-background hover:bg-muted/30 group">
      <div className="shrink-0 text-muted-foreground">
        {item.isRequired ? (
          <CheckCircle2 className="h-4 w-4 text-primary" />
        ) : (
          <Circle className="h-4 w-4" />
        )}
      </div>
      <span className="flex-1 text-sm truncate">{title}</span>
      <Badge variant="outline" className="text-xs shrink-0">
        {item.type}
      </Badge>
      {!item.isRequired && (
        <Badge variant="secondary" className="text-xs shrink-0">
          İsteğe bağlı
        </Badge>
      )}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={isFirst} onClick={onMoveUp}>
          <ChevronUp className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={isLast} onClick={onMoveDown}>
          <ChevronDown className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-danger hover:text-danger" onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function AddItemForm({
  assignmentId,
  availableLessons,
  locale,
  onAdded,
}: {
  assignmentId: string;
  availableLessons: Props["availableLessons"];
  locale: string;
  onAdded: (item: AssignmentItem) => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    type: "LESSON",
    lessonId: "",
    title: "",
    instructions: "",
    isRequired: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const item = await addAssignmentItem(assignmentId, {
        type: form.type,
        lessonId: form.type === "LESSON" ? form.lessonId || undefined : undefined,
        title: form.type === "TASK" ? form.title || undefined : undefined,
        instructions: form.instructions || undefined,
        isRequired: form.isRequired,
      });
      onAdded(item as AssignmentItem);
      setForm({ type: "LESSON", lessonId: "", title: "", instructions: "", isRequired: true });
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-primary hover:bg-primary/5 transition-colors"
      >
        <Plus className="h-3.5 w-3.5" />
        Madde Ekle
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-3 border-t border-border bg-muted/30">
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Tür</Label>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="w-full h-8 rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="LESSON">LESSON</option>
            <option value="TASK">TASK</option>
          </select>
        </div>
        <div className="flex items-end pb-0.5">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.isRequired}
              onChange={(e) => setForm({ ...form, isRequired: e.target.checked })}
              className="rounded"
            />
            Zorunlu
          </label>
        </div>
      </div>
      {form.type === "LESSON" ? (
        <div className="space-y-1">
          <Label className="text-xs">Ders</Label>
          <select
            value={form.lessonId}
            onChange={(e) => setForm({ ...form, lessonId: e.target.value })}
            required
            className="w-full h-8 rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="">Seçin...</option>
            {availableLessons.map((l) => {
              const title = l.translations.find((t) => t.locale === locale)?.title ?? l.translations[0]?.title;
              return (
                <option key={l.id} value={l.id}>
                  [{l.moduleTitle}] {title}
                </option>
              );
            })}
          </select>
        </div>
      ) : (
        <div className="space-y-1">
          <Label className="text-xs">Başlık</Label>
          <Input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="h-8 text-sm"
            required
          />
        </div>
      )}
      <div className="space-y-1">
        <Label className="text-xs">Talimatlar (isteğe bağlı)</Label>
        <Input
          value={form.instructions}
          onChange={(e) => setForm({ ...form, instructions: e.target.value })}
          className="h-8 text-sm"
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? "..." : "Ekle"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          İptal
        </Button>
      </div>
    </form>
  );
}

export function AssignmentEditor({ assignment, availableLessons, locale }: Props) {
  const t = useTranslations("admin");
  const [items, setItems] = useState<AssignmentItem[]>(assignment.items);
  const [title, setTitle] = useState(assignment.title);
  const [description, setDescription] = useState(assignment.description ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateAssignment(assignment.id, { title, description: description || undefined });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm("Bu maddeyi silmek istediğinize emin misiniz?")) return;
    await deleteAssignmentItem(itemId);
    setItems(items.filter((i) => i.id !== itemId));
  };

  const handleMove = async (index: number, direction: "up" | "down") => {
    const newItems = [...items];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    [newItems[index], newItems[swapIndex]] = [newItems[swapIndex], newItems[index]];
    setItems(newItems);
    await reorderAssignmentItems(assignment.id, newItems.map((i) => i.id));
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Basic info */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <Label>{t("assignmentTitle")}</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t("assignmentDesc")}</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="flex items-center gap-3">
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "..." : t("saveSettings")}
            </Button>
            {saved && <span className="text-sm text-success">{t("settingsSaved")}</span>}
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Maddeler ({items.length})</h3>
        <Card>
          {items.map((item, index) => (
            <ItemRow
              key={item.id}
              item={item}
              locale={locale}
              isFirst={index === 0}
              isLast={index === items.length - 1}
              onDelete={() => handleDelete(item.id)}
              onMoveUp={() => handleMove(index, "up")}
              onMoveDown={() => handleMove(index, "down")}
            />
          ))}
          <AddItemForm
            assignmentId={assignment.id}
            availableLessons={availableLessons}
            locale={locale}
            onAdded={(item) => setItems([...items, item])}
          />
        </Card>
      </div>
    </div>
  );
}
