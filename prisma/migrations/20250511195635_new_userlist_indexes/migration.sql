-- CreateIndex
CREATE INDEX `UserList_user_id_visibility_createdAt_idx` ON `UserList`(`user_id`, `visibility`, `createdAt`);
