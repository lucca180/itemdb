-- DropForeignKey
ALTER TABLE `feedbacks` DROP FOREIGN KEY `Feedbacks_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `feedbackvotes` DROP FOREIGN KEY `FeedbackVotes_user_id_fkey`;

-- DropIndex
DROP INDEX `Feedbacks_user_id_fkey` ON `feedbacks`;

-- DropIndex
DROP INDEX `FeedbackVotes_user_id_fkey` ON `feedbackvotes`;

-- AddForeignKey
ALTER TABLE `Feedbacks` ADD CONSTRAINT `Feedbacks_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FeedbackVotes` ADD CONSTRAINT `FeedbackVotes_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
