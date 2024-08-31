/*
  Warnings:

  - A unique constraint covering the columns `[trade_id,order]` on the table `TradeItems` will be added. If there are existing duplicate values, this will fail.

*/
CREATE INDEX `TradeItems_trade_id_idx` ON `TradeItems`(`trade_id`);

-- DropIndex
DROP INDEX `TradeItems_trade_id_order_idx` ON `tradeitems`;

-- CreateIndex
CREATE UNIQUE INDEX `TradeItems_trade_id_order_key` ON `TradeItems`(`trade_id`, `order`);

DROP INDEX `TradeItems_trade_id_idx` ON `TradeItems`