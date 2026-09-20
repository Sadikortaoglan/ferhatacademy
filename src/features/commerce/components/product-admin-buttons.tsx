"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { publishProduct, archiveProduct } from "@/features/commerce/actions/products";

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
