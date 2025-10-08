-- CreateEnum
CREATE TYPE "public"."MessageOrigin" AS ENUM ('USER', 'DEVICE');

-- CreateTable
CREATE TABLE "public"."Message" (
    "id" TEXT NOT NULL,
    "call_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "origin" "public"."MessageOrigin" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_call_id_fkey" FOREIGN KEY ("call_id") REFERENCES "public"."Call"("id") ON DELETE CASCADE ON UPDATE CASCADE;
