/*
  Warnings:

  - A unique constraint covering the columns `[item_iid]` on the table `PetpetColors` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `PetpetColors_item_iid_key` ON `PetpetColors`(`item_iid`);
