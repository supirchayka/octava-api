-- Migration to switch home directions from services to categories
-- Adds categoryId, backfills it from service links, and drops the old service reference.

-- 1) Add the new nullable column so we can backfill existing rows
ALTER TABLE "HomeDirection" ADD COLUMN IF NOT EXISTS "categoryId" INTEGER;

-- 2) Populate categoryId using the current service relations
UPDATE "HomeDirection" hd
SET "categoryId" = s."categoryId"
FROM "Service" s
WHERE hd."serviceId" = s."id" AND hd."categoryId" IS NULL;

-- 3) Enforce the new foreign key and non-null constraint
ALTER TABLE "HomeDirection"
  ADD CONSTRAINT IF NOT EXISTS "HomeDirection_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "ServiceCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HomeDirection" ALTER COLUMN "categoryId" SET NOT NULL;

-- 4) Drop the obsolete serviceId column and its constraint
ALTER TABLE "HomeDirection" DROP CONSTRAINT IF EXISTS "HomeDirection_serviceId_fkey";
ALTER TABLE "HomeDirection" DROP COLUMN IF EXISTS "serviceId";
