/*
  Warnings:

  - A unique constraint covering the columns `[list_id,item_iid]` on the table `ListItems` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `ListItems` ADD COLUMN `amount` INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `UserList` ADD COLUMN `colorHex` VARCHAR(191) NULL,
    ADD COLUMN `purpose` ENUM('none', 'seeking', 'trading') NOT NULL DEFAULT 'none',
    ADD COLUMN `visibility` ENUM('public', 'private', 'unlisted') NOT NULL DEFAULT 'public';

-- CreateIndex
CREATE UNIQUE INDEX `ListItems_list_id_item_iid_key` ON `ListItems`(`list_id`, `item_iid`);
