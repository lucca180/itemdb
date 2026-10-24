-- CreateIndex
CREATE INDEX `Feedbacks_processed_processedAt_idx` ON `Feedbacks`(`processed`, `processedAt`);

-- CreateIndex
CREATE INDEX `ItemProcess_processed_addedAt_idx` ON `ItemProcess`(`processed`, `addedAt`);
