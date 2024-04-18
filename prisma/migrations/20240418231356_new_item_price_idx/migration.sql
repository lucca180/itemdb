-- DropIndex
DROP INDEX `ItemPrices_item_iid_addedAt_idx` ON `itemprices`;

-- CreateIndex
CREATE INDEX `ItemPrices_item_iid_addedAt_manual_check_idx` ON `ItemPrices`(`item_iid`, `addedAt`, `manual_check`);
