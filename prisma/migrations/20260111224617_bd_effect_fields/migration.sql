/*
  Warnings:

  - You are about to drop the column `amount` on the `bdeffects` table. All the data in the column will be lost.
  - You are about to drop the column `credits` on the `bdeffects` table. All the data in the column will be lost.
  - You are about to drop the column `note` on the `bdeffects` table. All the data in the column will be lost.
  - Added the required column `value` to the `bdEffects` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `bdeffects` DROP COLUMN `amount`,
    DROP COLUMN `credits`,
    DROP COLUMN `note`,
    ADD COLUMN `value` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE INDEX `bdEffects_type_item_iid_idx` ON `bdEffects`(`type`, `item_iid`);
