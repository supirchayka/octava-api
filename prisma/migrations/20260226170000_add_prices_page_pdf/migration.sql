ALTER TYPE "StaticPageType" ADD VALUE 'PRICES';

CREATE TABLE "PricesPage" (
    "id" INTEGER NOT NULL,
    "priceListFileId" INTEGER,

    CONSTRAINT "PricesPage_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "PricesPage" ADD CONSTRAINT "PricesPage_id_fkey" FOREIGN KEY ("id") REFERENCES "StaticPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PricesPage" ADD CONSTRAINT "PricesPage_priceListFileId_fkey" FOREIGN KEY ("priceListFileId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;
