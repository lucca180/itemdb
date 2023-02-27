/*
  Warnings:

  - You are about to alter the column `json` on the `Feedbacks` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Json`.

*/
-- AlterTable
ALTER TABLE `Feedbacks` MODIFY `json` JSON NULL;
