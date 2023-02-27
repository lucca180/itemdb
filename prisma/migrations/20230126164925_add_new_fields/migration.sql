-- AlterTable
ALTER TABLE `Feedbacks` ADD COLUMN `user_id` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `xp` INTEGER NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE `Feedbacks` ADD CONSTRAINT `Feedbacks_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
