-- AlterTable
ALTER TABLE `datacollecting` ADD COLUMN `approved` BOOLEAN NULL,
    ADD COLUMN `note` TEXT NULL,
    ADD COLUMN `processed` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `processedAt` DATETIME(3) NULL,
    ADD COLUMN `subject_id` INTEGER NULL;

-- CreateIndex
CREATE INDEX `DataCollecting_type_processed_subject_id_idx` ON `DataCollecting`(`type`, `processed`, `subject_id`);
