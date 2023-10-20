-- CreateTable
CREATE TABLE `FeedbackVotes` (
    `vote_id` INTEGER NOT NULL AUTO_INCREMENT,
    `feedback_id` INTEGER NOT NULL,
    `user_id` VARCHAR(191) NULL,
    `voteWeight` INTEGER NOT NULL DEFAULT 1,
    `approve` BOOLEAN NOT NULL,
    `addedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`vote_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `FeedbackVotes` ADD CONSTRAINT `FeedbackVotes_feedback_id_fkey` FOREIGN KEY (`feedback_id`) REFERENCES `Feedbacks`(`feedback_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FeedbackVotes` ADD CONSTRAINT `FeedbackVotes_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
