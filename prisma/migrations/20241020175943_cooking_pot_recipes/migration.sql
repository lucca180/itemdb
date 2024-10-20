-- CreateTable
CREATE TABLE `ItemRecipes` (
    `internal_id` INTEGER NOT NULL AUTO_INCREMENT,
    `result_iid` INTEGER NOT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'cookingpot',

    PRIMARY KEY (`internal_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ItemIngredients` (
    `internal_id` INTEGER NOT NULL AUTO_INCREMENT,
    `item_iid` INTEGER NOT NULL,
    `recipe_id` INTEGER NOT NULL,

    PRIMARY KEY (`internal_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ItemRecipes` ADD CONSTRAINT `ItemRecipes_result_iid_fkey` FOREIGN KEY (`result_iid`) REFERENCES `Items`(`internal_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ItemIngredients` ADD CONSTRAINT `ItemIngredients_item_iid_fkey` FOREIGN KEY (`item_iid`) REFERENCES `Items`(`internal_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ItemIngredients` ADD CONSTRAINT `ItemIngredients_recipe_id_fkey` FOREIGN KEY (`recipe_id`) REFERENCES `ItemRecipes`(`internal_id`) ON DELETE CASCADE ON UPDATE CASCADE;
