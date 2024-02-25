-- CreateIndex
CREATE INDEX `TradeItems_name_image_id_idx` ON `TradeItems`(`name`, `image_id`);

-- CreateIndex
CREATE INDEX `Trades_hash_idx` ON `Trades`(`hash`);

-- CreateIndex
CREATE INDEX `Trades_wishlist_idx` ON `Trades`(`wishlist`(200));
