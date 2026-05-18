-- Add CMS page for editable services-section copy.

CREATE TABLE "ServicesPage" (
    "id" INTEGER NOT NULL,
    "landingTitle" TEXT NOT NULL,
    "landingDescription" TEXT NOT NULL,
    "femaleCardTitle" TEXT NOT NULL,
    "femaleCardDescription" TEXT NOT NULL,
    "maleCardTitle" TEXT NOT NULL,
    "maleCardDescription" TEXT NOT NULL,
    "femaleTitle" TEXT NOT NULL,
    "femaleDescription" TEXT NOT NULL,
    "maleTitle" TEXT NOT NULL,
    "maleDescription" TEXT NOT NULL,

    CONSTRAINT "ServicesPage_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ServicesPage"
ADD CONSTRAINT "ServicesPage_id_fkey"
FOREIGN KEY ("id") REFERENCES "StaticPage"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "StaticPage" ("type", "slug", "updatedAt")
VALUES ('SERVICES', 'services', NOW())
ON CONFLICT ("type") DO UPDATE SET "slug" = EXCLUDED."slug", "updatedAt" = NOW();

INSERT INTO "ServicesPage" (
    "id",
    "landingTitle",
    "landingDescription",
    "femaleCardTitle",
    "femaleCardDescription",
    "maleCardTitle",
    "maleCardDescription",
    "femaleTitle",
    "femaleDescription",
    "maleTitle",
    "maleDescription"
)
SELECT
    "id",
    'Выберите направление',
    'Перейдите к женским или мужским категориям услуг, чтобы посмотреть подборку процедур.',
    'Женщины',
    'Категории эстетического и оздоровительного ухода, собранные для женских запросов.',
    'Мужчины',
    'Процедуры и консультации, разработанные для мужских направлений и задач.',
    'Почему женщины выбирают нас?',
    'Собрали для вас направления, где заботимся о красоте, здоровье и комфорте с персональным подходом и вниманием к деталям.',
    'Почему мужчины выбирают нас?',
    'Подготовили направления с эффективными решениями для мужского ухода — от эстетики до консультаций специалистов.'
FROM "StaticPage"
WHERE "type" = 'SERVICES'
ON CONFLICT ("id") DO NOTHING;
