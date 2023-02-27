/*
  Warnings:

  - You are about to drop the column `estVal` on the `ItemTranslation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `ItemTranslation` DROP COLUMN `estVal`,
    ADD COLUMN `est_val` INTEGER NULL;

-- CreateTable
CREATE TABLE `ItemLog` (
    `log_id` INTEGER NOT NULL AUTO_INCREMENT,
    `info_type` ENUM('ITEM', 'TRANSLATION') NOT NULL,
    `info_id` INTEGER NOT NULL,
    `ip_address` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`log_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
