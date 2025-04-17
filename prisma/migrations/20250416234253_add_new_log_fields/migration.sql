/*
  Warnings:

  - You are about to drop the column `logText` on the `actionlogs` table. All the data in the column will be lost.
  - Added the required column `logData` to the `ActionLogs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `actionlogs` DROP COLUMN `logText`,
    ADD COLUMN `logData` JSON NOT NULL,
    ADD COLUMN `subject_id` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `ActionLogs_actionType_subject_id_addedAt_idx` ON `ActionLogs`(`actionType`, `subject_id`, `addedAt`);
