-- CreateIndex
CREATE INDEX `ItemPrices_item_iid_addedAt_idx` ON `ItemPrices`(`item_iid`, `addedAt` DESC);

-- CreateIndex
CREATE INDEX `OwlsPrice_item_iid_pricedAt_idx` ON `OwlsPrice`(`item_iid`, `pricedAt` DESC);
