-- CreateEnum
CREATE TYPE "VisaRenewalEventType" AS ENUM ('CREATED', 'RENEWED');

-- CreateTable
CREATE TABLE "VisaRenewalHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "visaId" TEXT NOT NULL,
    "eventType" "VisaRenewalEventType" NOT NULL,
    "previousExpiryDate" TIMESTAMP(3),
    "newExpiryDate" TIMESTAMP(3) NOT NULL,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisaRenewalHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VisaRenewalHistory_userId_idx" ON "VisaRenewalHistory"("userId");

-- CreateIndex
CREATE INDEX "VisaRenewalHistory_visaId_idx" ON "VisaRenewalHistory"("visaId");

-- CreateIndex
CREATE INDEX "VisaRenewalHistory_createdAt_idx" ON "VisaRenewalHistory"("createdAt");

-- AddForeignKey
ALTER TABLE "VisaRenewalHistory" ADD CONSTRAINT "VisaRenewalHistory_visaId_fkey" FOREIGN KEY ("visaId") REFERENCES "Visa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisaRenewalHistory" ADD CONSTRAINT "VisaRenewalHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
