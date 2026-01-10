-- CreateTable
CREATE TABLE `bdProcess` (
    `internal_id` INTEGER NOT NULL AUTO_INCREMENT,
    `battle_id` INTEGER NOT NULL,
    `owner` VARCHAR(191) NULL,
    `battle_data` JSON NOT NULL,
    `item_list` VARCHAR(191) NOT NULL,
    `addedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `processed` BOOLEAN NOT NULL DEFAULT false,
    `ip_address` VARCHAR(191) NULL,
    `processedAt` DATETIME(3) NULL,

    UNIQUE INDEX `bdProcess_battle_id_key`(`battle_id`),
    INDEX `bdProcess_item_list_processed_idx`(`item_list`, `processed`),
    PRIMARY KEY (`internal_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bdEffects` (
    `internal_id` INTEGER NOT NULL AUTO_INCREMENT,
    `item_iid` INTEGER NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `amount` INTEGER NOT NULL,
    `note` VARCHAR(191) NULL,
    `credits` VARCHAR(191) NULL,

    PRIMARY KEY (`internal_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `bdEffects` ADD CONSTRAINT `bdEffects_item_iid_fkey` FOREIGN KEY (`item_iid`) REFERENCES `Items`(`internal_id`) ON DELETE CASCADE ON UPDATE CASCADE;
