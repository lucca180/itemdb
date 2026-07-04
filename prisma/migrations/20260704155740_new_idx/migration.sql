-- CreateIndex
CREATE INDEX `ItemPrices_manual_check_addedAt_idx` ON `ItemPrices`(`manual_check`, `addedAt` DESC);

-- CreateIndex
CREATE INDEX `ListItems_list_id_isHidden_idx` ON `ListItems`(`list_id`, `isHidden`);

-- CreateIndex
CREATE INDEX `OpenableItems_opening_id_idx` ON `OpenableItems`(`opening_id`);

-- CreateIndex
CREATE INDEX `Trades_priced_auto_ignore_pricing_wishlist_addedAt_idx` ON `Trades`(`priced`, `auto_ignore_pricing`, `wishlist`(100), `addedAt` DESC);
