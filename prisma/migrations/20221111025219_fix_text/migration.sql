-- AlterTable
ALTER TABLE `Item` MODIFY `description` TEXT NULL,
    MODIFY `image` TINYTEXT NULL;

-- AlterTable
ALTER TABLE `ItemProcessList` MODIFY `description` TEXT NULL,
    MODIFY `image` TEXT NULL;

-- AlterTable
ALTER TABLE `ItemTranslation` MODIFY `description` TEXT NULL;
