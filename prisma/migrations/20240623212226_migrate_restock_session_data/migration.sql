-- AlterTable
ALTER TABLE `restocksession` MODIFY `session` JSON NULL;

-- Migrate all data from `session` to `sessionText`
UPDATE `restocksession` SET `sessionText` = `session`;
