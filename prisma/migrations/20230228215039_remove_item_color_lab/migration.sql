/*
  Warnings:

  - You are about to drop the `ItemColorLab` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[type,neo_id]` on the table `PriceProcess` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `PriceProcess` ADD COLUMN `neo_id` INTEGER NULL;

-- DropTable
DROP TABLE `ItemColorLab`;

-- CreateIndex
CREATE UNIQUE INDEX `PriceProcess_type_neo_id_key` ON `PriceProcess`(`type`, `neo_id`);
