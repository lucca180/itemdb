/*
  Warnings:

  - Added the required column `opening_id` to the `OpenableQueue` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `OpenableQueue` ADD COLUMN `manual_check` VARCHAR(191) NULL,
    ADD COLUMN `opening_id` VARCHAR(191) NOT NULL;
