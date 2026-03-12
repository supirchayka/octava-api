ALTER TABLE "Service"
ADD COLUMN "serviceCode" VARCHAR(255) NOT NULL DEFAULT 'АБ123-88';

ALTER TABLE "ServicePriceExtended"
ADD COLUMN "serviceCode" VARCHAR(255) NOT NULL DEFAULT 'АБ123-88';

ALTER TABLE "ServiceSpecialist"
ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "ServiceSpecialist_specialistId_sortOrder_idx"
ON "ServiceSpecialist"("specialistId", "sortOrder");
