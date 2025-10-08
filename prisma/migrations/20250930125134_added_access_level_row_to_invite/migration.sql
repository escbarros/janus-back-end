-- AlterTable
ALTER TABLE "public"."invites" ADD COLUMN     "access_level" "public"."AccessLevel" NOT NULL DEFAULT 'USER';
