/*
  Warnings:

  - A unique constraint covering the columns `[image_id,type]` on the table `ItemColor` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `ItemColor_image_id_type_key` ON `ItemColor`(`image_id`, `type`);
