-- CreateIndex
CREATE INDEX `Trades_isCanonical_isAllItemsEqual_itemsCount_idx` ON `Trades`(`isCanonical`, `isAllItemsEqual`, `itemsCount`);
