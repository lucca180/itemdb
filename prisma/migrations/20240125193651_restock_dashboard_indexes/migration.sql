-- CreateIndex
CREATE INDEX `RestockSession_user_id_startedAt_idx` ON `RestockSession`(`user_id`, `startedAt`);

-- CreateIndex
CREATE INDEX `RestockSession_user_id_startedAt_shop_id_idx` ON `RestockSession`(`user_id`, `startedAt`, `shop_id`);
