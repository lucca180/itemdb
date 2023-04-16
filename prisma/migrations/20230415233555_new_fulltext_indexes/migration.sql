-- CreateIndex
CREATE FULLTEXT INDEX `Items_name_idx` ON `Items`(`name`);

-- CreateIndex
CREATE FULLTEXT INDEX `Items_description_idx` ON `Items`(`description`);
