-- CreateEnum
CREATE TYPE "public"."InviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- AlterTable
ALTER TABLE "public"."invites" ADD COLUMN     "status" "public"."InviteStatus" NOT NULL DEFAULT 'PENDING';
