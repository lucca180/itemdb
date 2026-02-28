-- CreateTable
CREATE TABLE `AvatarSolution` (
    `internal_id` INTEGER NOT NULL AUTO_INCREMENT,
    `avy_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `image` VARCHAR(191) NOT NULL,
    `releasedAt` DATETIME(3) NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `list_id` INTEGER NULL,
    `item_iid` INTEGER NULL,
    `solution` TEXT NOT NULL,

    UNIQUE INDEX `AvatarSolution_avy_id_key`(`avy_id`),
    PRIMARY KEY (`internal_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AvatarSolution` ADD CONSTRAINT `AvatarSolution_list_id_fkey` FOREIGN KEY (`list_id`) REFERENCES `UserList`(`internal_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AvatarSolution` ADD CONSTRAINT `AvatarSolution_item_iid_fkey` FOREIGN KEY (`item_iid`) REFERENCES `Items`(`internal_id`) ON DELETE CASCADE ON UPDATE CASCADE;
