"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { publishProduct, archiveProduct } from "@/features/commerce/actions/products";
import { archiveProductById, deleteProductById } from "@/app/[locale]/admin/products/[productId]/actions";

export function PublishProductButton({ productId }: { productId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const handle = async () => {
    setLoading(true);
    try { await publishProduct(productId); router.refresh(); }
    finally { setLoading(false); }
  };
  return <Button onClick={handle} disabled={loading}>{loading ? "..." : "Yayınla"}</Button>;
}

export function ArchiveProductButton({ productId }: { productId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const handle = async () => {
    setLoading(true);
    try { await archiveProduct(productId); router.refresh(); }
    finally { setLoading(false); }
  };
  return <Button variant="outline" onClick={handle} disabled={loading}>{loading ? "..." : "Arşivle"}</Button>;
}

export function ProductStatusActions({
  locale,
  productId,
  productStatus,
}: {
  locale: string;
  productId: string;
  productStatus: string;
}) {
  const router = useRouter();
  const [archiving, setArchiving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleArchive() {
    setArchiving(true);
    setError(null);
    try {
      await archiveProductById(locale, productId);
      router.refresh();
    } finally {
      setArchiving(false);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      const result = await deleteProductById(locale, productId);
      if (result && !result.ok) {
        setError(result.reason);
        setConfirmDelete(false);
      }
      // On success, deleteProductById redirects — nothing to do here
    } catch {
      setError("Silme işlemi başarısız.");
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {productStatus === "DRAFT" && (
          <Button onClick={() => { void (async () => { await publishProduct(productId); router.refresh(); })(); }}>
            Yayınla
          </Button>
        )}
        {productStatus !== "ARCHIVED" && (
          <Button variant="outline" onClick={handleArchive} disabled={archiving}>
            {archiving ? "..." : "Arşivle"}
          </Button>
        )}
        {productStatus === "ARCHIVED" && (
          <Button
            variant="outline"
            className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Siliniyor..." : confirmDelete ? "Emin misin? Tekrar tıkla." : "Kalıcı Olarak Sil"}
          </Button>
        )}
      </div>
      {confirmDelete && !deleting && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Bu işlem geri alınamaz. Silmek için tekrar tıkla, vazgeçmek için başka bir yere tıkla.
        </p>
      )}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
