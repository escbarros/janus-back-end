-- CreateEnum
CREATE TYPE "public"."CallStatus" AS ENUM ('ACTIVE', 'FINISHED');

-- CreateTable
CREATE TABLE "public"."Call" (
    "id" TEXT NOT NULL,
    "device_serial_number" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "status" "public"."CallStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "Call_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Call" ADD CONSTRAINT "Call_device_serial_number_fkey" FOREIGN KEY ("device_serial_number") REFERENCES "public"."devices"("serial_number") ON DELETE CASCADE ON UPDATE CASCADE;
