/*
  Warnings:

  - Added the required column `users_id` to the `BLEDevice` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BLEDevice" ADD COLUMN     "session_started_at" TIMESTAMP(3),
ADD COLUMN     "users_id" INTEGER NOT NULL;
