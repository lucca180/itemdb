-- CreateIndex
CREATE FULLTEXT INDEX `Items_name_description_idx` ON `Items`(`name`, `description`);
