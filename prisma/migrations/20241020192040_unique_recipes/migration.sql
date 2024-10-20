/*
  Warnings:

  - A unique constraint covering the columns `[result_iid]` on the table `ItemRecipes` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `ItemRecipes_result_iid_key` ON `ItemRecipes`(`result_iid`);
