-- DropIndex
DROP INDEX `RestockAuctionHistory_item_iid_addedAt_type_idx` ON `restockauctionhistory`;

-- CreateIndex
CREATE INDEX `Items_category_rarity_est_val_idx` ON `Items`(`category`, `rarity`, `est_val`);

-- CreateIndex
CREATE INDEX `NcMallData_active_saleEnd_idx` ON `NcMallData`(`active`, `saleEnd`);

-- CreateIndex
CREATE INDEX `RestockAuctionHistory_item_iid_type_addedAt_idx` ON `RestockAuctionHistory`(`item_iid`, `type`, `addedAt`);
