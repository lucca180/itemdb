/*
  Warnings:

  - You are about to drop the column `estVal` on the `Item` table. All the data in the column will be lost.
  - You are about to alter the column `info_type` on the `ItemLog` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(0))` to `VarChar(191)`.

*/
-- AlterTable
ALTER TABLE `Item` DROP COLUMN `estVal`,
    ADD COLUMN `est_val` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `ItemLog` MODIFY `info_type` VARCHAR(191) NOT NULL;
