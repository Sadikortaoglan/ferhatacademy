-- Refactor site_appearances: drop individual color columns, use JSON overrides
-- Add page_appearance_overrides table

-- Drop old columns and add new ones on site_appearances
ALTER TABLE "site_appearances" DROP COLUMN IF EXISTS "themePreset";
ALTER TABLE "site_appearances" DROP COLUMN IF EXISTS "colorPrimary";
ALTER TABLE "site_appearances" DROP COLUMN IF EXISTS "colorPrimaryForeground";
ALTER TABLE "site_appearances" DROP COLUMN IF EXISTS "colorAccent";
ALTER TABLE "site_appearances" DROP COLUMN IF EXISTS "colorBackground";
ALTER TABLE "site_appearances" DROP COLUMN IF EXISTS "colorSurface";
ALTER TABLE "site_appearances" DROP COLUMN IF EXISTS "colorForeground";
ALTER TABLE "site_appearances" DROP COLUMN IF EXISTS "colorMuted";
ALTER TABLE "site_appearances" DROP COLUMN IF EXISTS "colorMutedForeground";
ALTER TABLE "site_appearances" DROP COLUMN IF EXISTS "colorBorder";
ALTER TABLE "site_appearances" DROP COLUMN IF EXISTS "colorSuccess";
ALTER TABLE "site_appearances" DROP COLUMN IF EXISTS "colorWarning";
ALTER TABLE "site_appearances" DROP COLUMN IF EXISTS "colorDanger";
ALTER TABLE "site_appearances" DROP COLUMN IF EXISTS "radiusPreset";

ALTER TABLE "site_appearances" ADD COLUMN IF NOT EXISTS "activeTheme" TEXT NOT NULL DEFAULT 'signature';
ALTER TABLE "site_appearances" ADD COLUMN IF NOT EXISTS "globalOverrides" JSONB NOT NULL DEFAULT '{}';

-- Create page_appearance_overrides table
CREATE TABLE IF NOT EXISTS "page_appearance_overrides" (
    "id" TEXT NOT NULL,
    "pageKey" TEXT NOT NULL,
    "overrides" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedById" TEXT,
    CONSTRAINT "page_appearance_overrides_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "page_appearance_overrides_pageKey_key" ON "page_appearance_overrides"("pageKey");

ALTER TABLE "page_appearance_overrides"
    ADD CONSTRAINT "page_appearance_overrides_updatedById_fkey"
    FOREIGN KEY ("updatedById") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
    NOT VALID;
