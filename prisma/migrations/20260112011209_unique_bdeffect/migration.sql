/*
  Warnings:

  - A unique constraint covering the columns `[item_iid,type]` on the table `bdEffects` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `bdEffects_item_iid_type_key` ON `bdEffects`(`item_iid`, `type`);
