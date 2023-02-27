-- CreateTable
CREATE TABLE `Trades` (
    `trade_id` INTEGER NOT NULL,
    `owner` VARCHAR(191) NOT NULL,
    `wishlist` TEXT NOT NULL,

    PRIMARY KEY (`trade_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TradeItems` (
    `internal_id` INTEGER NOT NULL,
    `trade_id` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `image` VARCHAR(191) NOT NULL,
    `image_id` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL,
    `price` INTEGER NULL,
    `item_id` INTEGER NULL,

    PRIMARY KEY (`internal_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TradeItems` ADD CONSTRAINT `TradeItems_trade_id_fkey` FOREIGN KEY (`trade_id`) REFERENCES `Trades`(`trade_id`) ON DELETE CASCADE ON UPDATE CASCADE;
