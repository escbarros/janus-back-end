-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."InviteStatus" ADD VALUE 'EXPIRED';
ALTER TYPE "public"."InviteStatus" ADD VALUE 'REVOKED';

-- AlterTable
ALTER TABLE "public"."invites" ADD COLUMN     "revoked_id" TEXT;

-- AddForeignKey
ALTER TABLE "public"."invites" ADD CONSTRAINT "invites_revoked_id_fkey" FOREIGN KEY ("revoked_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
