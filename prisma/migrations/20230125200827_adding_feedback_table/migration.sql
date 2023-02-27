-- CreateTable
CREATE TABLE `Feedbacks` (
    `feedback_id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` VARCHAR(191) NOT NULL DEFAULT 'feedback',
    `message` TEXT NULL,
    `json` TEXT NULL,
    `subject_id` INTEGER NULL,
    `email` TEXT NULL,
    `votes` INTEGER NOT NULL DEFAULT 0,
    `addedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`feedback_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
