/*
  Warnings:

  - You are about to drop the column `lastDynamicSync` on the `userlist` table. All the data in the column will be lost.
  - You are about to drop the column `lastLinkedSync` on the `userlist` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `userlist` DROP COLUMN `lastDynamicSync`,
    DROP COLUMN `lastLinkedSync`,
    ADD COLUMN `lastSync` DATETIME(3) NULL;
