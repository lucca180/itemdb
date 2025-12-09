/*
  Warnings:

  - You are about to drop the column `image` on the `tradeitems` table. All the data in the column will be lost.
  - You are about to drop the column `image_id` on the `tradeitems` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `tradeitems` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `TradeItems_name_image_id_idx` ON `tradeitems`;

-- AlterTable
ALTER TABLE `tradeitems` DROP COLUMN `image`,
    DROP COLUMN `image_id`,
    DROP COLUMN `name`,
    ADD COLUMN `amount` INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `trades` ADD COLUMN `createdAt` DATETIME(3) NULL,
    ADD COLUMN `instantBuy` INTEGER NULL;
