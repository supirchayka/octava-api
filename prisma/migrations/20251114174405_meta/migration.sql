-- AlterTable
ALTER TABLE "SeoCategory" ALTER COLUMN "metaTitle" DROP NOT NULL,
ALTER COLUMN "metaDescription" DROP NOT NULL;

-- AlterTable
ALTER TABLE "SeoDevice" ALTER COLUMN "metaTitle" DROP NOT NULL,
ALTER COLUMN "metaDescription" DROP NOT NULL;

-- AlterTable
ALTER TABLE "SeoService" ALTER COLUMN "metaTitle" DROP NOT NULL,
ALTER COLUMN "metaDescription" DROP NOT NULL;

-- AlterTable
ALTER TABLE "SeoStaticPage" ALTER COLUMN "metaTitle" DROP NOT NULL,
ALTER COLUMN "metaDescription" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Service" ALTER COLUMN "shortOffer" DROP NOT NULL;
