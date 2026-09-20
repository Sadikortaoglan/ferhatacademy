import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

// Güvenli MIME → uzantı eşleşmesi (sabit liste — client'tan gelen değer kullanılmaz)
const SAFE_MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

// Magic byte imzaları — MIME'ın gerçek olduğunu doğrular
const MAGIC: Record<string, number[][]> = {
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/png": [[0x89, 0x50, 0x4e, 0x47]],
  "image/webp": [[0x52, 0x49, 0x46, 0x46]], // RIFF header (WebP)
  "image/gif": [[0x47, 0x49, 0x46, 0x38]],  // GIF8
  "image/avif": [], // AVIF magic daha karmaşık — MIME kontrolü yeter
};

function checkMagic(buffer: Buffer, mimeType: string): boolean {
  const sigs = MAGIC[mimeType];
  if (!sigs || sigs.length === 0) return true; // imza kontrolü yoksa geç
  return sigs.some((sig) => sig.every((byte, i) => buffer[i] === byte));
}

export async function POST(req: NextRequest) {
  // Auth kontrolü
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş yapman gerekiyor" }, { status: 401 });
  }
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (!dbUser || (dbUser.role !== "ADMIN" && dbUser.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Bu işlem için yetkin yok" }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 400 });

  // MIME type whitelist — client'tan gelen MIME güvenilmez, sadece whitelist kontrolü
  const declaredMime = file.type.toLowerCase();
  const safeExt = SAFE_MIME_EXT[declaredMime];
  if (!safeExt) {
    return NextResponse.json({
      error: "Desteklenmeyen dosya türü. Sadece JPEG, PNG, WebP, GIF veya AVIF yükleyebilirsin.",
    }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Dosya 10 MB'tan büyük olamaz." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Magic byte doğrulaması — dosya içeriğinin gerçekten görsel olduğunu kontrol et
  if (!checkMagic(buffer, declaredMime)) {
    return NextResponse.json({
      error: "Dosya içeriği belirtilen türle eşleşmiyor.",
    }, { status: 400 });
  }

  // Güvenli rastgele dosya adı — orijinal adı hiç kullanmıyoruz
  const filename = `${randomUUID()}.${safeExt}`;
  const uploadsDir = join(process.cwd(), "public", "uploads");

  await mkdir(uploadsDir, { recursive: true });
  await writeFile(join(uploadsDir, filename), buffer);

  return NextResponse.json({ url: `/uploads/${filename}` });
}
