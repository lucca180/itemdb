/*
  Warnings:

  - Added the required column `updatedAt` to the `apiKeys` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `apikeys` ADD COLUMN `updatedAt` DATETIME(3) NOT NULL,
    ALTER COLUMN `limit` DROP DEFAULT;
