/*
  Warnings:

  - You are about to drop the column `updateAt` on the `ListItems` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `ListItems` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `ListItems` DROP COLUMN `updateAt`,
    ADD COLUMN `imported` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;
