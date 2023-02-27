/*
  Warnings:

  - You are about to drop the `Item` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ItemProcessList` table. If the table is not empty, all the data it contains will be lost.

*/
-- RenameTable
ALTER TABLE `Item` RENAME `Items`;

-- RenameTable
ALTER TABLE `ItemProcessList` RENAME `ItemProcess`;


