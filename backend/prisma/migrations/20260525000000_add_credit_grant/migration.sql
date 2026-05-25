-- CreateTable
CREATE TABLE "CreditGrant" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "grantedById" TEXT NOT NULL,
    "grantedByEmail" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditGrant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CreditGrant_recipientId_idx" ON "CreditGrant"("recipientId");

-- CreateIndex
CREATE INDEX "CreditGrant_grantedById_idx" ON "CreditGrant"("grantedById");

-- CreateIndex
CREATE INDEX "CreditGrant_createdAt_idx" ON "CreditGrant"("createdAt");

-- AddForeignKey
ALTER TABLE "CreditGrant" ADD CONSTRAINT "CreditGrant_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditGrant" ADD CONSTRAINT "CreditGrant_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
