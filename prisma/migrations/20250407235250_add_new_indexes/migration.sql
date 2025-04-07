-- CreateIndex
CREATE INDEX `Feedbacks_feedback_id_subject_id_idx` ON `Feedbacks`(`feedback_id`, `subject_id`);

-- CreateIndex
CREATE INDEX `ItemPrices_manual_check_processedAt_idx` ON `ItemPrices`(`manual_check`, `processedAt`);
