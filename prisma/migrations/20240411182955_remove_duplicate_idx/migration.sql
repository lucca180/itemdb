-- DropIndex
DROP INDEX `ItemPrices_name_idx` ON `itemprices`;

-- DropIndex
DROP INDEX `Items_item_id_idx` ON `items`;

-- DropIndex
DROP INDEX `PriceProcess2_item_iid_addedAt_idx` ON `priceprocess2`;

-- DropIndex
DROP INDEX `PriceProcessHistory_name_idx` ON `priceprocesshistory`;

-- DropIndex
DROP INDEX `RestockAuctionHistory_item_iid_addedAt_idx` ON `restockauctionhistory`;

-- DropIndex
DROP INDEX `RestockSession_user_id_startedAt_idx` ON `restocksession`;
