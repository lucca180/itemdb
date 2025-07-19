-- DropIndex
DROP INDEX `TradeItems_order_trade_id_idx` ON `tradeitems`;

-- AlterTable
ALTER TABLE `tradeitems` ADD COLUMN `item_iid` INTEGER NULL;

-- CreateIndex
CREATE INDEX `TradeItems_order_trade_id_item_iid_idx` ON `TradeItems`(`order`, `trade_id`, `item_iid`);

-- AddForeignKey
ALTER TABLE `TradeItems` ADD CONSTRAINT `TradeItems_item_iid_fkey` FOREIGN KEY (`item_iid`) REFERENCES `Items`(`internal_id`) ON DELETE CASCADE ON UPDATE CASCADE;
