-- DropIndex
DROP INDEX `ItemPrices_addedAt_idx` ON `ItemPrices`;

-- DropIndex
DROP INDEX `PriceProcess_addedAt_idx` ON `PriceProcess`;

-- CreateIndex
CREATE INDEX `ItemPrices_price_idx` ON `ItemPrices`(`price` ASC);

-- CreateIndex
CREATE INDEX `ItemPrices_addedAt_idx` ON `ItemPrices`(`addedAt` DESC);

-- CreateIndex
CREATE INDEX `PriceProcess_addedAt_idx` ON `PriceProcess`(`addedAt` DESC);
