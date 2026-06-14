-- AlterTable
ALTER TABLE `priceprocess2` ADD COLUMN `ownerHash` CHAR(64) NULL;

-- AlterTable
ALTER TABLE `restockauctionhistory` ADD COLUMN `ownerHash` CHAR(64) NULL;

-- AlterTable
ALTER TABLE `trades` ADD COLUMN `ownerHash` CHAR(64) NULL;
