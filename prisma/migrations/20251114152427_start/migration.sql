-- CreateEnum
CREATE TYPE "Storage" AS ENUM ('LOCAL', 'S3');

-- CreateEnum
CREATE TYPE "FileKind" AS ENUM ('IMAGE', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "StaticPageType" AS ENUM ('HOME', 'ABOUT', 'CONTACTS', 'ORG_INFO', 'PERSONAL_DATA_POLICY', 'PRIVACY_POLICY');

-- CreateEnum
CREATE TYPE "TrustItemKind" AS ENUM ('LICENSE', 'CERTIFICATE', 'AWARD', 'ATTESTATION');

-- CreateEnum
CREATE TYPE "DayGroup" AS ENUM ('WEEKDAYS', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "ImagePurpose" AS ENUM ('HERO', 'GALLERY', 'INLINE');

-- CreateEnum
CREATE TYPE "LeadSourceType" AS ENUM ('HOME', 'CONTACTS', 'SERVICE', 'DEVICE', 'OTHER');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'DONE');

-- CreateEnum
CREATE TYPE "PhoneType" AS ENUM ('MAIN', 'RECEPTION', 'OTHER');

-- CreateEnum
CREATE TYPE "OrgDocType" AS ENUM ('PRIVACY_POLICY', 'USER_AGREEMENT', 'BOOKING_RULES', 'PDN_CONSENT_SAMPLE', 'MED_CONSENT_SAMPLE', 'AD_DISCLOSURE', 'OTHER');

-- CreateEnum
CREATE TYPE "DeviceCertType" AS ENUM ('FDA', 'CE', 'ROSZDRAV', 'OTHER');

-- CreateEnum
CREATE TYPE "DeviceDocType" AS ENUM ('CERTIFICATE', 'MANUAL', 'REG_CERT', 'OTHER');

-- CreateEnum
CREATE TYPE "Rarity" AS ENUM ('COMMON', 'UNCOMMON', 'RARE');

-- CreateEnum
CREATE TYPE "ServicePriceType" AS ENUM ('BASE', 'EXTRA', 'PACKAGE');

-- CreateTable
CREATE TABLE "File" (
    "id" SERIAL NOT NULL,
    "storage" "Storage" NOT NULL DEFAULT 'LOCAL',
    "kind" "FileKind" NOT NULL,
    "originalName" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "sha256" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" SERIAL NOT NULL,
    "fullName" TEXT NOT NULL,
    "ogrn" TEXT NOT NULL,
    "inn" TEXT NOT NULL,
    "kpp" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationPhone" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "type" "PhoneType" NOT NULL DEFAULT 'MAIN',
    "number" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "OrganizationPhone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgLicense" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "issuedAt" DATE NOT NULL,
    "issuedBy" TEXT NOT NULL,
    "fileId" INTEGER NOT NULL,

    CONSTRAINT "OrgLicense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgDocument" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "docType" "OrgDocType" NOT NULL,
    "title" TEXT NOT NULL,
    "htmlBody" TEXT NOT NULL,
    "publishedAt" DATE,

    CONSTRAINT "OrgDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgCertificate" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "issuedBy" TEXT,
    "issuedAt" DATE,
    "fileId" INTEGER NOT NULL,

    CONSTRAINT "OrgCertificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaticPage" (
    "id" SERIAL NOT NULL,
    "type" "StaticPageType" NOT NULL,
    "slug" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaticPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomePage" (
    "id" INTEGER NOT NULL,
    "heroTitle" TEXT NOT NULL,
    "heroSubtitle" TEXT NOT NULL,
    "heroCtaText" TEXT NOT NULL,
    "heroCtaUrl" TEXT NOT NULL,
    "subheroTitle" TEXT NOT NULL,
    "subheroSubtitle" TEXT NOT NULL,
    "interiorText" TEXT NOT NULL,

    CONSTRAINT "HomePage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomeDirection" (
    "id" SERIAL NOT NULL,
    "homePageId" INTEGER NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "HomeDirection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomeGalleryImage" (
    "id" SERIAL NOT NULL,
    "homePageId" INTEGER NOT NULL,
    "fileId" INTEGER NOT NULL,
    "purpose" "ImagePurpose" NOT NULL,
    "order" INTEGER NOT NULL,
    "alt" TEXT,
    "caption" TEXT,

    CONSTRAINT "HomeGalleryImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AboutPage" (
    "id" INTEGER NOT NULL,
    "heroTitle" TEXT NOT NULL,
    "heroDescription" TEXT NOT NULL,
    "howWeAchieveText" TEXT NOT NULL,

    CONSTRAINT "AboutPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AboutTrustItem" (
    "id" SERIAL NOT NULL,
    "aboutPageId" INTEGER NOT NULL,
    "kind" "TrustItemKind" NOT NULL,
    "title" TEXT NOT NULL,
    "number" TEXT,
    "issuedAt" DATE,
    "issuedBy" TEXT,
    "imageId" INTEGER,
    "fileId" INTEGER,

    CONSTRAINT "AboutTrustItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AboutFact" (
    "id" SERIAL NOT NULL,
    "aboutPageId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "AboutFact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AboutHeroCta" (
    "id" SERIAL NOT NULL,
    "aboutPageId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,

    CONSTRAINT "AboutHeroCta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactsPage" (
    "id" INTEGER NOT NULL,
    "phoneMain" TEXT NOT NULL,
    "email" TEXT,
    "telegramUrl" TEXT,
    "whatsappUrl" TEXT,
    "addressText" TEXT NOT NULL,
    "yandexMapUrl" TEXT NOT NULL,

    CONSTRAINT "ContactsPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactsWorkingHours" (
    "id" SERIAL NOT NULL,
    "contactsPageId" INTEGER NOT NULL,
    "dayGroup" "DayGroup" NOT NULL,
    "openMinutes" INTEGER,
    "closeMinutes" INTEGER,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ContactsWorkingHours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactsMetroStation" (
    "id" SERIAL NOT NULL,
    "contactsPageId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "distanceMeters" INTEGER,
    "line" TEXT,

    CONSTRAINT "ContactsMetroStation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyPage" (
    "id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,

    CONSTRAINT "PolicyPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeoStaticPage" (
    "id" SERIAL NOT NULL,
    "pageId" INTEGER NOT NULL,
    "metaTitle" TEXT NOT NULL,
    "metaDescription" TEXT NOT NULL,
    "canonicalUrl" TEXT,
    "robotsIndex" BOOLEAN NOT NULL DEFAULT true,
    "robotsFollow" BOOLEAN NOT NULL DEFAULT true,
    "ogTitle" TEXT,
    "ogDescription" TEXT,
    "ogImageId" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeoStaticPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeoCategory" (
    "id" SERIAL NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "metaTitle" TEXT NOT NULL,
    "metaDescription" TEXT NOT NULL,
    "canonicalUrl" TEXT,
    "robotsIndex" BOOLEAN NOT NULL DEFAULT true,
    "robotsFollow" BOOLEAN NOT NULL DEFAULT true,
    "ogTitle" TEXT,
    "ogDescription" TEXT,
    "ogImageId" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeoCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeoService" (
    "id" SERIAL NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "metaTitle" TEXT NOT NULL,
    "metaDescription" TEXT NOT NULL,
    "canonicalUrl" TEXT,
    "robotsIndex" BOOLEAN NOT NULL DEFAULT true,
    "robotsFollow" BOOLEAN NOT NULL DEFAULT true,
    "ogTitle" TEXT,
    "ogDescription" TEXT,
    "ogImageId" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeoService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeoDevice" (
    "id" SERIAL NOT NULL,
    "deviceId" INTEGER NOT NULL,
    "metaTitle" TEXT NOT NULL,
    "metaDescription" TEXT NOT NULL,
    "canonicalUrl" TEXT,
    "robotsIndex" BOOLEAN NOT NULL DEFAULT true,
    "robotsFollow" BOOLEAN NOT NULL DEFAULT true,
    "ogTitle" TEXT,
    "ogDescription" TEXT,
    "ogImageId" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeoDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoryImage" (
    "id" SERIAL NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "fileId" INTEGER NOT NULL,
    "purpose" "ImagePurpose" NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "alt" TEXT,
    "caption" TEXT,

    CONSTRAINT "CategoryImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" SERIAL NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "shortOffer" TEXT NOT NULL,
    "priceFrom" DECIMAL(10,2),
    "durationMinutes" INTEGER,
    "benefit1" TEXT,
    "benefit2" TEXT,
    "ctaText" TEXT,
    "ctaUrl" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServicePriceExtended" (
    "id" SERIAL NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "durationMinutes" INTEGER,
    "type" "ServicePriceType" NOT NULL DEFAULT 'BASE',
    "sessionsCount" INTEGER,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ServicePriceExtended_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceDetails" (
    "serviceId" INTEGER NOT NULL,
    "whoIsFor" TEXT NOT NULL,
    "effect" TEXT NOT NULL,
    "principle" TEXT NOT NULL,
    "resultsTiming" TEXT NOT NULL,
    "courseSessions" INTEGER,

    CONSTRAINT "ServiceDetails_pkey" PRIMARY KEY ("serviceId")
);

-- CreateTable
CREATE TABLE "ServiceIndication" (
    "id" SERIAL NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "ServiceIndication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceContraindication" (
    "id" SERIAL NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "ServiceContraindication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServicePreparationStep" (
    "id" SERIAL NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ServicePreparationStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceRehabStep" (
    "id" SERIAL NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ServiceRehabStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceFaq" (
    "id" SERIAL NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ServiceFaq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceLegalDisclaimer" (
    "id" SERIAL NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "ServiceLegalDisclaimer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceDevice" (
    "serviceId" INTEGER NOT NULL,
    "deviceId" INTEGER NOT NULL,

    CONSTRAINT "ServiceDevice_pkey" PRIMARY KEY ("serviceId","deviceId")
);

-- CreateTable
CREATE TABLE "ServiceImage" (
    "id" SERIAL NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "fileId" INTEGER NOT NULL,
    "purpose" "ImagePurpose" NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "alt" TEXT,
    "caption" TEXT,

    CONSTRAINT "ServiceImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Device" (
    "id" SERIAL NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "positioning" TEXT NOT NULL,
    "principle" TEXT NOT NULL,
    "safetyNotes" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceCertBadge" (
    "id" SERIAL NOT NULL,
    "deviceId" INTEGER NOT NULL,
    "type" "DeviceCertType" NOT NULL,
    "label" TEXT NOT NULL,
    "imageId" INTEGER,
    "fileId" INTEGER,

    CONSTRAINT "DeviceCertBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceParameter" (
    "id" SERIAL NOT NULL,
    "deviceId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT,
    "valueText" TEXT NOT NULL,
    "minValue" DECIMAL(10,3),
    "maxValue" DECIMAL(10,3),

    CONSTRAINT "DeviceParameter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceAttachment" (
    "id" SERIAL NOT NULL,
    "deviceId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageId" INTEGER,

    CONSTRAINT "DeviceAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceMode" (
    "id" SERIAL NOT NULL,
    "deviceId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "DeviceMode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceIndication" (
    "id" SERIAL NOT NULL,
    "deviceId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "DeviceIndication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceContraindication" (
    "id" SERIAL NOT NULL,
    "deviceId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "DeviceContraindication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceSideEffect" (
    "id" SERIAL NOT NULL,
    "deviceId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "rarity" "Rarity" NOT NULL,

    CONSTRAINT "DeviceSideEffect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceDocument" (
    "id" SERIAL NOT NULL,
    "deviceId" INTEGER NOT NULL,
    "docType" "DeviceDocType" NOT NULL,
    "title" TEXT NOT NULL,
    "issuedBy" TEXT,
    "issuedAt" DATE,
    "fileId" INTEGER NOT NULL,

    CONSTRAINT "DeviceDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceFaq" (
    "id" SERIAL NOT NULL,
    "deviceId" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DeviceFaq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceImage" (
    "id" SERIAL NOT NULL,
    "deviceId" INTEGER NOT NULL,
    "fileId" INTEGER NOT NULL,
    "purpose" "ImagePurpose" NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "alt" TEXT,
    "caption" TEXT,

    CONSTRAINT "DeviceImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" SERIAL NOT NULL,
    "sourceType" "LeadSourceType" NOT NULL,
    "serviceId" INTEGER,
    "deviceId" INTEGER,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "message" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "referer" TEXT,
    "ipAddress" TEXT NOT NULL,
    "pdnConsent" BOOLEAN NOT NULL DEFAULT false,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "File_path_key" ON "File"("path");

-- CreateIndex
CREATE UNIQUE INDEX "File_sha256_key" ON "File"("sha256");

-- CreateIndex
CREATE UNIQUE INDEX "StaticPage_type_key" ON "StaticPage"("type");

-- CreateIndex
CREATE UNIQUE INDEX "StaticPage_slug_key" ON "StaticPage"("slug");

-- CreateIndex
CREATE INDEX "StaticPage_isPublished_idx" ON "StaticPage"("isPublished");

-- CreateIndex
CREATE INDEX "HomeDirection_homePageId_order_idx" ON "HomeDirection"("homePageId", "order");

-- CreateIndex
CREATE INDEX "HomeGalleryImage_homePageId_order_idx" ON "HomeGalleryImage"("homePageId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "AboutHeroCta_aboutPageId_key" ON "AboutHeroCta"("aboutPageId");

-- CreateIndex
CREATE UNIQUE INDEX "ContactsWorkingHours_contactsPageId_dayGroup_key" ON "ContactsWorkingHours"("contactsPageId", "dayGroup");

-- CreateIndex
CREATE UNIQUE INDEX "SeoStaticPage_pageId_key" ON "SeoStaticPage"("pageId");

-- CreateIndex
CREATE UNIQUE INDEX "SeoCategory_categoryId_key" ON "SeoCategory"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "SeoService_serviceId_key" ON "SeoService"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "SeoDevice_deviceId_key" ON "SeoDevice"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceCategory_slug_key" ON "ServiceCategory"("slug");

-- CreateIndex
CREATE INDEX "ServiceCategory_isPublished_idx" ON "ServiceCategory"("isPublished");

-- CreateIndex
CREATE INDEX "CategoryImage_categoryId_order_idx" ON "CategoryImage"("categoryId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "Service_slug_key" ON "Service"("slug");

-- CreateIndex
CREATE INDEX "Service_categoryId_idx" ON "Service"("categoryId");

-- CreateIndex
CREATE INDEX "Service_isPublished_idx" ON "Service"("isPublished");

-- CreateIndex
CREATE INDEX "ServicePriceExtended_serviceId_order_idx" ON "ServicePriceExtended"("serviceId", "order");

-- CreateIndex
CREATE INDEX "ServiceImage_serviceId_order_idx" ON "ServiceImage"("serviceId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "Device_slug_key" ON "Device"("slug");

-- CreateIndex
CREATE INDEX "Device_isPublished_idx" ON "Device"("isPublished");

-- CreateIndex
CREATE INDEX "DeviceImage_deviceId_order_idx" ON "DeviceImage"("deviceId", "order");

-- CreateIndex
CREATE INDEX "Lead_serviceId_idx" ON "Lead"("serviceId");

-- CreateIndex
CREATE INDEX "Lead_deviceId_idx" ON "Lead"("deviceId");

-- CreateIndex
CREATE INDEX "Lead_createdAt_idx" ON "Lead"("createdAt");

-- AddForeignKey
ALTER TABLE "OrganizationPhone" ADD CONSTRAINT "OrganizationPhone_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgLicense" ADD CONSTRAINT "OrgLicense_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgLicense" ADD CONSTRAINT "OrgLicense_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgDocument" ADD CONSTRAINT "OrgDocument_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgCertificate" ADD CONSTRAINT "OrgCertificate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgCertificate" ADD CONSTRAINT "OrgCertificate_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomePage" ADD CONSTRAINT "HomePage_id_fkey" FOREIGN KEY ("id") REFERENCES "StaticPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeDirection" ADD CONSTRAINT "HomeDirection_homePageId_fkey" FOREIGN KEY ("homePageId") REFERENCES "HomePage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeDirection" ADD CONSTRAINT "HomeDirection_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeGalleryImage" ADD CONSTRAINT "HomeGalleryImage_homePageId_fkey" FOREIGN KEY ("homePageId") REFERENCES "HomePage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeGalleryImage" ADD CONSTRAINT "HomeGalleryImage_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AboutPage" ADD CONSTRAINT "AboutPage_id_fkey" FOREIGN KEY ("id") REFERENCES "StaticPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AboutTrustItem" ADD CONSTRAINT "AboutTrustItem_aboutPageId_fkey" FOREIGN KEY ("aboutPageId") REFERENCES "AboutPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AboutTrustItem" ADD CONSTRAINT "AboutTrustItem_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AboutTrustItem" ADD CONSTRAINT "AboutTrustItem_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AboutFact" ADD CONSTRAINT "AboutFact_aboutPageId_fkey" FOREIGN KEY ("aboutPageId") REFERENCES "AboutPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AboutHeroCta" ADD CONSTRAINT "AboutHeroCta_aboutPageId_fkey" FOREIGN KEY ("aboutPageId") REFERENCES "AboutPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactsPage" ADD CONSTRAINT "ContactsPage_id_fkey" FOREIGN KEY ("id") REFERENCES "StaticPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactsWorkingHours" ADD CONSTRAINT "ContactsWorkingHours_contactsPageId_fkey" FOREIGN KEY ("contactsPageId") REFERENCES "ContactsPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactsMetroStation" ADD CONSTRAINT "ContactsMetroStation_contactsPageId_fkey" FOREIGN KEY ("contactsPageId") REFERENCES "ContactsPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyPage" ADD CONSTRAINT "PolicyPage_id_fkey" FOREIGN KEY ("id") REFERENCES "StaticPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeoStaticPage" ADD CONSTRAINT "SeoStaticPage_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "StaticPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeoStaticPage" ADD CONSTRAINT "SeoStaticPage_ogImageId_fkey" FOREIGN KEY ("ogImageId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeoCategory" ADD CONSTRAINT "SeoCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ServiceCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeoCategory" ADD CONSTRAINT "SeoCategory_ogImageId_fkey" FOREIGN KEY ("ogImageId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeoService" ADD CONSTRAINT "SeoService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeoService" ADD CONSTRAINT "SeoService_ogImageId_fkey" FOREIGN KEY ("ogImageId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeoDevice" ADD CONSTRAINT "SeoDevice_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeoDevice" ADD CONSTRAINT "SeoDevice_ogImageId_fkey" FOREIGN KEY ("ogImageId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryImage" ADD CONSTRAINT "CategoryImage_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ServiceCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryImage" ADD CONSTRAINT "CategoryImage_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ServiceCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicePriceExtended" ADD CONSTRAINT "ServicePriceExtended_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceDetails" ADD CONSTRAINT "ServiceDetails_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceIndication" ADD CONSTRAINT "ServiceIndication_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceContraindication" ADD CONSTRAINT "ServiceContraindication_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicePreparationStep" ADD CONSTRAINT "ServicePreparationStep_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRehabStep" ADD CONSTRAINT "ServiceRehabStep_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceFaq" ADD CONSTRAINT "ServiceFaq_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceLegalDisclaimer" ADD CONSTRAINT "ServiceLegalDisclaimer_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceDevice" ADD CONSTRAINT "ServiceDevice_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceDevice" ADD CONSTRAINT "ServiceDevice_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceImage" ADD CONSTRAINT "ServiceImage_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceImage" ADD CONSTRAINT "ServiceImage_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceCertBadge" ADD CONSTRAINT "DeviceCertBadge_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceCertBadge" ADD CONSTRAINT "DeviceCertBadge_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceCertBadge" ADD CONSTRAINT "DeviceCertBadge_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceParameter" ADD CONSTRAINT "DeviceParameter_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceAttachment" ADD CONSTRAINT "DeviceAttachment_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceAttachment" ADD CONSTRAINT "DeviceAttachment_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceMode" ADD CONSTRAINT "DeviceMode_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceIndication" ADD CONSTRAINT "DeviceIndication_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceContraindication" ADD CONSTRAINT "DeviceContraindication_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceSideEffect" ADD CONSTRAINT "DeviceSideEffect_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceDocument" ADD CONSTRAINT "DeviceDocument_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceDocument" ADD CONSTRAINT "DeviceDocument_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceFaq" ADD CONSTRAINT "DeviceFaq_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceImage" ADD CONSTRAINT "DeviceImage_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceImage" ADD CONSTRAINT "DeviceImage_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE SET NULL ON UPDATE CASCADE;
