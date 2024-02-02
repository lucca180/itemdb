-- AlterTable
ALTER TABLE `priceprocesshistory` ADD COLUMN `item_iid` INTEGER NULL,
    MODIFY `name` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `PriceProcessHistory` ADD CONSTRAINT `PriceProcessHistory_item_iid_fkey` FOREIGN KEY (`item_iid`) REFERENCES `Items`(`internal_id`) ON DELETE SET NULL ON UPDATE CASCADE;
