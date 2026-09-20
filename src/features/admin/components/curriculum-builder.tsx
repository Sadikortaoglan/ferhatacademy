"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";

function ConfirmDialog({
  open,
  title,
  description,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-surface border border-border rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4 space-y-4">
        <div className="space-y-1.5">
          <h3 className="font-bold text-base">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-border hover:bg-muted transition-colors"
          >
            İptal
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-danger text-white hover:bg-danger/90 transition-colors"
          >
            Evet, Sil
          </button>
        </div>
      </div>
    </div>
  );
}
import {
  createModule,
  deleteModule,
  reorderModules,
  createLesson,
  updateLesson,
  deleteLesson,
  reorderLessons,
} from "@/features/admin/actions/courses";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  ChevronUp,
  ChevronDown,
  Trash2,
  Plus,
  PlayCircle,
  FileText,
  Pencil,
  X,
} from "lucide-react";

type Translation = { locale: string; title: string };

interface LessonData {
  id: string;
  type: string;
  position: number;
  visibility: string;
  isPreview: boolean;
  videoProvider: string | null;
  videoExternalId: string | null;
  durationSeconds: number | null;
  translations: (Translation & { description?: string | null })[];
}

interface ModuleData {
  id: string;
  position: number;
  translations: Translation[];
  lessons: LessonData[];
}

interface CourseData {
  id: string;
  modules: ModuleData[];
}

interface Props {
  course: CourseData;
  locale: string;
}

function EditLessonForm({
  lesson,
  onSaved,
  onCancel,
}: {
  lesson: LessonData;
  onSaved: (updated: LessonData) => void;
  onCancel: () => void;
}) {
  const t = useTranslations("admin");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    titleTr: lesson.translations.find((tr) => tr.locale === "tr")?.title ?? "",
    titleEn: lesson.translations.find((tr) => tr.locale === "en")?.title ?? "",
    type: lesson.type,
    visibility: lesson.visibility,
    isPreview: lesson.isPreview,
    videoProvider: lesson.videoProvider ?? "YOUTUBE",
    videoExternalId: lesson.videoExternalId ?? "",
    durationSeconds: lesson.durationSeconds ? String(lesson.durationSeconds) : "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateLesson(lesson.id, {
        ...form,
        type: form.type as "VIDEO" | "TEXT",
        visibility: form.visibility as "PUBLIC" | "REGISTERED" | "ENTITLED" | "PRIVATE",
        videoProvider: form.type === "VIDEO" && form.videoExternalId ? form.videoProvider as "YOUTUBE" | "VIMEO" | "BUNNY" | "EXTERNAL" : undefined,
        videoExternalId: form.type === "VIDEO" ? form.videoExternalId : undefined,
        durationSeconds: form.durationSeconds ? parseInt(form.durationSeconds) : undefined,
      });
      const updated: LessonData = {
        ...lesson,
        type: form.type,
        visibility: form.visibility,
        isPreview: form.isPreview,
        videoProvider: form.type === "VIDEO" ? form.videoProvider : null,
        videoExternalId: form.type === "VIDEO" ? form.videoExternalId : null,
        translations: [
          { locale: "tr", title: form.titleTr },
          { locale: "en", title: form.titleEn },
        ],
      };
      onSaved(updated);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-3 bg-muted/30 border-b border-border">
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">{t("titleTr")}</Label>
          <Input value={form.titleTr} onChange={(e) => setForm({ ...form, titleTr: e.target.value })} className="h-8 text-sm" required />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{t("titleEn")}</Label>
          <Input value={form.titleEn} onChange={(e) => setForm({ ...form, titleEn: e.target.value })} className="h-8 text-sm" required />
        </div>
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">{t("lessonType")}</Label>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full h-8 rounded-md border border-input bg-background px-2 text-sm">
            <option value="VIDEO">{t("typeVideo")}</option>
            <option value="TEXT">{t("typeText")}</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{t("visibility")}</Label>
          <select value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value })} className="w-full h-8 rounded-md border border-input bg-background px-2 text-sm">
            <option value="PUBLIC">{t("visPublic")}</option>
            <option value="REGISTERED">{t("visRegistered")}</option>
            <option value="ENTITLED">{t("visEntitled")}</option>
            <option value="PRIVATE">{t("visPrivate")}</option>
          </select>
        </div>
        <div className="flex items-end gap-2 pb-1">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.isPreview} onChange={(e) => setForm({ ...form, isPreview: e.target.checked })} className="rounded" />
            {t("isPreview")}
          </label>
        </div>
      </div>
      {form.type === "VIDEO" && (
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">{t("videoProvider")}</Label>
            <select value={form.videoProvider} onChange={(e) => setForm({ ...form, videoProvider: e.target.value })} className="w-full h-8 rounded-md border border-input bg-background px-2 text-sm">
              <option value="YOUTUBE">YouTube</option>
              <option value="VIMEO">Vimeo</option>
              <option value="BUNNY">Bunny</option>
              <option value="EXTERNAL">External</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t("videoId")}</Label>
            <Input value={form.videoExternalId} onChange={(e) => setForm({ ...form, videoExternalId: e.target.value })} className="h-8 text-sm" placeholder="dQw4w9WgXcQ" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Süre (sn)</Label>
            <Input type="number" value={form.durationSeconds} onChange={(e) => setForm({ ...form, durationSeconds: e.target.value })} className="h-8 text-sm" placeholder="600" />
          </div>
        </div>
      )}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={loading}>{loading ? "..." : t("saveSettings")}</Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}><X className="h-3.5 w-3.5" /></Button>
      </div>
    </form>
  );
}

function LessonRow({
  lesson,
  locale,
  moduleId,
  isFirst,
  isLast,
  onDelete,
  onMoveUp,
  onMoveDown,
  onUpdated,
}: {
  lesson: LessonData;
  locale: string;
  moduleId: string;
  isFirst: boolean;
  isLast: boolean;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onUpdated: (updated: LessonData) => void;
}) {
  const t = useTranslations("admin");
  const [editing, setEditing] = useState(false);
  const title =
    lesson.translations.find((tr) => tr.locale === locale)?.title ??
    lesson.translations[0]?.title ??
    "—";

  if (editing) {
    return (
      <EditLessonForm
        lesson={lesson}
        onSaved={(updated) => { onUpdated(updated); setEditing(false); }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border last:border-0 bg-background hover:bg-muted/30 transition-colors group">
      <div className="shrink-0 text-muted-foreground">
        {lesson.type === "TEXT" ? (
          <FileText className="h-4 w-4" />
        ) : (
          <PlayCircle className="h-4 w-4" />
        )}
      </div>
      <span className="flex-1 text-sm truncate">{title}</span>
      {lesson.isPreview && (
        <Badge variant="secondary" className="text-xs shrink-0">
          {t("isPreview")}
        </Badge>
      )}
      <Badge variant="outline" className="text-xs shrink-0">
        {{ PUBLIC: t("visPublic"), REGISTERED: t("visRegistered"), ENTITLED: t("visEntitled"), PRIVATE: t("visPrivate") }[lesson.visibility] ?? lesson.visibility}
      </Badge>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setEditing(true)}
          title={t("edit")}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          disabled={isFirst}
          onClick={onMoveUp}
        >
          <ChevronUp className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          disabled={isLast}
          onClick={onMoveDown}
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-danger hover:text-danger"
          onClick={onDelete}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function AddLessonForm({
  moduleId,
  onAdded,
}: {
  moduleId: string;
  onAdded: (lesson: LessonData) => void;
}) {
  const t = useTranslations("admin");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    titleTr: "",
    titleEn: "",
    type: "VIDEO",
    visibility: "ENTITLED",
    isPreview: false,
    videoProvider: "YOUTUBE",
    videoExternalId: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const lesson = await createLesson(moduleId, {
        ...form,
        videoProvider: form.type === "VIDEO" && form.videoExternalId ? form.videoProvider : undefined,
        videoExternalId: form.type === "VIDEO" ? form.videoExternalId : undefined,
      });
      onAdded(lesson as LessonData);
      setForm({
        titleTr: "",
        titleEn: "",
        type: "VIDEO",
        visibility: "ENTITLED",
        isPreview: false,
        videoProvider: "YOUTUBE",
        videoExternalId: "",
      });
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
        {t("addLesson")}
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-3 border-t border-border bg-muted/30">
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">{t("titleTr")}</Label>
          <Input
            value={form.titleTr}
            onChange={(e) => setForm({ ...form, titleTr: e.target.value })}
            className="h-8 text-sm"
            required
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{t("titleEn")}</Label>
          <Input
            value={form.titleEn}
            onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
            className="h-8 text-sm"
            required
          />
        </div>
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">{t("lessonType")}</Label>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="w-full h-8 rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="VIDEO">{t("typeVideo")}</option>
            <option value="TEXT">{t("typeText")}</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{t("visibility")}</Label>
          <select
            value={form.visibility}
            onChange={(e) => setForm({ ...form, visibility: e.target.value })}
            className="w-full h-8 rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="PUBLIC">{t("visPublic")}</option>
            <option value="REGISTERED">{t("visRegistered")}</option>
            <option value="ENTITLED">{t("visEntitled")}</option>
            <option value="PRIVATE">{t("visPrivate")}</option>
          </select>
        </div>
        <div className="flex items-end gap-2 pb-0.5">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.isPreview}
              onChange={(e) => setForm({ ...form, isPreview: e.target.checked })}
              className="rounded"
            />
            {t("isPreview")}
          </label>
        </div>
      </div>
      {form.type === "VIDEO" && (
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">{t("videoProvider")}</Label>
            <select
              value={form.videoProvider}
              onChange={(e) => setForm({ ...form, videoProvider: e.target.value })}
              className="w-full h-8 rounded-md border border-input bg-background px-2 text-sm"
            >
              <option value="YOUTUBE">YouTube</option>
              <option value="VIMEO">Vimeo</option>
              <option value="BUNNY">Bunny</option>
              <option value="EXTERNAL">External</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t("videoId")}</Label>
            <Input
              value={form.videoExternalId}
              onChange={(e) => setForm({ ...form, videoExternalId: e.target.value })}
              className="h-8 text-sm"
              placeholder="dQw4w9WgXcQ"
            />
          </div>
        </div>
      )}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? "..." : t("addLesson")}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          İptal
        </Button>
      </div>
    </form>
  );
}

export function CurriculumBuilder({ course, locale }: Props) {
  const t = useTranslations("admin");
  const [modules, setModules] = useState<ModuleData[]>(course.modules);
  const [newModuleTitleTr, setNewModuleTitleTr] = useState("");
  const [newModuleTitleEn, setNewModuleTitleEn] = useState("");
  const [addingModule, setAddingModule] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => Promise<void>;
  }>({ open: false, title: "", description: "", onConfirm: async () => {} });

  const askConfirm = (title: string, description: string, onConfirm: () => Promise<void>) => {
    setConfirmDialog({ open: true, title, description, onConfirm });
  };

  const handleAddModule = async () => {
    if (!newModuleTitleTr) return;
    setLoading(true);
    try {
      const mod = await createModule(course.id, {
        titleTr: newModuleTitleTr,
        titleEn: newModuleTitleEn || newModuleTitleTr,
      });
      setModules([...modules, { ...mod, lessons: [] }]);
      setNewModuleTitleTr("");
      setNewModuleTitleEn("");
      setAddingModule(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteModule = (moduleId: string, modTitle: string) => {
    askConfirm(
      "Modülü sil",
      `"${modTitle}" modülü ve içindeki tüm dersler kalıcı olarak silinecek. Devam etmek istiyor musun?`,
      async () => {
        await deleteModule(moduleId);
        setModules((prev) => prev.filter((m) => m.id !== moduleId));
      }
    );
  };

  const handleMoveModule = async (index: number, direction: "up" | "down") => {
    const newModules = [...modules];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    [newModules[index], newModules[swapIndex]] = [newModules[swapIndex], newModules[index]];
    setModules(newModules);
    await reorderModules(course.id, newModules.map((m) => m.id));
  };

  const handleDeleteLesson = (moduleId: string, lessonId: string, lessonTitle: string) => {
    askConfirm(
      "Dersi sil",
      `"${lessonTitle}" dersi kalıcı olarak silinecek. Devam etmek istiyor musun?`,
      async () => {
        await deleteLesson(lessonId);
        setModules((prev) =>
          prev.map((m) =>
            m.id === moduleId ? { ...m, lessons: m.lessons.filter((l) => l.id !== lessonId) } : m
          )
        );
      }
    );
  };

  const handleMoveLesson = async (
    moduleId: string,
    index: number,
    direction: "up" | "down"
  ) => {
    const mod = modules.find((m) => m.id === moduleId)!;
    const newLessons = [...mod.lessons];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    [newLessons[index], newLessons[swapIndex]] = [newLessons[swapIndex], newLessons[index]];
    setModules(
      modules.map((m) => (m.id === moduleId ? { ...m, lessons: newLessons } : m))
    );
    await reorderLessons(moduleId, newLessons.map((l) => l.id));
  };

  return (
    <>
    <ConfirmDialog
      open={confirmDialog.open}
      title={confirmDialog.title}
      description={confirmDialog.description}
      onConfirm={async () => {
        await confirmDialog.onConfirm();
        setConfirmDialog((prev) => ({ ...prev, open: false }));
      }}
      onCancel={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
    />
    <div className="space-y-3">
      {modules.map((mod, modIndex) => {
        const modTitle =
          mod.translations.find((tr) => tr.locale === locale)?.title ??
          mod.translations[0]?.title ??
          "—";
        return (
          <Card key={mod.id}>
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/50">
              <span className="font-medium text-sm flex-1">{modTitle}</span>
              <span className="text-xs text-muted-foreground">
                {mod.lessons.length} ders
              </span>
              <div className="flex items-center gap-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={modIndex === 0}
                  onClick={() => handleMoveModule(modIndex, "up")}
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={modIndex === modules.length - 1}
                  onClick={() => handleMoveModule(modIndex, "down")}
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-danger hover:text-danger"
                  onClick={() => handleDeleteModule(mod.id, modTitle)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <div>
              {mod.lessons.map((lesson, lessonIndex) => {
                const lessonTitle = lesson.translations.find((tr) => tr.locale === locale)?.title ?? lesson.translations[0]?.title ?? "—";
                return (
                <LessonRow
                  key={lesson.id}
                  lesson={lesson}
                  locale={locale}
                  moduleId={mod.id}
                  isFirst={lessonIndex === 0}
                  isLast={lessonIndex === mod.lessons.length - 1}
                  onDelete={() => handleDeleteLesson(mod.id, lesson.id, lessonTitle)}
                  onMoveUp={() => handleMoveLesson(mod.id, lessonIndex, "up")}
                  onMoveDown={() => handleMoveLesson(mod.id, lessonIndex, "down")}
                  onUpdated={(updated) =>
                    setModules(
                      modules.map((m) =>
                        m.id === mod.id
                          ? { ...m, lessons: m.lessons.map((l) => (l.id === updated.id ? updated : l)) }
                          : m
                      )
                    )
                  }
                />
                );
              })}
              <AddLessonForm
                moduleId={mod.id}
                onAdded={(lesson) =>
                  setModules(
                    modules.map((m) =>
                      m.id === mod.id ? { ...m, lessons: [...m.lessons, lesson] } : m
                    )
                  )
                }
              />
            </div>
          </Card>
        );
      })}

      {/* Add Module */}
      {addingModule ? (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">{t("titleTr")}</Label>
                <Input
                  value={newModuleTitleTr}
                  onChange={(e) => setNewModuleTitleTr(e.target.value)}
                  placeholder="Modül Başlığı"
                  className="h-8 text-sm"
                  autoFocus
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("titleEn")}</Label>
                <Input
                  value={newModuleTitleEn}
                  onChange={(e) => setNewModuleTitleEn(e.target.value)}
                  placeholder="Module Title"
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddModule} disabled={loading || !newModuleTitleTr}>
                {loading ? "..." : t("addModule")}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setAddingModule(false)}>
                İptal
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setAddingModule(true)}
        >
          <Plus className="h-4 w-4" />
          {t("addModule")}
        </Button>
      )}
    </div>
    </>
  );
}
