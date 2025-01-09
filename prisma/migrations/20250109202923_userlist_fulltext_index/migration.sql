-- CreateIndex
CREATE FULLTEXT INDEX `UserList_name_idx` ON `UserList`(`name`);

-- CreateIndex
CREATE FULLTEXT INDEX `UserList_description_idx` ON `UserList`(`description`);

-- CreateIndex
CREATE FULLTEXT INDEX `UserList_name_description_idx` ON `UserList`(`name`, `description`);
