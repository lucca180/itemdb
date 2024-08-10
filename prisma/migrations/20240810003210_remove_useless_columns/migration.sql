/*
  Warnings:

  - You are about to drop the column `language` on the `priceprocess2` table. All the data in the column will be lost.
  - You are about to drop the column `otherInfo` on the `priceprocess2` table. All the data in the column will be lost.
  - You are about to drop the column `language` on the `restockauctionhistory` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `priceprocess2` DROP COLUMN `language`,
    DROP COLUMN `otherInfo`;

-- AlterTable
ALTER TABLE `restockauctionhistory` DROP COLUMN `language`;
