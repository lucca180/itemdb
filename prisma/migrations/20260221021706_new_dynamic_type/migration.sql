-- AlterTable
ALTER TABLE `userlist` MODIFY `dynamicType` ENUM('addOnly', 'removeOnly', 'fullSync', 'search') NULL;
