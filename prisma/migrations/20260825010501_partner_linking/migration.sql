-- AlterTable
ALTER TABLE "memories" ADD COLUMN     "shareStatus" TEXT NOT NULL DEFAULT 'NONE';

-- CreateTable
CREATE TABLE "couple_links" (
    "id" TEXT NOT NULL,
    "userAId" TEXT NOT NULL,
    "userBId" TEXT,
    "inviteCode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "linkedAt" TIMESTAMP(3),
    "unlinkedAt" TIMESTAMP(3),

    CONSTRAINT "couple_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "couple_links_inviteCode_key" ON "couple_links"("inviteCode");

-- AddForeignKey
ALTER TABLE "couple_links" ADD CONSTRAINT "couple_links_userAId_fkey" FOREIGN KEY ("userAId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "couple_links" ADD CONSTRAINT "couple_links_userBId_fkey" FOREIGN KEY ("userBId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
