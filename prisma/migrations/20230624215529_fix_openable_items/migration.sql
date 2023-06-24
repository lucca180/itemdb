/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `OpenableItems` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[opening_id]` on the table `OpenableItems` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `opening_id` to the `OpenableItems` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `OpenableItems` DROP COLUMN `updatedAt`,
    ADD COLUMN `limitedEdition` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `opening_id` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `OpenableItems_opening_id_key` ON `OpenableItems`(`opening_id`);
