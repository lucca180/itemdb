/*
  Warnings:

  - You are about to drop the column `date` on the `restockwrapped` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[user_id,dateType]` on the table `RestockWrapped` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `dateType` to the `RestockWrapped` table without a default value. This is not possible if the table is not empty.

*/

ALTER TABLE `RestockWrapped` DROP FOREIGN KEY `RestockWrapped_user_id_fkey`;

-- DropIndex
DROP INDEX `RestockWrapped_user_id_date_key` ON `restockwrapped`;

-- AlterTable
ALTER TABLE `restockwrapped` DROP COLUMN `date`,
    ADD COLUMN `dateType` VARCHAR(191) NOT NULL,
    MODIFY `sessionText` LONGTEXT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `RestockWrapped_user_id_dateType_key` ON `RestockWrapped`(`user_id`, `dateType`);

ALTER TABLE `RestockWrapped` ADD CONSTRAINT `RestockWrapped_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
