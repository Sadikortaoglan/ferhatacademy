"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { archiveTemplate, duplicateTemplate } from "./actions";

interface Props {
  locale: string;
  templateId: string;
  archived: boolean;
  usedByCount: number;
  applicationCount: number;
}

export function TemplateListActions({ locale, templateId, archived, usedByCount, applicationCount }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDuplicate() {
    startTransition(async () => {
      const copy = await duplicateTemplate(locale, templateId);
      router.push(`/${locale}/admin/applications/templates/${copy.id}`);
    });
  }

  function handleArchive() {
    if (usedByCount > 0) {
      alert(`Bu şablon ${usedByCount} programda kullanılıyor. Arşivlemeden önce bu programlarda başka bir şablon seçin.`);
      return;
    }
    if (applicationCount > 0 && !confirm(`Bu şablona ait ${applicationCount} başvuru var. Geçmiş başvurular korunur. Arşivlemek istediğinize emin misiniz?`)) return;
    if (!confirm("Bu şablonu arşivlemek istiyor musunuz? Artık yeni başvurularda görünmeyecek.")) return;
    startTransition(async () => {
      await archiveTemplate(locale, templateId);
      router.refresh();
    });
  }

  return (
    <>
      <button
        onClick={handleDuplicate}
        disabled={isPending}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
      >
        Kopyala
      </button>
      {!archived && (
        <button
          onClick={handleArchive}
          disabled={isPending}
          className="text-xs text-danger hover:text-danger/80 transition-colors disabled:opacity-50"
        >
          Arşivle
        </button>
      )}
    </>
  );
}
