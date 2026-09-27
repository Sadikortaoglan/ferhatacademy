-- AlterEnum: add APPOINTMENT_REQUEST to AdminNotificationType
ALTER TYPE "AdminNotificationType" ADD VALUE 'APPOINTMENT_REQUEST';

-- AlterEnum: add audit actions
ALTER TYPE "AuditAction" ADD VALUE 'APPOINTMENT_REQUEST_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'APPOINTMENT_STATUS_UPDATED';

-- CreateEnum: AppointmentStatus
CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED', 'COMPLETED', 'CANCELLED');

-- CreateTable: appointment_types
CREATE TABLE "appointment_types" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "nameTr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "descTr" TEXT,
    "descEn" TEXT,
    "durationMinutes" INTEGER,
    "isFree" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointment_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable: appointment_requests
CREATE TABLE "appointment_requests" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'tr',
    "typeId" TEXT NOT NULL,
    "preferredDate" TIMESTAMP(3),
    "preferredTimeRange" TEXT,
    "note" TEXT,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'PENDING',
    "sourcePage" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmContent" TEXT,
    "utmTerm" TEXT,
    "adminNote" TEXT,
    "productId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointment_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "appointment_types_key_key" ON "appointment_types"("key");

-- AddForeignKey
ALTER TABLE "appointment_requests" ADD CONSTRAINT "appointment_requests_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "appointment_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_requests" ADD CONSTRAINT "appointment_requests_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed default appointment types
INSERT INTO "appointment_types" ("id", "key", "nameTr", "nameEn", "descTr", "descEn", "durationMinutes", "isFree", "active", "position", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'on-gorusme', 'Ücretsiz Ön Görüşme', 'Free Discovery Call', '15 dakikalık kısa tanışma ve ihtiyaç değerlendirme görüşmesi.', '15-minute discovery and needs assessment call.', 15, true, true, 0, NOW()),
  (gen_random_uuid()::text, 'mentorship-bilgi', 'Mentörlük Bilgi Görüşmesi', 'Mentorship Info Call', 'Mentörlük programı hakkında detaylı bilgi alma görüşmesi.', 'Detailed information call about the mentorship program.', 30, true, true, 1, NOW()),
  (gen_random_uuid()::text, 'danismanlik-bilgi', 'Danışmanlık Bilgi Görüşmesi', 'Consultation Info Call', 'Danışmanlık hizmetleri hakkında bilgi alma görüşmesi.', 'Information call about consultation services.', 20, true, true, 2, NOW());
