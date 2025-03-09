/*
  Warnings:

  - A unique constraint covering the columns `[petpet_id,isCanonical]` on the table `PetpetColors` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `PetpetColors_petpet_id_isCanonical_key` ON `PetpetColors`(`petpet_id`, `isCanonical`);
