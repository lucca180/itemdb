/*
  Warnings:

  - A unique constraint covering the columns `[feedback_id,user_id]` on the table `FeedbackVotes` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `user` RENAME COLUMN `xp` TO `old_xp`;
ALTER TABLE `user` ADD COLUMN `xp` INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX `FeedbackVotes_feedback_id_user_id_key` ON `FeedbackVotes`(`feedback_id`, `user_id`);
