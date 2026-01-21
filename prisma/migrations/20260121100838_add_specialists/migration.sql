-- CreateTable
CREATE TABLE "Specialist" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "specialization" TEXT NOT NULL,
    "biography" TEXT NOT NULL,
    "experienceYears" INTEGER NOT NULL,
    "photoFileId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Specialist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceSpecialist" (
    "serviceId" INTEGER NOT NULL,
    "specialistId" INTEGER NOT NULL,

    CONSTRAINT "ServiceSpecialist_pkey" PRIMARY KEY ("serviceId","specialistId")
);

-- CreateIndex
CREATE INDEX "ServiceSpecialist_specialistId_idx" ON "ServiceSpecialist"("specialistId");

-- AddForeignKey
ALTER TABLE "Specialist" ADD CONSTRAINT "Specialist_photoFileId_fkey" FOREIGN KEY ("photoFileId") REFERENCES "File"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceSpecialist" ADD CONSTRAINT "ServiceSpecialist_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceSpecialist" ADD CONSTRAINT "ServiceSpecialist_specialistId_fkey" FOREIGN KEY ("specialistId") REFERENCES "Specialist"("id") ON DELETE CASCADE ON UPDATE CASCADE;
