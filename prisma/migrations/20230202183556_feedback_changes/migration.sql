/*
  Warnings:

  - You are about to drop the column `message` on the `Feedbacks` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Feedbacks` DROP COLUMN `message`,
    ADD COLUMN `subject_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `Trades` ADD COLUMN `processed` BOOLEAN NOT NULL DEFAULT false;
