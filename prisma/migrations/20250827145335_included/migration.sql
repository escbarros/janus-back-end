-- DropForeignKey
ALTER TABLE "public"."Access" DROP CONSTRAINT "Access_device_serial_number_fkey";

-- DropForeignKey
ALTER TABLE "public"."events" DROP CONSTRAINT "events_device_serial_number_fkey";

-- DropForeignKey
ALTER TABLE "public"."invites" DROP CONSTRAINT "invites_device_serial_number_fkey";

-- DropForeignKey
ALTER TABLE "public"."recordings" DROP CONSTRAINT "recordings_device_serial_number_fkey";

-- AlterTable
ALTER TABLE "public"."devices" ADD COLUMN     "public_key" TEXT NOT NULL DEFAULT '';

-- AddForeignKey
ALTER TABLE "public"."Access" ADD CONSTRAINT "Access_device_serial_number_fkey" FOREIGN KEY ("device_serial_number") REFERENCES "public"."devices"("serial_number") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."recordings" ADD CONSTRAINT "recordings_device_serial_number_fkey" FOREIGN KEY ("device_serial_number") REFERENCES "public"."devices"("serial_number") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."invites" ADD CONSTRAINT "invites_device_serial_number_fkey" FOREIGN KEY ("device_serial_number") REFERENCES "public"."devices"("serial_number") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."events" ADD CONSTRAINT "events_device_serial_number_fkey" FOREIGN KEY ("device_serial_number") REFERENCES "public"."devices"("serial_number") ON DELETE CASCADE ON UPDATE CASCADE;
