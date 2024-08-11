-- AlterTable
ALTER TABLE `salestats` MODIFY `stats` ENUM('ets', 'regular', 'hts', 'unknown') NOT NULL;
