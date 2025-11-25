-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('student', 'researcher', 'technician', 'admin');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');

-- CreateEnum
CREATE TYPE "SampleType" AS ENUM ('water', 'soil', 'plant', 'biological_fluid', 'other');

-- CreateEnum
CREATE TYPE "SampleStatus" AS ENUM ('pending', 'approved', 'rejected', 'under_review');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('pending', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('info', 'success', 'warning', 'error');

-- CreateTable
CREATE TABLE "Users" (
    "users_id" SERIAL NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'student',
    "mobile_no" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "profile_picture" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_modified_by_admin" INTEGER,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("users_id")
);

-- CreateTable
CREATE TABLE "MobileLabRequests" (
    "request_id" SERIAL NOT NULL,
    "users_id" INTEGER NOT NULL,
    "request_time" TIMESTAMP(3) NOT NULL,
    "request_date" TIMESTAMP(3) NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'pending',
    "purpose" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MobileLabRequests_pkey" PRIMARY KEY ("request_id")
);

-- CreateTable
CREATE TABLE "BLEDevice" (
    "ble_device_id" SERIAL NOT NULL,
    "device_name" TEXT NOT NULL,
    "device_type" TEXT NOT NULL,
    "last_time_connect" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BLEDevice_pkey" PRIMARY KEY ("ble_device_id")
);

-- CreateTable
CREATE TABLE "Samples" (
    "samples_id" SERIAL NOT NULL,
    "users_id" INTEGER NOT NULL,
    "sample_identifier" TEXT NOT NULL,
    "collection_datetime" TIMESTAMP(3) NOT NULL,
    "sample_type" "SampleType" NOT NULL,
    "geolocation" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "ph" DOUBLE PRECISION,
    "temperature" DOUBLE PRECISION,
    "salinity" DOUBLE PRECISION,
    "notes" TEXT,
    "qr_code_data" TEXT,
    "ble_device_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "status" "SampleStatus" NOT NULL DEFAULT 'pending',

    CONSTRAINT "Samples_pkey" PRIMARY KEY ("samples_id")
);

-- CreateTable
CREATE TABLE "Reports" (
    "report_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "sample_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "generated_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pdf_url" TEXT,
    "chart_data" JSONB,
    "status" "ReportStatus" NOT NULL DEFAULT 'pending',

    CONSTRAINT "Reports_pkey" PRIMARY KEY ("report_id")
);

-- CreateTable
CREATE TABLE "ReportShares" (
    "share_id" SERIAL NOT NULL,
    "report_id" INTEGER NOT NULL,
    "shared_by" INTEGER NOT NULL,
    "shared_with_email" TEXT NOT NULL,
    "share_token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "ReportShares_pkey" PRIMARY KEY ("share_id")
);

-- CreateTable
CREATE TABLE "Protocols" (
    "protocols_id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sample_type" TEXT,
    "steps" TEXT NOT NULL,
    "category" TEXT,
    "experiment_type" TEXT,
    "created_by_admin" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Protocols_pkey" PRIMARY KEY ("protocols_id")
);

-- CreateTable
CREATE TABLE "SystemLog" (
    "log_id" SERIAL NOT NULL,
    "users_id" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemLog_pkey" PRIMARY KEY ("log_id")
);

-- CreateTable
CREATE TABLE "Notifications" (
    "notifications_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'info',
    "message" TEXT NOT NULL,
    "title" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notifications_pkey" PRIMARY KEY ("notifications_id")
);

-- CreateTable
CREATE TABLE "PasswordResets" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PasswordResets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Users_email_key" ON "Users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Samples_sample_identifier_key" ON "Samples"("sample_identifier");

-- CreateIndex
CREATE UNIQUE INDEX "ReportShares_share_token_key" ON "ReportShares"("share_token");

-- AddForeignKey
ALTER TABLE "MobileLabRequests" ADD CONSTRAINT "MobileLabRequests_users_id_fkey" FOREIGN KEY ("users_id") REFERENCES "Users"("users_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Samples" ADD CONSTRAINT "Samples_users_id_fkey" FOREIGN KEY ("users_id") REFERENCES "Users"("users_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Samples" ADD CONSTRAINT "Samples_ble_device_id_fkey" FOREIGN KEY ("ble_device_id") REFERENCES "BLEDevice"("ble_device_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reports" ADD CONSTRAINT "Reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("users_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reports" ADD CONSTRAINT "Reports_sample_id_fkey" FOREIGN KEY ("sample_id") REFERENCES "Samples"("samples_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportShares" ADD CONSTRAINT "ReportShares_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "Reports"("report_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportShares" ADD CONSTRAINT "ReportShares_shared_by_fkey" FOREIGN KEY ("shared_by") REFERENCES "Users"("users_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Protocols" ADD CONSTRAINT "Protocols_created_by_admin_fkey" FOREIGN KEY ("created_by_admin") REFERENCES "Users"("users_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemLog" ADD CONSTRAINT "SystemLog_users_id_fkey" FOREIGN KEY ("users_id") REFERENCES "Users"("users_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notifications" ADD CONSTRAINT "Notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("users_id") ON DELETE CASCADE ON UPDATE CASCADE;
