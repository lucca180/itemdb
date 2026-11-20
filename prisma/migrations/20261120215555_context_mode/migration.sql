-- AlterTable
ALTER TABLE `listcontext` ADD COLUMN `mode` ENUM('both', 'grouping', 'badge') NOT NULL DEFAULT 'both';
