-- Explicitly mark home hero media variants while preserving the existing order convention.
CREATE TYPE "HomeHeroMediaVariant" AS ENUM ('DESKTOP', 'MOBILE');

ALTER TABLE "HomeGalleryImage"
ADD COLUMN "heroVariant" "HomeHeroMediaVariant";

UPDATE "HomeGalleryImage"
SET "heroVariant" = CASE
  WHEN "order" = 1 THEN 'MOBILE'::"HomeHeroMediaVariant"
  ELSE 'DESKTOP'::"HomeHeroMediaVariant"
END
WHERE "purpose" = 'HERO';

CREATE INDEX "HomeGalleryImage_homePageId_purpose_heroVariant_idx"
ON "HomeGalleryImage"("homePageId", "purpose", "heroVariant");
