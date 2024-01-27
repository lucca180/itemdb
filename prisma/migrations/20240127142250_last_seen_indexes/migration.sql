-- CreateIndex
CREATE INDEX `LastSeen_type_lastSeen_idx` ON `LastSeen`(`type`, `lastSeen`);

-- CreateIndex
CREATE INDEX `RestockSession_user_id_idx` ON `RestockSession`(`user_id`);
