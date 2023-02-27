-- AlterTable
ALTER TABLE `Feedbacks` ADD COLUMN `approved` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `Trades` ADD COLUMN `priced` BOOLEAN NOT NULL DEFAULT false;
