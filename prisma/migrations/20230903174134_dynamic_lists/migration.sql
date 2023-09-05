-- AlterTable
ALTER TABLE `listitems` ADD COLUMN `isHidden` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `userlist` ADD COLUMN `dynamicQuery` JSON NULL,
    ADD COLUMN `lastDynamicSync` DATETIME(3) NULL,
    ADD COLUMN `lastLinkedSync` DATETIME(3) NULL,
    ADD COLUMN `linkedListId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `UserList` ADD CONSTRAINT `UserList_linkedListId_fkey` FOREIGN KEY (`linkedListId`) REFERENCES `UserList`(`internal_id`) ON DELETE SET NULL ON UPDATE CASCADE;
