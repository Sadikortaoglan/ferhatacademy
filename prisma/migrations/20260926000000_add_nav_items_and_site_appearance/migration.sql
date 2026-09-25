-- CreateTable
CREATE TABLE "site_appearances" (
    "id" TEXT NOT NULL,
    "themePreset" TEXT NOT NULL DEFAULT 'signature',
    "colorPrimary" TEXT NOT NULL DEFAULT '#f97316',
    "colorPrimaryForeground" TEXT NOT NULL DEFAULT '#ffffff',
    "colorAccent" TEXT NOT NULL DEFAULT '#f97316',
    "colorBackground" TEXT NOT NULL DEFAULT '#0f0e0d',
    "colorSurface" TEXT NOT NULL DEFAULT '#1c1a18',
    "colorForeground" TEXT NOT NULL DEFAULT '#f2ede5',
    "colorMuted" TEXT NOT NULL DEFAULT '#252320',
    "colorMutedForeground" TEXT NOT NULL DEFAULT '#8c8580',
    "colorBorder" TEXT NOT NULL DEFAULT '#2e2c29',
    "colorSuccess" TEXT NOT NULL DEFAULT '#22c55e',
    "colorWarning" TEXT NOT NULL DEFAULT '#f59e0b',
    "colorDanger" TEXT NOT NULL DEFAULT '#ef4444',
    "radiusPreset" TEXT NOT NULL DEFAULT 'none',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_appearances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nav_items" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "labelTr" TEXT NOT NULL,
    "labelEn" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "showInNavbar" BOOLEAN NOT NULL DEFAULT true,
    "showInFooter" BOOLEAN NOT NULL DEFAULT false,
    "openInNewTab" BOOLEAN NOT NULL DEFAULT false,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nav_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "nav_items_key_key" ON "nav_items"("key");
