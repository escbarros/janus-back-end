-- CreateEnum
CREATE TYPE "public"."AccessLevel" AS ENUM ('OWNER', 'ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "public"."EventType" AS ENUM ('DOORBELL', 'DOOR_UNLOCKED', 'DOOR_LOCKED', 'INVITE_SENT', 'INVITE_ACCEPTED', 'INVITE_RECEIVED');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "public"."devices" (
    "serial_number" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("serial_number")
);

-- CreateTable
CREATE TABLE "public"."Access" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "device_serial_number" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "access_level" "public"."AccessLevel" NOT NULL DEFAULT 'USER',

    CONSTRAINT "Access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."recordings" (
    "id" TEXT NOT NULL,
    "device_serial_number" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recordings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."invites" (
    "id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "receiver_id" TEXT NOT NULL,
    "device_serial_number" TEXT NOT NULL,

    CONSTRAINT "invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."events" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT,
    "device_serial_number" TEXT NOT NULL,
    "invite_id" TEXT,
    "type" "public"."EventType" NOT NULL,
    "read_at" TIMESTAMP(3),

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_id_key" ON "public"."users"("id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- AddForeignKey
ALTER TABLE "public"."Access" ADD CONSTRAINT "Access_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Access" ADD CONSTRAINT "Access_device_serial_number_fkey" FOREIGN KEY ("device_serial_number") REFERENCES "public"."devices"("serial_number") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."recordings" ADD CONSTRAINT "recordings_device_serial_number_fkey" FOREIGN KEY ("device_serial_number") REFERENCES "public"."devices"("serial_number") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."invites" ADD CONSTRAINT "invites_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."invites" ADD CONSTRAINT "invites_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."invites" ADD CONSTRAINT "invites_device_serial_number_fkey" FOREIGN KEY ("device_serial_number") REFERENCES "public"."devices"("serial_number") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."events" ADD CONSTRAINT "events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."events" ADD CONSTRAINT "events_device_serial_number_fkey" FOREIGN KEY ("device_serial_number") REFERENCES "public"."devices"("serial_number") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."events" ADD CONSTRAINT "events_invite_id_fkey" FOREIGN KEY ("invite_id") REFERENCES "public"."invites"("id") ON DELETE SET NULL ON UPDATE CASCADE;
