-- DropIndex
DROP INDEX `Trades_hash_idx` ON `trades`;

-- CreateIndex
CREATE INDEX `TradeItems_trade_id_order_idx` ON `TradeItems`(`trade_id`, `order`);

-- CreateIndex
CREATE INDEX `Trades_hash_processed_idx` ON `Trades`(`hash`, `processed`);
